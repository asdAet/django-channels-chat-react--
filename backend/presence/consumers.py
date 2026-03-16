"""WebSocket consumer for user online presence tracking."""

import asyncio
import json
import time
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar, cast

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.core.cache import cache

from chat_app_django.ip_utils import get_client_ip_from_scope
from chat_app_django.media_utils import build_profile_url, serialize_avatar_crop
from chat_app_django.security.audit import audit_ws_event
from chat_app_django.security.rate_limit import DbRateLimiter
from chat_app_django.security.rate_limit_config import (
    ws_connect_rate_limit_disabled,
    ws_connect_rate_limit_policy,
)
from users.identity import user_public_ref, user_public_username

from .constants import (
    PRESENCE_CACHE_KEY_AUTH,
    PRESENCE_CACHE_KEY_GUEST,
    PRESENCE_CACHE_TTL_SECONDS,
    PRESENCE_CLOSE_IDLE_CODE,
    PRESENCE_GROUP_AUTH,
    PRESENCE_GROUP_GUEST,
)

T = TypeVar("T")


def _to_async(func: Callable[..., T]) -> Callable[..., Awaitable[T]]:
    return cast(Callable[..., Awaitable[T]], sync_to_async(func, thread_sensitive=True))


def _ws_connect_rate_limited(scope, endpoint: str) -> bool:
    """Checks websocket connect rate limit per endpoint and IP."""
    if ws_connect_rate_limit_disabled():
        return False
    ip = get_client_ip_from_scope(scope) or "unknown"
    scope_key = f"rl:ws:connect:{endpoint}:{ip}"
    policy = ws_connect_rate_limit_policy(endpoint)
    return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)


class PresenceConsumer(AsyncWebsocketConsumer):
    """Tracks user online/offline presence via WebSocket."""

    group_name_auth = PRESENCE_GROUP_AUTH
    group_name_guest = PRESENCE_GROUP_GUEST
    cache_key = PRESENCE_CACHE_KEY_AUTH
    guest_cache_key = PRESENCE_CACHE_KEY_GUEST
    presence_ttl = int(settings.PRESENCE_TTL)
    presence_grace = int(settings.PRESENCE_GRACE)
    presence_heartbeat = int(settings.PRESENCE_HEARTBEAT)
    presence_idle_timeout = int(settings.PRESENCE_IDLE_TIMEOUT)
    cache_timeout_seconds = PRESENCE_CACHE_TTL_SECONDS
    presence_touch_interval = int(settings.PRESENCE_TOUCH_INTERVAL)

    async def connect(self):
        user = self.scope.get("user")
        self.is_guest = not user or not user.is_authenticated
        self.group_name = self.group_name_guest if self.is_guest else self.group_name_auth
        self.guest_key = self._get_guest_session_key() if self.is_guest else None

        if self.is_guest and not self.guest_key:
            audit_ws_event("ws.connect.denied", self.scope, endpoint="presence", reason="missing_guest_session", code=4401)
            await self.close(code=4401)
            return

        if await _to_async(_ws_connect_rate_limited)(self.scope, "presence"):
            audit_ws_event("ws.connect.denied", self.scope, endpoint="presence", reason="rate_limited", code=4429)
            await self.close(code=4429)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        audit_ws_event("ws.connect.accepted", self.scope, endpoint="presence")

        self._last_client_activity = time.monotonic()
        self._next_presence_touch_at = 0.0
        self._heartbeat_task = asyncio.create_task(self._heartbeat())
        self._idle_task = None
        if self.presence_idle_timeout > 0:
            self._idle_task = asyncio.create_task(self._idle_watchdog())

        if self.is_guest:
            await self._add_guest(self.guest_key)
        else:
            await self._add_user(user)
        await self._broadcast()

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

        user = self.scope.get("user")
        graceful = code in (1000, 1001)
        if self.is_guest:
            await self._remove_guest(self.guest_key, graceful=graceful)
        elif user and user.is_authenticated:
            await self._remove_user(user, graceful=graceful)

        await self._broadcast()
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        audit_ws_event("ws.disconnect", self.scope, endpoint="presence", code=code)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        now = time.monotonic()
        self._last_client_activity = now
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            audit_ws_event("ws.presence.rejected", self.scope, endpoint="presence", reason="invalid_json")
            return
        if payload.get("type") != "ping":
            audit_ws_event(
                "ws.presence.rejected",
                self.scope,
                endpoint="presence",
                reason="unsupported_event",
                event_type=payload.get("type"),
            )
            return

        if now < self._next_presence_touch_at:
            return
        self._next_presence_touch_at = now + self.presence_touch_interval

        user = self.scope.get("user")
        if self.is_guest:
            await self._touch_guest(self.guest_key)
        elif user and user.is_authenticated:
            await self._touch_user(user)

    async def _broadcast(self):
        online = await self._get_online()
        guests = await self._get_guest_count()
        await self.channel_layer.group_send(
            self.group_name_guest,
            {"type": "presence.update", "guests": guests},
        )
        await self.channel_layer.group_send(
            self.group_name_auth,
            {"type": "presence.update", "online": online, "guests": guests},
        )

    async def presence_update(self, event):
        payload = {}
        if "online" in event:
            payload["online"] = event["online"]
        if "guests" in event:
            payload["guests"] = event["guests"]
        if payload:
            await self.send(text_data=json.dumps(payload))

    async def _heartbeat(self):
        interval = max(5, self.presence_heartbeat)
        while True:
            await asyncio.sleep(interval)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def _idle_watchdog(self):
        interval = max(5, min(self.presence_heartbeat, self.presence_idle_timeout))
        while True:
            await asyncio.sleep(interval)
            if (time.monotonic() - self._last_client_activity) <= self.presence_idle_timeout:
                continue
            await self.close(code=PRESENCE_CLOSE_IDLE_CODE)
            break

    @staticmethod
    def _normalize_presence_value(value: object) -> str:
        if not isinstance(value, str):
            return ""
        return value.strip()

    @staticmethod
    def _coerce_presence_int(value: object, default: int = 0) -> int:
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            try:
                return int(value)
            except (TypeError, ValueError, OverflowError):
                return default
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return default
            try:
                return int(normalized)
            except (TypeError, ValueError, OverflowError):
                return default
        return default

    def _resolve_presence_user_identity(self, user: Any) -> tuple[str, str, str]:
        public_ref = self._normalize_presence_value(user_public_ref(user))
        username = self._normalize_presence_value(user_public_username(user))
        key = public_ref or username
        return key, public_ref, username

    @staticmethod
    def _resolve_presence_entry(
        data: dict[str, dict[str, object]],
        *,
        key: str,
        username: str,
    ) -> tuple[str, dict[str, object] | None]:
        if key and key in data:
            return key, data.get(key)
        if username and username in data:
            return username, data.get(username)
        return key, None

    def _add_user_sync(self, user: Any) -> None:
        key, public_ref, username = self._resolve_presence_user_identity(user)
        if not key:
            return
        data = cache.get(self.cache_key, {}) or {}
        existing_key, current = self._resolve_presence_entry(
            data,
            key=key,
            username=username,
        )
        if current is None:
            current = {}
        elif existing_key != key:
            data.pop(existing_key, None)
        count = self._coerce_presence_int(current.get("count", 0), default=0) + 1
        profile = getattr(user, "profile", None)
        image_name = getattr(profile, "image", None)
        image_name = image_name.name if image_name else ""
        image_url = build_profile_url(self.scope, image_name) if image_name else None
        avatar_crop = serialize_avatar_crop(profile)
        data[key] = {
            "count": count,
            "publicRef": public_ref or key,
            "username": username or self._normalize_presence_value(current.get("username")) or key,
            "profileImage": image_url,
            "avatarCrop": avatar_crop,
            "last_seen": time.time(),
            "grace_until": 0,
        }
        cache.set(self.cache_key, data, timeout=self.cache_timeout_seconds)

    async def _add_user(self, user: Any) -> None:
        await _to_async(self._add_user_sync)(user)

    def _remove_user_sync(self, user: Any, graceful: bool = False) -> None:
        key, _public_ref, username = self._resolve_presence_user_identity(user)
        if not key:
            return
        data = cache.get(self.cache_key, {}) or {}
        existing_key, entry = self._resolve_presence_entry(
            data,
            key=key,
            username=username,
        )
        if entry is None:
            return
        count = self._coerce_presence_int(entry.get("count", 1), default=1) - 1
        now = time.time()
        if count <= 0:
            if graceful or self.presence_grace <= 0:
                data.pop(existing_key, None)
            else:
                entry["count"] = 0
                entry["last_seen"] = now
                entry["grace_until"] = now + self.presence_grace
                entry["username"] = username or self._normalize_presence_value(entry.get("username")) or key
                data[key] = entry
                if existing_key != key:
                    data.pop(existing_key, None)
        else:
            entry["count"] = count
            entry["last_seen"] = now
            entry["grace_until"] = 0
            entry["username"] = username or self._normalize_presence_value(entry.get("username")) or key
            data[key] = entry
            if existing_key != key:
                data.pop(existing_key, None)
        cache.set(self.cache_key, data, timeout=self.cache_timeout_seconds)

    async def _remove_user(self, user: Any, graceful: bool = False) -> None:
        await _to_async(self._remove_user_sync)(user, graceful)

    def _get_online_sync(self) -> list[dict[str, object]]:
        data = cache.get(self.cache_key, {}) or {}
        now = time.time()
        cleaned = {}
        for actor_key, info in data.items():
            try:
                count = int(info.get("count", 0))
            except (TypeError, ValueError):
                count = 0
            last_seen = info.get("last_seen", 0)
            grace_until = info.get("grace_until", 0)
            if count > 0 and (now - last_seen) <= self.presence_ttl:
                cleaned[actor_key] = info
            elif (
                count <= 0
                and grace_until
                and grace_until > now
                and (now - last_seen) <= self.presence_ttl
            ):
                cleaned[actor_key] = info
        if cleaned != data:
            cache.set(self.cache_key, cleaned, timeout=self.cache_timeout_seconds)
        return [
            {
                "publicRef": self._normalize_presence_value(info.get("publicRef")) or actor_key,
                "username": self._normalize_presence_value(info.get("username")) or actor_key,
                "profileImage": info.get("profileImage"),
                "avatarCrop": info.get("avatarCrop"),
            }
            for actor_key, info in cleaned.items()
        ]

    async def _get_online(self) -> list[dict[str, object]]:
        return await _to_async(self._get_online_sync)()

    def _add_guest_sync(self, ip: str | None) -> None:
        if not ip:
            return
        data = cache.get(self.guest_cache_key, {}) or {}
        current = data.get(ip, {})
        try:
            count = int(current.get("count", 0))
        except (TypeError, ValueError, AttributeError):
            count = 0
        data[ip] = {"count": count + 1, "last_seen": time.time(), "grace_until": 0}
        cache.set(self.guest_cache_key, data, timeout=self.cache_timeout_seconds)

    async def _add_guest(self, ip: str | None) -> None:
        await _to_async(self._add_guest_sync)(ip)

    def _remove_guest_sync(self, ip: str | None, graceful: bool = False) -> None:
        if not ip:
            return
        data = cache.get(self.guest_cache_key, {}) or {}
        current = data.get(ip, {})
        try:
            count = int(current.get("count", 0))
        except (TypeError, ValueError, AttributeError):
            count = 0
        count -= 1
        now = time.time()
        if count <= 0:
            if graceful or self.presence_grace <= 0:
                data.pop(ip, None)
            else:
                data[ip] = {"count": 0, "last_seen": now, "grace_until": now + self.presence_grace}
        else:
            data[ip] = {"count": count, "last_seen": now, "grace_until": 0}
        if data:
            cache.set(self.guest_cache_key, data, timeout=self.cache_timeout_seconds)
        else:
            cache.delete(self.guest_cache_key)

    async def _remove_guest(self, ip: str | None, graceful: bool = False) -> None:
        await _to_async(self._remove_guest_sync)(ip, graceful)

    def _get_guest_count_sync(self) -> int:
        data = cache.get(self.guest_cache_key, {}) or {}
        now = time.time()
        cleaned = {}
        for ip, info in data.items():
            try:
                count = int(info.get("count", 0))
            except (TypeError, ValueError, AttributeError):
                count = 0
            last_seen = info.get("last_seen", 0)
            grace_until = info.get("grace_until", 0)
            if count > 0 and (now - last_seen) <= self.presence_ttl:
                cleaned[ip] = info
            elif (
                count <= 0
                and grace_until
                and grace_until > now
                and (now - last_seen) <= self.presence_ttl
            ):
                cleaned[ip] = info
        if cleaned != data:
            cache.set(self.guest_cache_key, cleaned, timeout=self.cache_timeout_seconds)
        return len(cleaned)

    async def _get_guest_count(self) -> int:
        return await _to_async(self._get_guest_count_sync)()

    def _touch_user_sync(self, user: Any) -> None:
        key, public_ref, username = self._resolve_presence_user_identity(user)
        if not key:
            return
        data = cache.get(self.cache_key, {}) or {}
        existing_key, current = self._resolve_presence_entry(
            data,
            key=key,
            username=username,
        )
        profile = getattr(user, "profile", None)
        image_name = getattr(profile, "image", None)
        image_name = image_name.name if image_name else ""
        image_url = build_profile_url(self.scope, image_name) if image_name else None
        avatar_crop = serialize_avatar_crop(profile)
        if not current:
            data[key] = {
                "count": 1,
                "publicRef": public_ref or key,
                "username": username or key,
                "profileImage": image_url,
                "avatarCrop": avatar_crop,
                "last_seen": time.time(),
                "grace_until": 0,
            }
        else:
            count_value = self._coerce_presence_int(current.get("count", 1), default=1)
            if count_value <= 0:
                count_value = 1
            current["count"] = count_value
            current["last_seen"] = time.time()
            current["grace_until"] = 0
            current["publicRef"] = public_ref or key
            current["username"] = username or self._normalize_presence_value(current.get("username")) or key
            current["profileImage"] = image_url
            current["avatarCrop"] = avatar_crop
            data[key] = current
            if existing_key != key:
                data.pop(existing_key, None)
        cache.set(self.cache_key, data, timeout=self.cache_timeout_seconds)

    async def _touch_user(self, user: Any) -> None:
        await _to_async(self._touch_user_sync)(user)

    def _touch_guest_sync(self, ip: str | None) -> None:
        if not ip:
            return
        data = cache.get(self.guest_cache_key, {}) or {}
        current = data.get(ip)
        if not current:
            data[ip] = {"count": 1, "last_seen": time.time(), "grace_until": 0}
        else:
            data[ip] = {
                "count": current.get("count", 1),
                "last_seen": time.time(),
                "grace_until": 0,
            }
        cache.set(self.guest_cache_key, data, timeout=self.cache_timeout_seconds)

    async def _touch_guest(self, ip: str | None) -> None:
        await _to_async(self._touch_guest_sync)(ip)

    def _get_guest_session_key(self) -> str | None:
        """Returns guest session key from scope when session is initialized."""
        session = self.scope.get("session")
        if not session:
            return None
        key = getattr(session, "session_key", None)
        if not key:
            return None
        return str(key)
