"""ASGI middleware that restores websocket auth from opaque query tokens."""

from __future__ import annotations

from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import SESSION_KEY, get_user_model
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.models import Session

from .ws_auth import resolve_ws_auth_claims

WS_AUTH_QUERY_PARAM = "wst"

User = get_user_model()


def _session_contains_user(session_key: str, user_id: int) -> bool:
    session = Session.objects.filter(session_key=session_key).first()
    if session is None:
        return False
    try:
        session_data = session.get_decoded()
    except Exception:
        return False
    return str(session_data.get(SESSION_KEY) or "") == str(user_id)


def _load_authenticated_user(user_id: int):
    return User.objects.filter(pk=user_id, is_active=True).first()


def _session_exists(session_key: str) -> bool:
    return Session.objects.filter(session_key=session_key).exists()


class WebSocketTokenAuthMiddleware(BaseMiddleware):
    """Restores websocket auth from an opaque token when cookies are unavailable."""

    async def __call__(self, scope, receive, send):
        query_string = (scope.get("query_string") or b"").decode(
            "utf-8",
            errors="ignore",
        )
        token = parse_qs(query_string).get(WS_AUTH_QUERY_PARAM, [None])[0]
        claims = resolve_ws_auth_claims(token)
        if claims is not None:
            current_user = scope.get("user")
            if (
                claims.kind == "auth"
                and claims.user_id is not None
                and not getattr(current_user, "is_authenticated", False)
            ):
                session_matches_user = await sync_to_async(
                    _session_contains_user,
                    thread_sensitive=True,
                )(claims.session_key, claims.user_id)
                if session_matches_user:
                    user = await sync_to_async(
                        _load_authenticated_user,
                        thread_sensitive=True,
                    )(claims.user_id)
                    scope["user"] = user if user is not None else AnonymousUser()
            elif claims.kind == "guest" and not scope.get("ws_guest_session_key"):
                session_exists = await sync_to_async(
                    _session_exists,
                    thread_sensitive=True,
                )(claims.session_key)
                if session_exists:
                    scope["ws_guest_session_key"] = claims.session_key

        return await super().__call__(scope, receive, send)
