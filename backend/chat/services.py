"""Business logic for message operations: edit, delete, reactions, read state."""

from __future__ import annotations

import logging
import time

from django.conf import settings
from django.db import OperationalError, transaction
from django.utils import timezone

from messages.models import Message, MessageAttachment, MessageReadState, Reaction
from roles.access import has_permission
from roles.permissions import Perm
from rooms.models import Room

logger = logging.getLogger(__name__)


def _attachment_delete_retry_delay(attempt: int) -> float:
    base_delay = float(getattr(settings, "CHAT_ATTACHMENT_DELETE_RETRY_BASE_SECONDS", 0.1))
    return max(0.0, base_delay * (attempt + 1))


# ── Exceptions ─────────────────────────────────────────────────────────

class MessageError(Exception):
    pass


class MessageNotFoundError(MessageError):
    pass


class MessageForbiddenError(MessageError):
    pass


class MessageValidationError(MessageError):
    pass


# ── Edit / Delete ──────────────────────────────────────────────────────

def _load_message_or_raise(room: Room, message_id: int) -> Message:
    msg = (
        Message.objects
        .select_for_update()
        .filter(pk=message_id, room=room, is_deleted=False)
        .first()
    )
    if not msg:
        raise MessageNotFoundError("Сообщение не найдено")
    return msg


def _can_manage_message(room: Room, user, message: Message) -> bool:
    """Check if user can edit/delete this message (author or moderator)."""
    if message.user_id == user.pk:
        return True
    return has_permission(room, user, Perm.MANAGE_MESSAGES)


def _within_edit_window(message: Message) -> bool:
    window = int(getattr(settings, "CHAT_MESSAGE_EDIT_WINDOW_SECONDS", 900))
    if window == 0:
        return True
    elapsed = (timezone.now() - message.date_added).total_seconds()
    return elapsed <= window


def _delete_attachment_blob(
    storage,
    blob_name: str | None,
    *,
    attachment_id: int,
    field_name: str,
) -> None:
    normalized_name = str(blob_name or "").strip()
    if not normalized_name:
        return
    retries = max(1, int(getattr(settings, "CHAT_ATTACHMENT_DELETE_RETRIES", 8)))
    for attempt in range(retries):
        try:
            storage.delete(normalized_name)
            return
        except PermissionError as exc:
            # Windows can transiently lock files while they are being streamed/read.
            is_locked = getattr(exc, "winerror", None) == 32
            if is_locked and attempt < (retries - 1):
                time.sleep(_attachment_delete_retry_delay(attempt))
                continue
            logger.warning(
                "Failed to delete attachment %s blob for id=%s path=%s",
                field_name,
                attachment_id,
                normalized_name,
                exc_info=True,
            )
            return
        except Exception:
            logger.warning(
                "Failed to delete attachment %s blob for id=%s path=%s",
                field_name,
                attachment_id,
                normalized_name,
                exc_info=True,
            )
            return


def edit_message(user, room: Room, message_id: int, new_content: str) -> Message:
    """Edit a message. Returns the updated message."""
    new_content = new_content.strip()
    if not new_content:
        raise MessageValidationError("Текст сообщения не может быть пустым")

    max_len = int(getattr(settings, "CHAT_MESSAGE_MAX_LENGTH", 1000))
    if len(new_content) > max_len:
        raise MessageValidationError("Сообщение слишком длинное")

    with transaction.atomic():
        msg = _load_message_or_raise(room, message_id)

        is_author = msg.user_id == user.pk
        is_moderator = has_permission(room, user, Perm.MANAGE_MESSAGES)

        if not is_author and not is_moderator:
            raise MessageForbiddenError("Вы не можете редактировать это сообщение")

        if is_author and not is_moderator and not _within_edit_window(msg):
            raise MessageForbiddenError("Время на редактирование истекло")

        if not msg.original_content:
            msg.original_content = msg.message_content

        msg.message_content = new_content
        msg.edited_at = timezone.now()
        msg.save(update_fields=["message_content", "edited_at", "original_content"])

    return msg


def delete_message(user, room: Room, message_id: int) -> Message:
    """Soft-delete a message. Returns the deleted message."""
    with transaction.atomic():
        msg = _load_message_or_raise(room, message_id)

        if not _can_manage_message(room, user, msg):
            raise MessageForbiddenError("Вы не можете удалить это сообщение")

        msg.is_deleted = True
        msg.deleted_at = timezone.now()
        msg.deleted_by = user
        msg.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

        delete_files = bool(
            getattr(settings, "CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE", True),
        )
        if delete_files:
            attachments = list(
                MessageAttachment.objects.filter(message=msg).only("id", "file", "thumbnail"),
            )
            for attachment in attachments:
                file_field = attachment.file
                _delete_attachment_blob(
                    file_field.storage,
                    file_field.name,
                    attachment_id=attachment.pk,
                    field_name="file",
                )

                thumbnail_field = attachment.thumbnail
                if thumbnail_field:
                    _delete_attachment_blob(
                        thumbnail_field.storage,
                        thumbnail_field.name,
                        attachment_id=attachment.pk,
                        field_name="thumbnail",
                    )

    return msg


# ── Reactions ──────────────────────────────────────────────────────────

def add_reaction(user, room: Room, message_id: int, emoji: str) -> Reaction:
    """Add an emoji reaction to a message. Idempotent."""
    emoji = emoji.strip()
    if not emoji or len(emoji) > 32:
        raise MessageValidationError("Некорректный эмодзи")

    if not has_permission(room, user, Perm.ADD_REACTIONS):
        raise MessageForbiddenError("Отсутствует разрешение ADD_REACTIONS")

    msg = Message.objects.filter(pk=message_id, room=room, is_deleted=False).first()
    if not msg:
        raise MessageNotFoundError("Сообщение не найдено")

    reaction, _created = Reaction.objects.get_or_create(
        message=msg, user=user, emoji=emoji,
    )
    return reaction


def remove_reaction(user, room: Room, message_id: int, emoji: str) -> None:
    """Remove an emoji reaction. Idempotent (no error if not found)."""
    Reaction.objects.filter(
        message_id=message_id, message__room=room, user=user, emoji=emoji,
    ).delete()


# ── Read State ─────────────────────────────────────────────────────────

def mark_read(user, room: Room, last_read_message_id: int) -> MessageReadState:
    """Mark messages as read up to the given message ID."""
    if not Message.objects.filter(pk=last_read_message_id, room=room).exists():
        raise MessageNotFoundError("Сообщение не найдено")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                state, created = MessageReadState.objects.select_for_update().get_or_create(
                    user=user, room=room,
                    defaults={"last_read_message_id": last_read_message_id},
                )
                if not created:
                    current_id = state.last_read_message_id or 0
                    if last_read_message_id > current_id:
                        state.last_read_message_id = last_read_message_id
                        state.save(update_fields=["last_read_message_id", "last_read_at"])
            return state
        except OperationalError:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.1 * (attempt + 1))
    raise OperationalError("база данных заблокирована")


def get_unread_counts(user) -> list[dict]:
    """Get unread message counts for all rooms the user is a member of."""
    from roles.models import Membership

    memberships = (
        Membership.objects.filter(user=user, is_banned=False)
        .select_related("room")
    )

    result = []
    for ms in memberships:
        room = ms.room
        read_state = MessageReadState.objects.filter(user=user, room=room).first()
        last_read_id = read_state.last_read_message_id if read_state else 0
        unread = (
            Message.objects
            .filter(room=room, is_deleted=False, id__gt=(last_read_id or 0))
            .exclude(user=user)
            .count()
        )
        if unread > 0:
            result.append({"roomId": room.pk, "unreadCount": unread})

    return result
