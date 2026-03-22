"""Unit tests for users.application.media_access_service."""

from __future__ import annotations

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from messages.models import Message, MessageAttachment
from rooms.models import Room
from rooms.services import ensure_membership
from users.application import auth_service
from users.application.media_access_service import (
    MediaAccessNotFoundError,
    resolve_attachment_media_access,
    resolve_media_content_type,
)


class MediaAccessServiceTests(TestCase):
    def setUp(self):
        self.owner = auth_service.register_user(
            login="svc_media_owner_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Service Media Owner",
            username="svcmowner",
            email="svcmowner@example.com",
        )
        self.peer = auth_service.register_user(
            login="svc_media_peer_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Service Media Peer",
            username="svcmpeer",
            email="svcmpeer@example.com",
        )
        self.outsider = auth_service.register_user(
            login="svc_media_outsider_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Service Media Outsider",
            username="svcmoutsider",
            email="svcmoutsider@example.com",
        )
        self.direct_room = Room.objects.create(
            name="service media direct",
            kind=Room.Kind.DIRECT,
            direct_pair_key=f"{self.owner.pk}:{self.peer.pk}",
            created_by=self.owner,
        )
        ensure_membership(self.direct_room, self.owner)
        ensure_membership(self.direct_room, self.peer)

    def _attachment_for_room(self, room: Room, *, author) -> MessageAttachment:
        message = Message.objects.create(
            username=author.username,
            user=author,
            room=room,
            message_content="service attachment message",
        )
        return MessageAttachment.objects.create(
            message=message,
            file=SimpleUploadedFile("report.pdf", b"%PDF-1.4", content_type="application/pdf"),
            original_filename="report.pdf",
            content_type="application/pdf",
            file_size=8,
            thumbnail=SimpleUploadedFile("thumb.png", b"\x89PNG\r\n\x1a\n", content_type="application/octet-stream"),
        )

    def test_resolve_media_content_type_uses_specific_preferred_type(self):
        resolved = resolve_media_content_type(
            "chat_attachments/2026/03/report.bin",
            preferred_content_type="application/pdf",
        )
        self.assertEqual(resolved, "application/pdf")

    def test_resolve_media_content_type_falls_back_to_extension_when_preferred_generic(self):
        resolved = resolve_media_content_type(
            "chat_thumbnails/2026/03/thumb.png",
            preferred_content_type="application/octet-stream",
        )
        self.assertEqual(resolved, "image/png")

    def test_resolve_attachment_media_access_returns_preferred_type_for_original_file(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        result = resolve_attachment_media_access(
            normalized_path=attachment.file.name,
            room_id_raw=str(self.direct_room.pk),
            user=self.owner,
        )
        self.assertEqual(result.room_id, self.direct_room.pk)
        self.assertEqual(result.preferred_content_type, "application/pdf")

    def test_resolve_attachment_media_access_allows_non_owner_direct_participant(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        result = resolve_attachment_media_access(
            normalized_path=attachment.file.name,
            room_id_raw=self.direct_room.pk,
            user=self.peer,
        )
        self.assertEqual(result.room_id, self.direct_room.pk)

    def test_resolve_attachment_media_access_returns_guess_for_thumbnail(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        result = resolve_attachment_media_access(
            normalized_path=attachment.thumbnail.name,
            room_id_raw=self.direct_room.pk,
            user=self.owner,
        )
        self.assertEqual(result.room_id, self.direct_room.pk)
        self.assertEqual(result.preferred_content_type, "image/png")

    def test_resolve_attachment_media_access_denies_unauthenticated_or_outsider(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)

        with self.assertRaises(MediaAccessNotFoundError):
            resolve_attachment_media_access(
                normalized_path=attachment.file.name,
                room_id_raw=self.direct_room.pk,
                user=None,
            )

        with self.assertRaises(MediaAccessNotFoundError):
            resolve_attachment_media_access(
                normalized_path=attachment.file.name,
                room_id_raw=self.direct_room.pk,
                user=self.outsider,
            )

    def test_resolve_attachment_media_access_allows_authenticated_reader_in_public_room(self):
        public_room = Room.objects.create(
            name="service media public",
            kind=Room.Kind.PUBLIC,
            created_by=self.owner,
        )
        attachment = self._attachment_for_room(public_room, author=self.owner)

        result = resolve_attachment_media_access(
            normalized_path=attachment.file.name,
            room_id_raw=public_room.pk,
            user=self.outsider,
        )
        self.assertEqual(result.room_id, public_room.pk)
