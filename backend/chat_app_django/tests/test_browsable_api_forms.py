"""Tests for Browsable API HTML forms used in manual testing."""

from django.contrib.auth import get_user_model
from django.test import TestCase


User = get_user_model()


class BrowsableApiFormsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="browsable_user", password="pass12345")
        self.peer = User.objects.create_user(username="browsable_peer", password="pass12345")

    def _get_html(self, path: str) -> str:
        response = self.client.get(path, HTTP_ACCEPT="text/html")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        return response.content.decode("utf-8", errors="ignore")

    def test_login_form_shows_username_and_password_fields(self):
        html = self._get_html("/api/auth/login/")
        self.assertIn('name="username"', html)
        self.assertIn('name="password"', html)

    def test_register_form_shows_expected_fields(self):
        html = self._get_html("/api/auth/register/")
        self.assertIn('name="username"', html)
        self.assertIn('name="password1"', html)
        self.assertIn('name="password2"', html)

    def test_direct_start_form_shows_username_for_authenticated_user(self):
        self.client.force_login(self.user)
        html = self._get_html("/api/chat/direct/start/")
        self.assertIn('name="username"', html)

    def test_profile_form_shows_profile_update_fields_for_authenticated_user(self):
        self.client.force_login(self.user)
        html = self._get_html("/api/auth/profile/")
        self.assertIn('name="username"', html)
        self.assertIn('name="email"', html)
        self.assertIn('name="bio"', html)
        self.assertIn('name="image"', html)
        self.assertIn('name="avatarCropX"', html)
        self.assertIn('name="avatarCropY"', html)
        self.assertIn('name="avatarCropWidth"', html)
        self.assertIn('name="avatarCropHeight"', html)
