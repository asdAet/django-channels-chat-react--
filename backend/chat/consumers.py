"""WebSocket consumer для комнатного чата."""

import asyncio
import json
import logging
import time

from autobahn.exception import Disconnected
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError, OperationalError, ProgrammingError

from chat_app_django.ip_utils import get_client_ip_from_scope
from chat_app_django.media_utils import build_profile_url, serialize_avatar_crop
from chat_app_django.security.audit import audit_ws_event
from chat_app_django.security.rate_limit import DbRateLimiter, RateLimitPolicy
from chat_app_django.security.rate_limit_config import (
    chat_message_rate_limit_policy,
    ws_connect_rate_limit_disabled,
    ws_connect_rate_limit_policy,
)

from direct_inbox.state import (
    mark_read,
    mark_unread,
    user_group_name,
)
from messages.models import Message
from roles.access import can_read, can_write
from roles.models import Membership
from rooms.models import Room
from users.identity import (
    user_display_name,
    user_profile_avatar_source,
    user_public_ref,
    user_public_username,
)

from .constants import CHAT_CLOSE_IDLE_CODE

logger = logging.getLogger(__name__)


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


class ChatConsumer(AsyncWebsocketConsumer):
    """Класс ChatConsumer обрабатывает WebSocket-события и сообщения."""

    chat_idle_timeout = int(settings.CHAT_WS_IDLE_TIMEOUT)
    direct_inbox_unread_ttl = int(settings.DIRECT_INBOX_UNREAD_TTL)

    async def connect(self):
        """Устанавливает соединение и выполняет проверки доступа."""
        self._connection_closed = False
        user = self.scope.get("user")
        if user is None:
            audit_ws_event("ws.connect.denied", self.scope, endpoint="chat", reason="missing_user", code=4401)
            await self.close(code=4401)
            return

        room_id_raw: object | None = None
        url_route = self.scope.get("url_route")
        if isinstance(url_route, dict):
            kwargs = url_route.get("kwargs")
            if isinstance(kwargs, dict):
                room_id_raw = kwargs.get("room_id")

        room_id = 0
        if isinstance(room_id_raw, int):
            room_id = room_id_raw
        elif isinstance(room_id_raw, str):
            try:
                room_id = int(room_id_raw)
            except ValueError:
                room_id = 0
        if room_id < 1:
            audit_ws_event("ws.connect.denied", self.scope, endpoint="chat", reason="invalid_room_id", code=4404)
            await self.close(code=4404)
            return

        if await sync_to_async(_ws_connect_rate_limited)(self.scope, "chat"):
            audit_ws_event("ws.connect.denied", self.scope, endpoint="chat", reason="rate_limited", code=4429)
            await self.close(code=4429)
            return

        room = await self._load_room(room_id)
        if not room:
            audit_ws_event(
                "ws.connect.denied",
                self.scope,
                endpoint="chat",
                reason="room_not_found",
                code=4404,
                room_id=room_id,
            )
            await self.close(code=4404)
            return

        if not await self._can_read(room, user):
            audit_ws_event(
                "ws.connect.denied",
                self.scope,
                endpoint="chat",
                reason="forbidden",
                code=4403,
                room_id=room_id,
            )
            await self.close(code=4403)
            return

        is_authenticated = bool(getattr(user, "is_authenticated", False))
        if is_authenticated:
            self.actor_username = await self._resolve_public_username(user)
            self.actor_public_ref = await self._resolve_public_ref(user)
            self.actor_display_name = await self._resolve_display_name(user)
        else:
            self.actor_username = ""
            self.actor_public_ref = ""
            self.actor_display_name = ""
        self.room = room
        self.room_id = int(room.pk)
        self.room_name = str(self.room_id)
        self.room_group_name = f"chat_room_{self.room_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        audit_ws_event("ws.connect.accepted", self.scope, endpoint="chat", room_id=self.room_id)

        self._last_activity = time.monotonic()
        self._last_typing_broadcast = 0.0
        self._idle_task = None
        if self.chat_idle_timeout > 0:
            self._idle_task = asyncio.create_task(self._idle_watchdog())

    async def disconnect(self, code):
        """Корректно закрывает соединение и освобождает ресурсы.
        
        Args:
            code: Код ошибки или состояния.
        """
        self._connection_closed = True
        idle_task = getattr(self, "_idle_task", None)
        if idle_task:
            idle_task.cancel()
            try:
                await idle_task
            except asyncio.CancelledError:
                pass

        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        audit_ws_event(
            "ws.disconnect",
            self.scope,
            endpoint="chat",
            code=code,
            room_id=getattr(self, "room_id", None),
        )

    @staticmethod
    def _is_closed_send_error(exc: Exception) -> bool:
        """Normalize known send errors for an already-closed websocket."""
        if isinstance(exc, Disconnected):
            return True
        if not isinstance(exc, RuntimeError):
            return False
        message = str(exc).lower()
        return "closed protocol" in message or "websocket.close" in message

    async def _send_json(self, payload: object) -> bool:
        """Send JSON only while the websocket is still open."""
        if getattr(self, "_connection_closed", False):
            return False
        try:
            await self.send(text_data=json.dumps(payload))
            return True
        except Exception as exc:
            if not self._is_closed_send_error(exc):
                raise
            self._connection_closed = True
            logger.debug(
                "Skip websocket send for closed chat connection",
                extra={
                    "room_id": getattr(self, "room_id", None),
                    "channel_name": getattr(self, "channel_name", None),
                },
            )
            return False

    async def receive(self, text_data=None, bytes_data=None):
        """Принимает входящее сообщение и маршрутизирует его обработку.
        
        Args:
            text_data: Параметр text data, используемый в логике функции.
            bytes_data: Параметр bytes data, используемый в логике функции.
        """
        self._last_activity = time.monotonic()
        if text_data is None and bytes_data is not None:
            try:
                text_data = bytes_data.decode("utf-8")
            except UnicodeDecodeError:
                audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="invalid_payload")
                return
        if text_data is None:
            return
        try:
            text_data_json = json.loads(text_data)
        except json.JSONDecodeError:
            audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="invalid_json")
            return

        event_type = text_data_json.get("type")

        if event_type == "typing":
            await self._handle_typing()
            return

        if event_type == "mark_read":
            await self._handle_mark_read(text_data_json)
            return

        message = text_data_json.get("message", "")
        if not isinstance(message, str):
            audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="invalid_payload")
            return
        message = message.strip()
        if not message:
            audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="empty_message")
            return

        max_len = int(settings.CHAT_MESSAGE_MAX_LENGTH)
        if len(message) > max_len:
            audit_ws_event(
                "ws.message.rejected",
                self.scope,
                endpoint="chat",
                reason="message_too_long",
                room_id=self.room.pk,
                message_length=len(message),
            )
            await self._send_json({"error": "message_too_long"})
            return

        user = self.scope.get("user")
        if user is None or not getattr(user, "is_authenticated", False):
            audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="unauthorized")
            return

        if self.room.kind == Room.Kind.DIRECT and await self._is_blocked_in_dm(self.room, user):
            await self._send_json({"error": "forbidden"})
            return

        if not await self._can_write(self.room, user):
            audit_ws_event(
                "ws.message.rejected",
                self.scope,
                endpoint="chat",
                reason="forbidden",
                room_id=self.room.pk,
            )
            await self._send_json({"error": "forbidden"})
            return

        if await self._rate_limited(user):
            audit_ws_event("ws.message.rate_limited", self.scope, endpoint="chat", room_id=self.room.pk)
            payload: dict[str, object] = {"error": "rate_limited"}
            retry_after = await self._rate_limit_retry_after_seconds(user)
            if isinstance(retry_after, int) and retry_after > 0:
                payload["retry_after"] = retry_after
            await self._send_json(payload)
            return

        if await self._slow_mode_limited(user):
            await self._send_json({"error": "slow_mode"})
            return

        public_ref = (await self._resolve_public_ref(user)).strip()
        username = (await self._resolve_public_username(user)).strip()
        if not username:
            username = public_ref
        self.actor_username = username
        self.actor_public_ref = public_ref
        if not public_ref:
            audit_ws_event("ws.message.rejected", self.scope, endpoint="chat", reason="invalid_user")
            return
        room_id = int(self.room.pk)

        avatar_source, avatar_crop = await self._get_profile_avatar_state(user)
        profile_url = build_profile_url(self.scope, avatar_source)
        display_name = (await self._resolve_display_name(user)).strip()
        self.actor_display_name = display_name

        reply_to_id = text_data_json.get("replyTo")
        if reply_to_id is not None:
            try:
                reply_to_id = int(reply_to_id)
            except (TypeError, ValueError):
                reply_to_id = None

        saved_message = await self.save_message(message, user, username, avatar_source, self.room, reply_to_id)
        created_at = saved_message.date_added.isoformat()
        audit_ws_event(
            "ws.message.sent",
            self.scope,
            endpoint="chat",
            room_id=self.room.pk,
            message_length=len(message),
        )

        reply_to_data = await self._get_reply_data(saved_message) if reply_to_id else None

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "publicRef": public_ref,
                "username": username,
                "displayName": display_name,
                "profile_pic": profile_url,
                "avatar_crop": avatar_crop,
                "roomId": room_id,
                "id": saved_message.pk,
                "createdAt": created_at,
                "replyTo": reply_to_data,
            },
        )

        if self.room.kind == Room.Kind.DIRECT:
            sender_id = getattr(user, "pk", None)
            if sender_id is None:
                return
            targets = await self._build_direct_inbox_targets(
                room_id=self.room.pk,
                sender_id=int(sender_id),
                message=message,
                created_at=created_at,
            )
            for target in targets:
                await self.channel_layer.group_send(
                    target["group"],
                    {
                        "type": "direct_inbox_event",
                        "payload": target["payload"],
                    },
                )

    async def chat_message(self, event):
        """Транслирует событие нового сообщения в WebSocket-клиенты комнаты.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json(
            {
                "message": event["message"],
                "publicRef": event.get("publicRef") or event.get("username"),
                "username": event["username"],
                "displayName": event.get("displayName") or event["username"],
                "profile_pic": event["profile_pic"],
                "avatar_crop": event.get("avatar_crop"),
                "roomId": event.get("roomId"),
                "id": event.get("id"),
                "createdAt": event.get("createdAt") or event.get("date_added"),
                "replyTo": event.get("replyTo"),
                "attachments": event.get("attachments", []),
            }
        )

    async def _idle_watchdog(self):
        """Выполняет вспомогательную обработку для idle watchdog."""
        interval = max(10, min(60, self.chat_idle_timeout))
        while True:
            await asyncio.sleep(interval)
            if (time.monotonic() - self._last_activity) <= self.chat_idle_timeout:
                continue
            await self.close(code=CHAT_CLOSE_IDLE_CODE)
            break

    @sync_to_async
    def _load_room(self, room_id: int):
        """Загружает room из хранилища с необходимыми проверками.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            return Room.objects.filter(pk=room_id).first()
        except (OperationalError, ProgrammingError, IntegrityError):
            return None

    @sync_to_async
    def _can_read(self, room: Room, user) -> bool:
        """Проверяет условие read и возвращает логический результат.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Логическое значение результата проверки.
        """
        return can_read(room, user)

    @sync_to_async
    def _can_write(self, room: Room, user) -> bool:
        """Проверяет условие write и возвращает логический результат.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Логическое значение результата проверки.
        """
        return can_write(room, user)

    @sync_to_async
    def _resolve_public_username(self, user) -> str:
        """Определяет public username на основе доступного контекста.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        return user_public_username(user)

    @sync_to_async
    def _resolve_public_ref(self, user) -> str:
        """Определяет public ref на основе доступного контекста.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        if user is None or not getattr(user, "is_authenticated", False):
            return ""
        return user_public_ref(user)

    @sync_to_async
    def _resolve_display_name(self, user) -> str:
        """Определяет display name на основе доступного контекста.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        return user_display_name(user)

    @sync_to_async
    def save_message(self, message, user, username, profile_pic, room, reply_to_id=None):
        """Сохраняет сообщение и готовит payload для дальнейшей рассылки.
        
        Args:
            message: Сообщение, участвующее в обработке.
            user: Пользователь, для которого выполняется операция.
            username: Публичное имя пользователя.
            profile_pic: Параметр profile pic, используемый в логике функции.
            room: Комната, в контексте которой выполняется операция.
            reply_to_id: Идентификатор reply to.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        normalized_profile_pic = str(profile_pic or "").strip()
        if len(normalized_profile_pic) > 255:
            normalized_profile_pic = ""
        kwargs = {
            "message_content": message,
            "username": username,
            "user": user,
            "profile_pic": normalized_profile_pic,
            "room": room,
        }
        if reply_to_id is not None:
            exists = Message.objects.filter(
                pk=reply_to_id, room=room, is_deleted=False,
            ).exists()
            if exists:
                kwargs["reply_to_id"] = reply_to_id
        return Message.objects.create(**kwargs)

    @sync_to_async
    def _get_profile_avatar_state(self, user):
        """Возвращает profile avatar state из текущего контекста или хранилища.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Функция не возвращает значение.
        """
        try:
            profile = user.profile
            avatar_source = user_profile_avatar_source(user) or ""
            return avatar_source, serialize_avatar_crop(profile)
        except (AttributeError, ObjectDoesNotExist):
            return "", None

    @sync_to_async
    def _is_blocked_in_dm(self, room: Room, user) -> bool:
        """Проверяет условие blocked in dm и возвращает логический результат.
        
        Args:
            room: Экземпляр комнаты, над которой выполняется действие.
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Логическое значение результата проверки.
        """
        from friends.application.friend_service import is_blocked_between
        if room.kind != Room.Kind.DIRECT:
            return False
        other = Membership.objects.filter(room=room).exclude(user=user).values_list("user", flat=True).first()
        if not other:
            return False
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other_user = User.objects.filter(pk=other).first()
        if not other_user:
            return False
        return is_blocked_between(user, other_user)

    @sync_to_async
    def _rate_limited(self, user) -> bool:
        """Выполняет вспомогательную обработку для rate limited.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Логическое значение результата проверки.
        """
        if bool(getattr(user, "is_superuser", False)):
            return False
        scope_key = self._chat_message_rate_limit_scope_key(user)
        policy = chat_message_rate_limit_policy()
        return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)

    @sync_to_async
    def _rate_limit_retry_after_seconds(self, user) -> int | None:
        """Выполняет вспомогательную обработку для rate limit retry after seconds.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Объект типа int | None, полученный при выполнении операции.
        """
        if bool(getattr(user, "is_superuser", False)):
            return None
        scope_key = self._chat_message_rate_limit_scope_key(user)
        return DbRateLimiter.retry_after_seconds(scope_key)

    @staticmethod
    def _chat_message_rate_limit_scope_key(user) -> str:
        """Выполняет вспомогательную обработку для chat message rate limit scope key.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Строковое значение, сформированное функцией.
        """
        return f"rl:chat:message:{user.pk}"

    @sync_to_async
    def _slow_mode_limited(self, user) -> bool:
        """Выполняет вспомогательную обработку для slow mode limited.
        
        Args:
            user: Пользователь, для которого выполняется операция.
        
        Returns:
            Логическое значение результата проверки.
        """
        room = getattr(self, "room", None)
        if not room or room.kind != Room.Kind.GROUP:
            return False
        slow = getattr(room, "slow_mode_seconds", 0) or 0
        if slow <= 0:
            return False
        scope_key = f"rl:slow:{room.pk}:{user.pk}"
        policy = RateLimitPolicy(limit=1, window_seconds=slow)
        return DbRateLimiter.is_limited(scope_key=scope_key, policy=policy)
    # Обработка индикатора набора текста.

    async def _handle_typing(self):
        """Обрабатывает событие typing и выполняет связанную бизнес-логику."""
        user = self.scope.get("user")
        if user is None or not getattr(user, "is_authenticated", False):
            return
        if not await self._can_write(self.room, user):
            return
        now = time.monotonic()
        if now - self._last_typing_broadcast < 3.0:
            return
        self._last_typing_broadcast = now
        username = (await self._resolve_public_username(user)).strip()
        public_ref = (await self._resolve_public_ref(user)).strip()
        if not username:
            username = public_ref
        self.actor_username = username
        self.actor_public_ref = public_ref
        if not public_ref:
            return
        display_name = (await self._resolve_display_name(user)).strip()
        self.actor_display_name = display_name
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_typing",
                "publicRef": public_ref,
                "username": username,
                "displayName": display_name or username,
                "userId": user.pk,
                "sender_channel": self.channel_name,
            },
        )

    async def chat_typing(self, event):
        """Транслирует статус набора текста в комнате.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        if event.get("sender_channel") == self.channel_name:
            return
        await self._send_json({
            "type": "typing",
            "publicRef": event.get("publicRef") or event["username"],
            "username": event["username"],
            "displayName": event.get("displayName") or event["username"],
            "userId": event["userId"],
        })
    # Формирование данных reply-сообщения.

    @sync_to_async
    def _get_reply_data(self, saved_message):
        """Возвращает reply data из текущего контекста или хранилища.
        
        Args:
            saved_message: Сообщение, сохраненное в базе и готовое к публикации.
        
        Returns:
            Функция не возвращает значение.
        """
        reply = saved_message.reply_to
        if not reply:
            return None
        if reply.is_deleted:
            return {
                "id": reply.pk,
                "publicRef": None,
                "username": None,
                "displayName": None,
                "content": "[deleted]",
            }
        return {
            "id": reply.pk,
            "publicRef": user_public_ref(reply.user) if reply.user else None,
            "username": user_public_username(reply.user) if reply.user else reply.username,
            "displayName": user_display_name(reply.user) if reply.user else (reply.username or ""),
            "content": reply.message_content[:150],
        }
    # Обработчики edit, delete, reactions и read receipts.

    async def chat_message_edit(self, event):
        """Транслирует изменение сообщения в комнате.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json({
            "type": "message_edit",
            "messageId": event["messageId"],
            "content": event["content"],
            "editedAt": event["editedAt"],
            "editedByRef": event.get("editedByRef") or event.get("editedBy"),
            "editedBy": event["editedBy"],
        })

    async def chat_message_delete(self, event):
        """Транслирует удаление сообщения в комнате.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json({
            "type": "message_delete",
            "messageId": event["messageId"],
            "deletedByRef": event.get("deletedByRef") or event.get("deletedBy"),
            "deletedBy": event["deletedBy"],
        })

    async def chat_reaction_add(self, event):
        """Транслирует добавление реакции на сообщение.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json({
            "type": "reaction_add",
            "messageId": event["messageId"],
            "emoji": event["emoji"],
            "userId": event["userId"],
            "publicRef": event.get("publicRef") or event["username"],
            "username": event["username"],
            "displayName": event.get("displayName") or event["username"],
        })

    async def chat_reaction_remove(self, event):
        """Транслирует удаление реакции с сообщения.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json({
            "type": "reaction_remove",
            "messageId": event["messageId"],
            "emoji": event["emoji"],
            "userId": event["userId"],
            "publicRef": event.get("publicRef") or event["username"],
            "username": event["username"],
            "displayName": event.get("displayName") or event["username"],
        })

    async def chat_read_receipt(self, event):
        """Транслирует подтверждение чтения сообщения.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        self._last_activity = time.monotonic()
        await self._send_json({
            "type": "read_receipt",
            "userId": event["userId"],
            "publicRef": event.get("publicRef") or event["username"],
            "username": event["username"],
            "displayName": event.get("displayName") or event["username"],
            "lastReadMessageId": event["lastReadMessageId"],
            "lastReadAt": event.get("lastReadAt"),
            "roomId": event["roomId"],
        })
    # Обработка отметки прочитанного через WebSocket.

    async def chat_membership_revoked(self, event):
        """Уведомляет клиента о потере доступа к комнате.
        
        Args:
            event: Событие для логирования или трансляции.
        """
        target_user_id = event.get("targetUserId")
        if target_user_id is None:
            return
        user = self.scope.get("user")
        current_user_id = getattr(user, "pk", None)
        if current_user_id is None:
            return
        try:
            if int(current_user_id) != int(target_user_id):
                return
        except (TypeError, ValueError):
            return
        await self.close(code=4403)

    async def _handle_mark_read(self, data):
        """Обрабатывает событие mark read и выполняет связанную бизнес-логику.
        
        Args:
            data: Словарь входных данных для обработки.
        """
        user = self.scope.get("user")
        if user is None or not getattr(user, "is_authenticated", False):
            return
        last_read_id = data.get("lastReadMessageId")
        if not isinstance(last_read_id, int) or last_read_id < 1:
            return
        await self._do_mark_read(user, self.room, last_read_id)

    @sync_to_async
    def _do_mark_read(self, user, room, last_read_id):
        """Выполняет вспомогательную обработку для do mark read.
        
        Args:
            user: Пользователь, для которого выполняется операция.
            room: Комната, в контексте которой выполняется действие.
            last_read_id: Идентификатор last read.
        """
        from .services import mark_read as service_mark_read
        try:
            state = service_mark_read(user, room, last_read_id)
        except Exception:
            return
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        if getattr(room, "pk", None) is None:
            return
        group_name = f"chat_room_{room.pk}"
        async_to_sync(channel_layer.group_send)(group_name, {
            "type": "chat_read_receipt",
            "userId": user.pk,
            "publicRef": user_public_ref(user),
            "username": user_public_username(user),
            "displayName": user_display_name(user),
            "lastReadMessageId": state.last_read_message_id,
            "lastReadAt": state.last_read_at.isoformat() if state.last_read_at else None,
            "roomId": room.pk,
        })

    @sync_to_async
    def _build_direct_inbox_targets(self, room_id: int, sender_id: int, message: str, created_at: str):
        """Формирует direct inbox targets для дальнейшего использования в потоке обработки.
        
        Args:
            room_id: Идентификатор room, используемый для выборки данных.
            sender_id: Идентификатор sender, используемый для выборки данных.
            message: Экземпляр сообщения для обработки.
            created_at: Дата и время создания записи для курсорной пагинации.
        
        Returns:
            Функция не возвращает значение.
        """
        room = Room.objects.filter(id=room_id, kind=Room.Kind.DIRECT).first()
        if not room:
            return []

        memberships = list(
            Membership.objects.filter(room=room, is_banned=False)
            .select_related("user", "user__profile")
            .order_by("id")
        )

        pair_user_ids: set[int] = set()
        if room.direct_pair_key and ":" in room.direct_pair_key:
            first, second = room.direct_pair_key.split(":", 1)
            try:
                pair_user_ids = {int(first), int(second)}
            except (TypeError, ValueError):
                pair_user_ids = set()
        if len(pair_user_ids) != 2:
            return []

        participants = []
        seen_user_ids: set[int] = set()
        for ms in memberships:
            user = ms.user
            if not user:
                continue
            if pair_user_ids and user.pk not in pair_user_ids:
                continue
            if user.pk in seen_user_ids:
                continue
            seen_user_ids.add(user.pk)
            participants.append(user)

        if pair_user_ids and seen_user_ids != pair_user_ids:
            return []

        if not participants:
            return []

        targets = []
        for participant in participants:
            peer = next((candidate for candidate in participants if candidate.pk != participant.pk), None)
            peer_avatar_source = ""
            peer_avatar_crop = None
            if peer:
                peer_profile = getattr(peer, "profile", None)
                peer_avatar_source = user_profile_avatar_source(peer) or ""
                peer_avatar_crop = serialize_avatar_crop(peer_profile)

            if participant.pk == sender_id:
                unread_state = mark_read(participant.pk, room.pk, self.direct_inbox_unread_ttl)
            else:
                unread_state = mark_unread(participant.pk, room.pk, self.direct_inbox_unread_ttl)

            room_ids = unread_state.get("roomIds", [])
            raw_counts = unread_state.get("counts", {})
            counts = raw_counts if isinstance(raw_counts, dict) else {}
            unread_count = counts.get(str(room.pk), 0)
            payload = {
                "type": "direct_inbox_item",
                "item": {
                    "roomId": room.pk,
                    "peer": {
                        "publicRef": user_public_ref(peer) if peer else "",
                        "username": user_public_username(peer) if peer else "",
                        "displayName": user_display_name(peer) if peer else "",
                        "profileImage": build_profile_url(self.scope, peer_avatar_source) if peer_avatar_source else None,
                        "avatarCrop": peer_avatar_crop,
                    },
                    "lastMessage": message,
                    "lastMessageAt": created_at,
                },
                "unread": {
                    "roomId": room.pk,
                    "isUnread": unread_count > 0,
                    "dialogs": unread_state.get("dialogs", len(room_ids)),
                    "roomIds": room_ids,
                    "counts": counts,
                },
            }
            targets.append({"group": user_group_name(participant.pk), "payload": payload})
        return targets
