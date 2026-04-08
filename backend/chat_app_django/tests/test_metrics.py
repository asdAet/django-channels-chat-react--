"""Tests for Prometheus application metrics and observability config."""

from __future__ import annotations

import json
import shutil
import time
from contextlib import AbstractContextManager
from pathlib import Path
from typing import Any, cast
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from chat_app_django import metrics
from messages.models import Message, MessageAttachment
from presence.constants import PRESENCE_CACHE_KEY_AUTH, PRESENCE_CACHE_KEY_GUEST
from rooms.models import Room
from users.application import auth_service

User = get_user_model()


def _capture_on_commit_callbacks(test_case: TestCase, *, execute: bool) -> AbstractContextManager[list[object]]:
    callback_capture = cast(Any, test_case).captureOnCommitCallbacks
    return cast(AbstractContextManager[list[object]], callback_capture(execute=execute))


def _sample_value(metric, sample_name: str, labels: dict[str, str]) -> float:
    for collected in metric.collect():
        for sample in collected.samples:
            if sample.name != sample_name:
                continue
            if all(sample.labels.get(key) == value for key, value in labels.items()):
                return float(sample.value)
    return 0.0


class _MockResponse:
    def __init__(self, status_code: int, payload: dict[str, object]):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class HttpMetricsTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_http_metrics_endpoint_exposes_metrics_and_skips_self(self):
        request_count_before = _sample_value(
            metrics.HTTP_REQUESTS_TOTAL,
            "devils_http_requests_total",
            {
                "method": "GET",
                "route": "/api/",
                "status_code": "200",
                "status_class": "2xx",
            },
        )
        latency_count_before = _sample_value(
            metrics.HTTP_REQUEST_DURATION_SECONDS,
            "devils_http_request_duration_seconds_count",
            {
                "method": "GET",
                "route": "/api/",
                "status_class": "2xx",
            },
        )

        response = cast(Any, self.client.get("/api/"))
        self.assertEqual(response.status_code, 200)

        request_count_after = _sample_value(
            metrics.HTTP_REQUESTS_TOTAL,
            "devils_http_requests_total",
            {
                "method": "GET",
                "route": "/api/",
                "status_code": "200",
                "status_class": "2xx",
            },
        )
        latency_count_after = _sample_value(
            metrics.HTTP_REQUEST_DURATION_SECONDS,
            "devils_http_request_duration_seconds_count",
            {
                "method": "GET",
                "route": "/api/",
                "status_class": "2xx",
            },
        )

        self.assertEqual(request_count_after, request_count_before + 1)
        self.assertEqual(latency_count_after, latency_count_before + 1)
        self.assertEqual(
            _sample_value(metrics.HTTP_INFLIGHT_REQUESTS, "devils_http_inflight_requests", {}),
            0.0,
        )

        metrics_response = cast(Any, self.client.get("/metrics/"))
        self.assertEqual(metrics_response.status_code, 200)
        metrics_body = metrics_response.content.decode("utf-8")
        self.assertIn("devils_http_requests_total", metrics_body)
        self.assertIn("devils_site_online_users", metrics_body)

        metrics_route_count = _sample_value(
            metrics.HTTP_REQUESTS_TOTAL,
            "devils_http_requests_total",
            {
                "method": "GET",
                "route": "/metrics/",
                "status_code": "200",
                "status_class": "2xx",
            },
        )
        self.assertEqual(metrics_route_count, 0.0)

    def test_site_online_users_metric_reads_presence_state(self):
        now = time.time()
        cache.set(
            PRESENCE_CACHE_KEY_AUTH,
            {
                "@online-user": {
                    "count": 1,
                    "last_seen": now,
                    "grace_until": 0,
                },
                "@expired-user": {
                    "count": 0,
                    "last_seen": now - 999,
                    "grace_until": now - 100,
                },
            },
            timeout=60,
        )
        cache.set(
            PRESENCE_CACHE_KEY_GUEST,
            {
                "guest-1": {
                    "count": 1,
                    "last_seen": now,
                    "grace_until": 0,
                }
            },
            timeout=60,
        )

        self.assertEqual(
            _sample_value(
                metrics.SITE_ONLINE_USERS,
                "devils_site_online_users",
                {"kind": "authenticated"},
            ),
            1.0,
        )
        self.assertEqual(
            _sample_value(
                metrics.SITE_ONLINE_USERS,
                "devils_site_online_users",
                {"kind": "guest"},
            ),
            1.0,
        )


@override_settings(GOOGLE_OAUTH_CLIENT_ID="client-id")
class BusinessMetricsTests(TestCase):
    def setUp(self):
        cache.clear()
        media_parent = Path(settings.BASE_DIR).parent / ".tmp_test_media"
        self.temp_media_path = media_parent / "metrics_media"
        shutil.rmtree(self.temp_media_path, ignore_errors=True)
        self.temp_media_path.mkdir(parents=True, exist_ok=True)
        self.override_media = override_settings(MEDIA_ROOT=str(self.temp_media_path))
        self.override_media.enable()

    def tearDown(self):
        self.override_media.disable()
        shutil.rmtree(self.temp_media_path, ignore_errors=True)

    def test_account_creation_counters_increment_for_password_and_google(self):
        password_before = _sample_value(
            metrics.ACCOUNTS_CREATED_TOTAL,
            "devils_accounts_created_total",
            {"source": "password"},
        )
        google_before = _sample_value(
            metrics.ACCOUNTS_CREATED_TOTAL,
            "devils_accounts_created_total",
            {"source": "google"},
        )

        with _capture_on_commit_callbacks(self, execute=True):
            auth_service.register_user(
                login="metrics_login",
                password="pass12345",
                password_confirm="pass12345",
                name="Metrics Password User",
                username="metricspassword",
                email="metrics-password@example.com",
            )

        with patch(
            "users.application.auth_service.requests.get",
            return_value=_MockResponse(
                200,
                {
                    "iss": "https://accounts.google.com",
                    "aud": "client-id",
                    "exp": str(int(time.time()) + 3600),
                    "email_verified": "true",
                    "sub": "metrics-sub-1",
                    "email": "metrics-google@example.com",
                    "name": "Metrics Google User",
                },
            ),
        ):
            with _capture_on_commit_callbacks(self, execute=True):
                auth_service.authenticate_or_signup_with_google(
                    id_token="metrics-token",
                    username="metricsgoogle",
                )

        password_after = _sample_value(
            metrics.ACCOUNTS_CREATED_TOTAL,
            "devils_accounts_created_total",
            {"source": "password"},
        )
        google_after = _sample_value(
            metrics.ACCOUNTS_CREATED_TOTAL,
            "devils_accounts_created_total",
            {"source": "google"},
        )

        self.assertEqual(password_after, password_before + 1)
        self.assertEqual(google_after, google_before + 1)

    def test_message_and_attachment_metrics_increment_after_commit(self):
        user = User.objects.create_user(username="metrics_sender", password="pass12345")
        room = Room.objects.create(name="metrics-room", kind=Room.Kind.PUBLIC, created_by=user)

        message_count_before = _sample_value(
            metrics.CHAT_MESSAGES_CREATED_TOTAL,
            "devils_chat_messages_created_total",
            {"room_kind": "public"},
        )
        message_bytes_before = _sample_value(
            metrics.CHAT_MESSAGE_BYTES_TOTAL,
            "devils_chat_message_bytes_total",
            {"room_kind": "public"},
        )
        attachment_count_before = _sample_value(
            metrics.CHAT_ATTACHMENTS_CREATED_TOTAL,
            "devils_chat_attachments_created_total",
            {"content_group": "image"},
        )
        attachment_bytes_before = _sample_value(
            metrics.CHAT_ATTACHMENTS_BYTES_TOTAL,
            "devils_chat_attachments_bytes_total",
            {"content_group": "image"},
        )

        with _capture_on_commit_callbacks(self, execute=True):
            message = Message.objects.create(
                username=user.username,
                user=user,
                room=room,
                message_content="metrics hello",
            )

        with _capture_on_commit_callbacks(self, execute=True):
            MessageAttachment.objects.create(
                message=message,
                file=SimpleUploadedFile("metrics.png", b"12345", content_type="image/png"),
                original_filename="metrics.png",
                content_type="image/png",
                file_size=5,
            )

        message_count_after = _sample_value(
            metrics.CHAT_MESSAGES_CREATED_TOTAL,
            "devils_chat_messages_created_total",
            {"room_kind": "public"},
        )
        message_bytes_after = _sample_value(
            metrics.CHAT_MESSAGE_BYTES_TOTAL,
            "devils_chat_message_bytes_total",
            {"room_kind": "public"},
        )
        attachment_count_after = _sample_value(
            metrics.CHAT_ATTACHMENTS_CREATED_TOTAL,
            "devils_chat_attachments_created_total",
            {"content_group": "image"},
        )
        attachment_bytes_after = _sample_value(
            metrics.CHAT_ATTACHMENTS_BYTES_TOTAL,
            "devils_chat_attachments_bytes_total",
            {"content_group": "image"},
        )

        self.assertEqual(message_count_after, message_count_before + 1)
        self.assertEqual(message_bytes_after, message_bytes_before + len("metrics hello".encode("utf-8")))
        self.assertEqual(attachment_count_after, attachment_count_before + 1)
        self.assertEqual(attachment_bytes_after, attachment_bytes_before + 5)


class ObservabilityConfigTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_observability_files_exist_and_keep_expected_targets(self):
        repo_root = Path(settings.BASE_DIR).parent
        prometheus_config = (repo_root / "deploy" / "observability" / "prometheus" / "prometheus.yml").read_text(
            encoding="utf-8"
        )
        loki_config = (repo_root / "deploy" / "observability" / "loki" / "config.yml").read_text(
            encoding="utf-8"
        )
        nginx_config = (repo_root / "deploy" / "nginx.conf").read_text(encoding="utf-8")

        self.assertIn("job_name: backend", prometheus_config)
        self.assertIn("metrics_path: /metrics/", prometheus_config)
        self.assertIn("job_name: blackbox_https", prometheus_config)
        self.assertIn("schema: v13", loki_config)
        self.assertIn("listen 8080;", nginx_config)
        self.assertIn("location = /nginx_status", nginx_config)

    def test_grafana_dashboards_are_valid_json(self):
        repo_root = Path(settings.BASE_DIR).parent
        dashboards_dir = repo_root / "deploy" / "observability" / "grafana" / "dashboards"
        dashboard_paths = sorted(dashboards_dir.glob("*.json"))

        self.assertTrue(dashboard_paths)
        for dashboard_path in dashboard_paths:
            payload = json.loads(dashboard_path.read_text(encoding="utf-8"))
            self.assertTrue(payload.get("title"))
            self.assertTrue(payload.get("uid"))
            self.assertTrue(payload.get("panels"))
