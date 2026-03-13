# pyright: reportAttributeAccessIssue=false
"""Tests for profile/public-profile/media endpoints."""

from __future__ import annotations

import io
from urllib.parse import parse_qs, quote, urlparse

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.test.utils import override_settings

from chat import utils
from users.models import MAX_PROFILE_IMAGE_SIDE

User = get_user_model()


class ProfileApiTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.user = User.objects.create_user(
            username="profileuser_tech",
            password="pass12345",
            email="profile@example.com",
        )
        self.other = User.objects.create_user(
            username="otheruser_tech",
            password="pass12345",
            email="other@example.com",
        )
        self.user.profile.username = "profileuser"
        self.user.profile.save(update_fields=["username"])
        self.other.profile.username = "otheruser"
        self.other.profile.save(update_fields=["username"])

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
        self.assertEqual(parsed.path.split("/api/auth/media/")[0], "")
        self.assertTrue(parsed.path.startswith("/api/auth/media/"))
        query = parse_qs(parsed.query)
        self.assertIn("exp", query)
        self.assertIn("sig", query)
        media_path = parsed.path.removeprefix("/api/auth/media/")
        self.assertTrue(
            utils.is_valid_media_signature(
                media_path,
                int(query["exp"][0]),
                query["sig"][0],
            )
        )

    def test_profile_requires_auth(self):
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, 401)

    def test_get_profile_authenticated(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["user"]
        self.assertIn("name", payload)
        self.assertEqual(payload["name"], "")
        self.assertEqual(payload["username"], "profileuser")
        self.assertEqual(payload["publicUsername"], "profileuser")
        self.assertEqual(payload["email"], self.user.email)
        self.assertIn("bio", payload)
        self.assertIn("lastSeen", payload)
        self.assertIn("avatarCrop", payload)
        self.assertIsNone(payload["avatarCrop"])

    def test_profile_update_allows_arbitrary_name(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "name": "Same Name ###",
                "username": "profileuser",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.name, "Same Name ###")

    def test_profile_update_allows_same_username(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "updated",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.username, "profileuser")
        self.assertEqual(self.user.profile.bio, "updated")

    def test_profile_update_rejects_duplicate_username(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "otheruser",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("errors", payload)
        self.assertIn("username", payload["errors"])

    def test_profile_update_rejects_long_username(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "a" * 31,
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("errors", payload)
        self.assertIn("username", payload["errors"])

    def test_profile_update_rejects_username_with_invalid_symbols(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "@@@@",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("errors", payload)
        self.assertIn("username", payload["errors"])

    def test_profile_update_accepts_username_length_30(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "c" * 30,
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)

    def test_profile_update_sanitizes_bio(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "<b>Hello</b> <script>alert(1)</script>",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.bio, "Hello alert(1)")

    def test_profile_update_image_upload(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "has image",
                "image": self._image_upload(),
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()["user"]
        self._assert_signed_profile_image(payload["profileImage"])
        self.assertIsNone(payload["avatarCrop"])

    def test_profile_update_image_upload_persists_avatar_crop(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "has cropped image",
                "image": self._image_upload(),
                "avatarCropX": "0.1",
                "avatarCropY": "0.2",
                "avatarCropWidth": "0.3",
                "avatarCropHeight": "0.4",
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.avatar_crop_x, 0.1)
        self.assertEqual(self.user.profile.avatar_crop_y, 0.2)
        self.assertEqual(self.user.profile.avatar_crop_width, 0.3)
        self.assertEqual(self.user.profile.avatar_crop_height, 0.4)
        self.assertEqual(
            response.json()["user"]["avatarCrop"],
            {
                "x": 0.1,
                "y": 0.2,
                "width": 0.3,
                "height": 0.4,
            },
        )

    def test_profile_update_rejects_oversized_image(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "has image",
                "image": self._image_upload(size=(MAX_PROFILE_IMAGE_SIDE + 1, 50)),
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("image", response.json().get("errors", {}))

    @override_settings(DEBUG=True)
    def test_signed_media_endpoint_allows_valid_and_rejects_invalid_requests(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        update = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "has image",
                "image": self._image_upload(),
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(update.status_code, 200)
        signed_url = update.json()["user"]["profileImage"]

        parsed = urlparse(signed_url)
        valid_response = self.client.get(f"{parsed.path}?{parsed.query}")
        self.assertEqual(valid_response.status_code, 200)

        query = parse_qs(parsed.query)
        tampered = f"{parsed.path}?exp={query['exp'][0]}&sig=bad"
        with self.assertLogs("security.audit", level="INFO") as captured:
            self.assertEqual(self.client.get(tampered).status_code, 403)
        self.assertTrue(any("media.signature.invalid" in line for line in captured.output))

        media_path = parsed.path.removeprefix("/api/auth/media/")
        expired_url = utils._signed_media_url_path(media_path, expires_at=1)
        self.assertIsNotNone(expired_url)
        if expired_url is None:
            self.fail("Expected signed media url")
        self.assertEqual(self.client.get(expired_url).status_code, 403)

    @override_settings(DEBUG=True)
    def test_signed_media_endpoint_accepts_double_encoded_path_for_legacy_clients(self):
        self.client.force_login(self.user)
        csrf = self._csrf()
        update = self.client.post(
            "/api/auth/profile/",
            data={
                "username": "profileuser",
                "bio": "has cyrillic image",
                "image": self._image_upload(filename="Цветок.png"),
            },
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(update.status_code, 200)
        signed_url = update.json()["user"]["profileImage"]

        parsed = urlparse(signed_url)
        media_path = parsed.path.removeprefix("/api/auth/media/")
        double_encoded_path = quote(media_path, safe="/")
        legacy_url = f"/api/auth/media/{double_encoded_path}?{parsed.query}"

        valid_response = self.client.get(legacy_url)
        self.assertEqual(valid_response.status_code, 200)

    def test_public_profile_hides_email(self):
        response = self.client.get("/api/auth/users/profileuser/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()["user"]
        self.assertEqual(payload["username"], "profileuser")
        self.assertEqual(payload["email"], "")
        self.assertIn("lastSeen", payload)
        self.assertIn("avatarCrop", payload)
