"""Tests for thumbnail generation guards."""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings

from messages.thumbnail import generate_thumbnail


class _FakeImage:
    def __init__(self, size: tuple[int, int]):
        self.size = size
        self.mode = "RGB"

    def verify(self):
        return None


class ThumbnailGenerationTests(SimpleTestCase):
    @override_settings(CHAT_THUMBNAIL_MAX_SOURCE_SIZE_MB=1)
    def test_skips_large_source_file_before_opening_image(self):
        source = SimpleUploadedFile(
            "large.png",
            b"x" * (2 * 1024 * 1024),
            content_type="image/png",
        )

        from PIL import Image

        with patch.object(Image, "open") as open_mock:
            result = generate_thumbnail(source)

        self.assertIsNone(result)
        open_mock.assert_not_called()

    @override_settings(CHAT_THUMBNAIL_MAX_SOURCE_PIXELS=10_000)
    def test_skips_images_with_too_many_pixels(self):
        source = SimpleUploadedFile(
            "wide.png",
            b"stub",
            content_type="image/png",
        )

        from PIL import Image

        with patch.object(
            Image,
            "open",
            side_effect=[_FakeImage((200, 200)), _FakeImage((200, 200))],
        ):
            result = generate_thumbnail(source)

        self.assertIsNone(result)
