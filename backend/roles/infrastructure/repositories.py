"""ORM repositories for role permissions and management."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from roles.models import Membership, PermissionOverride, Role
from rooms.models import Room

User = get_user_model()


def get_room_by_id(room_id: int) -> Room | None:
    """Возвращает room by id из текущего контекста или хранилища.
    
    Args:
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Объект типа Room | None, сформированный в рамках обработки.
    """
    return Room.objects.filter(pk=room_id).first()


def get_default_role_permissions(room: Room) -> int | None:
    """Возвращает default role permissions из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа int | None, сформированный в рамках обработки.
    """
    return (
        Role.objects.filter(room=room, is_default=True)
        .values_list("permissions", flat=True)
        .first()
    )


def get_membership(room: Room, user) -> Membership | None:
    """Возвращает membership из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа Membership | None, сформированный в рамках обработки.
    """
    return (
        Membership.objects.filter(room=room, user=user)
        .prefetch_related("roles")
        .first()
    )


def get_membership_by_user_id(room: Room, user_id: int) -> Membership | None:
    """Возвращает membership by user id из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Объект типа Membership | None, сформированный в рамках обработки.
    """
    return (
        Membership.objects.filter(room=room, user_id=user_id)
        .select_related("user")
        .prefetch_related("roles")
        .first()
    )


def list_memberships(room: Room) -> QuerySet[Membership]:
    """Возвращает список memberships, доступных в текущем контексте.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа QuerySet[Membership], сформированный в рамках обработки.
    """
    return Membership.objects.filter(room=room).select_related("user").prefetch_related("roles")


def list_roles(room: Room) -> QuerySet[Role]:
    """Возвращает список roles, доступных в текущем контексте.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа QuerySet[Role], сформированный в рамках обработки.
    """
    return Role.objects.filter(room=room).order_by("-position", "id")


def get_role(room: Room, role_id: int) -> Role | None:
    """Возвращает role из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        role_id: Идентификатор role, используемый для выборки данных.
    
    Returns:
        Объект типа Role | None, сформированный в рамках обработки.
    """
    return Role.objects.filter(room=room, id=role_id).first()


def list_overrides(room: Room) -> QuerySet[PermissionOverride]:
    """Возвращает список overrides, доступных в текущем контексте.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
    
    Returns:
        Объект типа QuerySet[PermissionOverride], сформированный в рамках обработки.
    """
    return PermissionOverride.objects.filter(room=room).order_by("id")


def get_override(room: Room, override_id: int) -> PermissionOverride | None:
    """Возвращает override из текущего контекста или хранилища.
    
    Args:
        room: Экземпляр комнаты, над которой выполняется действие.
        override_id: Идентификатор override, используемый для выборки данных.
    
    Returns:
        Объект типа PermissionOverride | None, сформированный в рамках обработки.
    """
    return (
        PermissionOverride.objects.filter(room=room, id=override_id)
        .select_related("target_role", "target_user")
        .first()
    )


def get_user_by_id(user_id: int):
    """Возвращает user by id из текущего контекста или хранилища.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    return User.objects.filter(id=user_id).first()

