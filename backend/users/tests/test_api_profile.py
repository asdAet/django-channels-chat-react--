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
