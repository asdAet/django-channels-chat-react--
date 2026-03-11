"""Role, membership and override management use-cases."""

from __future__ import annotations

from dataclasses import dataclass

from django.db import IntegrityError, transaction

from chat_app_django.security.audit import audit_security_event
from roles.application.errors import (
    RoleConflictError,
    RoleForbiddenError,
    RoleNotFoundError,
    RoleServiceError,
)
from roles.application.permission_service import (
    ActorContext,
    can_manage_roles,
    can_read,
    compute_permissions,
    get_actor_context,
)
from roles.domain import rules
from roles.infrastructure import repositories
from roles.models import Membership, PermissionOverride, Role
from roles.permissions import Perm
from rooms.models import Room


@dataclass(frozen=True)
class RoomActorContext:
    room: Room
    actor_context: ActorContext


def _audit_role_denied(room: Room | None, actor, reason: str) -> None:
    audit_security_event(
        "role.manage.denied",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=bool(getattr(actor, "is_authenticated", False)),
        room_slug=getattr(room, "slug", None),
        reason=reason,
    )


def _load_room_or_raise(room_slug: str) -> Room:
    room = repositories.get_room_by_slug(room_slug)
    if not room:
        raise RoleNotFoundError("Комната не найдена")
    return room


def _ensure_authenticated(actor) -> None:
    if not actor or not getattr(actor, "is_authenticated", False):
        raise RoleForbiddenError("Требуется аутентификация")


def _ensure_manage_roles(room: Room, actor) -> ActorContext:
    actor_context = get_actor_context(room, actor)
    if not rules.has_manage_roles(int(actor_context.permissions)):
        _audit_role_denied(room, actor, "missing_manage_roles")
        raise RoleForbiddenError("Отсутствует разрешение MANAGE_ROLES")
    return actor_context


def _ensure_not_direct(room: Room) -> None:
    if room.kind == Room.Kind.DIRECT:
        raise RoleServiceError("Управление ролями не поддерживается для личных чатов")


def _ensure_manage_target_position(actor_context: ActorContext, *, target_position: int) -> None:
    if not rules.can_manage_target(
        actor_top_position=actor_context.top_position,
        target_position=target_position,
    ):
        raise RoleForbiddenError("Нельзя управлять ролью вашего уровня или выше")


def _ensure_permissions_subset(actor_context: ActorContext, *, candidate_permissions: int) -> None:
    if not rules.is_permission_subset(
        candidate=int(candidate_permissions),
        holder=int(actor_context.permissions),
    ):
        raise RoleForbiddenError("Нельзя выдавать разрешения, которых у вас нет")


def _membership_top_position(membership: Membership | None) -> int:
    if not membership:
        return 0
    top_role = membership.roles.order_by("-position").first()
    if not top_role:
        return 0
    return int(top_role.position)


def _obj_pk(value: object, *, field_name: str = "object") -> int:
    pk_value = getattr(value, "pk", None)
    if pk_value is None:
        raise RoleServiceError(f"У поля {field_name} отсутствует первичный ключ")
    return int(pk_value)


def _membership_user_id(membership: Membership) -> int:
    user_id = getattr(membership, "user_id", None)
    if user_id is not None:
        return int(user_id)
    user = getattr(membership, "user", None)
    user_pk = getattr(user, "pk", None)
    if user_pk is None:
        raise RoleServiceError("У записи участия отсутствует идентификатор пользователя")
    return int(user_pk)


def _override_target_role_id(override: PermissionOverride) -> int | None:
    target_role_id = getattr(override, "target_role_id", None)
    if target_role_id is not None:
        return int(target_role_id)
    target_role = getattr(override, "target_role", None)
    target_role_pk = getattr(target_role, "pk", None)
    if target_role_pk is None:
        return None
    return int(target_role_pk)


def _override_target_user_id(override: PermissionOverride) -> int | None:
    target_user_id = getattr(override, "target_user_id", None)
    if target_user_id is not None:
        return int(target_user_id)
    target_user = getattr(override, "target_user", None)
    target_user_pk = getattr(target_user, "pk", None)
    if target_user_pk is None:
        return None
    return int(target_user_pk)


def _ensure_manage_member(actor_context: ActorContext, membership: Membership) -> None:
    target_top_position = _membership_top_position(membership)
    _ensure_manage_target_position(actor_context, target_position=target_top_position)


def actor_can_manage_roles(room_slug: str, actor) -> bool:
    room = repositories.get_room_by_slug(room_slug)
    if not room or room.kind == Room.Kind.DIRECT:
        return False
    return can_manage_roles(room, actor)


def _room_actor_context_or_raise(room_slug: str, actor) -> RoomActorContext:
    _ensure_authenticated(actor)
    room = _load_room_or_raise(room_slug)
    _ensure_not_direct(room)
    actor_context = _ensure_manage_roles(room, actor)
    return RoomActorContext(room=room, actor_context=actor_context)


def list_room_roles(room_slug: str, actor):
    context = _room_actor_context_or_raise(room_slug, actor)
    return list(repositories.list_roles(context.room))


def create_room_role(
    room_slug: str,
    actor,
    *,
    name: str,
    color: str,
    position: int,
    permissions: int,
) -> Role:
    context = _room_actor_context_or_raise(room_slug, actor)
    _ensure_manage_target_position(context.actor_context, target_position=int(position))
    _ensure_permissions_subset(context.actor_context, candidate_permissions=int(permissions))

    try:
        with transaction.atomic():
            role = Role.objects.create(
                room=context.room,
                name=name,
                color=color,
                position=int(position),
                permissions=int(permissions),
                is_default=False,
            )
    except IntegrityError as exc:
        raise RoleConflictError("Роль с таким названием уже существует в комнате") from exc

    audit_security_event(
        "role.manage.created",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=True,
        room_slug=context.room.slug,
        role_id=_obj_pk(role, field_name="role"),
        role_name=role.name,
        position=role.position,
        permissions=role.permissions,
    )
    return role


def update_room_role(
    room_slug: str,
    role_id: int,
    actor,
    *,
    name: str | None = None,
    color: str | None = None,
    position: int | None = None,
    permissions: int | None = None,
) -> Role:
    context = _room_actor_context_or_raise(room_slug, actor)
    role = repositories.get_role(context.room, int(role_id))
    if not role:
        raise RoleNotFoundError("Роль не найдена")

    _ensure_manage_target_position(context.actor_context, target_position=int(role.position))
    if rules.role_is_protected(is_default=role.is_default, name=role.name):
        raise RoleForbiddenError("Системную роль нельзя изменять")

    if permissions is not None:
        _ensure_permissions_subset(context.actor_context, candidate_permissions=int(permissions))
    if position is not None:
        _ensure_manage_target_position(context.actor_context, target_position=int(position))

    changed_fields: list[str] = []
    if name is not None and name != role.name:
        role.name = name
        changed_fields.append("name")
    if color is not None and color != role.color:
        role.color = color
        changed_fields.append("color")
    if position is not None and int(position) != int(role.position):
        role.position = int(position)
        changed_fields.append("position")
    if permissions is not None and int(permissions) != int(role.permissions):
        role.permissions = int(permissions)
        changed_fields.append("permissions")

    if changed_fields:
        try:
            with transaction.atomic():
                role.save(update_fields=changed_fields)
        except IntegrityError as exc:
            raise RoleConflictError("Роль с таким названием уже существует в комнате") from exc

        audit_security_event(
            "role.manage.updated",
            actor_user=actor,
            actor_user_id=getattr(actor, "pk", None),
            actor_username=getattr(actor, "username", None),
            is_authenticated=True,
            room_slug=context.room.slug,
            role_id=_obj_pk(role, field_name="role"),
            changed_fields=changed_fields,
        )
    return role


def delete_room_role(room_slug: str, role_id: int, actor) -> None:
    context = _room_actor_context_or_raise(room_slug, actor)
    role = repositories.get_role(context.room, int(role_id))
    if not role:
        raise RoleNotFoundError("Роль не найдена")
    _ensure_manage_target_position(context.actor_context, target_position=int(role.position))
    if rules.role_is_protected(is_default=role.is_default, name=role.name):
        raise RoleForbiddenError("Системную роль нельзя удалить")

    role_id_value = _obj_pk(role, field_name="role")
    role_name_value = role.name
    with transaction.atomic():
        role.delete()

    audit_security_event(
        "role.manage.deleted",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=True,
        room_slug=context.room.slug,
        role_id=role_id_value,
        role_name=role_name_value,
    )


def get_member_roles(room_slug: str, user_id: int, actor) -> Membership:
    context = _room_actor_context_or_raise(room_slug, actor)
    membership = repositories.get_membership_by_user_id(context.room, int(user_id))
    if not membership:
        raise RoleNotFoundError("Запись участия не найдена")
    _ensure_manage_member(context.actor_context, membership)
    return membership


def set_member_roles(room_slug: str, user_id: int, actor, role_ids: list[int]) -> Membership:
    context = _room_actor_context_or_raise(room_slug, actor)
    membership = repositories.get_membership_by_user_id(context.room, int(user_id))
    if not membership:
        raise RoleNotFoundError("Запись участия не найдена")
    _ensure_manage_member(context.actor_context, membership)

    normalized_role_ids = rules.normalize_role_ids(role_ids)
    roles = list(
        repositories.list_roles(context.room).filter(
            id__in=normalized_role_ids,
            is_default=False,
        )
    )
    if len(roles) != len(normalized_role_ids):
        raise RoleServiceError("Одна или несколько ролей не найдены в этой комнате")

    for role in roles:
        _ensure_manage_target_position(context.actor_context, target_position=int(role.position))
        _ensure_permissions_subset(
            context.actor_context,
            candidate_permissions=int(role.permissions),
        )

    with transaction.atomic():
        membership.roles.set(roles)

    audit_security_event(
        "membership.roles.updated",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=True,
        room_slug=context.room.slug,
        target_user_id=_membership_user_id(membership),
        role_ids=normalized_role_ids,
    )
    return membership


def list_room_overrides(room_slug: str, actor):
    context = _room_actor_context_or_raise(room_slug, actor)
    return list(repositories.list_overrides(context.room).select_related("target_role", "target_user"))


def _resolve_override_target(
    *,
    room: Room,
    actor_context: ActorContext,
    target_role_id: int | None,
    target_user_id: int | None,
) -> tuple[Role | None, Membership | None]:
    if not rules.validate_override_target_ids(target_role_id, target_user_id):
        raise RoleServiceError("Необходимо указать ровно одно из полей: targetRoleId или targetUserId")

    target_role = None
    target_membership = None
    if target_role_id is not None:
        target_role = repositories.get_role(room, int(target_role_id))
        if not target_role:
            raise RoleNotFoundError("Целевая роль не найдена")
        _ensure_manage_target_position(actor_context, target_position=int(target_role.position))

    if target_user_id is not None:
        target_membership = repositories.get_membership_by_user_id(room, int(target_user_id))
        if not target_membership:
            raise RoleNotFoundError("Запись участия целевого пользователя не найдена")
        _ensure_manage_member(actor_context, target_membership)

    return target_role, target_membership


def create_room_override(
    room_slug: str,
    actor,
    *,
    target_role_id: int | None,
    target_user_id: int | None,
    allow: int,
    deny: int,
) -> PermissionOverride:
    context = _room_actor_context_or_raise(room_slug, actor)
    target_role, target_membership = _resolve_override_target(
        room=context.room,
        actor_context=context.actor_context,
        target_role_id=target_role_id,
        target_user_id=target_user_id,
    )
    _ensure_permissions_subset(context.actor_context, candidate_permissions=int(allow))

    with transaction.atomic():
        override, _ = PermissionOverride.objects.update_or_create(
            room=context.room,
            target_role=target_role,
            target_user=target_membership.user if target_membership else None,
            defaults={
                "allow": int(allow),
                "deny": int(deny),
            },
        )

    override_target_role_id = _override_target_role_id(override)
    override_target_user_id = _override_target_user_id(override)
    audit_security_event(
        "override.created",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=True,
        room_slug=context.room.slug,
        override_id=_obj_pk(override, field_name="override"),
        target_role_id=override_target_role_id,
        target_user_id=override_target_user_id,
        allow=override.allow,
        deny=override.deny,
    )
    return override


def update_room_override(
    room_slug: str,
    override_id: int,
    actor,
    *,
    allow: int | None = None,
    deny: int | None = None,
) -> PermissionOverride:
    context = _room_actor_context_or_raise(room_slug, actor)
    override = repositories.get_override(context.room, int(override_id))
    if not override:
        raise RoleNotFoundError("Переопределение не найдено")

    target_role_id = _override_target_role_id(override)
    target_user_id = _override_target_user_id(override)

    if target_role_id:
        target_role = repositories.get_role(context.room, target_role_id)
        if not target_role:
            raise RoleNotFoundError("Целевая роль не найдена")
        _ensure_manage_target_position(context.actor_context, target_position=int(target_role.position))
    elif target_user_id:
        target_membership = repositories.get_membership_by_user_id(context.room, target_user_id)
        if not target_membership:
            raise RoleNotFoundError("Целевая запись участия не найдена")
        _ensure_manage_member(context.actor_context, target_membership)

    changed_fields: list[str] = []
    if allow is not None and int(allow) != int(override.allow):
        _ensure_permissions_subset(context.actor_context, candidate_permissions=int(allow))
        override.allow = int(allow)
        changed_fields.append("allow")
    if deny is not None and int(deny) != int(override.deny):
        override.deny = int(deny)
        changed_fields.append("deny")

    if changed_fields:
        with transaction.atomic():
            override.save(update_fields=changed_fields)
        audit_security_event(
            "override.updated",
            actor_user=actor,
            actor_user_id=getattr(actor, "pk", None),
            actor_username=getattr(actor, "username", None),
            is_authenticated=True,
            room_slug=context.room.slug,
            override_id=_obj_pk(override, field_name="override"),
            changed_fields=changed_fields,
        )
    return override


def delete_room_override(room_slug: str, override_id: int, actor) -> None:
    context = _room_actor_context_or_raise(room_slug, actor)
    override = repositories.get_override(context.room, int(override_id))
    if not override:
        raise RoleNotFoundError("Переопределение не найдено")

    target_role_id = _override_target_role_id(override)
    target_user_id = _override_target_user_id(override)
    if target_role_id:
        role = repositories.get_role(context.room, target_role_id)
        if role:
            _ensure_manage_target_position(context.actor_context, target_position=int(role.position))
    elif target_user_id:
        membership = repositories.get_membership_by_user_id(context.room, target_user_id)
        if membership:
            _ensure_manage_member(context.actor_context, membership)

    override_id_value = _obj_pk(override, field_name="override")
    with transaction.atomic():
        override.delete()

    audit_security_event(
        "override.deleted",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=getattr(actor, "username", None),
        is_authenticated=True,
        room_slug=context.room.slug,
        override_id=override_id_value,
    )


def permissions_for_me(room_slug: str, actor) -> dict[str, object]:
    _ensure_authenticated(actor)
    room = _load_room_or_raise(room_slug)
    if room.kind in {Room.Kind.PRIVATE, Room.Kind.DIRECT} and not can_read(room, actor):
        raise RoleNotFoundError("Комната не найдена")

    effective = compute_permissions(room, actor)
    granted_flags = [perm.name for perm in Perm if perm and (effective & perm)]
    return {
        "roomSlug": room.slug,
        "kind": room.kind,
        "permissions": int(effective),
        "flags": granted_flags,
        "can": {
            "read": bool(effective & Perm.READ_MESSAGES),
            "write": bool(effective & Perm.SEND_MESSAGES),
            "manageRoles": bool(effective & Perm.MANAGE_ROLES),
        },
    }
