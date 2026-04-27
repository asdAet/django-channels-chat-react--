# pyright: reportAttributeAccessIssue=false
"""Tests for users.models."""

from __future__ import annotations

import io
import shutil
from pathlib import Path

from PIL import Image
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from users.models import MAX_PROFILE_IMAGE_SIDE

User = get_user_model()


class ProfileModelTests(TestCase):
    def test_str_representation_contains_username(self):
        user = User.objects.create_user(username="model_user", password="pass12345")
        self.assertIn("model_user", str(user.profile))

    def test_save_strips_html_from_bio(self):
        user = User.objects.create_user(username="bio_model_user", password="pass12345")
        profile = user.profile
        profile.bio = "<b>Hello</b> <script>alert(1)</script>"
        profile.save()
        profile.refresh_from_db()
        self.assertEqual(profile.bio, "Hello alert(1)")


class ProfileImageProcessingTests(TestCase):
    def setUp(self):
        media_parent = Path(settings.BASE_DIR).parent / ".tmp_test_media"
        self.temp_media_path = media_parent / "profile_models_media"
        shutil.rmtree(self.temp_media_path, ignore_errors=True)
        (self.temp_media_path / "profile_pics").mkdir(parents=True, exist_ok=True)
        self.override_media = override_settings(MEDIA_ROOT=str(self.temp_media_path))
        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        shutil.rmtree(self.temp_media_path, ignore_errors=True)

    @staticmethod
    def _make_rgba_upload_with_jpg_name() -> SimpleUploadedFile:
        image = Image.new("RGBA", (800, 600), (255, 0, 0, 120))
        buff = io.BytesIO()
        image.save(buff, format="PNG")
        buff.seek(0)
        return SimpleUploadedFile("avatar.jpg", buff.getvalue(), content_type="image/png")

    @staticmethod
    def _png_bytes(color) -> bytes:
        image = Image.new("RGB", (16, 16), color)
        buff = io.BytesIO()
        image.save(buff, format="PNG")
        return buff.getvalue()

    @staticmethod
    def _png_upload(size) -> SimpleUploadedFile:
        image = Image.new("RGB", size, (128, 64, 32))
        buff = io.BytesIO()
        image.save(buff, format="PNG")
        buff.seek(0)
        return SimpleUploadedFile("large.png", buff.read(), content_type="image/png")

    @staticmethod
    def _svg_upload() -> SimpleUploadedFile:
        payload = (
            b"<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'>"
            b"<rect width='20' height='20' fill='red'/></svg>"
        )
        return SimpleUploadedFile("avatar.svg", payload, content_type="image/svg+xml")

    def test_profile_save_handles_rgba_source_without_crash(self):
        user = User.objects.create_user(username="imguser", password="pass12345")
        profile = user.profile
        profile.image = self._make_rgba_upload_with_jpg_name()

        profile.save()
        profile.refresh_from_db()

        with Image.open(profile.image.path) as saved:
            self.assertEqual(saved.width, 800)
            self.assertEqual(saved.height, 600)
            self.assertEqual(saved.mode, "RGBA")

    def test_replacing_avatar_deletes_previous_file(self):
        user = User.objects.create_user(username="replace_user", password="pass12345")
        profile = user.profile

        first = SimpleUploadedFile("first.png", self._png_bytes((255, 0, 0)), content_type="image/png")
        second = SimpleUploadedFile("second.png", self._png_bytes((0, 255, 0)), content_type="image/png")

        profile.image = first
        profile.save()
        first_name = profile.image.name

        profile.image = second
        profile.save()
        second_name = profile.image.name

        self.assertNotEqual(first_name, second_name)

    def test_large_avatar_is_resized_to_safe_limit(self):
        user = User.objects.create_user(username="resize_user", password="pass12345")
        profile = user.profile
        profile.image = self._png_upload((MAX_PROFILE_IMAGE_SIDE + 500, 800))
        profile.save()
        profile.refresh_from_db()

        with Image.open(profile.image.path) as saved:
            self.assertLessEqual(saved.width, MAX_PROFILE_IMAGE_SIDE)
            self.assertLessEqual(saved.height, MAX_PROFILE_IMAGE_SIDE)

    def test_svg_avatar_is_saved_without_raster_processing(self):
        user = User.objects.create_user(username="svg_model_user", password="pass12345")
        profile = user.profile
        profile.image = self._svg_upload()
        profile.save()
        first_saved_name = profile.image.name

        profile.bio = "updated"
        profile.save(update_fields=["bio"])
        profile.refresh_from_db()

        self.assertEqual(profile.image.name, first_saved_name)
        self.assertTrue(profile.image.name.endswith(".svg"))
