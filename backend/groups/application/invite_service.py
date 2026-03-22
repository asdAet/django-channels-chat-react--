"""Invite link management for groups."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from chat_app_django.security.audit import audit_security_event
from groups.application.group_service import (
    GroupConflictError,
    GroupError,
    GroupForbiddenError,
    GroupNotFoundError,
    _ensure_authenticated,
    _ensure_group_permission,
    _load_group_or_raise,
)
from groups.domain import rules as group_rules
from groups.infrastructure.models import InviteLink, JoinRequest
from roles.application.permission_service import compute_permissions
from roles.models import Membership, Role
from roles.permissions import Perm
from rooms.models import Room
from users.identity import ensure_group_public_id, room_public_ref, user_public_username


def create_invite(
    actor,
    room_id: int,
    *,
    name: str = "",
    expires_in_seconds: int | None = None,
    max_uses: int = 0,
) -> InviteLink:
    """Создает invite и возвращает созданный объект.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор комнаты.
        name: Имя сущности или параметра.
        expires_in_seconds: Параметр expires in seconds, используемый в логике функции.
        max_uses: Параметр max uses, используемый в логике функции.
    
    Returns:
        Объект типа InviteLink, сформированный в ходе выполнения.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)

    effective = compute_permissions(room, actor)
    if not (effective & (Perm.INVITE_USERS | Perm.MANAGE_INVITES | Perm.ADMINISTRATOR)):
        raise GroupForbiddenError("Отсутствует разрешение на создание приглашений")

    max_invites = getattr(settings, "GROUP_MAX_INVITES_PER_ROOM", 50)
    active_count = InviteLink.objects.filter(room=room, is_revoked=False).count()
    if active_count >= max_invites:
        raise GroupError(f"Максимум активных ссылок-приглашений в группе: {max_invites}")

    expires_at = None
    if expires_in_seconds is not None and expires_in_seconds > 0:
        expires_at = timezone.now() + timedelta(seconds=expires_in_seconds)

    code = group_rules.generate_invite_code()

    invite = InviteLink.objects.create(
        room=room,
        code=code,
        created_by=actor,
        name=name[:100],
        expires_at=expires_at,
        max_uses=max(0, max_uses),
    )

    audit_security_event(
        "group.invite.created",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=room.pk,
        invite_code=code,
    )
    return invite


def list_invites(actor, room_id: int) -> list[InviteLink]:
    """Возвращает список invites, доступных в текущем контексте.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор room.
    
    Returns:
        Список типа list[InviteLink] с результатами операции.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)
    _ensure_group_permission(room, actor, Perm.MANAGE_INVITES)
    return list(InviteLink.objects.filter(room=room).select_related("created_by"))


def revoke_invite(actor, room_id: int, invite_code: str) -> None:
    """Отзывает invite и аннулирует дальнейшее использование.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор комнаты.
        invite_code: Код приглашения в группу.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)
    _ensure_group_permission(room, actor, Perm.MANAGE_INVITES)

    invite = InviteLink.objects.filter(room=room, code=invite_code).first()
    if not invite:
        raise GroupNotFoundError("Ссылка-приглашение не найдена")

    invite.is_revoked = True
    invite.save(update_fields=["is_revoked"])

    audit_security_event(
        "group.invite.revoked",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=room.pk,
        invite_code=invite_code,
    )


def get_invite_info(invite_code: str) -> dict:
    """Возвращает invite info из текущего контекста или хранилища.
    
    Args:
        invite_code: Код приглашения в группу.
    
    Returns:
        Словарь типа dict с данными результата.
    """
    invite = (
        InviteLink.objects.filter(code=invite_code)
        .select_related("room")
        .first()
    )
    if not invite:
        raise GroupNotFoundError("Ссылка-приглашение не найдена")

    if invite.is_expired:
        raise GroupError("Срок действия этой ссылки-приглашения истёк")

    room = invite.room
    ensure_group_public_id(room)
    return {
        "code": invite.code,
        "groupId": room.pk,
        "groupPublicRef": room_public_ref(room),
        "groupName": room.name,
        "groupDescription": room.description[:200],
        "memberCount": room.member_count,
        "isPublic": room.is_public,
    }


def join_via_invite(actor, invite_code: str) -> dict:
    """Добавляет участника или объект в via invite.
    
    Args:
        actor: Пользователь, инициирующий действие.
        invite_code: Код приглашения в группу.
    
    Returns:
        Словарь типа dict с данными результата.
    """
    _ensure_authenticated(actor)

    invite = (
        InviteLink.objects.filter(code=invite_code)
        .select_related("room")
        .first()
    )
    if not invite:
        raise GroupNotFoundError("Ссылка-приглашение не найдена")

    if invite.is_expired:
        raise GroupError("Срок действия этой ссылки-приглашения истёк")

    room = invite.room
    group_rules.ensure_is_group(room)

    with transaction.atomic():
        # Lock invite and room to prevent race conditions
        invite = InviteLink.objects.select_for_update().get(pk=invite.pk)
        if invite.is_expired:
            raise GroupError("Срок действия этой ссылки-приглашения истёк")

        existing = Membership.objects.select_for_update().filter(
            room=room, user=actor
        ).first()
        if existing:
            if existing.is_banned:
                raise GroupForbiddenError("Вы заблокированы в этой группе")
            return {"roomId": room.pk, "groupPublicRef": room_public_ref(room), "status": "already_member"}

        room = Room.objects.select_for_update().get(pk=room.pk)
        if room.member_count >= room.max_members:
            raise GroupError("В этой группе достигнут лимит участников")

        # Increment use count
        invite.use_count = F("use_count") + 1
        invite.save(update_fields=["use_count"])

        if room.join_approval_required:
            JoinRequest.objects.update_or_create(
                room=room,
                user=actor,
                status=JoinRequest.Status.PENDING,
                defaults={"invite_link": invite},
            )
            status = "pending"
        else:
            membership = Membership.objects.create(room=room, user=actor)
            member_role = Role.objects.filter(room=room, name=Role.MEMBER).first()
            if member_role:
                membership.roles.add(member_role)
            Room.objects.filter(pk=room.pk).update(member_count=F("member_count") + 1)
            status = "joined"

    audit_security_event(
        "group.invite.used",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=room.pk,
        invite_code=invite_code,
        status=status,
    )
    return {"roomId": room.pk, "groupPublicRef": room_public_ref(room), "status": status}


