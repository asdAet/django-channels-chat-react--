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
from users.identity import user_public_username


@dataclass(frozen=True)
class RoomActorContext:
    """Класс RoomActorContext инкапсулирует связанную бизнес-логику модуля."""
    room: Room
    actor_context: ActorContext


def _audit_role_denied(room: Room | None, actor, reason: str) -> None:
    """Фиксирует role denied в системе аудита.
    
    Args:
        room: Комната, в контексте которой выполняется операция.
        actor: Пользователь, инициирующий действие.
        reason: Причина административного действия.
    """
    audit_security_event(
        "role.manage.denied",
        actor_user=actor,
        actor_user_id=getattr(actor, "pk", None),
        actor_username=user_public_username(actor),
        is_authenticated=bool(getattr(actor, "is_authenticated", False)),
        room_id=getattr(room, "pk", None),
        reason=reason,
    )


def _load_room_or_raise(room_id: int) -> Room:
    """Загружает room or raise из хранилища с необходимыми проверками.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Объект типа Room, сформированный в рамках обработки.
    """
    room = repositories.get_room_by_id(room_id)
    if not room:
        raise RoleNotFoundError("Комната не найдена")
    return room


def _ensure_authenticated(actor) -> None:
    """Гарантирует корректность состояния authenticated перед выполнением операции.
    
    Args:
        actor: Пользователь, инициирующий действие в системе.
    """
    if not actor or not getattr(actor, "is_authenticated", False):
        raise RoleForbiddenError("Требуется аутентификация")


def _ensure_manage_roles(room: Room, actor) -> ActorContext:
    """Гарантирует корректность состояния manage roles перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Объект типа ActorContext, сформированный в рамках обработки.
    """
    actor_context = get_actor_context(room, actor)
    if not rules.has_manage_roles(int(actor_context.permissions)):
        _audit_role_denied(room, actor, "missing_manage_roles")
        raise RoleForbiddenError("Отсутствует разрешение MANAGE_ROLES")
    return actor_context


def _ensure_not_direct(room: Room) -> None:
    """Гарантирует корректность состояния not direct перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    """
    if room.kind == Room.Kind.DIRECT:
        raise RoleServiceError("Управление ролями не поддерживается для личных чатов")


def _ensure_manage_target_position(actor_context: ActorContext, *, target_position: int) -> None:
    """Гарантирует корректность состояния manage target position перед выполнением операции.
    
    Args:
        actor_context: Контекст полномочий пользователя, выполняющего изменение.
        target_position: Позиция роли целевого пользователя или объекта.
    """
    if not rules.can_manage_target(
        actor_top_position=actor_context.top_position,
        target_position=target_position,
    ):
        raise RoleForbiddenError("Нельзя управлять ролью вашего уровня или выше")


def _ensure_permissions_subset(actor_context: ActorContext, *, candidate_permissions: int) -> None:
    """Гарантирует корректность состояния permissions subset перед выполнением операции.
    
    Args:
        actor_context: Контекст полномочий пользователя, выполняющего изменение.
        candidate_permissions: Данные candidate permissions, участвующие в обработке текущей операции.
    """
    if not rules.is_permission_subset(
        candidate=int(candidate_permissions),
        holder=int(actor_context.permissions),
    ):
        raise RoleForbiddenError("Нельзя выдавать разрешения, которых у вас нет")


def _membership_top_position(membership: Membership | None) -> int:
    """Вспомогательная функция `_membership_top_position` реализует внутренний шаг бизнес-логики.
    
    Args:
        membership: Запись участия пользователя в комнате.
    
    Returns:
        Целочисленный результат вычисления.
    """
    if not membership:
        return 0
    top_role = membership.roles.order_by("-position").first()
    if not top_role:
        return 0
    return int(top_role.position)


def _obj_pk(value: object, *, field_name: str = "object") -> int:
    """Вспомогательная функция `_obj_pk` реализует внутренний шаг бизнес-логики.
    
    Args:
        value: Значение, которое нужно нормализовать или проверить.
        field_name: Параметр field name, используемый в логике функции.
    
    Returns:
        Целочисленный результат вычисления.
    """
    pk_value = getattr(value, "pk", None)
    if pk_value is None:
        raise RoleServiceError(f"У поля {field_name} отсутствует первичный ключ")
    return int(pk_value)


def _membership_user_id(membership: Membership) -> int:
    """Вспомогательная функция `_membership_user_id` реализует внутренний шаг бизнес-логики.
    
    Args:
        membership: Запись участия пользователя в комнате.
    
    Returns:
        Целочисленный результат вычисления.
    """
    user_id = getattr(membership, "user_id", None)
    if user_id is not None:
        return int(user_id)
    user = getattr(membership, "user", None)
    user_pk = getattr(user, "pk", None)
    if user_pk is None:
        raise RoleServiceError("У записи участия отсутствует идентификатор пользователя")
    return int(user_pk)


def _override_target_role_id(override: PermissionOverride) -> int | None:
    """Вспомогательная функция `_override_target_role_id` реализует внутренний шаг бизнес-логики.
    
    Args:
        override: Параметр override, используемый в логике функции.
    
    Returns:
        Объект типа int | None, сформированный в ходе выполнения.
    """
    target_role_id = getattr(override, "target_role_id", None)
    if target_role_id is not None:
        return int(target_role_id)
    target_role = getattr(override, "target_role", None)
    target_role_pk = getattr(target_role, "pk", None)
    if target_role_pk is None:
        return None
    return int(target_role_pk)


def _override_target_user_id(override: PermissionOverride) -> int | None:
    """Вспомогательная функция `_override_target_user_id` реализует внутренний шаг бизнес-логики.
    
    Args:
        override: Параметр override, используемый в логике функции.
    
    Returns:
        Объект типа int | None, сформированный в ходе выполнения.
    """
    target_user_id = getattr(override, "target_user_id", None)
    if target_user_id is not None:
        return int(target_user_id)
    target_user = getattr(override, "target_user", None)
    target_user_pk = getattr(target_user, "pk", None)
    if target_user_pk is None:
        return None
    return int(target_user_pk)


def _ensure_manage_member(actor_context: ActorContext, membership: Membership) -> None:
    """Гарантирует корректность состояния manage member перед выполнением операции.
    
    Args:
        actor_context: Контекст полномочий пользователя, выполняющего изменение.
        membership: Данные membership, участвующие в обработке текущей операции.
    """
    target_top_position = _membership_top_position(membership)
    _ensure_manage_target_position(actor_context, target_position=target_top_position)


def actor_can_manage_roles(room_id: int, actor) -> bool:
    """Вспомогательная функция `actor_can_manage_roles` реализует внутренний шаг бизнес-логики.
    
    Args:
        room_id: Идентификатор комнаты.
        actor: Пользователь, инициирующий действие.
    
    Returns:
        Логическое значение результата проверки.
    """
    room = repositories.get_room_by_id(room_id)
    if not room or room.kind == Room.Kind.DIRECT:
        return False
    return can_manage_roles(room, actor)


def _room_actor_context_or_raise(room_id: int, actor) -> RoomActorContext:
    """Выполняет вспомогательную обработку для room actor context or raise.
    
    Args:
        room_id: Идентификатор room.
        actor: Пользователь, инициирующий действие.
    
    Returns:
        Объект типа RoomActorContext, полученный при выполнении операции.
    """
    _ensure_authenticated(actor)
    room = _load_room_or_raise(room_id)
    _ensure_not_direct(room)
    actor_context = _ensure_manage_roles(room, actor)
    return RoomActorContext(room=room, actor_context=actor_context)


def list_room_roles(room_id: int, actor):
    """Возвращает список room roles, доступных в текущем контексте.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Функция не возвращает значение.
    """
    context = _room_actor_context_or_raise(room_id, actor)
    return list(repositories.list_roles(context.room))


def create_room_role(
    room_id: int,
    actor,
    *,
    name: str,
    color: str,
    position: int,
    permissions: int,
) -> Role:
    """Создает room role и возвращает созданную сущность.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
        name: Человекочитаемое имя сущности или объекта.
        color: Цвет роли, отображаемый в интерфейсе клиента.
        position: Позиция роли в иерархии комнаты.
        permissions: Набор прав доступа, применяемых к роли или участнику.
    
    Returns:
        Объект типа Role, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=context.room.pk,
        role_id=_obj_pk(role, field_name="role"),
        role_name=role.name,
        position=role.position,
        permissions=role.permissions,
    )
    return role


def update_room_role(
    room_id: int,
    role_id: int,
    actor,
    *,
    name: str | None = None,
    color: str | None = None,
    position: int | None = None,
    permissions: int | None = None,
) -> Role:
    """Обновляет room role и фиксирует изменения в хранилище.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        role_id: Идентификатор role, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
        name: Человекочитаемое имя сущности или объекта.
        color: Цвет роли, отображаемый в интерфейсе клиента.
        position: Позиция роли в иерархии комнаты.
        permissions: Набор прав доступа, применяемых к роли или участнику.
    
    Returns:
        Объект типа Role, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
            actor_username=user_public_username(actor),
            is_authenticated=True,
            room_id=context.room.pk,
            role_id=_obj_pk(role, field_name="role"),
            changed_fields=changed_fields,
        )
    return role


def delete_room_role(room_id: int, role_id: int, actor) -> None:
    """Удаляет room role и выполняет сопутствующие действия.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        role_id: Идентификатор role, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=context.room.pk,
        role_id=role_id_value,
        role_name=role_name_value,
    )


def get_member_roles(room_id: int, user_id: int, actor) -> Membership:
    """Возвращает member roles из текущего контекста или хранилища.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Объект типа Membership, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
    membership = repositories.get_membership_by_user_id(context.room, int(user_id))
    if not membership:
        raise RoleNotFoundError("Запись участия не найдена")
    _ensure_manage_member(context.actor_context, membership)
    return membership


def set_member_roles(room_id: int, user_id: int, actor, role_ids: list[int]) -> Membership:
    """Устанавливает member roles с учетом текущих правил приложения.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        user_id: Идентификатор user, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
        role_ids: Список идентификаторов role для пакетной обработки.
    
    Returns:
        Объект типа Membership, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=context.room.pk,
        target_user_id=_membership_user_id(membership),
        role_ids=normalized_role_ids,
    )
    return membership


def list_room_overrides(room_id: int, actor):
    """Возвращает список room overrides, доступных в текущем контексте.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Функция не возвращает значение.
    """
    context = _room_actor_context_or_raise(room_id, actor)
    return list(repositories.list_overrides(context.room).select_related("target_role", "target_user"))


def _resolve_override_target(
    *,
    room: Room,
    actor_context: ActorContext,
    target_role_id: int | None,
    target_user_id: int | None,
) -> tuple[Role | None, Membership | None]:
    """Определяет override target на основе доступного контекста.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        actor_context: Контекст полномочий пользователя, выполняющего изменение.
        target_role_id: Идентификатор target role, используемый для выборки данных.
        target_user_id: Идентификатор target user, используемый для выборки данных.
    
    Returns:
        Кортеж типа tuple[Role | None, Membership | None] с результатами операции.
    """
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
    room_id: int,
    actor,
    *,
    target_role_id: int | None,
    target_user_id: int | None,
    allow: int,
    deny: int,
) -> PermissionOverride:
    """Создает room override и возвращает созданную сущность.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
        target_role_id: Идентификатор target role, используемый для выборки данных.
        target_user_id: Идентификатор target user, используемый для выборки данных.
        allow: Битовая маска явно разрешенных действий.
        deny: Битовая маска явно запрещенных действий.
    
    Returns:
        Объект типа PermissionOverride, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=context.room.pk,
        override_id=_obj_pk(override, field_name="override"),
        target_role_id=override_target_role_id,
        target_user_id=override_target_user_id,
        allow=override.allow,
        deny=override.deny,
    )
    return override


def update_room_override(
    room_id: int,
    override_id: int,
    actor,
    *,
    allow: int | None = None,
    deny: int | None = None,
) -> PermissionOverride:
    """Обновляет room override и фиксирует изменения в хранилище.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        override_id: Идентификатор override, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
        allow: Битовая маска явно разрешенных действий.
        deny: Битовая маска явно запрещенных действий.
    
    Returns:
        Объект типа PermissionOverride, сформированный в рамках обработки.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
            actor_username=user_public_username(actor),
            is_authenticated=True,
            room_id=context.room.pk,
            override_id=_obj_pk(override, field_name="override"),
            changed_fields=changed_fields,
        )
    return override


def delete_room_override(room_id: int, override_id: int, actor) -> None:
    """Удаляет room override и выполняет сопутствующие действия.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
        override_id: Идентификатор override, используемый для выборки данных.
        actor: Пользователь, инициирующий действие в системе.
    """
    context = _room_actor_context_or_raise(room_id, actor)
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
        actor_username=user_public_username(actor),
        is_authenticated=True,
        room_id=context.room.pk,
        override_id=override_id_value,
    )


def permissions_for_me(room_id: int, actor) -> dict[str, object]:
    """Вспомогательная функция `permissions_for_me` реализует внутренний шаг бизнес-логики.
    
    Args:
        room_id: Идентификатор комнаты.
        actor: Пользователь, инициирующий действие.
    
    Returns:
        Словарь типа dict[str, object] с данными результата.
    """
    _ensure_authenticated(actor)
    room = _load_room_or_raise(room_id)
    if room.kind in {Room.Kind.PRIVATE, Room.Kind.DIRECT} and not can_read(room, actor):
        raise RoleNotFoundError("Комната не найдена")

    membership = repositories.get_membership(room, actor)
    is_member = bool(membership and not membership.is_banned)
    is_banned = bool(membership and membership.is_banned)
    can_join = bool(
        room.kind == Room.Kind.GROUP
        and room.is_public
        and not is_member
        and not is_banned
    )

    effective = compute_permissions(room, actor)
    granted_flags = [perm.name for perm in Perm if perm and (effective & perm)]
    return {
        "roomId": room.pk,
        "kind": room.kind,
        "permissions": int(effective),
        "isMember": is_member,
        "isBanned": is_banned,
        "canJoin": can_join,
        "flags": granted_flags,
        "can": {
            "read": bool(effective & Perm.READ_MESSAGES),
            "write": bool(effective & Perm.SEND_MESSAGES),
            "manageRoles": bool(effective & Perm.MANAGE_ROLES),
        },
    }



