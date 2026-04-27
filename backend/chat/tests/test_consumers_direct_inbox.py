# pyright: reportAttributeAccessIssue=false, reportGeneralTypeIssues=false
"""Содержит тесты модуля `test_consumers_direct_inbox` подсистемы `chat`."""


import json

from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import TransactionTestCase, override_settings

from direct_inbox.state import mark_unread
from rooms.services import ensure_membership
from rooms.models import Room
from chat.routing import websocket_urlpatterns as chat_ws
from direct_inbox.routing import websocket_urlpatterns as di_ws

User = get_user_model()
application = URLRouter(chat_ws + di_ws)


class DirectInboxConsumerTests(TransactionTestCase):
    """Группирует тестовые сценарии класса `DirectInboxConsumerTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.owner = User.objects.create_user(username='owner_di', password='pass12345')
        self.member = User.objects.create_user(username='member_di', password='pass12345')
        self.other = User.objects.create_user(username='other_di', password='pass12345')

        self.direct_room = Room.objects.create(
            name='dm',
            kind=Room.Kind.DIRECT,
            direct_pair_key=f'{self.owner.pk}:{self.member.pk}',
            created_by=self.owner,
        )
        ensure_membership(self.direct_room, self.owner, role_name='Owner')
        ensure_membership(self.direct_room, self.member, role_name='Member')

        self.unrelated_room = Room.objects.create(
            name='dm2',
            kind=Room.Kind.DIRECT,
            direct_pair_key=f'{self.member.pk}:{self.other.pk}',
            created_by=self.member,
        )
        ensure_membership(self.unrelated_room, self.member, role_name='Owner')
        ensure_membership(self.unrelated_room, self.other, role_name='Member')

    async def _connect_inbox(self, user=None):
        """Проверяет сценарий `_connect_inbox`."""
        communicator = WebsocketCommunicator(
            application,
            '/ws/inbox/',
            headers=[(b'host', b'localhost')],
        )
        communicator.scope['user'] = user if user is not None else AnonymousUser()
        communicator.scope['client'] = ('127.0.0.1', 50010)
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    async def _connect_chat(self, room_id: int, user):
        """Проверяет сценарий `_connect_chat`."""
        communicator = WebsocketCommunicator(
            application,
            f'/ws/chat/{room_id}/',
            headers=[(b'host', b'localhost')],
        )
        communicator.scope['user'] = user
        communicator.scope['client'] = ('127.0.0.1', 50011)
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    def test_guest_connection_is_rejected(self):
        """Проверяет сценарий `test_guest_connection_is_rejected`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect_inbox()
            self.assertFalse(connected)
            self.assertEqual(close_code, 4401)

        async_to_sync(run)()

    @override_settings(
        RATE_LIMITS={
            "ws_connect_default": {"limit": 1, "window_seconds": 60},
        }
    )
    def test_connect_rate_limit_for_inbox(self):
        """Отклоняет повторное подключение inbox websocket с одного IP."""
        async def run():
            """Проверяет сценарий `run`."""
            first, connected, _ = await self._connect_inbox(self.owner)
            self.assertTrue(connected)

            _second, second_connected, close_code = await self._connect_inbox(self.owner)
            self.assertFalse(second_connected)
            self.assertEqual(close_code, 4429)

            await first.disconnect()

        async_to_sync(run)()

    def test_authenticated_user_receives_initial_unread_state(self):
        """Проверяет сценарий `test_authenticated_user_receives_initial_unread_state`."""
        mark_unread(self.member.pk, self.direct_room.pk, ttl_seconds=60)

        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect_inbox(self.member)
            self.assertTrue(connected)

            payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(payload.get('type'), 'direct_unread_state')
            self.assertEqual(payload['unread']['dialogs'], 1)
            self.assertIn(self.direct_room.pk, payload['unread']['roomIds'])
            self.assertEqual(payload['unread']['counts'].get(str(self.direct_room.pk)), 1)

            room_payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(room_payload.get('type'), 'room_unread_state')
            self.assertIsInstance(room_payload.get('unread', {}).get('counts'), dict)

            await communicator.disconnect()

        async_to_sync(run)()

    def test_mark_read_decreases_unread_dialogs(self):
        """Проверяет сценарий `test_mark_read_decreases_unread_dialogs`."""
        mark_unread(self.member.pk, self.direct_room.pk, ttl_seconds=60)
        mark_unread(self.member.pk, self.unrelated_room.pk, ttl_seconds=60)

        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect_inbox(self.member)
            self.assertTrue(connected)
            await communicator.receive_from(timeout=2)
            await communicator.receive_from(timeout=2)

            await communicator.send_to(text_data=json.dumps({'type': 'mark_read', 'roomId': self.direct_room.pk}))
            payload = json.loads(await communicator.receive_from(timeout=2))

            self.assertEqual(payload.get('type'), 'direct_mark_read_ack')
            self.assertEqual(payload['roomId'], self.direct_room.pk)
            self.assertEqual(payload['unread']['dialogs'], 1)
            self.assertNotIn(self.direct_room.pk, payload['unread']['roomIds'])
            self.assertNotIn(str(self.direct_room.pk), payload['unread']['counts'])

            await communicator.disconnect()

        async_to_sync(run)()

    def test_set_active_room_checks_acl(self):
        """Проверяет сценарий `test_set_active_room_checks_acl`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect_inbox(self.owner)
            self.assertTrue(connected)
            await communicator.receive_from(timeout=2)
            await communicator.receive_from(timeout=2)

            await communicator.send_to(
                text_data=json.dumps({'type': 'set_active_room', 'roomId': self.unrelated_room.pk})
            )
            payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(payload.get('type'), 'error')
            self.assertEqual(payload.get('code'), 'forbidden')

            await communicator.disconnect()

        async_to_sync(run)()

    def test_active_room_stays_unread_until_explicit_mark_read(self):
        """Проверяет сценарий `test_active_room_stays_unread_until_explicit_mark_read`."""
        async def run():
            """Проверяет сценарий `run`."""
            inbox, connected, _ = await self._connect_inbox(self.member)
            self.assertTrue(connected)
            await inbox.receive_from(timeout=2)
            await inbox.receive_from(timeout=2)

            await inbox.send_to(
                text_data=json.dumps({'type': 'set_active_room', 'roomId': self.direct_room.pk})
            )

            chat, chat_connected, _ = await self._connect_chat(self.direct_room.pk, self.owner)
            self.assertTrue(chat_connected)

            await chat.send_to(text_data=json.dumps({'message': 'hello member'}))
            await chat.receive_from(timeout=2)

            inbox_payload = json.loads(await inbox.receive_from(timeout=2))
            self.assertEqual(inbox_payload.get('type'), 'direct_inbox_item')
            self.assertEqual(inbox_payload['item']['roomId'], self.direct_room.pk)
            self.assertEqual(inbox_payload['unread']['dialogs'], 1)
            self.assertTrue(inbox_payload['unread']['isUnread'])
            self.assertEqual(inbox_payload['unread']['counts'].get(str(self.direct_room.pk)), 1)

            await chat.disconnect()
            await inbox.disconnect()

        async_to_sync(run)()

