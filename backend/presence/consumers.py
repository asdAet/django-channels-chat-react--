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
from chat_app_django.metrics import (
    dec_ws_open_connection,
    inc_ws_open_connection,
    normalize_ws_auth_state,
    observe_ws_connect,
    observe_ws_event,
)
from chat_app_django.media_utils import serialize_avatar_crop
from chat_app_django.security.audit import audit_ws_event
from chat_app_django.security.rate_limit import DbRateLimiter
from chat_app_django.security.rate_limit_config import (
    ws_connect_rate_limit_disabled,
    ws_connect_rate_limit_policy,
)
from users.avatar_service import resolve_user_avatar_url_from_scope
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
    """Вспомогательная функция `_to_async` реализует внутренний шаг бизнес-логики.
    
    Args:
        func: Параметр func, используемый в логике функции.
    
    Returns:
        Объект типа Callable[..., Awaitable[T]], сформированный в ходе выполнения.
    """
    return cast(Callable[..., Awaitable[T]], sync_to_async(func, thread_sensitive=True))


def _ws_connect_rate_limited(scope, endpoint: str) -> bool:
    """Выполняет вспомогательную обработку для ws connect rate limited.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        endpoint: Идентификатор API/WS endpoint для применения правил.
    
    Returns:
        Логическое значение результата проверки.
    """
    if ws_connect_rate_limit_disabled():
        return False
    ip = get_client_ip_from_scope(scope) or "unknown"
    scope_key = f"rl:ws:connect:{endpoint}:{ip}"
    policy = ws_connect_rate_limit_policy(endpoint)
    return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)


class PresenceConsumer(AsyncWebsocketConsumer):
    """Класс PresenceConsumer обрабатывает WebSocket-события и сообщения."""

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
        """Устанавливает соединение и выполняет проверки доступа."""
        user = self.scope.get("user")
        self._metrics_connected = False
        self._metrics_auth_state = normalize_ws_auth_state(user)
        self._metrics_room_kind = "none"
        self.is_guest = not user or not user.is_authenticated
        self.group_name = self.group_name_guest if self.is_guest else self.group_name_auth
        self.guest_key = self._get_guest_session_key() if self.is_guest else None

        if self.is_guest and not self.guest_key:
            observe_ws_connect(
                "presence",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
                result="rejected",
                reason="missing_guest_session",
            )
            audit_ws_event("ws.connect.denied", self.scope, endpoint="presence", reason="missing_guest_session", code=4401)
            await self.close(code=4401)
            return

        if await _to_async(_ws_connect_rate_limited)(self.scope, "presence"):
            observe_ws_connect(
                "presence",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
                result="rejected",
                reason="rate_limited",
            )
            audit_ws_event("ws.connect.denied", self.scope, endpoint="presence", reason="rate_limited", code=4429)
            await self.close(code=4429)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self._metrics_connected = True
        observe_ws_connect(
            "presence",
            auth_state=self._metrics_auth_state,
            room_kind=self._metrics_room_kind,
            result="accepted",
        )
        inc_ws_open_connection(
            "presence",
            auth_state=self._metrics_auth_state,
            room_kind=self._metrics_room_kind,
        )
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
        """Корректно закрывает соединение и освобождает ресурсы.
        
        Args:
            code: Код ошибки или состояния.
        """
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
        if getattr(self, "_metrics_connected", False):
            dec_ws_open_connection(
                "presence",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
            )
            observe_ws_event("presence", event_type="disconnect", result="accepted")
        audit_ws_event("ws.disconnect", self.scope, endpoint="presence", code=code)

    async def receive(self, text_data=None, bytes_data=None):
        """Принимает входящее сообщение и маршрутизирует его обработку.
        
        Args:
            text_data: Параметр text data, используемый в логике функции.
            bytes_data: Параметр bytes data, используемый в логике функции.
        """
        if not text_data:
            return
        now = time.monotonic()
        self._last_client_activity = now
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            observe_ws_event("presence", event_type="ping", result="rejected")
            audit_ws_event("ws.presence.rejected", self.scope, endpoint="presence", reason="invalid_json")
            return
        if payload.get("type") != "ping":
            observe_ws_event("presence", event_type="receive", result="rejected")
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
        observe_ws_event("presence", event_type="ping", result="accepted")

        user = self.scope.get("user")
        if self.is_guest:
            await self._touch_guest(self.guest_key)
        elif user and user.is_authenticated:
            await self._touch_user(user)

    async def _broadcast(self):
        """Выполняет вспомогательную обработку для broadcast."""
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
        """Обрабатывает WebSocket-событие presence update.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        payload = {}
        if "online" in event:
            payload["online"] = event["online"]
        if "guests" in event:
            payload["guests"] = event["guests"]
        if payload:
            await self.send(text_data=json.dumps(payload))

    async def _heartbeat(self):
        """Выполняет вспомогательную обработку для heartbeat."""
        interval = max(5, self.presence_heartbeat)
        while True:
            await asyncio.sleep(interval)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def _idle_watchdog(self):
        """Выполняет вспомогательную обработку для idle watchdog."""
        interval = max(5, min(self.presence_heartbeat, self.presence_idle_timeout))
        while True:
            await asyncio.sleep(interval)
            if (time.monotonic() - self._last_client_activity) <= self.presence_idle_timeout:
                continue
            await self.close(code=PRESENCE_CLOSE_IDLE_CODE)
            break

    @staticmethod
    def _normalize_presence_value(value: object) -> str:
        """Нормализует presence value к внутреннему формату приложения.
        
        Args:
            value: Входное значение для проверки или преобразования.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        if not isinstance(value, str):
            return ""
        return value.strip()

    @staticmethod
    def _coerce_presence_int(value: object, default: int = 0) -> int:
        """Преобразует presence int к допустимому типу или формату.
        
        Args:
            value: Входное значение для проверки или преобразования.
            default: Значение по умолчанию, применяемое при отсутствии пользовательского ввода.
        
        Returns:
            Целочисленное значение результата вычисления.
        """
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
        """Определяет presence user identity на основе доступного контекста.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Кортеж типа tuple[str, str, str] с результатами операции.
        """
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
        """Определяет presence entry на основе доступного контекста.
        
        Args:
            data: Словарь входных данных для обработки.
            key: Ключ в хранилище состояния или словаре промежуточных данных.
            username: Публичное имя пользователя, используемое в событиях и ответах.
        
        Returns:
            Кортеж типа tuple[str, dict[str, object] | None] с результатами операции.
        """
        if key and key in data:
            return key, data.get(key)
        if username and username in data:
            return username, data.get(username)
        return key, None

    def _add_user_sync(self, user: Any) -> None:
        """Выполняет вспомогательную обработку для add user sync.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        """
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
        image_url = resolve_user_avatar_url_from_scope(self.scope, user)
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
        """Выполняет вспомогательную обработку для add user.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        """
        await _to_async(self._add_user_sync)(user)

    def _remove_user_sync(self, user: Any, graceful: bool = False) -> None:
        """Удаляет user sync из целевого набора данных.
        
        Args:
            user: Пользователь, для которого выполняется операция.
            graceful: Флаг штатного завершения соединения без ошибки.
        """
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
        """Удаляет user из целевого набора данных.
        
        Args:
            user: Пользователь, для которого выполняется операция.
            graceful: Флаг штатного завершения соединения без ошибки.
        """
        await _to_async(self._remove_user_sync)(user, graceful)

    def _get_online_sync(self) -> list[dict[str, object]]:
        """Возвращает online sync из текущего контекста или хранилища.
        
        Returns:
            Список типа list[dict[str, object]] с результатами операции.
        """
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
        """Возвращает online из текущего контекста или хранилища.
        
        Returns:
            Список типа list[dict[str, object]] с результатами операции.
        """
        return await _to_async(self._get_online_sync)()

    def _add_guest_sync(self, ip: str | None) -> None:
        """Добавляет guest sync в целевую коллекцию.
        
        Args:
            ip: IP-адрес клиента.
        """
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
        """Добавляет guest в целевую коллекцию.
        
        Args:
            ip: IP-адрес клиента.
        """
        await _to_async(self._add_guest_sync)(ip)

    def _remove_guest_sync(self, ip: str | None, graceful: bool = False) -> None:
        """Удаляет guest sync из целевого набора данных.
        
        Args:
            ip: IP-адрес клиента или узла, выполняющего запрос.
            graceful: Флаг штатного завершения соединения без ошибки.
        """
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
        """Удаляет guest из целевого набора данных.
        
        Args:
            ip: IP-адрес клиента или узла, выполняющего запрос.
            graceful: Флаг штатного завершения соединения без ошибки.
        """
        await _to_async(self._remove_guest_sync)(ip, graceful)

    def _get_guest_count_sync(self) -> int:
        """Возвращает guest count sync из текущего контекста или хранилища.
        
        Returns:
            Целочисленное значение результата вычисления.
        """
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
        """Возвращает guest count из текущего контекста или хранилища.
        
        Returns:
            Целочисленное значение результата вычисления.
        """
        return await _to_async(self._get_guest_count_sync)()

    def _touch_user_sync(self, user: Any) -> None:
        """Обновляет метку активности для user sync.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        """
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
        image_url = resolve_user_avatar_url_from_scope(self.scope, user)
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
        """Обновляет метку активности для user.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        """
        await _to_async(self._touch_user_sync)(user)

    def _touch_guest_sync(self, ip: str | None) -> None:
        """Обновляет метку активности для guest sync.
        
        Args:
            ip: IP-адрес клиента или узла, выполняющего запрос.
        """
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
        """Обновляет метку активности для guest.
        
        Args:
            ip: IP-адрес клиента или узла, выполняющего запрос.
        """
        await _to_async(self._touch_guest_sync)(ip)

    def _get_guest_session_key(self) -> str | None:
        """Возвращает guest session key из текущего контекста или хранилища.
        
        Returns:
            Объект типа str | None, сформированный в рамках обработки.
        """
        ws_guest_session_key = self.scope.get("ws_guest_session_key")
        if isinstance(ws_guest_session_key, str):
            normalized_ws_guest_session_key = ws_guest_session_key.strip()
            if normalized_ws_guest_session_key:
                return normalized_ws_guest_session_key
        session = self.scope.get("session")
        if not session:
            return None
        key = getattr(session, "session_key", None)
        if not key:
            return None
        return str(key)
