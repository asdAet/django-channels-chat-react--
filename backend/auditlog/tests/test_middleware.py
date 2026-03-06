from django.contrib.auth import get_user_model
from django.test import TestCase

from auditlog.models import AuditEvent

User = get_user_model()


class AuditMiddlewareTests(TestCase):
    def test_request_is_saved_to_audit_events(self):
        user = User.objects.create_user(username="audit_http_user", password="pass12345")
        self.client.force_login(user)

        response = self.client.get("/api/auth/session/")
        self.assertEqual(response.status_code, 200)

        self.assertTrue(
            AuditEvent.objects.filter(
                action="http.request",
                path="/api/auth/session/",
                actor_user_id_snapshot=user.pk,
                status_code=200,
            ).exists()
        )

    def test_health_endpoints_are_skipped(self):
        self.client.get("/api/health/live/")
        self.assertFalse(AuditEvent.objects.filter(path="/api/health/live/").exists())

