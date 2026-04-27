"""Pinned message management for groups."""

from __future__ import annotations

from django.conf import settings

from chat_app_django.security.audit import audit_security_event
from groups.application.group_service import (
    GroupError,
    GroupForbiddenError,
    GroupNotFoundError,
    _ensure_authenticated,
    _load_group_or_raise,
)
from groups.infrastructure.models import PinnedMessage
from messages.models import Message
from roles.application.permission_service import compute_permissions
from roles.permissions import Perm
from rooms.models import Room
from users.identity import user_public_username


def pin_message(actor, room_id: int, message_id: int) -> PinnedMessage:
    """Закрепляет message в интерфейсе комнаты.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор комнаты.
        message_id: Идентификатор сообщения.
    
    Returns:
        Объект типа PinnedMessage, сформированный в ходе выполнения.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)

    effective = compute_permissions(room, actor)
    if not (effective & (Perm.PIN_MESSAGES | Perm.MANAGE_MESSAGES | Perm.ADMINISTRATOR)):
        raise GroupForbiddenError("Отсутствует разрешение на закрепление сообщений")

    message = Message.objects.filter(pk=int(message_id), room=room).first()
    if not message:
        raise GroupNotFoundError("Сообщение в этой группе не найдено")

    max_pins = getattr(settings, "GROUP_MAX_PINNED_MESSAGES", 100)
    pin_count = PinnedMessage.objects.filter(room=room).count()
    if pin_count >= max_pins:
        raise GroupError(f"Максимум закреплённых сообщений в группе: {max_pins}")

    pin, created = PinnedMessage.objects.get_or_create(
        room=room,
        message=message,
        defaults={"pinned_by": actor},
    )

    if created:
        audit_security_event(
            "group.message.pinned",
            actor_user=actor,
            actor_user_id=getattr(actor, "pk", None),
            actor_username=user_public_username(actor),
            is_authenticated=True,
            room_id=room.pk,
            message_id=message_id,
        )
    return pin


def unpin_message(actor, room_id: int, message_id: int) -> None:
    """Снимает закрепление с message.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор комнаты.
        message_id: Идентификатор сообщения.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)

    effective = compute_permissions(room, actor)
    if not (effective & (Perm.PIN_MESSAGES | Perm.MANAGE_MESSAGES | Perm.ADMINISTRATOR)):
        raise GroupForbiddenError("Отсутствует разрешение на открепление сообщений")

    pin = PinnedMessage.objects.filter(
        room=room, message_id=int(message_id)
    ).first()
    if not pin:
        raise GroupNotFoundError("Закреплённое сообщение не найдено")

    pin.delete()

    audit_security_event(
        "group.message.unpinned",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=room.pk,
        message_id=message_id,
    )


def list_pinned(room_id: int, actor) -> list[dict]:
    """Возвращает список pinned, доступных в текущем контексте.
    
    Args:
        room_id: Идентификатор room.
        actor: Пользователь, инициирующий действие.
    
    Returns:
        Список типа list[dict] с результатами операции.
    """
    room = _load_group_or_raise(room_id)

    # Public groups: anyone can see pins; private groups: need READ_MESSAGES
    if not room.is_public:
        _ensure_authenticated(actor)
        effective = compute_permissions(room, actor)
        if not (effective & Perm.READ_MESSAGES):
            raise GroupForbiddenError("Нет доступа к просмотру закреплённых сообщений")

    pins = (
        PinnedMessage.objects.filter(room=room)
        .select_related("message", "message__user", "pinned_by")
        .order_by("-pinned_at")
    )

    return [
        {
            "messageId": p.message_id,
            "content": p.message.message_content,
            "author": user_public_username(p.message.user) if p.message.user else p.message.username,
            "pinnedBy": user_public_username(p.pinned_by) if p.pinned_by else None,
            "pinnedAt": p.pinned_at.isoformat(),
            "createdAt": p.message.date_added.isoformat(),
        }
        for p in pins
    ]


