from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from auditlog.models import AuditEvent

User = get_user_model()


class AuditAdminIpSummaryTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="audit_ip_admin",
            password="pass12345",
            is_staff=True,
            is_superuser=True,
        )
        self.member = User.objects.create_user(
            username="audit_ip_member",
            password="pass12345",
            is_staff=False,
        )
        self.actor_one = User.objects.create_user(username="actor_one", password="pass12345")
        self.actor_two = User.objects.create_user(username="actor_two", password="pass12345")
        self.summary_url = reverse("admin:auditlog_auditevent_ip_summary")

        now = timezone.now()
        self.ip_a = "10.10.10.10"
        self.ip_b = "172.16.1.9"

        event_a1 = AuditEvent.objects.create(
            action="auth.login.success",
            actor_user=self.actor_one,
            actor_user_id_snapshot=self.actor_one.pk,
            actor_username_snapshot=self.actor_one.username,
            is_authenticated=True,
            ip=self.ip_a,
            success=True,
        )
        event_a2 = AuditEvent.objects.create(
            action="chat.message.send",
            actor_user=self.actor_two,
            actor_user_id_snapshot=self.actor_two.pk,
            actor_username_snapshot=self.actor_two.username,
            is_authenticated=True,
            ip=self.ip_a,
            success=True,
        )
        event_a3 = AuditEvent.objects.create(
            action="http.request",
            is_authenticated=False,
            ip=self.ip_a,
            success=False,
        )
        event_b1 = AuditEvent.objects.create(
            action="auth.login.success",
            actor_user=self.actor_one,
            actor_user_id_snapshot=self.actor_one.pk,
            actor_username_snapshot=self.actor_one.username,
            is_authenticated=True,
            ip=self.ip_b,
            success=True,
        )
        AuditEvent.objects.create(
            action="healthcheck.ping",
            is_authenticated=False,
            ip="",
            success=True,
        )

        AuditEvent.objects.filter(pk=event_a1.pk).update(created_at=now - timedelta(days=3))
        AuditEvent.objects.filter(pk=event_a2.pk).update(created_at=now - timedelta(days=2))
        AuditEvent.objects.filter(pk=event_a3.pk).update(created_at=now - timedelta(days=1))
        AuditEvent.objects.filter(pk=event_b1.pk).update(created_at=now - timedelta(hours=1))

    def test_staff_can_view_ip_summary(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(self.summary_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.ip_a)
        self.assertContains(response, self.ip_b)

    def test_ip_rows_are_unique_and_include_related_accounts(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(self.summary_url, {"sort": "ip", "direction": "asc"})
        self.assertEqual(response.status_code, 200)
        ip_rows = response.context["ip_rows"]
        self.assertEqual(len(ip_rows), 2)

        row_a = next(row for row in ip_rows if row["ip"] == self.ip_a)
        self.assertEqual(row_a["total_events"], 3)
        self.assertEqual(row_a["account_count"], 2)
        self.assertEqual(row_a["anonymous_events"], 1)
        usernames = {str(account["username"]) for account in row_a["accounts"]}
        self.assertIn(self.actor_one.username, usernames)
        self.assertIn(self.actor_two.username, usernames)

    def test_staff_can_sort_and_filter_ip_summary(self):
        self.client.force_login(self.admin_user)
        response = self.client.get(
            self.summary_url,
            {
                "sort": "ip",
                "direction": "asc",
                "actor": self.actor_two.username,
            },
        )
        self.assertEqual(response.status_code, 200)
        ip_rows = response.context["ip_rows"]
        self.assertEqual(len(ip_rows), 1)
        self.assertEqual(ip_rows[0]["ip"], self.ip_a)

    def test_non_staff_cannot_view_ip_summary(self):
        self.client.force_login(self.member)
        response = self.client.get(self.summary_url)
        self.assertIn(response.status_code, {302, 403})
