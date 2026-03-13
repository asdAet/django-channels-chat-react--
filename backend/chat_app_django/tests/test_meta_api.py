"""Tests for frontend runtime client-config endpoint."""

from django.test import TestCase, override_settings


class ClientConfigApiTests(TestCase):
    """Ensures runtime config endpoint exposes backend source-of-truth limits."""

    @override_settings(
        USERNAME_MAX_LENGTH=40,
        CHAT_MESSAGE_MAX_LENGTH=2048,
        CHAT_ROOM_SLUG_REGEX=r"^[a-z0-9-]{3,20}$",
        CHAT_ATTACHMENT_MAX_SIZE_MB=25,
        CHAT_ATTACHMENT_MAX_PER_MESSAGE=7,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["audio/mpeg", "audio/webm"],
        MEDIA_URL_TTL_SECONDS=120,
        GOOGLE_OAUTH_CLIENT_ID="google-client-id",
    )
    def test_client_config_returns_expected_shape(self):
        response = self.client.get("/api/meta/client-config/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["usernameMaxLength"], 40)
        self.assertEqual(payload["chatMessageMaxLength"], 2048)
        self.assertEqual(payload["chatRoomSlugRegex"], r"^[a-z0-9-]{3,20}$")
        self.assertEqual(payload["chatAttachmentMaxSizeMb"], 25)
        self.assertEqual(payload["chatAttachmentMaxPerMessage"], 7)
        self.assertEqual(payload["chatAttachmentAllowedTypes"], ["audio/mpeg", "audio/webm"])
        self.assertEqual(payload["mediaUrlTtlSeconds"], 120)
        self.assertEqual(payload["mediaMode"], "signed_only")
        self.assertEqual(payload["googleOAuthClientId"], "google-client-id")
