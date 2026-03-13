import json

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from auditlog.models import AuditEvent

User = get_user_model()


class AuditAdminExportTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="audit_admin",
            password="pass12345",
            is_staff=True,
            is_superuser=True,
        )
        self.member = User.objects.create_user(
            username="audit_member_regular",
            password="pass12345",
            is_staff=False,
        )
        self.actor = User.objects.create_user(username="audit_actor", password="pass12345")
        self.export_url = reverse("admin:auditlog_auditevent_export")

        AuditEvent.objects.create(
            action="auth.login.success",
            protocol="http",
            actor_user=self.actor,
            actor_user_id_snapshot=self.actor.pk,
            actor_username_snapshot=self.actor.username,
            is_authenticated=True,
            method="POST",
            path="/api/auth/login/",
            status_code=200,
            success=True,
            request_id="req-ok-1",
            metadata={"room_slug": "public"},
        )
        AuditEvent.objects.create(
            action="chat.message.forbidden",
            protocol="http",
            actor_user=self.actor,
            actor_user_id_snapshot=self.actor.pk,
            actor_username_snapshot=self.actor.username,
            is_authenticated=True,
            method="POST",
            path="/api/chat/rooms/private/messages/",
            status_code=403,
            success=False,
            request_id="req-forbidden-1",
            metadata={"room_slug": "private123"},
        )

    def test_staff_can_export_filtered_json(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {"format": "json", "action": "auth.login.success"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("application/json", response["Content-Type"])
        payload = json.loads(response.content.decode("utf-8"))
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["action"], "auth.login.success")
        self.assertEqual(payload[0]["statusCode"], 200)

    def test_staff_can_export_csv_by_status_family_filter(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {"format": "csv", "status_family": "4xx"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response["Content-Type"])
        body = response.content.decode("utf-8")
        self.assertIn("chat.message.forbidden", body)
        self.assertNotIn("auth.login.success", body)

    def test_non_staff_cannot_export(self):
        self.client.force_login(self.member)
        response = self.client.get(self.export_url, {"format": "json"})
        self.assertIn(response.status_code, {302, 403})
