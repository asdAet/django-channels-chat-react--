"""Edge and helper tests for users API."""

from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import patch

from django.core.cache import cache
from django.db import OperationalError
from django.http.request import RawPostDataException
from django.test import Client, RequestFactory, SimpleTestCase, TestCase

from chat_app_django.http_utils import parse_request_payload
from users import api
from users.application import auth_service
from users.application.errors import IdentityServiceError
from users.identity import ensure_profile


class _BodyRaisesRequest:
    META = {"CONTENT_TYPE": "application/json"}

    def __init__(self, post=None):
        self.POST = post or {}

    @property
    def body(self):
        raise RawPostDataException("stream already consumed")


class _InvalidJsonRequest:
    META = {"CONTENT_TYPE": "application/json"}

    def __init__(self, body: bytes, post=None):
        self._body = body
        self.POST = post or {}

    @property
    def body(self):
        return self._body


class UsersApiHelpersTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_parse_body_returns_post_for_form_content_type(self):
        request = SimpleNamespace(
            META={"CONTENT_TYPE": "multipart/form-data"},
            POST={"username": "form-user"},
        )
        self.assertEqual(parse_request_payload(request), {"username": "form-user"})

    def test_parse_body_handles_raw_post_data_exception(self):
        request = _BodyRaisesRequest(post={"username": "fallback"})
        self.assertEqual(parse_request_payload(request), {"username": "fallback"})

    def test_parse_body_invalid_json_falls_back_to_empty_dict(self):
        request = _InvalidJsonRequest(body=b"{bad-json", post={})
        self.assertEqual(parse_request_payload(request), {})

    def test_identity_error_response_returns_code_message_and_errors_fields(self):
        response = api._identity_error_response(
            IdentityServiceError("Validation error", errors={"email": ["Укажите email"]})
        )
        self.assertEqual(response.status_code, 400)
        payload = response.data
        if not isinstance(payload, dict):
            self.fail("Expected response payload to be a dict")
        self.assertEqual(payload["code"], "invalid_request")
        self.assertEqual(payload["message"], "Validation error")
        self.assertEqual(payload["errors"], {"email": ["Укажите email"]})


class AuthApiEdgeTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client(enforce_csrf_checks=True)
        self.user = auth_service.register_user(
            login="auth_edge_user",
            password="pass12345",
            password_confirm="pass12345",
            name="Edge User",
            email="edge@example.com",
        )

    def _csrf(self) -> str:
        response = self.client.get("/api/auth/csrf/")
        return response.cookies["csrftoken"].value

    def test_session_view_for_guest(self):
        response = self.client.get("/api/auth/session/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["authenticated"])

    def test_login_rejects_empty_json_body(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.json()["errors"])

    def test_login_requires_both_identifier_and_password(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/login/",
            data=json.dumps({"identifier": "only-login"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("credentials", response.json()["errors"])

    def test_register_get_returns_method_not_allowed(self):
        response = self.client.get("/api/auth/register/")
        self.assertEqual(response.status_code, 405)

    def test_register_rejects_empty_payload(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps({}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("login", response.json()["errors"])

    def test_register_rejects_missing_login(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "name": "Edge User",
                    "password": "pass12345",
                    "passwordConfirm": "pass12345",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("login", response.json()["errors"])

    def test_register_rejects_missing_password(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps({"login": "edge_login", "name": "Edge User"}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.json()["errors"])

    def test_register_rejects_password_mismatch(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "login": "edge_login",
                    "name": "Edge User",
                    "password": "pass12345",
                    "passwordConfirm": "pass54321",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("passwordConfirm", response.json()["errors"])

    def test_register_returns_conflict_for_duplicate_login(self):
        csrf = self._csrf()
        response = self.client.post(
            "/api/auth/register/",
            data=json.dumps(
                {
                    "login": "auth_edge_user",
                    "name": "Another User",
                    "password": "pass12345",
                    "passwordConfirm": "pass12345",
                }
            ),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 409)
        payload = response.json()
        self.assertIn("errors", payload)
        self.assertIn("login", payload["errors"])

    def test_logout_handles_operational_error_when_updating_last_seen(self):
        self.client.force_login(self.user)
        csrf = self._csrf()

        profile = ensure_profile(self.user)
        with patch.object(type(profile), "save", side_effect=OperationalError):
            response = self.client.post("/api/auth/logout/", HTTP_X_CSRFTOKEN=csrf)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

    def test_public_resolve_not_found(self):
        response = self.client.get("/api/public/resolve/missing-ref/")
        self.assertEqual(response.status_code, 404)


