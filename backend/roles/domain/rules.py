"""Pure domain rules for role permissions and hierarchy checks."""

from __future__ import annotations

from collections.abc import Iterable

from roles.permissions import Perm

SYSTEM_PROTECTED_ROLE_NAMES = frozenset({"@everyone", "Owner"})


def parse_direct_pair_key(pair_key: str | None) -> tuple[int, int] | None:
    """Разбирает direct pair key из входных данных с валидацией формата.
    
    Args:
        pair_key: Ключ пары разрешений allow/deny.
    
    Returns:
        Кортеж типа tuple[int, int] | None с результатами операции.
    """
    if not pair_key or ":" not in pair_key:
        return None
    first, second = pair_key.split(":", 1)
    try:
        return int(first), int(second)
    except (TypeError, ValueError):
        return None


def direct_access_allowed(
    *,
    user_id: int | None,
    pair: tuple[int, int] | None,
    membership_user_ids: set[int],
    banned_user_ids: set[int],
) -> bool:
    """Вспомогательная функция `direct_access_allowed` реализует внутренний шаг бизнес-логики.
    
    Args:
        user_id: Идентификатор user.
        pair: Параметр pair, используемый в логике функции.
        membership_user_ids: Список идентификаторов membership user.
        banned_user_ids: Список идентификаторов banned user.
    
    Returns:
        Логическое значение результата проверки.
    """
    if user_id is None or pair is None:
        return False
    if user_id not in pair:
        return False
    if user_id not in membership_user_ids:
        return False
    if user_id in banned_user_ids:
        return False
    return True


def resolve_permissions(
    *,
    everyone_permissions: int,
    role_permissions: Iterable[int],
    role_overrides: Iterable[tuple[int, int]],
    user_overrides: Iterable[tuple[int, int]],
) -> Perm:
    """Определяет permissions на основе доступного контекста.
    
    Args:
        everyone_permissions: Права роли everyone, действующие для всех участников.
        role_permissions: Права, назначенные ролями участника комнаты.
        role_overrides: Переопределения прав, примененные к ролям.
        user_overrides: Пользовательские переопределения прав на уровне участника.
    
    Returns:
        Объект типа Perm, сформированный в рамках обработки.
    """
    permissions = Perm(int(everyone_permissions))
    for role_perm in role_permissions:
        permissions |= Perm(int(role_perm))

    if permissions & Perm.ADMINISTRATOR:
        return Perm(-1)

    role_allow = 0
    role_deny = 0
    for allow, deny in role_overrides:
        role_allow |= int(allow)
        role_deny |= int(deny)
    permissions = Perm((int(permissions) & ~role_deny) | role_allow)

    for allow, deny in user_overrides:
        permissions = Perm((int(permissions) & ~int(deny)) | int(allow))

    if permissions & Perm.ADMINISTRATOR:
        return Perm(-1)
    return permissions


def is_permission_subset(*, candidate: int, holder: int) -> bool:
    """Проверяет условие permission subset и возвращает логический результат.
    
    Args:
        candidate: Кандидатный объект для сравнения с текущим контекстом.
        holder: Сущность, в которой хранится сравниваемое значение.
    
    Returns:
        Логическое значение результата проверки.
    """
    holder_perm = Perm(int(holder))
    if holder_perm & Perm.ADMINISTRATOR:
        return True
    return (int(candidate) & ~int(holder_perm)) == 0


def can_manage_target(*, actor_top_position: int, target_position: int) -> bool:
    """Проверяет условие manage target и возвращает логический результат.
    
    Args:
        actor_top_position: Максимальная позиция роли текущего пользователя.
        target_position: Позиция роли целевого пользователя или объекта.
    
    Returns:
        Логическое значение результата проверки.
    """
    return int(actor_top_position) > int(target_position)


def normalize_role_ids(raw_role_ids: Iterable[int | str]) -> list[int]:
    """Нормализует role ids к внутреннему формату приложения.
    
    Args:
        raw_role_ids: Список идентификаторов raw role для пакетной обработки.
    
    Returns:
        Список типа list[int] с результатами операции.
    """
    result: list[int] = []
    seen: set[int] = set()
    for value in raw_role_ids:
        try:
            role_id = int(value)
        except (TypeError, ValueError):
            continue
        if role_id < 1 or role_id in seen:
            continue
        seen.add(role_id)
        result.append(role_id)
    return result


def validate_override_target_ids(target_role_id: int | None, target_user_id: int | None) -> bool:
    """Проверяет значение поля override target ids и возвращает нормализованный результат.
    
    Args:
        target_role_id: Идентификатор target role, используемый для выборки данных.
        target_user_id: Идентификатор target user, используемый для выборки данных.
    
    Returns:
        Логическое значение результата проверки.
    """
    return (target_role_id is None) ^ (target_user_id is None)


def has_manage_roles(permissions: int) -> bool:
    """Проверяет условие manage roles и возвращает логический результат.
    
    Args:
        permissions: Набор прав доступа, применяемых к роли или участнику.
    
    Returns:
        Логическое значение результата проверки.
    """
    return bool(Perm(int(permissions)) & Perm.MANAGE_ROLES)


def role_is_protected(*, is_default: bool, name: str) -> bool:
    """Проверяет роль с учетом защищенный ответ.
    
    Args:
        is_default: Булев флаг условия default.
        name: Имя сущности или параметра.
    
    Returns:
        Логическое значение результата проверки.
    """
    return bool(is_default or name in SYSTEM_PROTECTED_ROLE_NAMES)
