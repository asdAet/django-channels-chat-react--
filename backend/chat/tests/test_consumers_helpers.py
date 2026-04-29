# pyright: reportAttributeAccessIssue=false, reportGeneralTypeIssues=false
"""Содержит тесты модуля `test_consumers_helpers` подсистемы `chat`."""


import json
import time
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from chat.constants import CHAT_CLOSE_IDLE_CODE
from chat.consumers import (
    ChatConsumer,
    _ws_connect_rate_limited,
)
from chat.utils import is_valid_chat_target as _is_valid_chat_target
from direct_inbox.consumers import DirectInboxConsumer
from presence.constants import PRESENCE_CLOSE_IDLE_CODE
from presence.consumers import PresenceConsumer, _ws_connect_rate_limited as _presence_ws_connect_rate_limited
from rooms.services import ensure_membership
from rooms.models import Room
from users.identity import set_user_public_handle, user_public_ref
from users.models import SecurityRateLimitBucket

User = get_user_model()


class WsConnectRateLimitTests(TestCase):
    """Проверяет helper лимита подключений WebSocket по IP."""

    def setUp(self):
        """Очищает кэш перед каждым сценарием."""
        cache.clear()

    @override_settings(
        RATE_LIMITS={
            "ws_connect_default": {"limit": 2, "window_seconds": 60},
        }
    )
    def test_ws_connect_rate_limit_counts_and_resets(self):
        """Ограничивает частые connect-запросы и сбрасывает окно по reset."""
        scope = {"client": ("127.0.0.1", 50500), "headers": []}
        self.assertFalse(_ws_connect_rate_limited(scope, "chat"))
        self.assertFalse(_ws_connect_rate_limited(scope, "chat"))
        self.assertTrue(_ws_connect_rate_limited(scope, "chat"))

        cache.clear()
        self.assertTrue(_ws_connect_rate_limited(scope, "chat"))

        key = "rl:ws:connect:chat:127.0.0.1"
        bucket = SecurityRateLimitBucket.objects.get(scope_key=key)
        bucket.reset_at = timezone.now() - timedelta(seconds=1)
        bucket.save(update_fields=["reset_at", "updated_at"])
        self.assertFalse(_ws_connect_rate_limited(scope, "chat"))


class PresenceWsConnectRateLimitTests(TestCase):
    """Проверяет endpoint-specific настройки rate limit для presence websocket."""

    def setUp(self):
        cache.clear()

    @override_settings(
        RATE_LIMITS={
            "ws_connect_default": {"limit": 1, "window_seconds": 60},
            "ws_connect_presence": {"limit": 3, "window_seconds": 60},
        }
    )
    def test_presence_uses_dedicated_limits_without_changing_chat_limit(self):
        scope = {"client": ("127.0.0.1", 50501), "headers": []}

        self.assertFalse(_presence_ws_connect_rate_limited(scope, "presence"))
        self.assertFalse(_presence_ws_connect_rate_limited(scope, "presence"))
        self.assertFalse(_presence_ws_connect_rate_limited(scope, "presence"))
        self.assertTrue(_presence_ws_connect_rate_limited(scope, "presence"))

        # Chat endpoint should still follow global stricter limit.
        self.assertFalse(_ws_connect_rate_limited(scope, "chat"))
        self.assertTrue(_ws_connect_rate_limited(scope, "chat"))


class ChatConsumerInternalTests(TestCase):
    """Группирует тестовые сценарии класса `ChatConsumerInternalTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.user = User.objects.create_user(username='chat_internal_user', password='pass12345')
        self.superuser = User.objects.create_superuser(
            username='chat_internal_superuser',
            email='chat_internal_superuser@example.com',
            password='pass12345',
        )

    def _consumer(self, user=None):
        """Проверяет сценарий `_consumer`."""
        consumer = ChatConsumer()
        consumer.scope = {
            'user': user if user is not None else self.user,
            'headers': [(b'host', b'localhost:8000')],
            'scheme': 'ws',
            'client': ('127.0.0.1', 50001),
        }
        consumer.room_name = 'private123'
        consumer.room = Room(name='private', kind=Room.Kind.PRIVATE)
        consumer.room_group_name = 'chat_private123'
        consumer.channel_name = 'chat.channel'
        consumer.channel_layer = SimpleNamespace(
            group_discard=AsyncMock(),
            group_send=AsyncMock(),
        )
        consumer.send = AsyncMock()
        consumer.close = AsyncMock()
        consumer._can_write = AsyncMock(return_value=True)
        consumer._last_activity = 0.0
        return consumer

    @override_settings(CHAT_TARGET_REGEX='[')
    def test_chat_target_validation_handles_invalid_regex(self):
        """Проверяет сценарий `test_chat_target_validation_handles_invalid_regex`."""
        self.assertFalse(_is_valid_chat_target('private123'))

    def test_get_profile_avatar_state_returns_empty_when_profile_missing(self):
        """Проверяет сценарий `test_get_profile_avatar_state_returns_empty_when_profile_missing`."""
        consumer = self._consumer()
        user_without_profile = SimpleNamespace()

        name, crop = async_to_sync(consumer._get_profile_avatar_state)(user_without_profile)
        self.assertEqual(name, '')
        self.assertIsNone(crop)

    @override_settings(
        RATE_LIMITS={
            "chat_message_send": {"limit": 2, "window_seconds": 60},
        }
    )
    def test_message_send_rate_limit_is_not_applied(self):
        """Chat message send no longer uses server-side cooldown."""
        consumer = self._consumer()

        key = f'rl:chat:message:{self.user.pk}'
        self.assertFalse(hasattr(consumer, '_rate_limited'))
        self.assertFalse(SecurityRateLimitBucket.objects.filter(scope_key=key).exists())

    @override_settings(
        RATE_LIMITS={
            "chat_message_send": {"limit": 1, "window_seconds": 60},
        }
    )
    def test_message_send_rate_limit_is_not_applied_for_superuser(self):
        """Superusers also bypass the removed chat message cooldown path."""
        consumer = self._consumer(user=self.superuser)

        key = f'rl:chat:message:{self.superuser.pk}'
        self.assertFalse(hasattr(consumer, '_rate_limited'))
        self.assertFalse(SecurityRateLimitBucket.objects.filter(scope_key=key).exists())

    def test_chat_message_serializes_and_sends_payload(self):
        """Проверяет сценарий `test_chat_message_serializes_and_sends_payload`."""
        consumer = self._consumer()

        async_to_sync(consumer.chat_message)(
            {
                'message': 'hello',
                'username': 'chat_internal_user',
                'profile_pic': '/media/default.jpg',
                'roomId': 123,
            }
        )

        consumer.send.assert_awaited_once()
        payload = json.loads(consumer.send.await_args.kwargs['text_data'])
        self.assertEqual(payload['message'], 'hello')
        self.assertEqual(payload['roomId'], 123)

    def test_receive_ignores_message_for_anonymous_user(self):
        """Проверяет сценарий `test_receive_ignores_message_for_anonymous_user`."""
        consumer = self._consumer(user=AnonymousUser())
        consumer.save_message = AsyncMock()
        consumer._rate_limited = AsyncMock(return_value=False)

        async_to_sync(consumer.receive)(json.dumps({'message': 'hello'}))

        consumer.save_message.assert_not_awaited()
        consumer.send.assert_not_awaited()

    def test_receive_ignores_legacy_rate_limit_hook(self):
        """Legacy cooldown hooks must not block fast consecutive messages."""
        consumer = self._consumer()
        consumer.room = Room.objects.create(
            name='chat-internal-fast-send',
            kind=Room.Kind.PRIVATE,
            created_by=self.user,
        )
        consumer.room_name = str(consumer.room.pk)
        consumer.room_group_name = f'chat_room_{consumer.room.pk}'
        consumer._delivery_dispatcher = SimpleNamespace(enqueue=Mock())
        consumer.save_message = AsyncMock(
            return_value=SimpleNamespace(
                pk=123,
                date_added=timezone.now(),
                reply_to=None,
            )
        )
        consumer._rate_limited = AsyncMock(return_value=True)

        async_to_sync(consumer.receive)(json.dumps({'message': 'hello'}))

        consumer._rate_limited.assert_not_awaited()
        consumer.save_message.assert_awaited_once()
        consumer.send.assert_awaited_once()
        payload = json.loads(consumer.send.await_args.kwargs['text_data'])
        self.assertEqual(payload['message'], 'hello')

    def test_receive_ping_refreshes_activity_without_message_flow(self):
        """Heartbeat ping должен обновлять активность без message/error веток."""
        consumer = self._consumer()
        consumer.save_message = AsyncMock()

        with patch("chat.consumers.time.monotonic", return_value=42.0):
            async_to_sync(consumer.receive)(json.dumps({"type": "ping"}))

        self.assertEqual(consumer._last_activity, 42.0)
        consumer.save_message.assert_not_awaited()
        consumer.send.assert_not_awaited()
        consumer.close.assert_not_awaited()

    def test_disconnect_without_group_name_is_safe(self):
        """Проверяет сценарий `test_disconnect_without_group_name_is_safe`."""
        consumer = self._consumer()
        delattr(consumer, 'room_group_name')

        async_to_sync(consumer.disconnect)(1000)

    def test_disconnect_discards_group_when_present(self):
        """Проверяет сценарий `test_disconnect_discards_group_when_present`."""
        consumer = self._consumer()
        class _IdleTask:
            """Группирует тестовые сценарии класса `_IdleTask`."""
            def __init__(self):
                """Проверяет сценарий `__init__`."""
                self.cancel = Mock()

            def __await__(self):
                """Проверяет сценарий `__await__`."""
                async def _done():
                    """Проверяет сценарий `_done`."""
                    return None

                return _done().__await__()

        idle_task = _IdleTask()
        consumer._idle_task = idle_task

        async_to_sync(consumer.disconnect)(1000)

        idle_task.cancel.assert_called_once()
        consumer.channel_layer.group_discard.assert_awaited_once_with(
            'chat_private123',
            'chat.channel',
        )

    def test_idle_watchdog_closes_connection_after_timeout(self):
        """Проверяет сценарий `test_idle_watchdog_closes_connection_after_timeout`."""
        consumer = self._consumer()
        consumer.chat_idle_timeout = 1
        consumer._last_activity = 0.0

        async def _fast_sleep(_interval):
            """Проверяет сценарий `_fast_sleep`."""
            return None

        with patch('chat.consumers.asyncio.sleep', new=_fast_sleep), patch(
            'chat.consumers.time.monotonic', return_value=10.0
        ):
            async_to_sync(consumer._idle_watchdog)()

        consumer.close.assert_awaited_once_with(code=CHAT_CLOSE_IDLE_CODE)


class PresenceConsumerInternalTests(TestCase):
    """Группирует тестовые сценарии класса `PresenceConsumerInternalTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.user = User.objects.create_user(username='presence_internal_user', password='pass12345')
        set_user_public_handle(self.user, self.user.username)

    def _consumer(self, user=None):
        """Проверяет сценарий `_consumer`."""
        consumer = PresenceConsumer()
        resolved_user = user if user is not None else self.user
        consumer.scope = {
            'user': resolved_user,
            'headers': [(b'host', b'localhost:8000')],
            'scheme': 'ws',
            'client': ('203.0.113.50', 56000),
            'session': SimpleNamespace(session_key='session-presence-helper'),
        }
        consumer.channel_name = 'presence.channel'
        consumer.channel_layer = SimpleNamespace(
            group_add=AsyncMock(),
            group_discard=AsyncMock(),
            group_send=AsyncMock(),
        )
        consumer.group_name_auth = 'presence_auth_test'
        consumer.group_name_guest = 'presence_guest_test'
        consumer.cache_key = 'presence:auth:test'
        consumer.guest_cache_key = 'presence:guest:test'
        consumer.cache_timeout_seconds = 300
        consumer.presence_ttl = 90
        consumer.presence_grace = 5
        consumer.presence_touch_interval = 10
        consumer.presence_heartbeat = 1
        consumer.presence_idle_timeout = 1
        consumer.send = AsyncMock()
        consumer.close = AsyncMock()
        consumer._last_client_activity = 0.0
        consumer._next_presence_touch_at = 0.0
        consumer.guest_key = 'session-presence-helper'
        return consumer

    def test_get_guest_session_key_returns_none_without_session(self):
        """Проверяет отсутствие session_key у гостя без сессии."""
        consumer = self._consumer(user=AnonymousUser())
        consumer.scope['session'] = None
        self.assertIsNone(consumer._get_guest_session_key())

    def test_receive_ignores_invalid_payload_and_throttles_guest_ping(self):
        """Проверяет сценарий `test_receive_ignores_invalid_payload_and_throttles_guest_ping`."""
        consumer = self._consumer(user=AnonymousUser())
        consumer.is_guest = True
        consumer._touch_guest = AsyncMock()

        async_to_sync(consumer.receive)(None)
        async_to_sync(consumer.receive)('not-json')
        async_to_sync(consumer.receive)(json.dumps({'type': 'pong'}))

        consumer._next_presence_touch_at = time.monotonic() + 100
        async_to_sync(consumer.receive)(json.dumps({'type': 'ping'}))
        consumer._touch_guest.assert_not_awaited()

        consumer._next_presence_touch_at = 0
        async_to_sync(consumer.receive)(json.dumps({'type': 'ping'}))
        consumer._touch_guest.assert_awaited_once_with('session-presence-helper')

    def test_receive_touches_authenticated_user(self):
        """Проверяет сценарий `test_receive_touches_authenticated_user`."""
        consumer = self._consumer()
        consumer.is_guest = False
        consumer._touch_user = AsyncMock()

        async_to_sync(consumer.receive)(json.dumps({'type': 'ping'}))

        consumer._touch_user.assert_awaited_once_with(self.user)

    def test_presence_update_sends_only_non_empty_payload(self):
        """Проверяет сценарий `test_presence_update_sends_only_non_empty_payload`."""
        consumer = self._consumer()

        async_to_sync(consumer.presence_update)({})
        consumer.send.assert_not_awaited()

        async_to_sync(consumer.presence_update)({'guests': 3})
        consumer.send.assert_awaited_once()

    def test_heartbeat_stops_when_send_raises(self):
        """Проверяет сценарий `test_heartbeat_stops_when_send_raises`."""
        consumer = self._consumer()
        consumer.send = AsyncMock(side_effect=RuntimeError('boom'))

        async def _fast_sleep(_interval):
            """Проверяет сценарий `_fast_sleep`."""
            return None

        with patch('presence.consumers.asyncio.sleep', new=_fast_sleep):
            async_to_sync(consumer._heartbeat)()

        consumer.send.assert_awaited_once()

    def test_idle_watchdog_closes_on_timeout(self):
        """Проверяет сценарий `test_idle_watchdog_closes_on_timeout`."""
        consumer = self._consumer()
        consumer._last_client_activity = 0.0

        async def _fast_sleep(_interval):
            """Проверяет сценарий `_fast_sleep`."""
            return None

        with patch('presence.consumers.asyncio.sleep', new=_fast_sleep), patch(
            'presence.consumers.time.monotonic', return_value=10.0
        ):
            async_to_sync(consumer._idle_watchdog)()

        consumer.close.assert_awaited_once_with(code=PRESENCE_CLOSE_IDLE_CODE)

    def test_guest_cache_lifecycle(self):
        """Проверяет сценарий `test_guest_cache_lifecycle`."""
        consumer = self._consumer(user=AnonymousUser())

        async_to_sync(consumer._add_guest)('203.0.113.10')
        self.assertEqual(async_to_sync(consumer._get_guest_count)(), 1)

        async_to_sync(consumer._remove_guest)('203.0.113.10', graceful=False)
        self.assertEqual(async_to_sync(consumer._get_guest_count)(), 1)

        async_to_sync(consumer._remove_guest)('203.0.113.10', graceful=True)
        self.assertEqual(async_to_sync(consumer._get_guest_count)(), 0)

    def test_add_guest_handles_invalid_existing_count(self):
        """Проверяет сценарий `test_add_guest_handles_invalid_existing_count`."""
        consumer = self._consumer(user=AnonymousUser())
        cache.set(consumer.guest_cache_key, {'203.0.113.15': 'bad'}, timeout=300)

        async_to_sync(consumer._add_guest)('203.0.113.15')

        state = cache.get(consumer.guest_cache_key)
        self.assertEqual(state['203.0.113.15']['count'], 1)

    def test_user_presence_lifecycle_and_get_online_cleanup(self):
        """Проверяет сценарий `test_user_presence_lifecycle_and_get_online_cleanup`."""
        consumer = self._consumer()

        async_to_sync(consumer._add_user)(self.user)
        async_to_sync(consumer._add_user)(self.user)
        async_to_sync(consumer._remove_user)(self.user, graceful=False)

        online = async_to_sync(consumer._get_online)()
        self.assertEqual(len(online), 1)
        self.assertEqual(online[0]['username'], self.user.username)

        async_to_sync(consumer._remove_user)(self.user, graceful=False)
        self.assertEqual(async_to_sync(consumer._get_online)()[0]['username'], self.user.username)

        async_to_sync(consumer._remove_user)(self.user, graceful=True)
        self.assertEqual(async_to_sync(consumer._get_online)(), [])

    def test_get_online_and_guest_count_drop_expired_entries(self):
        """Проверяет сценарий `test_get_online_and_guest_count_drop_expired_entries`."""
        consumer = self._consumer()
        now = time.time()
        cache.set(
            consumer.cache_key,
            {
                'active': {'count': 1, 'last_seen': now - 1, 'grace_until': 0},
                'expired': {'count': 1, 'last_seen': now - 999, 'grace_until': 0},
                'grace': {'count': 0, 'last_seen': now - 1, 'grace_until': now + 10},
                'broken': {'count': 'x', 'last_seen': now - 1, 'grace_until': 0},
            },
            timeout=300,
        )
        cache.set(
            consumer.guest_cache_key,
            {
                '203.0.113.1': {'count': 1, 'last_seen': now - 1, 'grace_until': 0},
                '203.0.113.2': {'count': 1, 'last_seen': now - 999, 'grace_until': 0},
            },
            timeout=300,
        )

        online = async_to_sync(consumer._get_online)()
        self.assertEqual({row['username'] for row in online}, {'active', 'grace'})
        self.assertEqual(async_to_sync(consumer._get_guest_count)(), 1)

    def test_touch_user_and_guest_paths(self):
        """Проверяет сценарий `test_touch_user_and_guest_paths`."""
        consumer = self._consumer()

        async_to_sync(consumer._touch_user)(self.user)
        state = cache.get(consumer.cache_key)
        self.assertEqual(state[user_public_ref(self.user)]['count'], 1)

        async_to_sync(consumer._touch_guest)(None)
        async_to_sync(consumer._touch_guest)('203.0.113.20')
        guest_state = cache.get(consumer.guest_cache_key)
        self.assertEqual(guest_state['203.0.113.20']['count'], 1)

    def test_disconnect_paths_for_guest_and_auth(self):
        """Проверяет сценарий `test_disconnect_paths_for_guest_and_auth`."""
        guest_consumer = self._consumer(user=AnonymousUser())
        guest_consumer.is_guest = True
        guest_consumer.group_name = guest_consumer.group_name_guest
        guest_consumer._heartbeat_task = None
        guest_consumer._idle_task = None
        guest_consumer._remove_guest = AsyncMock()
        guest_consumer._broadcast = AsyncMock()

        async_to_sync(guest_consumer.disconnect)(1001)

        guest_consumer._remove_guest.assert_awaited_once_with('session-presence-helper', graceful=True)
        guest_consumer._broadcast.assert_awaited_once()
        guest_consumer.channel_layer.group_discard.assert_awaited_once()

        auth_consumer = self._consumer()
        auth_consumer.is_guest = False
        auth_consumer.group_name = auth_consumer.group_name_auth
        auth_consumer._heartbeat_task = None
        auth_consumer._idle_task = None
        auth_consumer._remove_user = AsyncMock()
        auth_consumer._broadcast = AsyncMock()

        async_to_sync(auth_consumer.disconnect)(4000)

        auth_consumer._remove_user.assert_awaited_once_with(self.user, graceful=False)

    def test_connect_adds_guest_and_authenticated_users(self):
        """Проверяет сценарий `test_connect_adds_guest_and_authenticated_users`."""
        guest_consumer = self._consumer(user=AnonymousUser())
        guest_consumer.accept = AsyncMock()
        guest_consumer._add_guest = AsyncMock()
        guest_consumer._add_user = AsyncMock()
        guest_consumer._broadcast = AsyncMock()

        def _fake_task(coro):
            """Проверяет сценарий `_fake_task`."""
            coro.close()
            return AsyncMock(cancel=Mock())

        with patch('presence.consumers.asyncio.create_task', side_effect=_fake_task):
            async_to_sync(guest_consumer.connect)()

        guest_consumer._add_guest.assert_awaited_once_with('session-presence-helper')
        guest_consumer._add_user.assert_not_awaited()

        auth_consumer = self._consumer()
        auth_consumer.accept = AsyncMock()
        auth_consumer._add_guest = AsyncMock()
        auth_consumer._add_user = AsyncMock()
        auth_consumer._broadcast = AsyncMock()

        with patch('presence.consumers.asyncio.create_task', side_effect=_fake_task):
            async_to_sync(auth_consumer.connect)()

        auth_consumer._add_guest.assert_not_awaited()
        auth_consumer._add_user.assert_awaited_once_with(self.user)

    def test_connect_closes_when_rate_limited(self):
        """Закрывает соединение Presence при превышении connect-rate-limit."""
        consumer = self._consumer()
        consumer.accept = AsyncMock()

        with self.assertLogs('security.audit', level='INFO') as captured:
            with patch("presence.consumers._ws_connect_rate_limited", return_value=True):
                async_to_sync(consumer.connect)()

        consumer.close.assert_awaited_once_with(code=4429)
        consumer.accept.assert_not_awaited()
        self.assertTrue(any('ws.connect.denied' in line for line in captured.output))


class ChatConsumerDirectInboxTargetsTests(TestCase):
    """Группирует тестовые сценарии класса `ChatConsumerDirectInboxTargetsTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.owner = User.objects.create_user(username='target_owner', password='pass12345')
        self.member = User.objects.create_user(username='target_member', password='pass12345')

    def _consumer(self):
        """Проверяет сценарий `_consumer`."""
        consumer = ChatConsumer()
        consumer.scope = {
            'user': self.owner,
            'headers': [(b'host', b'localhost:8000')],
            'scheme': 'ws',
            'client': ('127.0.0.1', 50005),
        }
        return consumer

    def test_build_targets_returns_empty_for_missing_room(self):
        """Проверяет сценарий `test_build_targets_returns_empty_for_missing_room`."""
        consumer = self._consumer()
        result = async_to_sync(consumer._build_direct_inbox_targets)(999999, self.owner.pk, 'msg', '2026-01-01T00:00:00Z')
        self.assertEqual(result, [])

    def test_build_targets_handles_invalid_pair_key(self):
        """Invalid pair_key disables direct-inbox target fanout."""
        room = Room.objects.create(
            name='badpair',
            kind=Room.Kind.DIRECT,
            direct_pair_key='bad:value',
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name='Owner')

        consumer = self._consumer()
        result = async_to_sync(consumer._build_direct_inbox_targets)(room.pk, self.owner.pk, 'msg', '2026-01-01T00:00:00Z')
        self.assertEqual(result, [])
    def test_build_targets_requires_pair_memberships(self):
        """Strict DM mode: without membership for both pair users, no targets are built."""
        room = Room.objects.create(
            name='missingpair',
            kind=Room.Kind.DIRECT,
            direct_pair_key=f'{self.owner.pk}:{self.member.pk}',
            created_by=self.owner,
        )
        ensure_membership(room, self.owner, role_name='Owner')

        consumer = self._consumer()
        targets = async_to_sync(consumer._build_direct_inbox_targets)(room.pk, self.owner.pk, 'hello', '2026-01-01T00:00:00Z')

        self.assertEqual(targets, [])

class DirectInboxConsumerInternalTests(TestCase):
    """Группирует тестовые сценарии класса `DirectInboxConsumerInternalTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.user = User.objects.create_user(username='direct_inbox_internal', password='pass12345')

    def _consumer(self):
        """Проверяет сценарий `_consumer`."""
        consumer = DirectInboxConsumer()
        consumer.scope = {
            'user': self.user,
            'headers': [(b'host', b'localhost:8000')],
            'scheme': 'ws',
            'client': ('127.0.0.1', 50100),
        }
        consumer.user = self.user
        consumer.conn_id = 'conn_1'
        consumer.group_name = 'direct_inbox_user_1'
        consumer.channel_name = 'direct.channel'
        consumer.channel_layer = SimpleNamespace(
            group_add=AsyncMock(),
            group_discard=AsyncMock(),
        )
        consumer.send = AsyncMock()
        consumer.close = AsyncMock()
        consumer._last_client_activity = 0.0
        return consumer

    def test_receive_handles_ping_and_payload_guards(self):
        """Проверяет сценарий `test_receive_handles_ping_and_payload_guards`."""
        consumer = self._consumer()
        consumer._touch_active_room = AsyncMock()
        consumer._send_error = AsyncMock()

        async_to_sync(consumer.receive)(json.dumps({'type': 'ping'}))
        consumer._touch_active_room.assert_awaited_once()

        async_to_sync(consumer.receive)('not-json')
        async_to_sync(consumer.receive)(json.dumps({'type': 'set_active_room', 'roomId': 'bad'}))
        consumer._send_error.assert_awaited_with('invalid_payload')

    def test_receive_set_active_room_branches(self):
        """Проверяет сценарий `test_receive_set_active_room_branches`."""
        consumer = self._consumer()
        consumer._clear_active_room = AsyncMock()
        consumer._set_active_room = AsyncMock()
        consumer._send_error = AsyncMock()
        consumer._load_room = AsyncMock(return_value=Room(name='p', kind=Room.Kind.PRIVATE))
        consumer._can_read = AsyncMock(return_value=False)

        async_to_sync(consumer.receive)(json.dumps({'type': 'set_active_room', 'roomId': None}))
        consumer._clear_active_room.assert_awaited_once_with(conn_only=True)

        async_to_sync(consumer.receive)(json.dumps({'type': 'set_active_room', 'roomId': 0}))
        consumer._send_error.assert_any_await('forbidden')

        async_to_sync(consumer.receive)(json.dumps({'type': 'set_active_room', 'roomId': 123}))
        consumer._send_error.assert_any_await('forbidden')

    def test_receive_mark_read_branches(self):
        """Проверяет сценарий `test_receive_mark_read_branches`."""
        consumer = self._consumer()
        consumer._send_error = AsyncMock()
        consumer._mark_read = AsyncMock(return_value={'dialogs': 0, 'roomIds': []})
        consumer._load_room = AsyncMock(return_value=None)
        consumer._can_read = AsyncMock(return_value=False)

        async_to_sync(consumer.receive)(json.dumps({'type': 'mark_read', 'roomId': 'bad'}))
        consumer._send_error.assert_awaited_with('invalid_payload')

        async_to_sync(consumer.receive)(json.dumps({'type': 'mark_read', 'roomId': 0}))
        consumer._send_error.assert_any_await('forbidden')

    def test_direct_event_and_disconnect_and_watchdogs(self):
        """Проверяет сценарий `test_direct_event_and_disconnect_and_watchdogs`."""
        consumer = self._consumer()
        consumer._clear_active_room = AsyncMock()

        async_to_sync(consumer.direct_inbox_event)({'payload': 'bad'})
        consumer.send.assert_not_awaited()

        async_to_sync(consumer.disconnect)(1000)
        consumer._clear_active_room.assert_awaited_once_with(conn_only=True)
        consumer.channel_layer.group_discard.assert_awaited_once()

        heartbeat_consumer = self._consumer()
        heartbeat_consumer.send = AsyncMock(side_effect=RuntimeError('boom'))

        async def _fast_sleep(_interval):
            """Проверяет сценарий `_fast_sleep`."""
            return None

        with patch('direct_inbox.consumers.asyncio.sleep', new=_fast_sleep):
            async_to_sync(heartbeat_consumer._heartbeat)()

        idle_consumer = self._consumer()
        idle_consumer.idle_timeout = 1
        idle_consumer._last_client_activity = 0.0

        with patch('direct_inbox.consumers.asyncio.sleep', new=_fast_sleep), patch(
            'direct_inbox.consumers.time.monotonic', return_value=10.0
        ):
            async_to_sync(idle_consumer._idle_watchdog)()

        idle_consumer.close.assert_awaited_once()

    def test_connect_closes_when_rate_limited(self):
        """Закрывает direct inbox websocket при превышении лимита connect."""
        consumer = self._consumer()
        consumer.accept = AsyncMock()
        consumer._send_unread_state = AsyncMock()

        with patch("direct_inbox.consumers._ws_connect_rate_limited", return_value=True):
            async_to_sync(consumer.connect)()

        consumer.close.assert_awaited_once_with(code=4429)
        consumer.accept.assert_not_awaited()

