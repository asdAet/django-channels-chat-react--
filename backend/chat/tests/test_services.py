"""Unit tests for chat.services business logic."""

from datetime import timedelta
import tempfile
from unittest.mock import Mock
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import OperationalError
from django.test import TestCase, override_settings
from django.utils import timezone

from chat import services
from chat.services import MessageForbiddenError, MessageNotFoundError, MessageValidationError
from messages.models import Message, MessageAttachment, MessageReadState, Reaction
from rooms.models import Room
from rooms.services import ensure_membership

User = get_user_model()


class ChatServicesTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="svc_owner", password="pass12345")
        self.peer = User.objects.create_user(username="svc_peer", password="pass12345")
        self.other = User.objects.create_user(username="svc_other", password="pass12345")
        self.room = Room.objects.create(
            slug="svc-room-1",
            name="Service room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(self.room, self.owner, role_name="Owner")
        ensure_membership(self.room, self.peer, role_name="Member")
        ensure_membership(self.room, self.other, role_name="Member")

    def _message(self, *, user=None, content="hello"):
        user = user or self.owner
        return Message.objects.create(
            username=user.username,
            user=user,
            room=self.room,
            message_content=content,
        )

    def test_edit_message_validates_payload(self):
        msg = self._message()
        with self.assertRaises(MessageValidationError):
            services.edit_message(self.owner, self.room, msg.pk, "   ")
        with override_settings(CHAT_MESSAGE_MAX_LENGTH=3):
            with self.assertRaises(MessageValidationError):
                services.edit_message(self.owner, self.room, msg.pk, "1234")

    def test_edit_message_raises_not_found_for_missing_message(self):
        with self.assertRaises(MessageNotFoundError):
            services.edit_message(self.owner, self.room, 999999, "text")

    def test_edit_message_raises_forbidden_for_non_author_without_permission(self):
        msg = self._message(user=self.owner)
        with patch("chat.services.has_permission", return_value=False):
            with self.assertRaises(MessageForbiddenError):
                services.edit_message(self.other, self.room, msg.pk, "new")

    @override_settings(CHAT_MESSAGE_EDIT_WINDOW_SECONDS=1)
    def test_edit_message_raises_when_author_window_expired(self):
        msg = self._message(user=self.owner, content="original")
        Message.objects.filter(pk=msg.pk).update(date_added=timezone.now() - timedelta(seconds=5))
        with patch("chat.services.has_permission", return_value=False):
            with self.assertRaises(MessageForbiddenError):
                services.edit_message(self.owner, self.room, msg.pk, "new")

    @override_settings(CHAT_MESSAGE_EDIT_WINDOW_SECONDS=0)
    def test_edit_message_window_zero_allows_old_message(self):
        msg = self._message(user=self.owner, content="old")
        Message.objects.filter(pk=msg.pk).update(date_added=timezone.now() - timedelta(days=3))
        updated = services.edit_message(self.owner, self.room, msg.pk, "new")
        self.assertEqual(updated.message_content, "new")

    def test_edit_message_updates_message_and_preserves_original(self):
        msg = self._message(user=self.owner, content="original")
        updated = services.edit_message(self.owner, self.room, msg.pk, "updated")
        self.assertEqual(updated.message_content, "updated")
        self.assertEqual(updated.original_content, "original")
        self.assertIsNotNone(updated.edited_at)

    def test_delete_message_forbidden_and_success(self):
        msg = self._message(user=self.owner)
        with patch("chat.services.has_permission", return_value=False):
            with self.assertRaises(MessageForbiddenError):
                services.delete_message(self.other, self.room, msg.pk)

        deleted = services.delete_message(self.owner, self.room, msg.pk)
        self.assertTrue(deleted.is_deleted)
        self.assertIsNotNone(deleted.deleted_at)
        self.assertEqual(deleted.deleted_by_id, self.owner.pk)

    @override_settings(CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE=True)
    def test_delete_message_deletes_attachment_files_when_enabled(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            msg = self._message(user=self.owner)
            attachment = MessageAttachment.objects.create(
                message=msg,
                file=SimpleUploadedFile("doc.txt", b"file", content_type="text/plain"),
                original_filename="doc.txt",
                content_type="text/plain",
                file_size=4,
                thumbnail=SimpleUploadedFile("thumb.txt", b"thumb", content_type="text/plain"),
            )
            file_storage = attachment.file.storage
            thumb_storage = attachment.thumbnail.storage
            file_name = attachment.file.name
            thumb_name = attachment.thumbnail.name

            self.assertTrue(file_storage.exists(file_name))
            self.assertTrue(thumb_storage.exists(thumb_name))

            deleted = services.delete_message(self.owner, self.room, msg.pk)

            attachment.refresh_from_db()
            self.assertEqual(attachment.file.name, file_name)
            self.assertEqual(attachment.thumbnail.name, thumb_name)
            self.assertFalse(file_storage.exists(file_name))
            self.assertFalse(thumb_storage.exists(thumb_name))
            self.assertTrue(MessageAttachment.objects.filter(pk=attachment.pk).exists())
            self.assertTrue(deleted.is_deleted)

    @override_settings(CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE=False)
    def test_delete_message_keeps_attachment_files_when_delete_disabled(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            msg = self._message(user=self.owner)
            attachment = MessageAttachment.objects.create(
                message=msg,
                file=SimpleUploadedFile("doc.txt", b"file", content_type="text/plain"),
                original_filename="doc.txt",
                content_type="text/plain",
                file_size=4,
                thumbnail=SimpleUploadedFile("thumb.txt", b"thumb", content_type="text/plain"),
            )
            file_storage = attachment.file.storage
            thumb_storage = attachment.thumbnail.storage
            file_name = attachment.file.name
            thumb_name = attachment.thumbnail.name

            self.assertTrue(file_storage.exists(file_name))
            self.assertTrue(thumb_storage.exists(thumb_name))

            deleted = services.delete_message(self.owner, self.room, msg.pk)

            self.assertTrue(file_storage.exists(file_name))
            self.assertTrue(thumb_storage.exists(thumb_name))
            self.assertTrue(deleted.is_deleted)

    @override_settings(CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE=True)
    def test_delete_message_logs_storage_errors_and_continues(self):
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            msg = self._message(user=self.owner)
            attachment = MessageAttachment.objects.create(
                message=msg,
                file=SimpleUploadedFile("doc.txt", b"file", content_type="text/plain"),
                original_filename="doc.txt",
                content_type="text/plain",
                file_size=4,
                thumbnail=SimpleUploadedFile("thumb.txt", b"thumb", content_type="text/plain"),
            )
            storage = attachment.file.storage

            with patch.object(storage, "delete", side_effect=OSError("storage down")) as delete_mock, patch(
                "chat.services.logger.warning",
            ) as logger_warning:
                deleted = services.delete_message(self.owner, self.room, msg.pk)

            self.assertGreaterEqual(delete_mock.call_count, 1)
            self.assertGreaterEqual(logger_warning.call_count, 1)
            self.assertTrue(deleted.is_deleted)

    def test_add_reaction_validates_permission_and_missing_message(self):
        msg = self._message(user=self.owner)
        with self.assertRaises(MessageValidationError):
            services.add_reaction(self.peer, self.room, msg.pk, "")

        with patch("chat.services.has_permission", return_value=False):
            with self.assertRaises(MessageForbiddenError):
                services.add_reaction(self.peer, self.room, msg.pk, "👍")

        with patch("chat.services.has_permission", return_value=True):
            with self.assertRaises(MessageNotFoundError):
                services.add_reaction(self.peer, self.room, 999999, "👍")

    def test_add_and_remove_reaction_are_idempotent(self):
        msg = self._message(user=self.owner)
        with patch("chat.services.has_permission", return_value=True):
            first = services.add_reaction(self.peer, self.room, msg.pk, "👍")
            second = services.add_reaction(self.peer, self.room, msg.pk, "👍")
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(Reaction.objects.filter(message=msg, user=self.peer, emoji="👍").count(), 1)

        services.remove_reaction(self.peer, self.room, msg.pk, "👍")
        services.remove_reaction(self.peer, self.room, msg.pk, "👍")
        self.assertFalse(Reaction.objects.filter(message=msg, user=self.peer, emoji="👍").exists())

    def test_mark_read_requires_existing_message_and_is_monotonic(self):
        first = self._message(user=self.peer, content="one")
        second = self._message(user=self.peer, content="two")

        with self.assertRaises(MessageNotFoundError):
            services.mark_read(self.owner, self.room, 999999)

        state = services.mark_read(self.owner, self.room, second.pk)
        self.assertEqual(state.last_read_message_id, second.pk)

        state = services.mark_read(self.owner, self.room, first.pk)
        self.assertEqual(state.last_read_message_id, second.pk)
        self.assertTrue(
            MessageReadState.objects.filter(
                user=self.owner,
                room=self.room,
                last_read_message_id=second.pk,
            ).exists()
        )

        # cover branch where existing state increases and is saved
        state = services.mark_read(self.owner, self.room, second.pk)
        self.assertEqual(state.last_read_message_id, second.pk)

    def test_mark_read_retries_and_raises_operational_error(self):
        msg = self._message(user=self.peer, content="op error")
        mocked_queryset = Mock()
        mocked_queryset.exists.return_value = True
        with patch("chat.services.Message.objects.filter", return_value=mocked_queryset), patch(
            "chat.services.MessageReadState.objects.select_for_update"
        ) as select_for_update_mock:
            select_for_update_mock.return_value.get_or_create.side_effect = OperationalError("locked")
            with self.assertRaises(OperationalError):
                services.mark_read(self.owner, self.room, msg.pk)

    def test_get_unread_counts_returns_only_rooms_with_unread(self):
        second_room = Room.objects.create(
            slug="svc-room-2",
            name="Second room",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(second_room, self.owner, role_name="Owner")
        ensure_membership(second_room, self.peer, role_name="Member")

        m1 = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=self.room,
            message_content="unread in first",
        )
        m2 = Message.objects.create(
            username=self.peer.username,
            user=self.peer,
            room=second_room,
            message_content="read in second",
        )
        services.mark_read(self.owner, second_room, m2.pk)

        items = services.get_unread_counts(self.owner)
        self.assertTrue(any(item["roomId"] == self.room.pk for item in items))
        self.assertFalse(any(item["roomId"] == second_room.pk for item in items))

        # ensure read-state branch for deleted and own messages does not inflate unread
        Message.objects.filter(pk=m1.pk).update(is_deleted=True)
        own_message = Message.objects.create(
            username=self.owner.username,
            user=self.owner,
            room=self.room,
            message_content="own message",
        )
        services.mark_read(self.owner, self.room, own_message.pk)
        self.assertEqual(services.get_unread_counts(self.owner), [])
