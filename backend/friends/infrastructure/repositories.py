"""ORM repositories for friendship queries."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q, QuerySet

from friends.models import Friendship
from users.identity import normalize_public_ref, resolve_public_ref

User = get_user_model()


def get_user_by_public_ref(public_ref: str):
    """Возвращает user by public ref из текущего контекста или хранилища.
    
    Args:
        public_ref: Данные public ref, участвующие в обработке текущей операции.
    
    Returns:
        Функция не возвращает значение.
    """
    normalized = normalize_public_ref(public_ref)
    if not normalized:
        return None
    owner_type, owner = resolve_public_ref(normalized)
    if owner_type != "user":
        return None
    return owner


def get_user_by_id(user_id: int):
    """Возвращает user by id из текущего контекста или хранилища.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Функция не возвращает значение.
    """
    return User.objects.filter(id=user_id).first()


def get_friendship(from_user, to_user) -> Friendship | None:
    """Возвращает friendship из текущего контекста или хранилища.
    
    Args:
        from_user: Пользователь-инициатор действия или запроса дружбы.
        to_user: Целевой пользователь действия или запроса дружбы.
    
    Returns:
        Объект типа Friendship | None, сформированный в рамках обработки.
    """
    return Friendship.objects.filter(from_user=from_user, to_user=to_user).first()


def get_friendship_by_id(friendship_id: int) -> Friendship | None:
    """Возвращает friendship by id из текущего контекста или хранилища.
    
    Args:
        friendship_id: Идентификатор friendship, используемый для выборки данных.
    
    Returns:
        Объект типа Friendship | None, сформированный в рамках обработки.
    """
    return (
        Friendship.objects.filter(id=friendship_id)
        .select_related("from_user", "to_user")
        .first()
    )


def list_friends_for_user(user) -> QuerySet:
    """Возвращает список friends for user, доступных в текущем контексте.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа QuerySet, сформированный в рамках обработки.
    """
    return (
        Friendship.objects.filter(from_user=user, status=Friendship.Status.ACCEPTED)
        .select_related("to_user", "to_user__profile")
        .order_by("-updated_at")
    )


def list_pending_incoming(user) -> QuerySet:
    """Возвращает список pending incoming, доступных в текущем контексте.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа QuerySet, сформированный в рамках обработки.
    """
    return (
        Friendship.objects.filter(to_user=user, status=Friendship.Status.PENDING)
        .select_related("from_user", "from_user__profile")
        .order_by("-created_at")
    )


def list_pending_outgoing(user) -> QuerySet:
    """Возвращает список pending outgoing, доступных в текущем контексте.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа QuerySet, сформированный в рамках обработки.
    """
    return (
        Friendship.objects.filter(from_user=user, status=Friendship.Status.PENDING)
        .select_related("to_user", "to_user__profile")
        .order_by("-created_at")
    )


def list_blocked_by_user(user) -> QuerySet:
    """Возвращает список blocked by user, доступных в текущем контексте.
    
    Args:
        user: Пользователь, для которого выполняется операция.
    
    Returns:
        Объект типа QuerySet, сформированный в рамках обработки.
    """
    return (
        Friendship.objects.filter(from_user=user, status=Friendship.Status.BLOCKED)
        .select_related("to_user", "to_user__profile")
        .order_by("-updated_at")
    )


def delete_friendship_pair(user_a, user_b, *, status: str | None = None) -> int:
    """Удаляет friendship pair и выполняет сопутствующие действия.
    
    Args:
        user_a: Данные user a, участвующие в обработке текущей операции.
        user_b: Данные user b, участвующие в обработке текущей операции.
        status: HTTP-статус ответа, который будет возвращен клиенту.
    
    Returns:
        Целочисленное значение результата вычисления.
    """
    queryset = Friendship.objects.filter(
        Q(from_user=user_a, to_user=user_b) | Q(from_user=user_b, to_user=user_a)
    )
    if status is not None:
        queryset = queryset.filter(status=status)
    deleted, _ = queryset.delete()
    return deleted
