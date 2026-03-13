"""Pure domain rules for friendship logic."""

from __future__ import annotations


def is_self_request(actor_id: int, target_id: int) -> bool:
    return int(actor_id) == int(target_id)


def can_send_request(
    *,
    existing_outgoing_status: str | None,
    existing_incoming_status: str | None,
) -> tuple[bool, str]:
    """Check if a friend request can be sent.

    Returns (allowed, reason).
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
    """If the target already sent us a pending request, auto-accept both."""
    return existing_incoming_status == "pending"


def can_accept_request(*, request_to_user_id: int, actor_id: int) -> bool:
    """Only the recipient can accept a request."""
    return int(request_to_user_id) == int(actor_id)


def can_decline_request(*, request_to_user_id: int, actor_id: int) -> bool:
    """Only the recipient can decline a request."""
    return int(request_to_user_id) == int(actor_id)
