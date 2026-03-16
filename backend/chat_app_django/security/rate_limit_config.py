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
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return max(1, int(fallback))
    return max(1, parsed)


def _rate_limits_mapping() -> Mapping[str, Any]:
    raw = getattr(settings, "RATE_LIMITS", {})
    if isinstance(raw, Mapping):
        return raw
    return {}


def _section(name: str) -> Mapping[str, Any]:
    raw = _rate_limits_mapping().get(name, {})
    if isinstance(raw, Mapping):
        return raw
    return {}


def _section_policy(
    *,
    section_name: str,
    default_limit: int,
    default_window: int,
) -> RateLimitPolicy:
    section = _section(section_name)
    limit = _positive_int(section.get("limit"), default_limit)
    window = _positive_int(section.get("window_seconds"), default_window)
    return RateLimitPolicy(limit=limit, window_seconds=window)


def auth_rate_limit_policy() -> RateLimitPolicy:
    """Policy for auth attempts (login/register), scoped per action and IP."""
    return _section_policy(
        section_name="auth_attempts",
        default_limit=10,
        default_window=60,
    )


def chat_message_rate_limit_policy() -> RateLimitPolicy:
    """Policy for chat message send throttle, scoped per user."""
    return _section_policy(
        section_name="chat_message_send",
        default_limit=20,
        default_window=10,
    )


def ws_connect_rate_limit_policy(endpoint: str) -> RateLimitPolicy:
    """Policy for websocket connect throttle, scoped per endpoint and IP."""
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
    """Global switch for websocket connect throttling."""
    section = _section("ws_connect")
    section_disabled = section.get("disabled")
    if isinstance(section_disabled, bool):
        return section_disabled
    if isinstance(section_disabled, str):
        return section_disabled.strip().lower() in {"1", "true", "yes", "on"}
    return False
