"""Tests for opaque websocket auth tokens and middleware restoration."""

from __future__ import annotations

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import Client, TestCase

from chat_app_django.ws_auth import (
    issue_authenticated_ws_auth_token,
    issue_guest_ws_auth_token,
)
from chat_app_django.ws_auth_middleware import WebSocketTokenAuthMiddleware

User = get_user_model()


class WebSocketTokenAuthMiddlewareTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="ws_auth_user",
            password="pass12345",
        )

    def _run_middleware(self, *, query_string: str, user=None):
        captured_scope: dict[str, object] = {}

        async def app(scope, receive, send):
            captured_scope.update(scope)

        async def receive():
            return {"type": "websocket.disconnect"}

        async def send(_message):
            return None

        middleware = WebSocketTokenAuthMiddleware(app)
        scope = {
            "type": "websocket",
            "query_string": query_string.encode("utf-8"),
            "user": user if user is not None else AnonymousUser(),
        }
        async_to_sync(middleware)(scope, receive, send)
        return captured_scope

    def test_authenticated_token_restores_scope_user(self):
        client = Client()
        client.force_login(self.user)
        session_key = client.session.session_key
        assert session_key is not None

        token = issue_authenticated_ws_auth_token(
            user_id=self.user.pk,
            session_key=session_key,
        )

        scope = self._run_middleware(query_string=f"wst={token}")
        restored_user = scope.get("user")

        self.assertIsNotNone(restored_user)
        self.assertTrue(getattr(restored_user, "is_authenticated", False))
        self.assertEqual(getattr(restored_user, "pk", None), self.user.pk)

    def test_guest_token_restores_guest_session_key(self):
        client = Client()
        response = client.get("/api/auth/presence-session/")
        self.assertEqual(response.status_code, 200)
        session_key = client.session.session_key
        assert session_key is not None

        token = issue_guest_ws_auth_token(session_key=session_key)
        scope = self._run_middleware(query_string=f"wst={token}")

        self.assertEqual(scope.get("ws_guest_session_key"), session_key)

    def test_invalidated_session_does_not_restore_user(self):
        client = Client()
        client.force_login(self.user)
        session_key = client.session.session_key
        assert session_key is not None

        token = issue_authenticated_ws_auth_token(
            user_id=self.user.pk,
            session_key=session_key,
        )
        client.logout()

        scope = self._run_middleware(query_string=f"wst={token}")
        restored_user = scope.get("user")

        self.assertFalse(getattr(restored_user, "is_authenticated", False))
