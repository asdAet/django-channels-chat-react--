"""API endpoints for the chat subsystem."""

import mimetypes
import time

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, OperationalError, ProgrammingError, transaction
from django.db.models import Q
from django.http import Http404
from rest_framework import serializers, status as http_status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from messages.models import Message, MessageAttachment, MessageReadState
from messages.serializers import MessageSerializer
from roles.access import ensure_can_read_or_404, has_permission
from roles.models import Membership
from roles.permissions import Perm
from rooms.models import Room
from rooms.serializers import RoomPublicSerializer

from .services import (
    MessageForbiddenError,
    MessageNotFoundError,
    MessageValidationError,
    add_reaction,
    delete_message,
    edit_message,
    get_unread_counts,
    mark_read as service_mark_read,
    remove_reaction,
)
from rooms.services import (
    direct_pair_key,
    direct_peer_for_user,
    direct_room_slug,
    ensure_direct_memberships,
    ensure_direct_room_with_retry,
    ensure_membership,
    parse_pair_key_users,
)
from users.identity import (
    resolve_public_ref,
    room_public_ref,
    user_display_name,
    user_profile_avatar_source,
    user_public_ref,
    user_public_username,
)
from users.models import PublicHandle

from .constants import PUBLIC_ROOM_NAME, PUBLIC_ROOM_SLUG
from chat_app_django.media_utils import (
    build_profile_url_from_request,
    build_room_media_url_from_request,
    serialize_avatar_crop,
)

User = get_user_model()


class DirectStartInputSerializer(serializers.Serializer):
    ref = serializers.CharField()


def _build_profile_pic_url(request, profile_pic):
    if not profile_pic:
        return None
    try:
        raw_value = profile_pic.url
    except (AttributeError, ValueError):
        raw_value = str(profile_pic)
    return build_profile_url_from_request(request, raw_value)


def _build_attachment_url(request, attachment_file, room_id: int | None):
    if not attachment_file or room_id is None:
        return None
    try:
        raw_value = attachment_file.url
    except (AttributeError, ValueError):
        raw_value = str(attachment_file)
    return build_room_media_url_from_request(request, raw_value, room_id)


def _serialize_peer(request, user, *, is_blocked: bool = False):
    profile_pic = None
    avatar_source = user_profile_avatar_source(user)
    if avatar_source:
        profile_pic = _build_profile_pic_url(request, avatar_source)

    profile = getattr(user, "profile", None)
    last_seen = getattr(profile, "last_seen", None)
    # If blocked, hide real online status
    if is_blocked:
        last_seen = None
    return {
        "userId": user.pk,
        "publicRef": user_public_ref(user),
        "username": user_public_username(user),
        "displayName": user_display_name(user),
        "profileImage": profile_pic,
        "avatarCrop": serialize_avatar_crop(profile),
        "lastSeen": last_seen.isoformat() if last_seen else None,
        "bio": getattr(profile, "bio", "") or "",
        "blocked": is_blocked,
    }


def _serialize_reply_to(message: Message | None):
    if not message:
        return None
    if message.is_deleted:
        return {
            "id": message.pk,
            "publicRef": None,
            "username": None,
            "displayName": None,
            "content": "[удалено]",
        }
    return {
        "id": message.pk,
        "publicRef": user_public_ref(message.user) if message.user else None,
        "username": user_public_username(message.user) if message.user else message.username,
        "displayName": user_display_name(message.user) if message.user else (message.username or ""),
        "content": message.message_content[:150],
    }


def _serialize_attachment_item(
    request,
    attachment: MessageAttachment,
    *,
    room_id: int | None,
):
    return {
        "id": attachment.pk,
        "originalFilename": attachment.original_filename,
        "contentType": attachment.content_type,
        "fileSize": attachment.file_size,
        "url": _build_attachment_url(request, attachment.file, room_id),
        "thumbnailUrl": (
            _build_attachment_url(request, attachment.thumbnail, room_id)
            if attachment.thumbnail
            else None
        ),
        "width": attachment.width,
        "height": attachment.height,
    }


def _serialize_group_avatar_for_room(request, room: Room) -> tuple[str | None, dict[str, float] | None]:
    if room.kind != Room.Kind.GROUP:
        return None, None

    avatar_url = None
    image = getattr(room, "avatar", None)
    image_name = getattr(image, "name", "") if image else ""
    if image_name:
        avatar_url = _build_profile_pic_url(request, image)
    else:
        fallback_name = str(getattr(settings, "GROUP_DEFAULT_AVATAR", "default.jpg") or "").strip()
        if fallback_name:
            avatar_url = build_profile_url_from_request(request, fallback_name)

    return avatar_url, serialize_avatar_crop(room)


def _public_room():
    try:
        room, _created = Room.objects.get_or_create(
            slug=PUBLIC_ROOM_SLUG,
            defaults={"name": PUBLIC_ROOM_NAME, "kind": Room.Kind.PUBLIC},
        )
        changed_fields = []
        if room.kind != Room.Kind.PUBLIC:
            room.kind = Room.Kind.PUBLIC
            changed_fields.append("kind")
        if room.direct_pair_key:
            room.direct_pair_key = None
            changed_fields.append("direct_pair_key")
        if changed_fields:
            room.save(update_fields=changed_fields)
        return room
    except (OperationalError, ProgrammingError, IntegrityError):
        return Room(slug=PUBLIC_ROOM_SLUG, name=PUBLIC_ROOM_NAME, kind=Room.Kind.PUBLIC)


def _parse_positive_int(raw_value: str | None, param_name: str) -> int:
    if raw_value is None:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")

    candidate = raw_value.strip()
    if not candidate:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")

    try:
        parsed = int(candidate)
    except ValueError:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть целое число")
    if parsed < 1:
        raise ValueError(f"Некорректный параметр '{param_name}': должно быть >= 1")
    return parsed


def _is_transient_db_lock(exc: OperationalError) -> bool:
    message = str(exc).lower()
    return "locked" in message or "deadlock" in message


def _ensure_direct_memberships_with_retry(room: Room, initiator, peer) -> None:
    attempts = max(
        1,
        int(
            getattr(
                settings,
                "CHAT_DIRECT_ROLE_SYNC_RETRIES",
                getattr(settings, "CHAT_DIRECT_START_RETRIES", 3),
            )
        ),
    )
    for attempt in range(attempts):
        try:
            with transaction.atomic():
                ensure_direct_memberships(room, initiator, peer)
            return
        except OperationalError as exc:
            if attempt == attempts - 1 or not _is_transient_db_lock(exc):
                raise
            time.sleep(0.05 * (attempt + 1))


def _resolve_room(room_id: int):
    room = Room.objects.filter(pk=room_id).first()
    return room, None


def _serialize_room_details(request, room: Room, created: bool):
    group_avatar_url, group_avatar_crop = _serialize_group_avatar_for_room(request, room)
    payload = {
        "roomId": room.pk,
        "name": room.name,
        "kind": room.kind,
        "created": created,
        "createdBy": user_display_name(room.created_by) if room.created_by else None,
        "createdByRef": user_public_ref(room.created_by) if room.created_by else None,
        "publicRef": room_public_ref(room) if room.kind == Room.Kind.GROUP else None,
        "peer": None,
        "avatarUrl": group_avatar_url,
        "avatarCrop": group_avatar_crop,
    }

    if request.user and request.user.is_authenticated:
        read_state = MessageReadState.objects.filter(
            user=request.user, room=room
        ).values_list("last_read_message_id", flat=True).first()
        payload["lastReadMessageId"] = read_state

    if room.kind == Room.Kind.DIRECT and request.user and request.user.is_authenticated:
        peer = direct_peer_for_user(room, request.user)
        if peer:
            from friends.application.friend_service import is_blocked_between
            from friends.models import Friendship
            blocked = is_blocked_between(request.user, peer)
            # Determine who blocked whom
            blocker = False
            if blocked:
                blocker = Friendship.objects.filter(
                    from_user=request.user, to_user=peer, status=Friendship.Status.BLOCKED
                ).exists()
            payload["peer"] = _serialize_peer(request, peer, is_blocked=blocked)
            payload["blocked"] = blocked
            payload["blockedByMe"] = blocker

    return payload


@api_view(["GET"])
@permission_classes([AllowAny])
def public_room(request):
    room = _public_room()
    serializer = RoomPublicSerializer({"roomId": room.pk, "name": room.name, "kind": room.kind})
    return Response(serializer.data)


class DirectStartApiView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DirectStartInputSerializer

    def get(self, _request):
        return Response({"detail": "Используйте POST с публичным ref пользователя"})

    def post(self, request):
        target_ref = str(request.data.get("ref") or "").strip()
        if not target_ref:
            return Response({"error": "Требуется ref"}, status=http_status.HTTP_400_BAD_REQUEST)

        owner_type, resolved = resolve_public_ref(target_ref)
        if owner_type != "user" or resolved is None:
            return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)
        target = resolved

        if target.pk == request.user.pk:
            return Response({"error": "Нельзя начать личный чат с самим собой"}, status=http_status.HTTP_400_BAD_REQUEST)

        pair_key = direct_pair_key(request.user.pk, target.pk)
        slug = direct_room_slug(pair_key)

        try:
            room, _created = ensure_direct_room_with_retry(request.user, target, pair_key, slug)
        except OperationalError:
            return Response({"error": "Сервис временно недоступен"}, status=http_status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            _ensure_direct_memberships_with_retry(room, request.user, target)
        except OperationalError:
            return Response({"error": "Сервис временно недоступен"}, status=http_status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(
            {
                "roomId": room.pk,
                "kind": room.kind,
                "peer": _serialize_peer(request, target),
            }
        )


direct_start = DirectStartApiView.as_view()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def direct_chats(request):
    membership_qs = (
        Membership.objects.filter(
            user=request.user,
            room__kind=Room.Kind.DIRECT,
            is_banned=False,
        )
        .select_related("room")
        .order_by("-joined_at")
    )

    seen_room_ids: set[int] = set()
    items = []
    for membership in membership_qs:
        room = membership.room
        room_pk = getattr(room, "pk", None)
        if room_pk is None:
            continue
        if room_pk in seen_room_ids:
            continue
        seen_room_ids.add(room_pk)

        pair = parse_pair_key_users(room.direct_pair_key)
        if not pair or request.user.pk not in pair:
            continue

        last_message = Message.objects.filter(room=room).order_by("-date_added", "-id").first()

        peer = direct_peer_for_user(room, request.user)
        if not peer:
            continue

        sort_key = (
            last_message.date_added.timestamp()
            if last_message is not None
            else membership.joined_at.timestamp()
        )
        items.append(
            {
                "roomId": room.pk,
                "peer": _serialize_peer(request, peer),
                "lastMessage": last_message.message_content if last_message else "",
                "lastMessageAt": last_message.date_added.isoformat() if last_message else None,
                "sortKey": sort_key,
            }
        )

    items.sort(key=lambda item: item["sortKey"], reverse=True)
    for item in items:
        item.pop("sortKey", None)

    return Response({"items": items})


@api_view(["GET"])
@permission_classes([AllowAny])
def room_details(request, room_id: int):
    try:
        room, error_response = _resolve_room(room_id)
        if error_response:
            return error_response

        if room is None:
            return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

        if room.kind in {Room.Kind.PRIVATE, Room.Kind.DIRECT, Room.Kind.GROUP}:
            try:
                ensure_can_read_or_404(room, request.user)
            except Http404:
                return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

        return Response(_serialize_room_details(request, room, created=False))
    except (OperationalError, ProgrammingError, IntegrityError):
        return Response(
            {
                "roomId": room_id,
                "name": None,
                "kind": None,
                "created": False,
                "createdBy": None,
                "peer": None,
                "avatarUrl": None,
                "avatarCrop": None,
            }
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def room_messages(request, room_id: int):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response

    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    if room.kind in {Room.Kind.PRIVATE, Room.Kind.DIRECT, Room.Kind.GROUP}:
        try:
            ensure_can_read_or_404(room, request.user)
        except Http404:
            return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        default_page_size = max(1, int(getattr(settings, "CHAT_MESSAGES_PAGE_SIZE", 50)))
        max_page_size = max(
            default_page_size,
            int(getattr(settings, "CHAT_MESSAGES_MAX_PAGE_SIZE", 200)),
        )

        limit_raw = request.query_params.get("limit")
        before_raw = request.query_params.get("before")

        if limit_raw is None:
            limit = default_page_size
        else:
            try:
                limit = _parse_positive_int(limit_raw, "limit")
            except ValueError as exc:
                return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)
        limit = min(limit, max_page_size)

        before_id = None
        if before_raw is not None:
            try:
                before_id = _parse_positive_int(before_raw, "before")
            except ValueError as exc:
                return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)

        messages_qs = (
            Message.objects.filter(room=room)
            .select_related("user", "user__profile", "reply_to", "reply_to__user")
            .prefetch_related("attachments", "reactions")
        )
        if before_id is not None:
            messages_qs = messages_qs.filter(id__lt=before_id)

        batch = list(messages_qs.order_by("-id")[: limit + 1])
        has_more = len(batch) > limit
        if has_more:
            batch = batch[:limit]
        batch.reverse()

        next_before = getattr(batch[0], "pk", None) if has_more and batch else None

        serializer = MessageSerializer(
            batch,
            many=True,
            context={
                "request": request,
                "build_profile_pic_url": lambda pic: _build_profile_pic_url(request, pic),
                "build_attachment_url": (
                    lambda file_field, scoped_room_id: _build_attachment_url(
                        request,
                        file_field,
                        scoped_room_id,
                    )
                ),
                "room_id": room.pk,
                "serialize_avatar_crop": serialize_avatar_crop,
            },
        )

        return Response(
            {
                "messages": serializer.data,
                "pagination": {
                    "limit": limit,
                    "hasMore": has_more,
                    "nextBefore": next_before,
                },
            }
        )
    except (OperationalError, ProgrammingError):
        return Response(
            {
                "messages": [],
                "pagination": {
                    "limit": int(getattr(settings, "CHAT_MESSAGES_PAGE_SIZE", 50)),
                    "hasMore": False,
                    "nextBefore": None,
                },
            }
        )


# ── Helpers for WS broadcast from REST views ──────────────────────────

def _broadcast_to_room(room: Room, event: dict):
    """Send a channel-layer event to the room group."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    if getattr(room, "pk", None) is None:
        return
    group_name = f"chat_room_{room.pk}"
    async_to_sync(channel_layer.group_send)(group_name, event)


def _ensure_room_read_access(request, room: Room):
    """Raise Http404 if user cannot read this room."""
    if room.kind in {Room.Kind.PRIVATE, Room.Kind.DIRECT, Room.Kind.GROUP}:
        ensure_can_read_or_404(room, request.user)


# ── Message Edit / Delete ─────────────────────────────────────────────

@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def message_detail(request, room_id: int, message_id):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        if request.method == "PATCH":
            content = request.data.get("content", "")
            if not isinstance(content, str):
                return Response({"error": "Требуется поле content"}, status=http_status.HTTP_400_BAD_REQUEST)
            msg = edit_message(request.user, room, message_id, content)
            edited_at = msg.edited_at or msg.date_added
            _broadcast_to_room(room, {
                "type": "chat_message_edit",
                "messageId": msg.pk,
                "content": msg.message_content,
                "editedAt": edited_at.isoformat(),
                "editedByRef": user_public_ref(request.user),
                "editedBy": user_public_username(request.user),
            })
            return Response({
                "id": msg.pk,
                "content": msg.message_content,
                "editedAt": edited_at.isoformat(),
            })
        else:
            msg = delete_message(request.user, room, message_id)
            _broadcast_to_room(room, {
                "type": "chat_message_delete",
                "messageId": msg.pk,
                "deletedByRef": user_public_ref(request.user),
                "deletedBy": user_public_username(request.user),
            })
            return Response(status=http_status.HTTP_204_NO_CONTENT)

    except MessageNotFoundError:
        return Response({"error": "Сообщение не найдено"}, status=http_status.HTTP_404_NOT_FOUND)
    except MessageForbiddenError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_403_FORBIDDEN)
    except MessageValidationError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)


# ── Reactions ─────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def message_reactions(request, room_id: int, message_id):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    emoji = request.data.get("emoji", "")
    if not isinstance(emoji, str):
        return Response({"error": "Требуется поле emoji"}, status=http_status.HTTP_400_BAD_REQUEST)

    try:
        reaction = add_reaction(request.user, room, message_id, emoji)
        _broadcast_to_room(room, {
            "type": "chat_reaction_add",
            "messageId": message_id,
            "emoji": reaction.emoji,
            "userId": request.user.pk,
            "publicRef": user_public_ref(request.user),
            "username": user_public_username(request.user),
            "displayName": user_display_name(request.user),
        })
        return Response({
            "messageId": message_id,
            "emoji": reaction.emoji,
            "userId": request.user.pk,
            "publicRef": user_public_ref(request.user),
            "username": user_public_username(request.user),
            "displayName": user_display_name(request.user),
        })
    except MessageNotFoundError:
        return Response({"error": "Сообщение не найдено"}, status=http_status.HTTP_404_NOT_FOUND)
    except MessageForbiddenError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_403_FORBIDDEN)
    except MessageValidationError as exc:
        return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def message_reaction_remove(request, room_id: int, message_id, emoji):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    remove_reaction(request.user, room, message_id, emoji)
    _broadcast_to_room(room, {
        "type": "chat_reaction_remove",
        "messageId": message_id,
        "emoji": emoji,
        "userId": request.user.pk,
        "publicRef": user_public_ref(request.user),
        "username": user_public_username(request.user),
        "displayName": user_display_name(request.user),
    })
    return Response(status=http_status.HTTP_204_NO_CONTENT)


# ── File Attachments ──────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_attachments(request, room_id: int):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        limit_raw = request.query_params.get("limit")
        before_raw = request.query_params.get("before")

        if limit_raw is None:
            limit = 40
        else:
            try:
                limit = _parse_positive_int(limit_raw, "limit")
            except ValueError as exc:
                return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)
        limit = min(limit, 200)

        before_id = None
        if before_raw is not None:
            try:
                before_id = _parse_positive_int(before_raw, "before")
            except ValueError as exc:
                return Response({"error": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)

        qs = (
            MessageAttachment.objects.filter(message__room=room, message__is_deleted=False)
            .select_related("message", "message__user")
            .order_by("-id")
        )
        if before_id is not None:
            qs = qs.filter(id__lt=before_id)

        batch = list(qs[: limit + 1])
        has_more = len(batch) > limit
        if has_more:
            batch = batch[:limit]

        items = [
            {
                **_serialize_attachment_item(request, attachment, room_id=room.pk),
                "messageId": attachment.message_id,
                "createdAt": attachment.message.date_added.isoformat(),
                "publicRef": user_public_ref(attachment.message.user)
                if attachment.message.user
                else attachment.message.username,
                "username": user_public_username(attachment.message.user)
                if attachment.message.user
                else attachment.message.username,
                "displayName": user_display_name(attachment.message.user)
                if attachment.message.user
                else (attachment.message.username or ""),
            }
            for attachment in batch
        ]

        return Response(
            {
                "items": items,
                "pagination": {
                    "limit": limit,
                    "hasMore": has_more,
                    "nextBefore": batch[-1].pk if has_more and batch else None,
                },
            }
        )

    if not has_permission(room, request.user, Perm.ATTACH_FILES):
        return Response({"error": "Отсутствует разрешение ATTACH_FILES"}, status=http_status.HTTP_403_FORBIDDEN)

    # Keep attachment-media access consistent with room-scoped membership checks.
    # For PUBLIC rooms, a user may have @everyone write permissions without an explicit Membership row.
    # Persisting membership on successful upload marks the user as a concrete room participant.
    if not Membership.objects.filter(room=room, user=request.user, is_banned=False).exists():
        ensure_membership(room, request.user)

    def _error_response(
        message: str,
        *,
        code: str,
        details: dict[str, object] | None = None,
        status_code: int = http_status.HTTP_400_BAD_REQUEST,
    ) -> Response:
        payload: dict[str, object] = {"error": message, "code": code}
        if details:
            payload["details"] = details
        return Response(payload, status=status_code)

    def _collect_uploaded_files() -> list:
        keys = ("files", "file", "attachments", "attachments[]")
        collected: list = []
        seen_ids: set[int] = set()

        for key in keys:
            for uploaded in request.FILES.getlist(key):
                marker = id(uploaded)
                if marker in seen_ids:
                    continue
                seen_ids.add(marker)
                collected.append(uploaded)

        if collected or not request.FILES:
            return collected

        # Fallback for legacy/custom clients that send unknown multipart keys.
        for key in request.FILES.keys():
            for uploaded in request.FILES.getlist(key):
                marker = id(uploaded)
                if marker in seen_ids:
                    continue
                seen_ids.add(marker)
                collected.append(uploaded)
        return collected

    files = _collect_uploaded_files()
    if not files:
        return _error_response(
            "Файлы не переданы",
            code="no_files",
            details={"expectedKeys": ["files", "file", "attachments", "attachments[]"]},
        )

    max_per_msg = int(getattr(settings, "CHAT_ATTACHMENT_MAX_PER_MESSAGE", 5))
    if len(files) > max_per_msg:
        return _error_response(
            f"Максимум {max_per_msg} файлов на сообщение",
            code="too_many_files",
            details={"maxPerMessage": max_per_msg, "received": len(files)},
        )

    max_size = int(getattr(settings, "CHAT_ATTACHMENT_MAX_SIZE_MB", 10)) * 1024 * 1024
    allow_any_type = bool(getattr(settings, "CHAT_ATTACHMENT_ALLOW_ANY_TYPE", True))
    allowed_types = (
        set()
        if allow_any_type
        else {
            str(item).strip().lower()
            for item in getattr(settings, "CHAT_ATTACHMENT_ALLOWED_TYPES", [])
            if str(item).strip()
        }
    )
    alias_map = {
        "audio/mp3": "audio/mpeg",
        "audio/x-mp3": "audio/mpeg",
        "audio/x-mpeg": "audio/mpeg",
    }

    def _canonical_content_type(content_type: str, *, file_name: str = "") -> str:
        normalized = content_type.strip().lower()
        aliased = alias_map.get(normalized, normalized)

        lower_name = (file_name or "").strip().lower()
        if lower_name.endswith((".svg", ".svgz")):
            if aliased in {
                "",
                "application/octet-stream",
                "text/plain",
                "text/xml",
                "application/xml",
                "image/svg",
            }:
                return "image/svg+xml"

        return aliased or "application/octet-stream"

    for f in files:
        if f.size > max_size:
            return _error_response(
                f"Файл '{f.name}' превышает максимальный размер",
                code="file_too_large",
                details={
                    "fileName": f.name,
                    "fileSize": f.size,
                    "maxSize": max_size,
                },
            )

    def _resolve_content_type(uploaded_file) -> str:
        file_name = getattr(uploaded_file, "name", "") or ""
        raw_content_type = (getattr(uploaded_file, "content_type", "") or "").strip().lower()
        guessed_content_type, _ = mimetypes.guess_type(file_name)
        if raw_content_type and raw_content_type != "application/octet-stream":
            return _canonical_content_type(raw_content_type, file_name=file_name)
        if guessed_content_type:
            return _canonical_content_type(guessed_content_type.lower(), file_name=file_name)
        if raw_content_type:
            return _canonical_content_type(raw_content_type, file_name=file_name)
        return _canonical_content_type("application/octet-stream", file_name=file_name)

    resolved_files = []
    for f in files:
        resolved_content_type = _resolve_content_type(f)
        if (not allow_any_type) and allowed_types and resolved_content_type not in allowed_types:
            return _error_response(
                f"Тип файла '{resolved_content_type}' не поддерживается",
                code="unsupported_type",
                details={
                    "fileName": getattr(f, "name", "file"),
                    "contentType": resolved_content_type,
                    "allowedTypes": sorted(allowed_types),
                },
            )
        resolved_files.append((f, resolved_content_type))

    message_content = request.data.get("messageContent", "")
    if not isinstance(message_content, str):
        message_content = ""

    reply_to_raw = request.data.get("replyTo")
    reply_to_id = None
    if reply_to_raw not in (None, ""):
        try:
            reply_to_id = _parse_positive_int(str(reply_to_raw), "replyTo")
        except ValueError as exc:
            return _error_response(
                str(exc),
                code="invalid_reply_to",
                details={"replyTo": reply_to_raw},
            )
        if not Message.objects.filter(pk=reply_to_id, room=room, is_deleted=False).exists():
            return _error_response(
                "Сообщение для ответа не найдено",
                code="invalid_reply_to",
                details={"replyTo": reply_to_id},
            )

    user = request.user
    profile = getattr(user, "profile", None)
    avatar_source = (user_profile_avatar_source(user) or "").strip()
    if len(avatar_source) > 255:
        avatar_source = ""
    message_kwargs = {
        "message_content": message_content,
        "username": user_public_username(user),
        "user": user,
        "profile_pic": avatar_source,
        "room": room,
    }
    if reply_to_id:
        message_kwargs["reply_to_id"] = reply_to_id

    msg = Message.objects.create(**message_kwargs)

    from messages.thumbnail import generate_thumbnail

    attachments_data = []
    for f, resolved_content_type in resolved_files:
        attachment = MessageAttachment.objects.create(
            message=msg,
            file=f,
            original_filename=f.name or "file",
            content_type=resolved_content_type,
            file_size=f.size,
        )

        attachment_content_type = attachment.content_type or ""
        if attachment_content_type.startswith("image/"):
            thumb_info = generate_thumbnail(attachment.file)
            if thumb_info:
                attachment.thumbnail = thumb_info["path"]
                attachment.width = thumb_info.get("width")
                attachment.height = thumb_info.get("height")
                attachment.save(update_fields=["thumbnail", "width", "height"])

        attachments_data.append(_serialize_attachment_item(request, attachment, room_id=room.pk))

    profile_url = _build_profile_pic_url(request, avatar_source) if avatar_source else None
    _broadcast_to_room(room, {
        "type": "chat_message",
        "message": message_content,
        "publicRef": user_public_ref(user),
        "username": user_public_username(user),
        "displayName": user_display_name(user),
        "profile_pic": profile_url,
        "avatar_crop": serialize_avatar_crop(profile),
        "roomId": room.pk,
        "id": msg.pk,
        "createdAt": msg.date_added.isoformat(),
        "replyTo": _serialize_reply_to(msg.reply_to),
        "attachments": attachments_data,
    })

    return Response({
        "id": msg.pk,
        "content": message_content,
        "attachments": attachments_data,
    }, status=http_status.HTTP_201_CREATED)
# ── Message Search ────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def search_messages(request, room_id: int):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    q = request.query_params.get("q", "").strip()
    if len(q) < 2:
        return Response({"error": "Запрос должен содержать минимум 2 символа"}, status=http_status.HTTP_400_BAD_REQUEST)

    try:
        limit = min(int(request.query_params.get("limit", 20)), 50)
    except (TypeError, ValueError):
        limit = 20
    limit = max(1, limit)

    before_id = None
    before_raw = request.query_params.get("before")
    if before_raw:
        try:
            before_id = int(before_raw)
        except (TypeError, ValueError):
            pass

    from django.db import connection

    qs = Message.objects.filter(room=room, is_deleted=False)
    if before_id:
        qs = qs.filter(id__lt=before_id)

    if connection.vendor == "postgresql":
        try:
            from django.contrib.postgres import search as pg_search

            vector = pg_search.SearchVector("message_content", config="russian")
            query = pg_search.SearchQuery(q, config="russian", search_type="websearch")
            qs = (
                qs.annotate(search=vector, rank=pg_search.SearchRank(vector, query))
                .filter(Q(search=query) | Q(message_content__icontains=q))
                .order_by("-rank", "-id")
            )
            search_headline = getattr(pg_search, "SearchHeadline", None)
            if search_headline is not None:
                qs = qs.annotate(
                    headline=search_headline(
                        "message_content",
                        query,
                        start_sel="<mark>",
                        stop_sel="</mark>",
                        max_words=50,
                        min_words=20,
                    )
                )
        except Exception:
            # Fallback to deterministic substring search if FTS parser/config fails.
            qs = qs.filter(message_content__icontains=q).order_by("-id")
    else:
        qs = qs.filter(message_content__icontains=q).order_by("-id")

    batch = list(qs.select_related("user")[: limit + 1])
    has_more = len(batch) > limit
    if has_more:
        batch = batch[:limit]

    results = []
    for msg in batch:
        results.append({
            "id": msg.pk,
            "publicRef": user_public_ref(msg.user) if msg.user else msg.username,
            "username": user_public_username(msg.user) if msg.user else msg.username,
            "displayName": user_display_name(msg.user) if msg.user else (msg.username or ""),
            "content": msg.message_content,
            "createdAt": msg.date_added.isoformat(),
            "highlight": getattr(msg, "headline", None),
        })

    return Response({
        "results": results,
        "pagination": {
            "limit": limit,
            "hasMore": has_more,
            "nextBefore": batch[-1].pk if has_more and batch else None,
        },
    })


# ── Read Receipts ─────────────────────────────────────────────────────

def _parse_section_limit(request, key: str, default: int, max_value: int) -> int:
    raw = request.query_params.get(key)
    if raw is None:
        return default
    try:
        parsed = _parse_positive_int(raw, key)
    except ValueError:
        return default
    return min(parsed, max_value)


def _interaction_room_ids(user) -> set[int]:
    room_ids = set(
        Membership.objects.filter(
            user=user,
            is_banned=False,
            room__kind__in=[Room.Kind.DIRECT, Room.Kind.GROUP, Room.Kind.PRIVATE],
        ).values_list("room_id", flat=True)
    )
    public_room = _public_room()
    public_room_id = getattr(public_room, "pk", None)
    if public_room_id:
        room_ids.add(int(public_room_id))
    return room_ids


def _interaction_user_ids(user, room_ids: set[int]) -> set[int]:
    if not room_ids:
        return set()

    member_user_ids = set(
        Membership.objects.filter(
            room_id__in=room_ids,
            is_banned=False,
        ).values_list("user_id", flat=True)
    )

    message_user_ids = set(
        Message.objects.filter(
            room_id__in=room_ids,
            is_deleted=False,
            user_id__isnull=False,
        ).values_list("user_id", flat=True)
    )

    interacted_user_ids = member_user_ids | message_user_ids
    actor_id = getattr(user, "pk", None)
    if actor_id is not None:
        interacted_user_ids.discard(int(actor_id))
    return interacted_user_ids


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    raw_q = request.query_params.get("q", "").strip()
    if len(raw_q) < 2:
        return Response({"error": "Запрос должен содержать минимум 2 символа"}, status=http_status.HTTP_400_BAD_REQUEST)
    is_handle_query = raw_q.startswith("@")
    q = raw_q[1:].strip() if is_handle_query else raw_q
    if len(q) < 2:
        return Response({"error": "Запрос должен содержать минимум 2 символа"}, status=http_status.HTTP_400_BAD_REQUEST)

    users_limit = _parse_section_limit(request, "usersLimit", 8, 20)
    groups_limit = _parse_section_limit(request, "groupsLimit", 8, 20)
    messages_limit = _parse_section_limit(request, "messagesLimit", 15, 50)

    actor_is_superuser = bool(getattr(request.user, "is_superuser", False))
    interaction_room_ids: set[int] = set()
    interaction_user_ids: set[int] = set()
    if not actor_is_superuser:
        interaction_room_ids = _interaction_room_ids(request.user)
        interaction_user_ids = _interaction_user_ids(request.user, interaction_room_ids)

    users = []
    groups = []
    if is_handle_query:
        handle_query = q.lower()
        user_ids_by_handle = list(
            PublicHandle.objects.filter(user_id__isnull=False, handle__icontains=handle_query)
            .values_list("user_id", flat=True)
        )
        users_qs = User.objects.filter(pk__in=user_ids_by_handle)
        if actor_is_superuser:
            users_qs = users_qs.exclude(pk=request.user.pk)
        else:
            users_qs = users_qs.filter(pk__in=interaction_user_ids)
        users_qs = users_qs.select_related("profile").order_by("id")[:users_limit]
        users = [_serialize_peer(request, found_user) for found_user in users_qs]

    group_handle_query = q.lower()
    group_room_ids = list(
        PublicHandle.objects.filter(room_id__isnull=False, handle__icontains=group_handle_query)
        .values_list("room_id", flat=True)
    )
    groups_qs = Room.objects.filter(kind=Room.Kind.GROUP).filter(id__in=group_room_ids)
    if not actor_is_superuser:
        groups_qs = groups_qs.filter(Q(id__in=interaction_room_ids) | Q(is_public=True))
    groups_qs = groups_qs.distinct().order_by("-member_count", "name")[:groups_limit]
    groups = []
    for room in groups_qs:
        groups.append(
            {
                "roomId": room.pk,
                "name": room.name,
                "description": room.description[:200],
                "publicRef": room_public_ref(room),
                "memberCount": room.member_count,
                "isPublic": room.is_public,
            }
        )

    if actor_is_superuser:
        messages_qs = (
            Message.objects.filter(
                is_deleted=False,
                message_content__icontains=q,
            )
            .select_related("room", "user")
            .order_by("-id")[:messages_limit]
        )
    elif interaction_room_ids:
        messages_qs = (
            Message.objects.filter(
                room_id__in=interaction_room_ids,
                is_deleted=False,
                message_content__icontains=q,
            )
            .select_related("room", "user")
            .order_by("-id")[:messages_limit]
        )
    else:
        messages_qs = Message.objects.none()

    messages = [
        {
            "id": msg.pk,
            "publicRef": user_public_ref(msg.user) if msg.user else msg.username,
            "username": user_public_username(msg.user) if msg.user else msg.username,
            "displayName": user_display_name(msg.user) if msg.user else (msg.username or ""),
            "content": msg.message_content,
            "createdAt": msg.date_added.isoformat(),
            "roomId": msg.room_id,
            "roomName": msg.room.name if msg.room else "",
            "roomKind": msg.room.kind if msg.room else "",
        }
        for msg in messages_qs
    ]

    return Response(
        {
            "users": users,
            "groups": groups,
            "messages": messages,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read_view(request, room_id: int):
    room, error_response = _resolve_room(room_id)
    if error_response:
        return error_response
    if room is None:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    if room.kind == Room.Kind.PUBLIC:
        return Response({"roomId": room.pk, "lastReadMessageId": None})

    try:
        _ensure_room_read_access(request, room)
    except Http404:
        return Response({"error": "Не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    last_read_raw = request.data.get("lastReadMessageId")
    if isinstance(last_read_raw, bool):
        return Response({"error": "lastReadMessageId должен быть положительным целым числом"}, status=http_status.HTTP_400_BAD_REQUEST)

    try:
        last_read_id = int(last_read_raw)
    except (TypeError, ValueError):
        return Response({"error": "lastReadMessageId должен быть положительным целым числом"}, status=http_status.HTTP_400_BAD_REQUEST)

    if last_read_id < 1:
        return Response({"error": "lastReadMessageId должен быть положительным целым числом"}, status=http_status.HTTP_400_BAD_REQUEST)

    try:
        state = service_mark_read(request.user, room, last_read_id)
    except MessageNotFoundError:
        return Response({"error": "Сообщение не найдено"}, status=http_status.HTTP_404_NOT_FOUND)

    # Sync with DirectInbox cache for DM rooms
    if room.kind == Room.Kind.DIRECT:
        from direct_inbox.state import mark_read as di_mark_read
        di_ttl = int(getattr(settings, "DIRECT_INBOX_UNREAD_TTL", 30 * 24 * 60 * 60))
        di_mark_read(request.user.pk, room.pk, di_ttl)

    _broadcast_to_room(room, {
        "type": "chat_read_receipt",
        "userId": request.user.pk,
        "publicRef": user_public_ref(request.user),
        "username": user_public_username(request.user),
        "displayName": user_display_name(request.user),
        "lastReadMessageId": state.last_read_message_id,
        "roomId": room.pk,
    })

    return Response({
        "roomId": room.pk,
        "lastReadMessageId": state.last_read_message_id,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_counts(request):
    items = get_unread_counts(request.user)
    return Response({"items": items})

