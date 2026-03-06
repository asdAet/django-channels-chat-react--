"""Tests for API index and interactive renderer configuration."""

from django.test import TestCase

from chat_app_django import settings as app_settings


class ApiIndexTests(TestCase):
    def test_api_index_returns_links_map(self):
        response = self.client.get("/api/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertIn("endpoints", payload)
        self.assertIn("templates", payload)
        self.assertIn("auth", payload["endpoints"])
        self.assertIn("session", payload["endpoints"]["auth"])
        self.assertIn("/api/auth/session/", payload["endpoints"]["auth"]["session"])
        self.assertIn("sessionAuth", payload["endpoints"])
        self.assertIn("/api-auth/login/", payload["endpoints"]["sessionAuth"]["login"])
        self.assertIn("/api-auth/logout/", payload["endpoints"]["sessionAuth"]["logout"])

    def test_api_index_is_browsable_in_debug(self):
        response = self.client.get("/api/", HTTP_ACCEPT="text/html")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response["Content-Type"])
        content = response.content.decode("utf-8", errors="ignore")
        self.assertIn("/api/auth/session/", content)
        self.assertIn("/api/chat/public-room/", content)
        self.assertIn("/api-auth/login/", content)


class RendererSettingsTests(TestCase):
    def test_build_rest_renderer_classes_debug_true(self):
        classes = app_settings.build_rest_renderer_classes(True)
        self.assertEqual(classes[0], "rest_framework.renderers.JSONRenderer")
        self.assertIn("rest_framework.renderers.BrowsableAPIRenderer", classes)

    def test_build_rest_renderer_classes_debug_false(self):
        classes = app_settings.build_rest_renderer_classes(False)
        self.assertEqual(classes, ["rest_framework.renderers.JSONRenderer"])
