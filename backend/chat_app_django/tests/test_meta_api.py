"""Tests for meta endpoints used by the frontend runtime."""

import json

from django.test import TestCase, override_settings

from chat_app_django.visitor_telemetry import normalize_visit_payload


class ClientConfigApiTests(TestCase):
    """Ensures runtime config endpoint exposes backend source-of-truth limits."""

    @override_settings(
        USERNAME_MAX_LENGTH=40,
        CHAT_MESSAGE_MAX_LENGTH=2048,
        CHAT_TARGET_REGEX=r"^[a-z0-9_@-]{1,20}$",
        CHAT_ATTACHMENT_MAX_SIZE_MB=25,
        CHAT_ATTACHMENT_MAX_PER_MESSAGE=17,
        CHAT_ATTACHMENT_ALLOW_ANY_TYPE=False,
        CHAT_ATTACHMENT_ALLOWED_TYPES=["audio/mpeg", "audio/webm"],
        MEDIA_URL_TTL_SECONDS=120,
        GOOGLE_OAUTH_CLIENT_ID="google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="google-client-secret",
    )
    def test_client_config_returns_expected_shape(self):
        response = self.client.get("/api/meta/client-config/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["usernameMaxLength"], 40)
        self.assertEqual(payload["chatMessageMaxLength"], 2048)
        self.assertEqual(payload["chatTargetRegex"], r"^[a-z0-9_@-]{1,20}$")
        self.assertEqual(payload["chatAttachmentMaxSizeMb"], 25)
        self.assertEqual(payload["chatAttachmentMaxPerMessage"], 17)
        self.assertEqual(payload["chatAttachmentAllowedTypes"], ["audio/mpeg", "audio/webm"])
        self.assertEqual(payload["mediaUrlTtlSeconds"], 120)
        self.assertEqual(payload["mediaMode"], "signed_only")
        self.assertEqual(payload["googleOAuthClientId"], "google-client-id")

    @override_settings(
        GOOGLE_OAUTH_CLIENT_ID="google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="",
    )
    def test_client_config_hides_google_oauth_when_server_flow_is_incomplete(self):
        response = self.client.get("/api/meta/client-config/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["googleOAuthClientId"], "")

    @override_settings(
        CHAT_TARGET_REGEX="",
        GOOGLE_OAUTH_CLIENT_ID="google-client-id",
        GOOGLE_OAUTH_CLIENT_SECRET="google-client-secret",
    )
    def test_client_config_falls_back_to_default_chat_target_regex_when_blank(self):
        response = self.client.get("/api/meta/client-config/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["chatTargetRegex"], r"^[A-Za-z0-9_@-]{1,60}$")
        self.assertEqual(payload["googleOAuthClientId"], "google-client-id")


class SiteVisitApiTests(TestCase):
    """Проверяет публичный telemetry-endpoint для visitor-событий."""

    def test_site_visit_writes_structured_audit_event(self):
        payload = {
            "visitorId": "visitor-12345678",
            "pagePath": "/",
            "pageTitle": "Devil",
            "referrer": "https://slowed.sbs/login",
            "viewportWidth": 393,
            "viewportHeight": 852,
            "isMobileViewport": True,
            "hasTouch": True,
            "isTouchDesktop": False,
            "canHover": False,
            "primaryPointer": "coarse",
            "platform": "Linux armv8l",
            "language": "ru-RU",
            "timeZone": "Asia/Yekaterinburg",
        }

        with self.assertLogs("security.audit", level="INFO") as captured:
            response = self.client.post(
                "/api/meta/visit/",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_USER_AGENT=(
                    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/AP2A.240905.003) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36"
                ),
                REMOTE_ADDR="198.51.100.17",
            )

        self.assertEqual(response.status_code, 204)
        record = next(
            json.loads(entry.getMessage())
            for entry in captured.records
            if json.loads(entry.getMessage()).get("event") == "site.visit"
        )
        self.assertEqual(record["event"], "site.visit")
        self.assertEqual(record["ip"], "198.51.100.17")
        self.assertEqual(record["visitor_id"], "visitor-12345678")
        self.assertEqual(record["visitor_alias"], "12345678")
        self.assertEqual(record["page_path"], "/")
        self.assertEqual(record["device_class"], "mobile")
        self.assertEqual(record["device_label"], "Pixel 8 Pro")
        self.assertEqual(record["browser_family"], "Chrome")
        self.assertEqual(record["os_family"], "Android")
        self.assertEqual(record["telemetry_source"], "site_visit")

    def test_site_visit_rejects_invalid_payload(self):
        response = self.client.post(
            "/api/meta/visit/",
            data=json.dumps({"pagePath": "/"}),
            content_type="application/json",
            REMOTE_ADDR="198.51.100.17",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"error": "Некорректные данные visitor telemetry"},
        )


class VisitorTelemetryNormalizationTests(TestCase):
    """Проверяет нормализацию модели устройства для visitor telemetry."""

    def test_normalize_visit_payload_ignores_firefox_revision_token(self):
        payload = {
            "visitorId": "visitor-firefox-12345678",
            "pagePath": "/",
            "pageTitle": "Devil",
            "referrer": "https://slowed.sbs/",
            "viewportWidth": 1536,
            "viewportHeight": 864,
            "isMobileViewport": False,
            "hasTouch": False,
            "isTouchDesktop": False,
            "canHover": True,
            "primaryPointer": "fine",
            "platform": "rv:149.0",
            "language": "ru-RU",
            "timeZone": "Asia/Yekaterinburg",
        }

        result = normalize_visit_payload(
            payload,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) "
                "Gecko/20100101 Firefox/149.0"
            ),
        )

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["browser_family"], "Firefox")
        self.assertEqual(result["os_family"], "Windows")
        self.assertEqual(result["device_class"], "desktop")
        self.assertEqual(result["device_label"], "Windows PC")
        self.assertEqual(result["platform"], "Windows PC")
