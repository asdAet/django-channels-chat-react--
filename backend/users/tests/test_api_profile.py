# pyright: reportAttributeAccessIssue=false
"""Tests for profile and public resolve endpoints in identity vNext."""

from __future__ import annotations

import io
import time
from urllib.parse import parse_qs, quote, urlparse

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.test.utils import override_settings
from rest_framework.test import APIClient

from chat import utils
from messages.models import Message, MessageAttachment
from rooms.models import Room
from rooms.services import ensure_membership
from users.application import auth_service
from users.identity import user_public_ref
from users.models import MAX_PROFILE_IMAGE_SIDE


class ProfileApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.user = auth_service.register_user(
            login="profile_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Profile User",
            username="profileuser",
            email="profile@example.com",
        )
        self.other = auth_service.register_user(
            login="other_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Other User",
            username="otheruser",
            email="other@example.com",
        )

    def _csrf(self) -> str:
        response = self.client.get("/api/auth/csrf/")
        return response.cookies["csrftoken"].value

    @staticmethod
    def _image_upload(filename: str = "avatar.png", size=(20, 20)) -> SimpleUploadedFile:
        image = Image.new("RGB", size, (30, 60, 90))
        buff = io.BytesIO()
        image.save(buff, format="PNG")
        buff.seek(0)
        return SimpleUploadedFile(filename, buff.read(), content_type="image/png")

    def _assert_signed_profile_image(self, url: str):
        parsed = urlparse(url)
        self.assertTrue(parsed.path.startswith("/api/auth/media/"))
        query = parse_qs(parsed.query)
        self.assertIn("exp", query)
        self.assertIn("sig", query)
        media_path = parsed.path.removeprefix("/api/auth/media/")
        self.assertTrue(utils.is_valid_media_signature(media_path, int(query["exp"][0]), query["sig"][0]))

    def test_profile_requires_auth(self):
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, 401)

    def test_get_profile_authenticated(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["user"]
        self.assertEqual(payload["name"], "Profile User")
        self.assertEqual(payload["handle"], "profileuser")
        self.assertEqual(payload["publicRef"], user_public_ref(self.user))
        self.assertEqual(payload["email"], "profile@example.com")
        self.assertIn("avatarCrop", payload)

    def test_profile_update_name_and_bio(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.patch(
            "/api/profile/",
            data="{\"name\":\"Same Name ###\",\"bio\":\"<b>Hello</b> <script>alert(1)</script>\"}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.name, "Same Name ###")
        self.assertEqual(self.user.profile.bio, "Hello alert(1)")

    def test_profile_handle_update_accepts_and_rejects_duplicate(self):
        self.client.force_login(self.user)
        csrf = self._csrf()

        ok = self.client.patch(
            "/api/profile/handle/",
            data="{\"username\":\"newhandle\"}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["user"]["handle"], "newhandle")

        csrf = self._csrf()
        conflict = self.client.patch(
            "/api/profile/handle/",
            data="{\"username\":\"otheruser\"}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(conflict.status_code, 409)
        self.assertIn("username", conflict.json().get("errors", {}))

    def test_profile_handle_update_rejects_invalid_format(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.patch(
            "/api/profile/handle/",
            data="{\"username\":\"invalid name\"}",
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertEqual(payload.get("code"), "invalid_username")
        self.assertIn("username", payload.get("errors", {}))

    def test_public_resolve_user_hides_email(self):
        response = self.client.get("/api/public/resolve/@profileuser/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["ownerType"], "user")
        self.assertEqual(payload["publicRef"], user_public_ref(self.user))
        self.assertEqual(payload["user"]["email"], "")

    @override_settings(DEBUG=True)
    def test_signed_media_endpoint_allows_valid_and_rejects_invalid_requests(self):
        self.user.profile.image = self._image_upload()
        self.user.profile.save(update_fields=["image"])

        media_path = self.user.profile.image.name
        expires_at = int(time.time()) + 300
        signed_url = utils._signed_media_url_path(media_path, expires_at=expires_at)
        self.assertIsNotNone(signed_url)
        if signed_url is None:
            self.fail("Expected signed media url")
        self._assert_signed_profile_image(signed_url)

        valid_response = self.client.get(signed_url)
        self.assertEqual(valid_response.status_code, 200)

        parsed = urlparse(signed_url)
        query = parse_qs(parsed.query)
        tampered = f"{parsed.path}?exp={query['exp'][0]}&sig=bad"
        self.assertEqual(self.client.get(tampered).status_code, 403)

        expired_url = utils._signed_media_url_path(media_path, expires_at=1)
        self.assertIsNotNone(expired_url)
        if expired_url is None:
            self.fail("Expected signed media url")
        self.assertEqual(self.client.get(expired_url).status_code, 403)

    @override_settings(DEBUG=True)
    def test_signed_media_endpoint_accepts_double_encoded_path_for_legacy_clients(self):
        self.user.profile.image = self._image_upload()
        self.user.profile.save(update_fields=["image"])

        media_path = self.user.profile.image.name
        signed_url = utils._signed_media_url_path(media_path, expires_at=int(time.time()) + 300)
        self.assertIsNotNone(signed_url)
        if signed_url is None:
            self.fail("Expected signed media url")

        parsed = urlparse(signed_url)
        encoded_path = parsed.path.removeprefix("/api/auth/media/")
        double_encoded_path = quote(encoded_path, safe="/")
        legacy_url = f"/api/auth/media/{double_encoded_path}?{parsed.query}"

        valid_response = self.client.get(legacy_url)
        self.assertEqual(valid_response.status_code, 200)

    def test_profile_update_rejects_oversized_image(self):
        api_client = APIClient()
        api_client.force_authenticate(user=self.user)
        response = api_client.patch(
            "/api/profile/",
            {"image": self._image_upload(size=(MAX_PROFILE_IMAGE_SIDE + 1, 50))},
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.json().get("errors", {}))


class AttachmentMediaAccessTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = auth_service.register_user(
            login="media_owner_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Media Owner",
            username="mediaowner",
            email="mediaowner@example.com",
        )
        self.peer = auth_service.register_user(
            login="media_peer_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Media Peer",
            username="mediapeer",
            email="mediapeer@example.com",
        )
        self.outsider = auth_service.register_user(
            login="media_outsider_login",
            password="pass12345",
            password_confirm="pass12345",
            name="Media Outsider",
            username="mediaoutsider",
            email="mediaoutsider@example.com",
        )
        self.direct_room = Room.objects.create(
            slug="media_room_direct_01",
            name="media direct",
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
            message_content="attachment message",
        )
        return MessageAttachment.objects.create(
            message=message,
            file=SimpleUploadedFile("doc.txt", b"hello", content_type="text/plain"),
            original_filename="doc.txt",
            content_type="text/plain",
            file_size=5,
            thumbnail=SimpleUploadedFile("thumb.txt", b"thumb", content_type="text/plain"),
        )

    def _attachment_with_custom_file(
        self,
        room: Room,
        *,
        author,
        file_name: str,
        file_content_type: str,
        file_payload: bytes,
        thumbnail_name: str | None = None,
        thumbnail_content_type: str = "application/octet-stream",
        thumbnail_payload: bytes = b"thumb",
    ) -> MessageAttachment:
        message = Message.objects.create(
            username=author.username,
            user=author,
            room=room,
            message_content="custom attachment message",
        )
        return MessageAttachment.objects.create(
            message=message,
            file=SimpleUploadedFile(file_name, file_payload, content_type=file_content_type),
            original_filename=file_name,
            content_type=file_content_type,
            file_size=len(file_payload),
            thumbnail=(
                SimpleUploadedFile(
                    thumbnail_name,
                    thumbnail_payload,
                    content_type=thumbnail_content_type,
                )
                if thumbnail_name
                else None
            ),
        )

    def _svg_attachment_for_room(self, room: Room, *, author) -> MessageAttachment:
        message = Message.objects.create(
            username=author.username,
            user=author,
            room=room,
            message_content="svg attachment message",
        )
        svg_payload = (
            b"<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>"
            b"<rect width='20' height='20' fill='red'/>"
            b"</svg>"
        )
        return MessageAttachment.objects.create(
            message=message,
            file=SimpleUploadedFile("pizza.svg", svg_payload, content_type="text/plain"),
            original_filename="pizza.svg",
            content_type="text/plain",
            file_size=len(svg_payload),
        )

    @staticmethod
    def _png_payload() -> bytes:
        image = Image.new("RGB", (2, 2), (255, 0, 0))
        buff = io.BytesIO()
        image.save(buff, format="PNG")
        buff.seek(0)
        return buff.read()

    def _attachment_with_png_thumbnail_for_room(self, room: Room, *, author) -> MessageAttachment:
        message = Message.objects.create(
            username=author.username,
            user=author,
            room=room,
            message_content="png thumbnail attachment message",
        )
        return MessageAttachment.objects.create(
            message=message,
            file=SimpleUploadedFile("doc.txt", b"hello", content_type="text/plain"),
            original_filename="doc.txt",
            content_type="text/plain",
            file_size=5,
            thumbnail=SimpleUploadedFile(
                "thumb.png",
                self._png_payload(),
                content_type="application/octet-stream",
            ),
        )

    def test_attachment_media_view_returns_200_for_room_participant(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        self.client.force_login(self.owner)

        file_response = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )
        thumb_response = self.client.get(
            f"/api/auth/media/{attachment.thumbnail.name}?roomId={self.direct_room.pk}",
        )

        self.assertEqual(file_response.status_code, 200)
        self.assertEqual(thumb_response.status_code, 200)
        file_response.close()
        thumb_response.close()

    def test_attachment_media_view_returns_200_for_non_owner_direct_participant(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        self.client.force_login(self.peer)

        response = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )

        self.assertEqual(response.status_code, 200)
        response.close()

    def test_attachment_media_view_returns_404_for_invalid_access_context(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)

        unauthenticated = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )
        self.assertEqual(unauthenticated.status_code, 404)

        self.client.force_login(self.outsider)
        outsider = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )
        self.assertEqual(outsider.status_code, 404)

        missing_room = self.client.get(f"/api/auth/media/{attachment.file.name}")
        self.assertEqual(missing_room.status_code, 404)

        wrong_room = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk + 999}",
        )
        self.assertEqual(wrong_room.status_code, 404)

        signed_query = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}&exp=1&sig=abc",
        )
        self.assertEqual(signed_query.status_code, 404)

    def test_attachment_media_view_returns_404_when_path_or_message_context_is_invalid(self):
        attachment = self._attachment_for_room(self.direct_room, author=self.owner)
        self.client.force_login(self.owner)

        other_room = Room.objects.create(
            slug="media_room_private_02",
            name="media private",
            kind=Room.Kind.PRIVATE,
            created_by=self.owner,
        )
        ensure_membership(other_room, self.owner)
        foreign_attachment = self._attachment_for_room(other_room, author=self.owner)

        wrong_path = self.client.get(
            f"/api/auth/media/{foreign_attachment.file.name}?roomId={self.direct_room.pk}",
        )
        self.assertEqual(wrong_path.status_code, 404)

        attachment.message.is_deleted = True
        attachment.message.save(update_fields=["is_deleted"])
        deleted_message = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )
        self.assertEqual(deleted_message.status_code, 404)

    def test_public_room_attachment_access_requires_active_membership(self):
        public_room = Room.objects.create(
            slug="media_room_public_03",
            name="media public",
            kind=Room.Kind.PUBLIC,
            created_by=self.owner,
        )
        attachment = self._attachment_for_room(public_room, author=self.owner)
        self.client.force_login(self.outsider)

        outsider_response = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={public_room.pk}",
        )
        self.assertEqual(outsider_response.status_code, 404)

        ensure_membership(public_room, self.outsider)
        member_response = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={public_room.pk}",
        )
        self.assertEqual(member_response.status_code, 200)
        member_response.close()

    def test_attachment_media_view_serves_svg_with_image_content_type(self):
        attachment = self._svg_attachment_for_room(self.direct_room, author=self.owner)
        self.client.force_login(self.owner)

        response = self.client.get(
            f"/api/auth/media/{attachment.file.name}?roomId={self.direct_room.pk}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Content-Type", "").split(";")[0],
            "image/svg+xml",
        )
        response.close()

    def test_attachment_media_view_serves_png_thumbnail_with_image_content_type(self):
        attachment = self._attachment_with_png_thumbnail_for_room(self.direct_room, author=self.owner)
        self.client.force_login(self.owner)

        response = self.client.get(
            f"/api/auth/media/{attachment.thumbnail.name}?roomId={self.direct_room.pk}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("Content-Type", "").split(";")[0],
            "image/png",
        )
        response.close()

    def test_attachment_media_view_serves_common_thumbnail_image_content_types(self):
        self.client.force_login(self.owner)
        test_cases = [
            ("thumb.png", "application/octet-stream", b"\x89PNG\r\n\x1a\n", "image/png"),
            ("thumb.jpg", "text/plain", b"\xff\xd8\xff\xe0", "image/jpeg"),
            ("thumb.gif", "application/octet-stream", b"GIF89a", "image/gif"),
        ]

        for thumbnail_name, thumbnail_content_type, thumbnail_payload, expected_content_type in test_cases:
            with self.subTest(thumbnail=thumbnail_name):
                attachment = self._attachment_with_custom_file(
                    self.direct_room,
                    author=self.owner,
                    file_name="doc.txt",
                    file_content_type="text/plain",
                    file_payload=b"hello",
                    thumbnail_name=thumbnail_name,
                    thumbnail_content_type=thumbnail_content_type,
                    thumbnail_payload=thumbnail_payload,
                )
                response = self.client.get(
                    f"/api/auth/media/{attachment.thumbnail.name}?roomId={self.direct_room.pk}",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.headers.get("Content-Type", "").split(";")[0],
                    expected_content_type,
                )
                response.close()

    def test_attachment_media_view_denies_unauthorized_for_any_attachment_type(self):
        guest_client = Client()
        outsider_client = Client()
        outsider_client.force_login(self.outsider)
        owner_client = Client()
        owner_client.force_login(self.owner)

        attachment_cases = [
            {
                "file_name": "report.pdf",
                "file_content_type": "application/pdf",
                "file_payload": b"%PDF-1.4",
                "thumbnail_name": None,
            },
            {
                "file_name": "voice.mp3",
                "file_content_type": "audio/mpeg",
                "file_payload": b"ID3",
                "thumbnail_name": None,
            },
            {
                "file_name": "clip.mp4",
                "file_content_type": "video/mp4",
                "file_payload": b"....ftyp",
                "thumbnail_name": None,
            },
            {
                "file_name": "image.png",
                "file_content_type": "image/png",
                "file_payload": b"\x89PNG\r\n\x1a\n",
                "thumbnail_name": "thumb.png",
            },
            {
                "file_name": "diagram.svg",
                "file_content_type": "text/plain",
                "file_payload": b"<svg xmlns='http://www.w3.org/2000/svg'></svg>",
                "thumbnail_name": None,
            },
        ]

        for case in attachment_cases:
            with self.subTest(file=case["file_name"]):
                attachment = self._attachment_with_custom_file(
                    self.direct_room,
                    author=self.owner,
                    file_name=case["file_name"],
                    file_content_type=case["file_content_type"],
                    file_payload=case["file_payload"],
                    thumbnail_name=case["thumbnail_name"],
                )
                target_paths = [attachment.file.name]
                if attachment.thumbnail:
                    target_paths.append(attachment.thumbnail.name)

                for target_path in target_paths:
                    with self.subTest(path=target_path):
                        owner_response = owner_client.get(
                            f"/api/auth/media/{target_path}?roomId={self.direct_room.pk}",
                        )
                        self.assertEqual(owner_response.status_code, 200)
                        owner_response.close()

                        guest_response = guest_client.get(
                            f"/api/auth/media/{target_path}?roomId={self.direct_room.pk}",
                        )
                        self.assertEqual(guest_response.status_code, 404)

                        outsider_response = outsider_client.get(
                            f"/api/auth/media/{target_path}?roomId={self.direct_room.pk}",
                        )
                        self.assertEqual(outsider_response.status_code, 404)
