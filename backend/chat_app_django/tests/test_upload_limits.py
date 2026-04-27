"""Tests for upload memory-limit resolution."""

from django.test import SimpleTestCase

from chat_app_django import settings as project_settings


class UploadLimitSettingsTests(SimpleTestCase):
    """Verifies large uploads don't silently move file buffering into RAM."""

    def test_zero_request_limit_keeps_django_gate_disabled(self):
        data_limit, file_limit = project_settings.resolve_upload_memory_limits(0)

        self.assertIsNone(data_limit)
        self.assertEqual(
            file_limit,
            project_settings.DEFAULT_FILE_UPLOAD_MAX_MEMORY_SIZE,
        )

    def test_large_request_limit_does_not_raise_file_memory_buffer_limit(self):
        data_limit, file_limit = project_settings.resolve_upload_memory_limits(4096)

        self.assertEqual(data_limit, 4096 * 1024 * 1024)
        self.assertEqual(
            file_limit,
            project_settings.DEFAULT_FILE_UPLOAD_MAX_MEMORY_SIZE,
        )
