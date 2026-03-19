import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

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

        self.success_event = AuditEvent.objects.create(
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
        self.forbidden_event = AuditEvent.objects.create(
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

    def test_staff_can_export_by_exact_date(self):
        self.client.force_login(self.admin_user)
        now = timezone.now()
        AuditEvent.objects.filter(pk=self.success_event.pk).update(created_at=now - timedelta(days=1))
        AuditEvent.objects.filter(pk=self.forbidden_event.pk).update(created_at=now)
        self.success_event.refresh_from_db()
        self.forbidden_event.refresh_from_db()

        response = self.client.get(
            self.export_url,
            {"format": "json", "export_date": self.success_event.created_at.date().isoformat()},
        )

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content.decode("utf-8"))
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["id"], self.success_event.pk)

    def test_staff_can_export_by_date_range(self):
        self.client.force_login(self.admin_user)
        now = timezone.now()
        AuditEvent.objects.filter(pk=self.success_event.pk).update(created_at=now - timedelta(days=5))
        AuditEvent.objects.filter(pk=self.forbidden_event.pk).update(created_at=now - timedelta(days=1))
        self.success_event.refresh_from_db()
        self.forbidden_event.refresh_from_db()

        response = self.client.get(
            self.export_url,
            {
                "format": "json",
                "date_from": (now - timedelta(days=2)).date().isoformat(),
                "date_to": now.date().isoformat(),
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content.decode("utf-8"))
        event_ids = {item["id"] for item in payload}
        self.assertIn(self.forbidden_event.pk, event_ids)
        self.assertNotIn(self.success_event.pk, event_ids)

    def test_staff_can_export_only_selected_checkboxes(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {
                "format": "json",
                "selected_only": "1",
                "_selected_action": [str(self.forbidden_event.pk)],
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content.decode("utf-8"))
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["id"], self.forbidden_event.pk)

    def test_selected_only_without_selection_returns_400(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {"format": "json", "selected_only": "1"},
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_export_date_returns_400(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {"format": "json", "export_date": "bad-date"},
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_date_range_returns_400(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {
                "format": "json",
                "date_from": "2026-03-19",
                "date_to": "2026-03-01",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_selected_event_id_returns_400(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.export_url,
            {
                "format": "json",
                "selected_only": "1",
                "_selected_action": ["abc"],
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_non_staff_cannot_export(self):
        self.client.force_login(self.member)
        response = self.client.get(self.export_url, {"format": "json"})
        self.assertIn(response.status_code, {302, 403})
