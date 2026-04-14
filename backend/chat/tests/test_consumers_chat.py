# pyright: reportAttributeAccessIssue=false, reportGeneralTypeIssues=false
"""Содержит тесты модуля `test_consumers_chat` подсистемы `chat`."""


import json
from unittest.mock import AsyncMock

from autobahn.exception import Disconnected
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.cache import cache
from django.test import TransactionTestCase, override_settings

from chat.consumers import ChatConsumer
from messages.models import Message
from roles.models import Membership, Role
from rooms.services import ensure_membership
from rooms.models import Room
from chat.routing import websocket_urlpatterns as chat_ws
from direct_inbox.routing import websocket_urlpatterns as di_ws
from users.identity import user_public_ref, user_public_username

User = get_user_model()
application = URLRouter(chat_ws + di_ws)


class ChatConsumerTests(TransactionTestCase):
    """Группирует тестовые сценарии класса `ChatConsumerTests`."""
    def setUp(self):
        """Проверяет сценарий `setUp`."""
        cache.clear()
        self.owner = User.objects.create_user(username='owner', password='pass12345')
        self.member = User.objects.create_user(username='member', password='pass12345')
        self.other = User.objects.create_user(username='other', password='pass12345')

        self.private_room = Room.objects.create(
            name='private',
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(self.private_room, self.owner, role_name="Owner")
        ensure_membership(self.private_room, self.member, role_name="Member")

        self.direct_room = Room.objects.create(
            name='dm',
            kind=Room.Kind.DIRECT,
            direct_pair_key=f'{self.owner.pk}:{self.member.pk}',
            created_by=self.owner,
        )
        ensure_membership(self.direct_room, self.owner)
        ensure_membership(self.direct_room, self.member)
        self.public_room = Room.objects.create(
            name='public',
            kind=Room.Kind.PUBLIC,
            created_by=self.owner,
        )

    async def _connect(self, path: str, user=None):
        """Проверяет сценарий `_connect`."""
        communicator = WebsocketCommunicator(
            application,
            path,
            headers=[(b'host', b'localhost')],
        )
        communicator.scope['user'] = user if user is not None else AnonymousUser()
        communicator.scope['client'] = ('127.0.0.1', 50001)
        connected, close_code = await communicator.connect()
        return communicator, connected, close_code

    def test_public_connect(self):
        """Проверяет сценарий `test_public_connect`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(f'/ws/chat/{self.public_room.pk}/')
            self.assertTrue(connected)
            await communicator.disconnect()

        async_to_sync(run)()

    @override_settings(
        RATE_LIMITS={
            "ws_connect_default": {"limit": 1, "window_seconds": 60},
        }
    )
    def test_chat_connect_rate_limit(self):
        """Отклоняет второе подключение с того же IP при жестком лимите."""
        async def run():
            """Проверяет сценарий `run`."""
            first, connected, _ = await self._connect(f'/ws/chat/{self.public_room.pk}/')
            self.assertTrue(connected)

            _second, second_connected, close_code = await self._connect(f'/ws/chat/{self.public_room.pk}/')
            self.assertFalse(second_connected)
            self.assertEqual(close_code, 4429)

            await first.disconnect()

        async_to_sync(run)()

    def test_invalid_room_rejected(self):
        """Проверяет сценарий `test_invalid_room_rejected`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect('/ws/chat/0/')
            self.assertFalse(connected)
            self.assertEqual(close_code, 4404)

        async_to_sync(run)()

    def test_missing_room_rejected(self):
        """Проверяет сценарий `test_missing_room_rejected`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect('/ws/chat/999999/')
            self.assertFalse(connected)
            self.assertEqual(close_code, 4404)

        async_to_sync(run)()

    def test_non_canonical_text_route_rejected(self):
        """Отклоняет устаревший text-route без no-route ошибки на уровне Daphne."""
        async def run():
            _communicator, connected, close_code = await self._connect('/ws/chat/general/')
            self.assertFalse(connected)
            self.assertEqual(close_code, 4404)

        async_to_sync(run)()

    def test_private_requires_role(self):
        """Проверяет сценарий `test_private_requires_role`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect(
                f'/ws/chat/{self.private_room.pk}/'
            )
            self.assertFalse(connected)
            self.assertEqual(close_code, 4403)

        async_to_sync(run)()

    def test_private_denies_non_member(self):
        """Проверяет сценарий `test_private_denies_non_member`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.other,
            )
            self.assertFalse(connected)
            self.assertEqual(close_code, 4403)

        async_to_sync(run)()

    def test_private_allows_member(self):
        """Проверяет сценарий `test_private_allows_member`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)
            await communicator.disconnect()

        async_to_sync(run)()

    def test_direct_denies_non_participant(self):
        """Проверяет сценарий `test_direct_denies_non_participant`."""
        async def run():
            """Проверяет сценарий `run`."""
            _communicator, connected, close_code = await self._connect(
                f'/ws/chat/{self.direct_room.pk}/',
                user=self.other,
            )
            self.assertFalse(connected)
            self.assertEqual(close_code, 4403)

        async_to_sync(run)()

    def test_invalid_json_non_string_and_blank_messages_are_ignored(self):
        """Проверяет сценарий `test_invalid_json_non_string_and_blank_messages_are_ignored`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)

            await communicator.send_to(text_data='not-json')
            self.assertTrue(await communicator.receive_nothing(timeout=0.2))

            await communicator.send_to(text_data=json.dumps({'message': 123}))
            self.assertTrue(await communicator.receive_nothing(timeout=0.2))

            await communicator.send_to(text_data=json.dumps({'message': '   '}))
            self.assertTrue(await communicator.receive_nothing(timeout=0.2))

            await communicator.disconnect()

        async_to_sync(run)()

    def test_typing_event_does_not_crash_socket_and_message_send_still_works(self):
        """Typing event should not close socket; message send must continue to work."""
        async def run():
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)

            await communicator.send_to(text_data=json.dumps({'type': 'typing'}))
            self.assertTrue(await communicator.receive_nothing(timeout=0.3))

            await communicator.send_to(text_data=json.dumps({'message': 'typing-safe'}))
            event = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(event.get('message'), 'typing-safe')

            await communicator.disconnect()

        async_to_sync(run)()
        self.assertTrue(
            Message.objects.filter(room=self.private_room, message_content='typing-safe').exists()
        )

    def test_read_receipt_ignores_closed_socket_send(self):
        """Late room events after disconnect must not crash the consumer."""
        async def run():
            consumer = ChatConsumer()
            consumer.scope = {"type": "websocket"}
            consumer._connection_closed = False
            consumer._last_activity = 0.0
            consumer.send = AsyncMock(side_effect=Disconnected())

            await consumer.chat_read_receipt(
                {
                    "userId": self.member.pk,
                    "publicRef": user_public_ref(self.member),
                    "username": user_public_username(self.member),
                    "displayName": self.member.username,
                    "lastReadMessageId": 1,
                    "lastReadAt": None,
                    "roomId": self.private_room.pk,
                }
            )

            consumer.send.assert_awaited_once()
            self.assertTrue(consumer._connection_closed)

        async_to_sync(run)()

    def test_unauthenticated_public_user_cannot_send_messages(self):
        """Проверяет сценарий `test_unauthenticated_public_user_cannot_send_messages`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(f'/ws/chat/{self.public_room.pk}/')
            self.assertTrue(connected)

            await communicator.send_to(text_data=json.dumps({'message': 'hello'}))
            self.assertTrue(await communicator.receive_nothing(timeout=0.2))

            await communicator.disconnect()

        async_to_sync(run)()
        self.assertFalse(Message.objects.filter(message_content='hello').exists())

    def test_viewer_cannot_write(self):
        """Проверяет сценарий `test_viewer_cannot_write`."""
        membership = Membership.objects.get(room=self.private_room, user=self.member)
        viewer_role = (
            Role.objects.filter(room=self.private_room, name="Viewer").first()
            or Role.create_defaults_for_room(self.private_room)["Viewer"]
        )
        membership.roles.set([viewer_role])

        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)
            await communicator.send_to(text_data=json.dumps({'message': 'hello'}))
            payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(payload.get('error'), 'forbidden')
            await communicator.disconnect()

        async_to_sync(run)()

    def test_message_too_long(self):
        """Проверяет сценарий `test_message_too_long`."""
        @override_settings(CHAT_MESSAGE_MAX_LENGTH=10)
        def inner():
            """Проверяет сценарий `inner`."""
            async def run():
                """Проверяет сценарий `run`."""
                communicator, connected, _ = await self._connect(
                    f'/ws/chat/{self.private_room.pk}/',
                    user=self.member,
                )
                self.assertTrue(connected)
                await communicator.send_to(text_data=json.dumps({'message': 'x' * 20}))
                payload = json.loads(await communicator.receive_from(timeout=2))
                self.assertEqual(payload.get('error'), 'message_too_long')
                await communicator.disconnect()

            async_to_sync(run)()

        inner()

    def test_message_persisted(self):
        """Проверяет сценарий `test_message_persisted`."""
        self.member.profile.avatar_crop_x = 0.1
        self.member.profile.avatar_crop_y = 0.2
        self.member.profile.avatar_crop_width = 0.3
        self.member.profile.avatar_crop_height = 0.4
        self.member.profile.save(
            update_fields=[
                'avatar_crop_x',
                'avatar_crop_y',
                'avatar_crop_width',
                'avatar_crop_height',
            ]
        )

        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)
            await communicator.send_to(text_data=json.dumps({'message': 'hello'}))
            event = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(event.get('message'), 'hello')
            self.assertEqual(event.get('username'), user_public_username(self.member))
            self.assertIsInstance(event.get('id'), int)
            self.assertTrue(event.get('createdAt'))
            self.assertIn('replyTo', event)
            self.assertIn('attachments', event)
            self.assertEqual(
                event.get('avatar_crop'),
                {'x': 0.1, 'y': 0.2, 'width': 0.3, 'height': 0.4},
            )
            await communicator.disconnect()

        async_to_sync(run)()
        self.assertTrue(Message.objects.filter(room=self.private_room, message_content='hello').exists())


    def test_direct_message_notifies_participants_in_inbox_channel(self):
        """Проверяет сценарий `test_direct_message_notifies_participants_in_inbox_channel`."""
        self.owner.profile.avatar_crop_x = 0.1
        self.owner.profile.avatar_crop_y = 0.2
        self.owner.profile.avatar_crop_width = 0.3
        self.owner.profile.avatar_crop_height = 0.4
        self.owner.profile.save(
            update_fields=[
                'avatar_crop_x',
                'avatar_crop_y',
                'avatar_crop_width',
                'avatar_crop_height',
            ]
        )

        async def run():
            """Проверяет сценарий `run`."""
            inbox_member, connected, _ = await self._connect('/ws/inbox/', user=self.member)
            self.assertTrue(connected)
            initial_payload = json.loads(await inbox_member.receive_from(timeout=2))
            self.assertEqual(initial_payload.get('type'), 'direct_unread_state')

            chat_owner, chat_connected, _ = await self._connect(
                f'/ws/chat/{self.direct_room.pk}/',
                user=self.owner,
            )
            self.assertTrue(chat_connected)
            await chat_owner.send_to(text_data=json.dumps({'message': 'hello dm'}))
            await chat_owner.receive_from(timeout=2)

            inbox_payload = json.loads(await inbox_member.receive_from(timeout=2))
            self.assertEqual(inbox_payload.get('type'), 'direct_inbox_item')
            self.assertEqual(inbox_payload['item']['roomId'], self.direct_room.pk)
            self.assertEqual(
                inbox_payload['item']['peer']['username'],
                user_public_username(self.owner),
            )
            self.assertEqual(
                inbox_payload['item']['peer']['publicRef'],
                user_public_ref(self.owner),
            )
            self.assertEqual(
                inbox_payload['item']['peer']['avatarCrop'],
                {'x': 0.1, 'y': 0.2, 'width': 0.3, 'height': 0.4},
            )
            self.assertTrue(inbox_payload['unread']['isUnread'])
            self.assertEqual(inbox_payload['unread']['dialogs'], 1)
            self.assertEqual(inbox_payload['unread']['counts'].get(str(self.direct_room.pk)), 1)

            await chat_owner.disconnect()
            await inbox_member.disconnect()

        async_to_sync(run)()

    def test_direct_message_does_not_notify_non_participant_inbox_channel(self):
        """Проверяет сценарий `test_direct_message_does_not_notify_non_participant_inbox_channel`."""
        async def run():
            """Проверяет сценарий `run`."""
            inbox_outsider, connected, _ = await self._connect('/ws/inbox/', user=self.other)
            self.assertTrue(connected)
            initial_payload = json.loads(await inbox_outsider.receive_from(timeout=2))
            self.assertEqual(initial_payload.get('type'), 'direct_unread_state')

            chat_owner, chat_connected, _ = await self._connect(
                f'/ws/chat/{self.direct_room.pk}/',
                user=self.owner,
            )
            self.assertTrue(chat_connected)
            await chat_owner.send_to(text_data=json.dumps({'message': 'hello private'}))
            await chat_owner.receive_from(timeout=2)

            self.assertTrue(await inbox_outsider.receive_nothing(timeout=0.3))

            await chat_owner.disconnect()
            await inbox_outsider.disconnect()

        async_to_sync(run)()

    def test_membership_revoked_closes_target_socket(self):
        """Disconnect target user socket when membership is revoked in room."""
        async def run():
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)

            channel_layer = get_channel_layer()
            assert channel_layer is not None
            await channel_layer.group_send(
                f"chat_room_{self.private_room.pk}",
                {
                    "type": "chat_membership_revoked",
                    "targetUserId": self.member.pk,
                },
            )

            output = await communicator.receive_output(timeout=2)
            self.assertEqual(output.get("type"), "websocket.close")
            self.assertEqual(output.get("code"), 4403)

        async_to_sync(run)()

    @override_settings(
        RATE_LIMITS={
            "chat_message_send": {"limit": 1, "window_seconds": 30},
        }
    )
    def test_rate_limit(self):
        """Проверяет сценарий `test_rate_limit`."""
        async def run():
            """Проверяет сценарий `run`."""
            communicator, connected, _ = await self._connect(
                f'/ws/chat/{self.private_room.pk}/',
                user=self.member,
            )
            self.assertTrue(connected)

            await communicator.send_to(text_data=json.dumps({'message': 'first'}))
            await communicator.receive_from(timeout=2)

            await communicator.send_to(text_data=json.dumps({'message': 'second'}))
            payload = json.loads(await communicator.receive_from(timeout=2))
            self.assertEqual(payload.get('error'), 'rate_limited')
            self.assertIsInstance(payload.get("retry_after"), int)
            self.assertGreaterEqual(payload.get("retry_after"), 1)
            self.assertLessEqual(payload.get("retry_after"), 30)
            await communicator.disconnect()

        async_to_sync(run)()


