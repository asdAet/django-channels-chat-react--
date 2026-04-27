"""WebSocket observability metric coverage."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any, cast

from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import TransactionTestCase

from chat.routing import websocket_urlpatterns as chat_ws
from chat_app_django import metrics
from direct_inbox.routing import websocket_urlpatterns as direct_inbox_ws
from presence.routing import websocket_urlpatterns as presence_ws
from rooms.models import Room
from rooms.services import ensure_membership

User = get_user_model()
application = URLRouter(cast(list[Any], chat_ws + direct_inbox_ws + presence_ws))


def _scope_dict(communicator: WebsocketCommunicator) -> dict[str, Any]:
    return cast(dict[str, Any], communicator.scope)


def _sample_value(metric, sample_name: str, labels: dict[str, str]) -> float:
    for collected in metric.collect():
        for sample in collected.samples:
            if sample.name != sample_name:
                continue
            if all(sample.labels.get(key) == value for key, value in labels.items()):
                return float(sample.value)
    return 0.0


class WebSocketObservabilityMetricsTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.owner = User.objects.create_user(username="metrics_owner", password="pass12345")
        self.member = User.objects.create_user(username="metrics_member", password="pass12345")
        self.private_room = Room.objects.create(
            name="metrics-private",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(self.private_room, self.owner, role_name="Owner")
        ensure_membership(self.private_room, self.member, role_name="Member")

    async def _connect_presence(self, *, user=None, session_key: str | None = None):
        communicator = WebsocketCommunicator(
            application,
            "/ws/presence/",
            headers=[(b"host", b"localhost")],
        )
        scope = _scope_dict(communicator)
        scope["user"] = user if user is not None else AnonymousUser()
        scope["client"] = ("198.51.100.10", 55000)
        scope["session"] = SimpleNamespace(session_key=session_key or "presence-session")
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    async def _connect_inbox(self, *, user=None):
        communicator = WebsocketCommunicator(
            application,
            "/ws/inbox/",
            headers=[(b"host", b"localhost")],
        )
        scope = _scope_dict(communicator)
        scope["user"] = user if user is not None else AnonymousUser()
        scope["client"] = ("198.51.100.20", 55010)
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    async def _connect_chat(self, room_id: int, *, user):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{room_id}/",
            headers=[(b"host", b"localhost")],
        )
        scope = _scope_dict(communicator)
        scope["user"] = user
        scope["client"] = ("198.51.100.30", 55020)
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    def test_presence_metrics_track_connect_and_disconnect(self):
        labels = {
            "endpoint": "presence",
            "auth_state": "guest",
            "room_kind": "none",
        }
        connect_before = _sample_value(
            metrics.WS_CONNECT_TOTAL,
            "devils_ws_connect_total",
            {**labels, "result": "accepted", "reason": "none"},
        )
        open_before = _sample_value(
            metrics.WS_OPEN_CONNECTIONS,
            "devils_ws_open_connections",
            labels,
        )
        disconnect_before = _sample_value(
            metrics.WS_EVENTS_TOTAL,
            "devils_ws_events_total",
            {
                "endpoint": "presence",
                "event_type": "disconnect",
                "result": "accepted",
            },
        )

        async def run():
            communicator, connected, _ = await self._connect_presence()
            self.assertTrue(connected)
            await communicator.receive_from(timeout=2)

            connect_after_connect = _sample_value(
                metrics.WS_CONNECT_TOTAL,
                "devils_ws_connect_total",
                {**labels, "result": "accepted", "reason": "none"},
            )
            open_after_connect = _sample_value(
                metrics.WS_OPEN_CONNECTIONS,
                "devils_ws_open_connections",
                labels,
            )
            self.assertEqual(connect_after_connect, connect_before + 1)
            self.assertEqual(open_after_connect, open_before + 1)

            await communicator.disconnect()

        async_to_sync(run)()

        open_after_disconnect = _sample_value(
            metrics.WS_OPEN_CONNECTIONS,
            "devils_ws_open_connections",
            labels,
        )
        disconnect_after = _sample_value(
            metrics.WS_EVENTS_TOTAL,
            "devils_ws_events_total",
            {
                "endpoint": "presence",
                "event_type": "disconnect",
                "result": "accepted",
            },
        )
        self.assertEqual(open_after_disconnect, open_before)
        self.assertEqual(disconnect_after, disconnect_before + 1)

    def test_direct_inbox_guest_rejection_is_counted(self):
        before = _sample_value(
            metrics.WS_CONNECT_TOTAL,
            "devils_ws_connect_total",
            {
                "endpoint": "direct_inbox",
                "auth_state": "guest",
                "room_kind": "none",
                "result": "rejected",
                "reason": "unauthorized",
            },
        )

        async def run():
            _communicator, connected, close_code = await self._connect_inbox()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4401)

        async_to_sync(run)()

        after = _sample_value(
            metrics.WS_CONNECT_TOTAL,
            "devils_ws_connect_total",
            {
                "endpoint": "direct_inbox",
                "auth_state": "guest",
                "room_kind": "none",
                "result": "rejected",
                "reason": "unauthorized",
            },
        )
        self.assertEqual(after, before + 1)

    def test_chat_message_send_metrics_track_acceptance(self):
        connection_labels = {
            "endpoint": "chat",
            "auth_state": "authenticated",
            "room_kind": "private",
        }
        connect_before = _sample_value(
            metrics.WS_CONNECT_TOTAL,
            "devils_ws_connect_total",
            {**connection_labels, "result": "accepted", "reason": "none"},
        )
        event_before = _sample_value(
            metrics.WS_EVENTS_TOTAL,
            "devils_ws_events_total",
            {
                "endpoint": "chat",
                "event_type": "message_send",
                "result": "accepted",
            },
        )
        open_before = _sample_value(
            metrics.WS_OPEN_CONNECTIONS,
            "devils_ws_open_connections",
            connection_labels,
        )

        async def run():
            communicator, connected, _ = await self._connect_chat(self.private_room.pk, user=self.member)
            self.assertTrue(connected)

            connect_after_connect = _sample_value(
                metrics.WS_CONNECT_TOTAL,
                "devils_ws_connect_total",
                {**connection_labels, "result": "accepted", "reason": "none"},
            )
            open_after_connect = _sample_value(
                metrics.WS_OPEN_CONNECTIONS,
                "devils_ws_open_connections",
                connection_labels,
            )
            self.assertEqual(connect_after_connect, connect_before + 1)
            self.assertEqual(open_after_connect, open_before + 1)

            await communicator.send_to(text_data=json.dumps({"message": "metrics message"}))
            payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(payload.get("message"), "metrics message")
            await communicator.disconnect()

        async_to_sync(run)()

        event_after = _sample_value(
            metrics.WS_EVENTS_TOTAL,
            "devils_ws_events_total",
            {
                "endpoint": "chat",
                "event_type": "message_send",
                "result": "accepted",
            },
        )
        open_after = _sample_value(
            metrics.WS_OPEN_CONNECTIONS,
            "devils_ws_open_connections",
            connection_labels,
        )
        self.assertEqual(event_after, event_before + 1)
        self.assertEqual(open_after, open_before)
