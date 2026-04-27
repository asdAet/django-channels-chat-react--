"""Pure domain rules for friendship logic."""

from __future__ import annotations


def is_self_request(actor_id: int, target_id: int) -> bool:
    """Проверяет условие self request и возвращает логический результат.
    
    Args:
        actor_id: Идентификатор actor, используемый для выборки данных.
        target_id: Идентификатор target, используемый для выборки данных.
    
    Returns:
        Логическое значение результата проверки.
    """
    return int(actor_id) == int(target_id)


def can_send_request(
    *,
    existing_outgoing_status: str | None,
    existing_incoming_status: str | None,
) -> tuple[bool, str]:
    """Проверяет условие send request и возвращает логический результат.
    
    Args:
        existing_outgoing_status: Текущий статус исходящей заявки дружбы.
        existing_incoming_status: Текущий статус входящей заявки дружбы.
    
    Returns:
        Кортеж типа tuple[bool, str] с результатами операции.
    """
    if existing_outgoing_status == "blocked":
        return False, "Вы заблокировали этого пользователя"
    if existing_incoming_status == "blocked":
        return False, "Этот пользователь заблокировал вас"
    if existing_outgoing_status == "pending":
        return False, "Заявка в друзья уже отправлена"
    if existing_outgoing_status == "accepted":
        return False, "Вы уже в друзьях"
    return True, ""


def should_auto_accept(existing_incoming_status: str | None) -> bool:
    """Определяет, нужно ли выполнять действие auto accept.
    
    Args:
        existing_incoming_status: Текущий статус входящей заявки дружбы.
    
    Returns:
        Логическое значение результата проверки.
    """
    return existing_incoming_status == "pending"


def can_accept_request(*, request_to_user_id: int, actor_id: int) -> bool:
    """Проверяет условие accept request и возвращает логический результат.
    
    Args:
        request_to_user_id: Идентификатор request to user, используемый для выборки данных.
        actor_id: Идентификатор actor, используемый для выборки данных.
    
    Returns:
        Логическое значение результата проверки.
    """
    return int(request_to_user_id) == int(actor_id)


def can_decline_request(*, request_to_user_id: int, actor_id: int) -> bool:
    """Проверяет условие decline request и возвращает логический результат.
    
    Args:
        request_to_user_id: Идентификатор request to user, используемый для выборки данных.
        actor_id: Идентификатор actor, используемый для выборки данных.
    
    Returns:
        Логическое значение результата проверки.
    """
    return int(request_to_user_id) == int(actor_id)
