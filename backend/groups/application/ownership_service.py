"""Group ownership transfer."""

from __future__ import annotations

from django.db import transaction

from chat_app_django.security.audit import audit_security_event
from groups.application.group_service import (
    GroupError,
    GroupForbiddenError,
    GroupNotFoundError,
    _ensure_authenticated,
    _ensure_group_permission,
    _load_group_or_raise,
)
from roles.models import Membership, Role
from roles.permissions import Perm
from users.identity import user_public_username


def transfer_ownership(actor, room_id: int, new_owner_user_id: int) -> None:
    """Передает владение.
    
    Args:
        actor: Пользователь, инициирующий действие.
        room_id: Идентификатор комнаты.
        new_owner_user_id: Идентификатор new owner user.
    """
    _ensure_authenticated(actor)
    room = _load_group_or_raise(room_id)
    _ensure_group_permission(room, actor, Perm.ADMINISTRATOR)

    if int(new_owner_user_id) == actor.pk:
        raise GroupError("Нельзя передать владение самому себе")

    new_owner_membership = Membership.objects.filter(
        room=room, user_id=int(new_owner_user_id), is_banned=False
    ).first()
    if not new_owner_membership:
        raise GroupNotFoundError("Целевой участник не найден")

    actor_is_superuser = bool(getattr(actor, "is_superuser", False))
    actor_membership = Membership.objects.filter(room=room, user=actor).first()
    if not actor_membership and not actor_is_superuser:
        raise GroupError("Вы не являетесь участником этой группы")

    owner_role = Role.objects.filter(room=room, name=Role.OWNER).first()
    admin_role = Role.objects.filter(room=room, name=Role.ADMIN).first()

    if not owner_role:
        raise GroupError("Роль владельца не найдена")

    with transaction.atomic():
        # Remove Owner from previous owner(s), add Admin
        previous_owner_memberships = list(
            Membership.objects.filter(room=room, roles=owner_role)
        )
        for membership in previous_owner_memberships:
            if membership.user_id == int(new_owner_user_id):
                continue
            membership.roles.remove(owner_role)
            if admin_role:
                membership.roles.add(admin_role)

        # Add Owner role to new owner (keep existing roles)
        new_owner_membership.roles.add(owner_role)

        # Update room created_by
        room.created_by_id = int(new_owner_user_id)
        room.save(update_fields=["created_by_id"])

    audit_security_event(
        "group.ownership.transferred",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=room.pk,
        new_owner_user_id=new_owner_user_id,
    )


