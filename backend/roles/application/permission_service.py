"""Permission computation and read-only role access checks."""

from __future__ import annotations

from dataclasses import dataclass

from django.http import Http404

from roles.domain import rules
from roles.infrastructure import repositories
from roles.permissions import (
    DM_PARTICIPANT,
    EVERYONE_GROUP_PRIVATE,
    EVERYONE_GROUP_PUBLIC,
    EVERYONE_PUBLIC,
    Perm,
)
from rooms.models import Room


@dataclass(frozen=True)
class ActorContext:
    """Класс ActorContext инкапсулирует связанную бизнес-логику модуля."""
    permissions: Perm
    top_position: int


_SUPERUSER_TOP_POSITION = (1 << 31) - 1


def _is_superuser(user) -> bool:
    """Проверяет условие superuser и возвращает логический результат.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Логическое значение результата проверки.
    """
    return bool(
        user
        and getattr(user, "is_authenticated", False)
        and getattr(user, "is_superuser", False)
    )


def _role_pk(role) -> int | None:
    """Вспомогательная функция `_role_pk` реализует внутренний шаг бизнес-логики.
    
    Args:
        role: Параметр role, используемый в логике функции.
    
    Returns:
        Объект типа int | None, сформированный в ходе выполнения.
    """
    value = getattr(role, "pk", None)
    if value is None:
        return None
    return int(value)


def _membership_user_id(membership) -> int | None:
    """Вспомогательная функция `_membership_user_id` реализует внутренний шаг бизнес-логики.
    
    Args:
        membership: Запись участия пользователя в комнате.
    
    Returns:
        Объект типа int | None, сформированный в ходе выполнения.
    """
    user_id = getattr(membership, "user_id", None)
    if user_id is not None:
        return int(user_id)
    user = getattr(membership, "user", None)
    user_pk = getattr(user, "pk", None)
    if user_pk is None:
        return None
    return int(user_pk)


def _override_target_role_id(override) -> int | None:
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
    return _role_pk(target_role)


def _override_target_user_id(override) -> int | None:
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


def _top_role_position_for_membership(membership) -> int:
    """Вспомогательная функция `_top_role_position_for_membership` реализует внутренний шаг бизнес-логики.
    
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


def _compute_direct_permissions(room: Room, user) -> Perm:
    """Выполняет вспомогательную обработку для compute direct permissions.
    
    Args:
        room: Комната, в контексте которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа Perm, полученный при выполнении операции.
    """
    user_id = getattr(user, "pk", None)
    pair = rules.parse_direct_pair_key(room.direct_pair_key)
    memberships = list(repositories.list_memberships(room))
    membership_user_ids = {
        membership_user_id
        for ms in memberships
        for membership_user_id in [_membership_user_id(ms)]
        if membership_user_id is not None
    }
    banned_user_ids = {
        membership_user_id
        for ms in memberships
        if ms.is_banned
        for membership_user_id in [_membership_user_id(ms)]
        if membership_user_id is not None
    }
    if rules.direct_access_allowed(
        user_id=int(user_id) if user_id is not None else None,
        pair=pair,
        membership_user_ids=membership_user_ids,
        banned_user_ids=banned_user_ids,
    ):
        return DM_PARTICIPANT
    return Perm(0)


def _get_default_everyone_permissions(room: Room) -> int:
    """Возвращает default everyone permissions из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Целочисленное значение результата вычисления.
    """
    if room.kind == Room.Kind.GROUP:
        if getattr(room, "is_public", False):
            return int(EVERYONE_GROUP_PUBLIC)
        return int(EVERYONE_GROUP_PRIVATE)
    if room.kind == Room.Kind.PUBLIC:
        return int(EVERYONE_PUBLIC)
    return 0


def compute_permissions(room: Room, user) -> Perm:
    """Вычисляет permissions на основе входных данных.
    
    Args:
        room: Комната, в контексте которой выполняется операция.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа Perm, сформированный в ходе выполнения.
    """
    if not user or not getattr(user, "is_authenticated", False):
        if room.kind in {Room.Kind.PUBLIC, Room.Kind.GROUP}:
            if room.kind == Room.Kind.GROUP and not getattr(room, "is_public", False):
                return Perm(0)
            return Perm.READ_MESSAGES
        return Perm(0)

    if _is_superuser(user):
        return Perm(-1)

    if room.kind == Room.Kind.DIRECT:
        return _compute_direct_permissions(room, user)

    default_permissions = repositories.get_default_role_permissions(room)
    if default_permissions is not None:
        everyone_permissions = int(default_permissions)
    else:
        everyone_permissions = _get_default_everyone_permissions(room)

    membership = repositories.get_membership(room, user)
    if not membership:
        if room.kind == Room.Kind.GROUP:
            if not getattr(room, "is_public", False):
                return Perm(0)
            # Public groups are readable before join, but writing requires membership.
            return Perm.READ_MESSAGES
        return Perm(everyone_permissions)
    if membership.is_banned:
        return Perm(0)

    member_roles = list(membership.roles.all())
    role_permissions = [int(role.permissions) for role in member_roles]
    role_ids = {
        role_id
        for role in member_roles
        for role_id in [_role_pk(role)]
        if role_id is not None
    }
    user_id = getattr(user, "pk", None)
    if user_id is None:
        return Perm(0)

    role_overrides: list[tuple[int, int]] = []
    user_overrides: list[tuple[int, int]] = []
    for override in repositories.list_overrides(room):
        target_role_id = _override_target_role_id(override)
        target_user_id = _override_target_user_id(override)
        if target_role_id and target_role_id in role_ids:
            role_overrides.append((int(override.allow), int(override.deny)))
        if target_user_id and target_user_id == int(user_id):
            user_overrides.append((int(override.allow), int(override.deny)))

    effective = rules.resolve_permissions(
        everyone_permissions=everyone_permissions,
        role_permissions=role_permissions,
        role_overrides=role_overrides,
        user_overrides=user_overrides,
    )

    # Strip SEND_MESSAGES if member is muted (unless ADMINISTRATOR)
    if membership.is_muted and not (int(effective) & Perm.ADMINISTRATOR):
        effective = Perm(int(effective) & ~int(Perm.SEND_MESSAGES))

    return effective


def has_permission(room: Room, user, perm: Perm) -> bool:
    """Проверяет условие permission и возвращает логический результат.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
        perm: Имя отдельного разрешения, проверяемого в наборе прав.
    
    Returns:
        Логическое значение результата проверки.
    """
    return bool(compute_permissions(room, user) & perm)


def can_read(room: Room, user) -> bool:
    """Проверяет условие read и возвращает логический результат.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Логическое значение результата проверки.
    """
    return has_permission(room, user, Perm.READ_MESSAGES)


def can_write(room: Room, user) -> bool:
    """Проверяет условие write и возвращает логический результат.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Логическое значение результата проверки.
    """
    return has_permission(room, user, Perm.SEND_MESSAGES)


def ensure_can_read_or_404(room: Room, user) -> None:
    """Гарантирует корректность состояния can read or 404 перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    """
    if not can_read(room, user):
        raise Http404("Не найдено")


def ensure_can_write(room: Room, user) -> bool:
    """Гарантирует корректность состояния can write перед выполнением операции.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Логическое значение результата проверки.
    """
    return can_write(room, user)


def get_user_role(room: Room, user) -> str | None:
    """Возвращает user role из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not user or not getattr(user, "is_authenticated", False):
        return None
    membership = repositories.get_membership(room, user)
    if not membership or membership.is_banned:
        return None
    top_role = membership.roles.order_by("-position").first()
    return top_role.name if top_role else None


def get_actor_context(room: Room, actor) -> ActorContext:
    """Возвращает actor context из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Объект типа ActorContext, сформированный в рамках обработки.
    """
    if _is_superuser(actor):
        return ActorContext(permissions=Perm(-1), top_position=_SUPERUSER_TOP_POSITION)
    membership = repositories.get_membership(room, actor)
    permissions = compute_permissions(room, actor)
    top_position = _top_role_position_for_membership(membership)
    return ActorContext(permissions=permissions, top_position=top_position)


def can_manage_roles(room: Room, actor) -> bool:
    """Проверяет условие manage roles и возвращает логический результат.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        actor: Пользователь, инициирующий действие в системе.
    
    Returns:
        Логическое значение результата проверки.
    """
    actor_context = get_actor_context(room, actor)
    return rules.has_manage_roles(int(actor_context.permissions))
