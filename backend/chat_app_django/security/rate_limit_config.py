"""Centralized rate-limit policy readers.

This module is the single architecture entry point for reading runtime
rate-limit configuration from Django settings.

Why it exists:
- keep policy lookup in one place;
- avoid duplicating env/default logic across consumers and APIs;
- read all rate-limit policies from the unified RATE_LIMITS mapping.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from django.conf import settings

from .rate_limit import RateLimitPolicy


def _positive_int(value: Any, fallback: int) -> int:
    """Вспомогательная функция `_positive_int` реализует внутренний шаг бизнес-логики.
    
    Args:
        value: Значение, которое нужно нормализовать или проверить.
        fallback: Параметр fallback, используемый в логике функции.
    
    Returns:
        Целочисленный результат вычисления.
    """
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return max(1, int(fallback))
    return max(1, parsed)


def _rate_limits_mapping() -> Mapping[str, Any]:
    """Выполняет вспомогательную обработку для rate limits mapping.
    
    Returns:
        Объект типа Mapping[str, Any], полученный при выполнении операции.
    """
    raw = getattr(settings, "RATE_LIMITS", {})
    if isinstance(raw, Mapping):
        return raw
    return {}


def _section(name: str) -> Mapping[str, Any]:
    """Выполняет вспомогательную обработку для section.
    
    Args:
        name: Человекочитаемое имя объекта или параметра.
    
    Returns:
        Объект типа Mapping[str, Any], полученный при выполнении операции.
    """
    raw = _rate_limits_mapping().get(name, {})
    if isinstance(raw, Mapping):
        return raw
    return {}


def _section_disabled(name: str) -> bool:
    """Returns a normalized disabled flag for a rate-limit section."""

    raw_value = _section(name).get("disabled")
    if isinstance(raw_value, bool):
        return raw_value
    if isinstance(raw_value, str):
        return raw_value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def _section_policy(
    *,
    section_name: str,
    default_limit: int,
    default_window: int,
) -> RateLimitPolicy:
    """Вспомогательная функция `_section_policy` реализует внутренний шаг бизнес-логики.
    
    Args:
        section_name: Параметр section name, используемый в логике функции.
        default_limit: Параметр default limit, используемый в логике функции.
        default_window: Параметр default window, используемый в логике функции.
    
    Returns:
        Объект типа RateLimitPolicy, сформированный в ходе выполнения.
    """
    section = _section(section_name)
    limit = _positive_int(section.get("limit"), default_limit)
    window = _positive_int(section.get("window_seconds"), default_window)
    return RateLimitPolicy(limit=limit, window_seconds=window)


def auth_rate_limit_policy() -> RateLimitPolicy:
    """Вспомогательная функция `auth_rate_limit_policy` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Объект типа RateLimitPolicy, сформированный в ходе выполнения.
    """
    return _section_policy(
        section_name="auth_attempts",
        default_limit=10,
        default_window=60,
    )


def auth_rate_limit_disabled() -> bool:
    """Returns whether auth attempt throttling is disabled."""

    return _section_disabled("auth_attempts")


def chat_message_rate_limit_policy() -> RateLimitPolicy:
    """Вспомогательная функция `chat_message_rate_limit_policy` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Объект типа RateLimitPolicy, сформированный в ходе выполнения.
    """
    return _section_policy(
        section_name="chat_message_send",
        default_limit=20,
        default_window=10,
    )


def chat_message_rate_limit_disabled() -> bool:
    """Returns whether chat message throttling is disabled."""

    return _section_disabled("chat_message_send")


def ws_connect_rate_limit_policy(endpoint: str) -> RateLimitPolicy:
    """Вспомогательная функция `ws_connect_rate_limit_policy` реализует внутренний шаг бизнес-логики.
    
    Args:
        endpoint: Параметр endpoint, используемый в логике функции.
    
    Returns:
        Объект типа RateLimitPolicy, сформированный в ходе выполнения.
    """
    if endpoint == "presence":
        return _section_policy(
            section_name="ws_connect_presence",
            default_limit=180,
            default_window=60,
        )
    return _section_policy(
        section_name="ws_connect_default",
        default_limit=60,
        default_window=60,
    )


def ws_connect_rate_limit_disabled() -> bool:
    """Вспомогательная функция `ws_connect_rate_limit_disabled` реализует внутренний шаг бизнес-логики.
    
    Returns:
        Логическое значение результата проверки.
    """
    return _section_disabled("ws_connect")
