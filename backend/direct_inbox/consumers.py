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
from chat_app_django.metrics import (
    dec_ws_open_connection,
    inc_ws_open_connection,
    normalize_ws_auth_state,
    observe_ws_connect,
    observe_ws_event,
)
from chat_app_django.security.audit import audit_ws_event
from chat_app_django.security.rate_limit import DbRateLimiter
from chat_app_django.security.rate_limit_config import (
    ws_connect_rate_limit_disabled,
    ws_connect_rate_limit_policy,
)
from roles.access import can_read
from rooms.models import Room
from chat.unread_push import build_room_unread_state

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


class DirectInboxConsumer(AsyncWebsocketConsumer):
    """Класс DirectInboxConsumer обрабатывает WebSocket-события и сообщения."""

    unread_ttl = int(settings.DIRECT_INBOX_UNREAD_TTL)
    active_ttl = int(settings.DIRECT_INBOX_ACTIVE_TTL)
    heartbeat_seconds = int(settings.DIRECT_INBOX_HEARTBEAT)
    idle_timeout = int(settings.DIRECT_INBOX_IDLE_TIMEOUT)

    async def connect(self):
        """Устанавливает соединение и выполняет проверки доступа."""
        user = self.scope.get("user")
        self._metrics_connected = False
        self._metrics_auth_state = normalize_ws_auth_state(user)
        self._metrics_room_kind = "none"
        if not user or not user.is_authenticated:
            observe_ws_connect(
                "direct_inbox",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
                result="rejected",
                reason="unauthorized",
            )
            audit_ws_event("ws.connect.denied", self.scope, endpoint="direct_inbox", reason="unauthorized", code=4401)
            await self.close(code=4401)
            return

        if await _to_async(_ws_connect_rate_limited)(self.scope, "direct_inbox"):
            observe_ws_connect(
                "direct_inbox",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
                result="rejected",
                reason="rate_limited",
            )
            audit_ws_event("ws.connect.denied", self.scope, endpoint="direct_inbox", reason="rate_limited", code=4429)
            await self.close(code=4429)
            return

        self.user = user
        self.conn_id = uuid.uuid4().hex
        self.group_name = user_group_name(user.pk)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self._metrics_connected = True
        observe_ws_connect(
            "direct_inbox",
            auth_state=self._metrics_auth_state,
            room_kind=self._metrics_room_kind,
            result="accepted",
        )
        inc_ws_open_connection(
            "direct_inbox",
            auth_state=self._metrics_auth_state,
            room_kind=self._metrics_room_kind,
        )
        audit_ws_event("ws.connect.accepted", self.scope, endpoint="direct_inbox")

        self._last_client_activity = time.monotonic()
        self._heartbeat_task = asyncio.create_task(self._heartbeat())
        self._idle_task = None
        if self.idle_timeout > 0:
            self._idle_task = asyncio.create_task(self._idle_watchdog())

        await self._send_unread_state()
        await self._send_room_unread_state()

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

        user = getattr(self, "user", None)
        if user and user.is_authenticated:
            await self._clear_active_room(conn_only=True)

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if getattr(self, "_metrics_connected", False):
            dec_ws_open_connection(
                "direct_inbox",
                auth_state=self._metrics_auth_state,
                room_kind=self._metrics_room_kind,
            )
            observe_ws_event("direct_inbox", event_type="disconnect", result="accepted")
        audit_ws_event("ws.disconnect", self.scope, endpoint="direct_inbox", code=code)

    async def receive(self, text_data=None, bytes_data=None):
        """Принимает входящее сообщение и маршрутизирует его обработку.
        
        Args:
            text_data: Параметр text data, используемый в логике функции.
            bytes_data: Параметр bytes data, используемый в логике функции.
        """
        if not text_data:
            return

        self._last_client_activity = time.monotonic()
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            observe_ws_event("direct_inbox", event_type="receive", result="rejected")
            audit_ws_event("ws.direct_inbox.rejected", self.scope, endpoint="direct_inbox", reason="invalid_json")
            return

        event_type = payload.get("type")
        if event_type == "ping":
            observe_ws_event("direct_inbox", event_type="ping", result="accepted")
            await self._touch_active_room()
            return

        if event_type == "set_active_room":
            raw_room_id = payload.get("roomId")
            if raw_room_id is None:
                await self._clear_active_room(conn_only=True)
                observe_ws_event("direct_inbox", event_type="set_active_room", result="accepted")
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.success",
                    self.scope,
                    endpoint="direct_inbox",
                    room_id=None,
                )
                return

            try:
                room_id = int(raw_room_id)
            except (TypeError, ValueError):
                observe_ws_event("direct_inbox", event_type="set_active_room", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="invalid_payload",
                )
                await self._send_error("invalid_payload")
                return

            if room_id <= 0:
                observe_ws_event("direct_inbox", event_type="set_active_room", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_id=room_id,
                )
                await self._send_error("forbidden")
                return

            room = await self._load_room(room_id)
            if not room or room.kind != Room.Kind.DIRECT or not await self._can_read(room):
                observe_ws_event("direct_inbox", event_type="set_active_room", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.set_active_room.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_id=room_id,
                )
                await self._send_error("forbidden")
                return

            await self._set_active_room(room_id)
            observe_ws_event("direct_inbox", event_type="set_active_room", result="accepted")
            audit_ws_event(
                "ws.direct_inbox.set_active_room.success",
                self.scope,
                endpoint="direct_inbox",
                room_id=room_id,
            )
            return

        if event_type == "mark_read":
            raw_room_id = payload.get("roomId")
            try:
                room_id = int(raw_room_id)
            except (TypeError, ValueError):
                observe_ws_event("direct_inbox", event_type="mark_read", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="invalid_payload",
                )
                await self._send_error("invalid_payload")
                return

            if room_id <= 0:
                observe_ws_event("direct_inbox", event_type="mark_read", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_id=room_id,
                )
                await self._send_error("forbidden")
                return

            room = await self._load_room(room_id)
            if not room or room.kind != Room.Kind.DIRECT or not await self._can_read(room):
                observe_ws_event("direct_inbox", event_type="mark_read", result="rejected")
                audit_ws_event(
                    "ws.direct_inbox.mark_read.rejected",
                    self.scope,
                    endpoint="direct_inbox",
                    reason="forbidden",
                    room_id=room_id,
                )
                await self._send_error("forbidden")
                return

            unread = await self._mark_read(room_id)
            observe_ws_event("direct_inbox", event_type="mark_read", result="accepted")
            audit_ws_event(
                "ws.direct_inbox.mark_read.success",
                self.scope,
                endpoint="direct_inbox",
                room_id=room_id,
            )
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "direct_mark_read_ack",
                        "roomId": room_id,
                        "unread": unread,
                    }
                )
            )
            await self._send_room_unread_state()
            return

        observe_ws_event("direct_inbox", event_type="receive", result="rejected")
        audit_ws_event(
            "ws.direct_inbox.rejected",
            self.scope,
            endpoint="direct_inbox",
            reason="unsupported_event",
            event_type=event_type,
        )

    async def direct_inbox_event(self, event):
        """Обрабатывает WebSocket-событие direct inbox event.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        payload = event.get("payload")
        if not isinstance(payload, dict):
            return
        await self.send(text_data=json.dumps(payload))

    async def _send_unread_state(self):
        """Выполняет вспомогательную обработку для send unread state."""
        unread = await self._get_unread_state()
        await self.send(
            text_data=json.dumps(
                {
                    "type": "direct_unread_state",
                    "unread": unread,
                }
            )
        )

    async def _send_room_unread_state(self):
        """Отправляет authoritative unread snapshot по всем комнатам пользователя."""
        unread = await _to_async(build_room_unread_state)(self.user)
        await self.send(
            text_data=json.dumps(
                {
                    "type": "room_unread_state",
                    "unread": unread,
                }
            )
        )

    async def _send_error(self, code: str):
        """Выполняет вспомогательную обработку для send error.
        
        Args:
            code: Код ошибки или состояния.
        """
        await self.send(
            text_data=json.dumps(
                {
                    "type": "error",
                    "code": code,
                }
            )
        )

    async def _heartbeat(self):
        """Выполняет вспомогательную обработку для heartbeat."""
        interval = max(5, self.heartbeat_seconds)
        while True:
            await asyncio.sleep(interval)
            try:
                await self.send(text_data=json.dumps({"type": "ping"}))
            except Exception:
                break

    async def _idle_watchdog(self):
        """Выполняет вспомогательную обработку для idle watchdog."""
        interval = max(5, min(self.heartbeat_seconds, self.idle_timeout))
        while True:
            await asyncio.sleep(interval)
            if (time.monotonic() - self._last_client_activity) <= self.idle_timeout:
                continue
            await self.close(code=DIRECT_INBOX_CLOSE_IDLE_CODE)
            break

    def _load_room_sync(self, room_id: int) -> Room | None:
        """Загружает room sync из хранилища с необходимыми проверками.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Объект типа Room | None, сформированный в рамках обработки.
        """
        return Room.objects.filter(pk=room_id).first()

    async def _load_room(self, room_id: int) -> Room | None:
        """Загружает room из хранилища с необходимыми проверками.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Объект типа Room | None, сформированный в рамках обработки.
        """
        return await _to_async(self._load_room_sync)(room_id)

    def _can_read_sync(self, room: Room) -> bool:
        """Проверяет условие read sync и возвращает логический результат.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
        
        Returns:
            Логическое значение результата проверки.
        """
        return can_read(room, self.user)

    async def _can_read(self, room: Room) -> bool:
        """Проверяет условие read и возвращает логический результат.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
        
        Returns:
            Логическое значение результата проверки.
        """
        return await _to_async(self._can_read_sync)(room)

    def _get_unread_state_sync(self) -> dict[str, Any]:
        """Возвращает unread state sync из текущего контекста или хранилища.
        
        Returns:
            Словарь типа dict[str, Any] с результатами операции.
        """
        return get_unread_state(self.user.pk)

    async def _get_unread_state(self) -> dict[str, Any]:
        """Возвращает unread state из текущего контекста или хранилища.
        
        Returns:
            Словарь типа dict[str, Any] с результатами операции.
        """
        return await _to_async(self._get_unread_state_sync)()

    def _mark_read_sync(self, room_id: int) -> dict[str, Any]:
        """Помечает read sync новым состоянием.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Словарь типа dict[str, Any] с результатами операции.
        """
        return mark_read(self.user.pk, room_id, self.unread_ttl)

    async def _mark_read(self, room_id: int) -> dict[str, Any]:
        """Помечает read новым состоянием.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Словарь типа dict[str, Any] с результатами операции.
        """
        return await _to_async(self._mark_read_sync)(room_id)

    def _set_active_room_sync(self, room_id: int) -> None:
        """Устанавливает active room sync с учетом текущих правил приложения.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        """
        set_active_room(self.user.pk, room_id, self.conn_id, self.active_ttl)

    async def _set_active_room(self, room_id: int) -> None:
        """Устанавливает active room с учетом текущих правил приложения.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        """
        await _to_async(self._set_active_room_sync)(room_id)

    def _clear_active_room_sync(self, conn_only: bool = False) -> None:
        """Очищает active room sync и сбрасывает связанное состояние.
        
        Args:
            conn_only: Флаг отправки обновления только в текущее соединение.
        """
        clear_active_room(self.user.pk, self.conn_id if conn_only else None)

    async def _clear_active_room(self, conn_only: bool = False) -> None:
        """Очищает active room и сбрасывает связанное состояние.
        
        Args:
            conn_only: Флаг отправки обновления только в текущее соединение.
        """
        await _to_async(self._clear_active_room_sync)(conn_only)

    def _touch_active_room_sync(self) -> None:
        """Обновляет метку активности для active room sync."""
        touch_active_room(self.user.pk, self.conn_id, self.active_ttl)

    async def _touch_active_room(self) -> None:
        """Обновляет метку активности для active room."""
        await _to_async(self._touch_active_room_sync)()
