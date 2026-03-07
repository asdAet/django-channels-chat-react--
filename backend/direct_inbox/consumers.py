"""WebSocket consumer for direct message inbox state."""

import asyncio
import json
import time
import uuid
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar, cast

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

from chat_app_django.ip_utils import get_client_ip_from_scope
from chat_app_django.security.audit import audit_ws_event
from chat_app_django.security.rate_limit import DbRateLimiter, RateLimitPolicy
from chat.utils import is_valid_room_slug as _is_valid_room_slug
from roles.access import can_read
from rooms.models import Room

from .constants import DIRECT_INBOX_CLOSE_IDLE_CODE
from .state import (
    clear_active_room,
    get_unread_state,
    mark_read,
    set_active_room,
    touch_active_room,
    user_group_name,
)

T = TypeVar("T")


def _to_async(func: Callable[..., T]) -> Callable[..., Awaitable[T]]:
    return cast(Callable[..., Awaitable[T]], sync_to_async(func, thread_sensitive=True))


def _ws_connect_rate_limited(scope, endpoint: str) -> bool:
    """Checks websocket connect rate limit per endpoint and IP."""
    limit = int(getattr(settings, "WS_CONNECT_RATE_LIMIT", 60))
    window = int(getattr(settings, "WS_CONNECT_RATE_WINDOW", 60))
    ip = get_client_ip_from_scope(scope) or "unknown"
    scope_key = f"rl:ws:connect:{endpoint}:{ip}"
    policy = RateLimitPolicy(limit=limit, window_seconds=window)
    return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)


class DirectInboxConsumer(AsyncWebsocketConsumer):
    """Manages unread/active state for direct message conversations."""

    unread_ttl = int(getattr(settings, "DIRECT_INBOX_UNREAD_TTL", 30 * 24 * 60 * 60))
    active_ttl = int(getattr(settings, "DIRECT_INBOX_ACTIVE_TTL", 90))
    heartbeat_seconds = int(getattr(settings, "DIRECT_INBOX_HEARTBEAT", 20))
    idle_timeout = int(getattr(settings, "DIRECT_INBOX_IDLE_TIMEOUT", 90))

    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            audit_ws_event("ws.connect.denied", self.scope, endpoint="direct_inbox", reason="unauthorized", code=4401)
            await self.close(code=4401)
            return

        if await _to_async(_ws_connect_rate_limited)(self.scope, "direct_inbox"):
            audit_ws_event("ws.connect.denied", self.scope, endpoint="direct_inbox", reason="rate_limited", code=4429)
            await self.close(code=4429)
            return

        self.user = user
        self.conn_id = uuid.uuid4().hex
        self.group_name = user_group_name(user.pk)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        audit_ws_event("ws.connect.accepted", self.scope, endpoint="direct_inbox")

        self._last_client_activity = time.monotonic()
        self._heartbeat_task = asyncio.create_task(self._heartbeat())
        self._idle_task = None
        if self.idle_timeout > 0:
            self._idle_task = asyncio.create_task(self._idle_watchdog())

        await self._send_unread_state()

    async def disconnect(self, code):
        for task_name in ("_heartbeat_task", "_idle_task"):
            task = getattr(self, task_name, None)
            if not task:
                continue
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        user = getattr(self, "user", None)
        if user and user.is_authenticated:
            await self._clear_active_room(conn_only=True)

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        audit_ws_event("ws.disconnect", self.scope, endpoint="direct_inbox", code=code)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        self._last_client_activity = time.monotonic()
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            audit_ws_event("ws.direct_inbox.rejected", self.scope, endpoint="direct_inbox", reason="invalid_json")
            return

        event_type = payload.get("type")
        if event_type == "ping":
            await self._touch_active_room()
            return

        if event_type == "set_active_room":
            raw_slug = payload.get("roomSlug")
            if raw_slug is None:
                await self._clear_active_room(conn_only=True)
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.success",
                    self.scope,
                    endpoint="direct_inbox",
                    room_slug=None,
                )
                return
            if not isinstance(raw_slug, str):
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="invalid_payload",
                )
                await self._send_error("invalid_payload")
                return

            room_slug = raw_slug.strip()
            if not _is_valid_room_slug(room_slug):
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_slug=room_slug,
                )
                await self._send_error("forbidden")
                return

            room = await self._load_room(room_slug)
            if not room or room.kind != Room.Kind.DIRECT or not await self._can_read(room):
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_slug=room_slug,
                )
                await self._send_error("forbidden")
                return

            await self._set_active_room(room_slug)
            audit_ws_event(
                "ws.direct_inbox.set_active_room.success",
                self.scope,
                endpoint="direct_inbox",
                room_slug=room_slug,
            )
            return

        if event_type == "mark_read":
            raw_slug = payload.get("roomSlug")
            if not isinstance(raw_slug, str):
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="invalid_payload",
                )
                await self._send_error("invalid_payload")
                return

            room_slug = raw_slug.strip()
            if not _is_valid_room_slug(room_slug):
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_slug=room_slug,
                )
                await self._send_error("forbidden")
                return

            room = await self._load_room(room_slug)
            if not room or room.kind != Room.Kind.DIRECT or not await self._can_read(room):
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_slug=room_slug,
                )
                await self._send_error("forbidden")
                return

            unread = await self._mark_read(room_slug)
            audit_ws_event(
                "ws.direct_inbox.mark_read.success",
                self.scope,
                endpoint="direct_inbox",
                room_slug=room_slug,
            )
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "direct_mark_read_ack",
                        "roomSlug": room_slug,
                        "unread": unread,
                    }
                )
            )
            return

        audit_ws_event(
            "ws.direct_inbox.rejected",
            self.scope,
            endpoint="direct_inbox",
            reason="unsupported_event",
            event_type=event_type,
        )

    async def direct_inbox_event(self, event):
        payload = event.get("payload")
        if not isinstance(payload, dict):
            return
        await self.send(text_data=json.dumps(payload))

    async def _send_unread_state(self):
        unread = await self._get_unread_state()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "direct_unread_state",
                    "unread": unread,
                }
            )
        )

    async def _send_error(self, code: str):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "error",
                    "code": code,
                }
            )
        )

    async def _heartbeat(self):
        interval = max(5, self.heartbeat_seconds)
        while True:
            await asyncio.sleep(interval)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def _idle_watchdog(self):
        interval = max(5, min(self.heartbeat_seconds, self.idle_timeout))
        while True:
            await asyncio.sleep(interval)
            if (time.monotonic() - self._last_client_activity) <= self.idle_timeout:
                continue
            await self.close(code=DIRECT_INBOX_CLOSE_IDLE_CODE)
            break

    def _load_room_sync(self, room_slug: str) -> Room | None:
        return Room.objects.filter(slug=room_slug).first()

    async def _load_room(self, room_slug: str) -> Room | None:
        return await _to_async(self._load_room_sync)(room_slug)

    def _can_read_sync(self, room: Room) -> bool:
        return can_read(room, self.user)

    async def _can_read(self, room: Room) -> bool:
        return await _to_async(self._can_read_sync)(room)

    def _get_unread_state_sync(self) -> dict[str, Any]:
        return get_unread_state(self.user.pk)

    async def _get_unread_state(self) -> dict[str, Any]:
        return await _to_async(self._get_unread_state_sync)()

    def _mark_read_sync(self, room_slug: str) -> dict[str, Any]:
        return mark_read(self.user.pk, room_slug, self.unread_ttl)

    async def _mark_read(self, room_slug: str) -> dict[str, Any]:
        return await _to_async(self._mark_read_sync)(room_slug)

    def _set_active_room_sync(self, room_slug: str) -> None:
        set_active_room(self.user.pk, room_slug, self.conn_id, self.active_ttl)

    async def _set_active_room(self, room_slug: str) -> None:
        await _to_async(self._set_active_room_sync)(room_slug)

    def _clear_active_room_sync(self, conn_only: bool = False) -> None:
        clear_active_room(self.user.pk, self.conn_id if conn_only else None)

    async def _clear_active_room(self, conn_only: bool = False) -> None:
        await _to_async(self._clear_active_room_sync)(conn_only)

    def _touch_active_room_sync(self) -> None:
        touch_active_room(self.user.pk, self.conn_id, self.active_ttl)

    async def _touch_active_room(self) -> None:
        await _to_async(self._touch_active_room_sync)()
