"""Opaque websocket auth tokens used when proxies drop cookies on WS upgrade."""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Literal

from django.conf import settings
from django.core.cache import caches
from django.core.cache.backends.base import InvalidCacheBackendError


WS_AUTH_CACHE_PREFIX = "ws_auth:"


@dataclass(frozen=True)
class WebSocketAuthClaims:
    """Server-side claims resolved from an opaque websocket auth token."""

    kind: Literal["auth", "guest"]
    session_key: str
    user_id: int | None = None


def _parse_positive_user_id(raw_user_id: object) -> int | None:
    """Parses a positive user id from cache payload."""
    if isinstance(raw_user_id, bool):
        return None
    if isinstance(raw_user_id, int):
        user_id = raw_user_id
    elif isinstance(raw_user_id, str):
        normalized_user_id = raw_user_id.strip()
        if not normalized_user_id:
            return None
        try:
            user_id = int(normalized_user_id)
        except ValueError:
            return None
    else:
        return None

    return user_id if user_id > 0 else None


def _ws_auth_cache_key(token: str) -> str:
    return f"{WS_AUTH_CACHE_PREFIX}{token}"


def _get_ws_auth_cache():
    alias = str(getattr(settings, "WS_AUTH_CACHE_ALIAS", "ws_auth") or "ws_auth").strip()
    if not alias:
        alias = "ws_auth"
    try:
        return caches[alias]
    except InvalidCacheBackendError:
        return caches["default"]


def _ws_auth_ttl_seconds() -> int:
    ttl = int(getattr(settings, "SESSION_COOKIE_AGE", 0) or 0)
    return ttl if ttl > 0 else 14 * 24 * 60 * 60


def issue_authenticated_ws_auth_token(*, user_id: int, session_key: str) -> str:
    """Creates an opaque auth token bound to the current Django session."""
    normalized_session_key = str(session_key or "").strip()
    if user_id <= 0 or not normalized_session_key:
        return ""

    token = secrets.token_urlsafe(32)
    _get_ws_auth_cache().set(
        _ws_auth_cache_key(token),
        {
            "kind": "auth",
            "user_id": int(user_id),
            "session_key": normalized_session_key,
        },
        timeout=_ws_auth_ttl_seconds(),
    )
    return token


def issue_guest_ws_auth_token(*, session_key: str) -> str:
    """Creates an opaque guest token bound to the guest Django session."""
    normalized_session_key = str(session_key or "").strip()
    if not normalized_session_key:
        return ""

    token = secrets.token_urlsafe(32)
    _get_ws_auth_cache().set(
        _ws_auth_cache_key(token),
        {
            "kind": "guest",
            "session_key": normalized_session_key,
        },
        timeout=_ws_auth_ttl_seconds(),
    )
    return token


def resolve_ws_auth_claims(token: str | None) -> WebSocketAuthClaims | None:
    """Loads websocket auth claims from the configured shared ws-auth cache."""
    normalized_token = str(token or "").strip()
    if not normalized_token:
        return None

    payload = _get_ws_auth_cache().get(_ws_auth_cache_key(normalized_token))
    if not isinstance(payload, dict):
        return None

    kind = payload.get("kind")
    session_key = str(payload.get("session_key") or "").strip()
    if kind not in {"auth", "guest"} or not session_key:
        return None

    if kind == "guest":
        return WebSocketAuthClaims(kind="guest", session_key=session_key)

    user_id = _parse_positive_user_id(payload.get("user_id"))
    if user_id is None:
        return None

    return WebSocketAuthClaims(
        kind="auth",
        session_key=session_key,
        user_id=user_id,
    )
