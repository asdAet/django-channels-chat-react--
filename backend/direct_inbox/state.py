"""Cache-backed unread/active state for direct messages."""

from __future__ import annotations

from typing import Any

from django.core.cache import cache


UNREAD_KEY_PREFIX = "direct:unread"
ACTIVE_KEY_PREFIX = "direct:active"
USER_GROUP_PREFIX = "direct_inbox_user_"


def user_group_name(user_id: int) -> str:
    """Вспомогательная функция `user_group_name` реализует внутренний шаг бизнес-логики.
    
    Args:
        user_id: Идентификатор user.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return f"{USER_GROUP_PREFIX}{int(user_id)}"


def unread_key(user_id: int) -> str:
    """Вспомогательная функция `unread_key` реализует внутренний шаг бизнес-логики.
    
    Args:
        user_id: Идентификатор user.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return f"{UNREAD_KEY_PREFIX}:{int(user_id)}"


def active_key(user_id: int) -> str:
    """Вспомогательная функция `active_key` реализует внутренний шаг бизнес-логики.
    
    Args:
        user_id: Идентификатор user.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    return f"{ACTIVE_KEY_PREFIX}:{int(user_id)}"


def _normalize_room_ids(value: Any) -> list[int]:
    """Нормализует room ids к внутреннему формату приложения.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Список типа list[int] с результатами операции.
    """
    if not isinstance(value, list):
        return []
    seen: set[int] = set()
    result: list[int] = []
    for item in value:
        try:
            room_id = int(item)
        except (TypeError, ValueError):
            continue
        if room_id <= 0 or room_id in seen:
            continue
        seen.add(room_id)
        result.append(room_id)
    return result


def _normalize_counts(value: Any) -> dict[str, int]:
    """Нормализует counts к внутреннему формату приложения.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Словарь типа dict[str, int] с результатами операции.
    """
    result: dict[str, int] = {}
    if isinstance(value, dict):
        for key, raw in value.items():
            try:
                room_id = int(key)
                count = int(raw)
            except (TypeError, ValueError):
                continue
            if room_id <= 0 or count <= 0:
                continue
            result[str(room_id)] = count
        return result
    if isinstance(value, list):
        for room_id in _normalize_room_ids(value):
            result[str(room_id)] = 1
    return result


def _counts_to_room_ids(counts: dict[str, int]) -> list[int]:
    """Вспомогательная функция `_counts_to_room_ids` реализует внутренний шаг бизнес-логики.
    
    Args:
        counts: Параметр counts, используемый в логике функции.
    
    Returns:
        Список типа list[int] с данными результата.
    """
    result: list[int] = []
    for key in counts.keys():
        try:
            room_id = int(key)
        except (TypeError, ValueError):
            continue
        if room_id > 0:
            result.append(room_id)
    return result


def _parse_positive_room_id(value: int | str | None) -> int | None:
    """Разбирает positive room id из входных данных с валидацией формата.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа int | None, сформированный в рамках обработки.
    """
    if isinstance(value, int):
        room_id = value
    elif isinstance(value, str):
        try:
            room_id = int(value)
        except ValueError:
            return None
    else:
        return None

    if room_id <= 0:
        return None
    return room_id


def get_unread_room_ids(user_id: int) -> list[int]:
    """Возвращает unread room ids из текущего контекста или хранилища.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Список типа list[int] с результатами операции.
    """
    counts = _normalize_counts(cache.get(unread_key(user_id)))
    return _counts_to_room_ids(counts)

def get_unread_state(user_id: int) -> dict[str, Any]:
    """Возвращает unread state из текущего контекста или хранилища.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
    
    Returns:
        Словарь типа dict[str, Any] с результатами операции.
    """
    counts = _normalize_counts(cache.get(unread_key(user_id)))
    room_ids = _counts_to_room_ids(counts)
    return {
        "dialogs": len(room_ids),
        "roomIds": room_ids,
        "counts": counts,
    }


def mark_unread(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]:
    """Помечает unread новым состоянием.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        room_id: Идентификатор room, используемый для выборки данных.
        ttl_seconds: Время жизни данных в кеше в секундах.
    
    Returns:
        Словарь типа dict[str, Any] с результатами операции.
    """
    normalized_room_id = _parse_positive_room_id(room_id)
    if normalized_room_id is None:
        return get_unread_state(user_id)

    current = _normalize_counts(cache.get(unread_key(user_id)))
    key = str(normalized_room_id)
    current[key] = current.get(key, 0) + 1
    cache.set(unread_key(user_id), current, timeout=ttl_seconds)
    room_ids = _counts_to_room_ids(current)
    return {
        "dialogs": len(room_ids),
        "roomIds": room_ids,
        "counts": current,
    }


def mark_read(user_id: int, room_id: int | str | None, ttl_seconds: int) -> dict[str, Any]:
    """Помечает read новым состоянием.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        room_id: Идентификатор room, используемый для выборки данных.
        ttl_seconds: Время жизни данных в кеше в секундах.
    
    Returns:
        Словарь типа dict[str, Any] с результатами операции.
    """
    normalized_room_id = _parse_positive_room_id(room_id)
    if normalized_room_id is None:
        return get_unread_state(user_id)

    current = _normalize_counts(cache.get(unread_key(user_id)))
    current.pop(str(normalized_room_id), None)
    if current:
        cache.set(unread_key(user_id), current, timeout=ttl_seconds)
    else:
        cache.delete(unread_key(user_id))
    room_ids = _counts_to_room_ids(current)
    return {
        "dialogs": len(room_ids),
        "roomIds": room_ids,
        "counts": current,
    }


def set_active_room(user_id: int, room_id: int, conn_id: str, ttl_seconds: int) -> None:
    """Устанавливает active room с учетом текущих правил приложения.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        room_id: Идентификатор room, используемый для выборки данных.
        conn_id: Идентификатор conn, используемый для выборки данных.
        ttl_seconds: Время жизни данных в кеше в секундах.
    """
    cache.set(
        active_key(user_id),
        {
            "roomId": int(room_id),
            "connId": conn_id,
        },
        timeout=ttl_seconds,
    )


def touch_active_room(user_id: int, conn_id: str, ttl_seconds: int) -> None:
    """Обновляет метку активности для active room.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        conn_id: Идентификатор conn, используемый для выборки данных.
        ttl_seconds: Время жизни данных в кеше в секундах.
    """
    value = cache.get(active_key(user_id))
    if not isinstance(value, dict):
        return
    if value.get("connId") != conn_id:
        return
    cache.set(active_key(user_id), value, timeout=ttl_seconds)


def clear_active_room(user_id: int, conn_id: str | None = None) -> None:
    """Очищает active room и сбрасывает связанное состояние.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        conn_id: Идентификатор conn, используемый для выборки данных.
    """
    if conn_id is None:
        cache.delete(active_key(user_id))
        return
    value = cache.get(active_key(user_id))
    if not isinstance(value, dict):
        return
    if value.get("connId") != conn_id:
        return
    cache.delete(active_key(user_id))


def is_room_active(user_id: int, room_id: int) -> bool:
    """Проверяет условие room active и возвращает логический результат.
    
    Args:
        user_id: Идентификатор user, используемый для выборки данных.
        room_id: Идентификатор room, используемый для выборки данных.
    
    Returns:
        Логическое значение результата проверки.
    """
    value = cache.get(active_key(user_id))
    if not isinstance(value, dict):
        return False
    room_id_value = value.get("roomId")
    if room_id_value is None:
        return False
    try:
        return int(room_id_value) == int(room_id)
    except (TypeError, ValueError):
        return False
