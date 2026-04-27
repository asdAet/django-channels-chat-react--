from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from auditlog.models import AuditEvent

User = get_user_model()


class AuditSignalsAndCleanupTests(TestCase):
    def test_username_change_creates_audit_event(self):
        user = User.objects.create_user(username="old_name", password="pass12345")
        user.username = "new_name"
        user.save(update_fields=["username"])

        event = (
            AuditEvent.objects.filter(
                action="user.username.changed",
                actor_user_id_snapshot=user.pk,
            )
            .order_by("-id")
            .first()
        )
        self.assertIsNotNone(event)
        assert event is not None
        self.assertEqual(event.metadata.get("old_username"), "old_name")
        self.assertEqual(event.metadata.get("new_username"), "new_name")

    def test_cleanup_command_deletes_old_events(self):
        old_event = AuditEvent.objects.create(
            action="http.request",
            protocol="http",
            success=True,
            metadata={},
        )
        fresh_event = AuditEvent.objects.create(
            action="http.request",
            protocol="http",
            success=True,
            metadata={},
        )
        AuditEvent.objects.filter(id=old_event.pk).update(created_at=timezone.now() - timedelta(days=365))

        call_command("cleanup_audit_events", days=180)

        self.assertFalse(AuditEvent.objects.filter(id=old_event.pk).exists())
        self.assertTrue(AuditEvent.objects.filter(id=fresh_event.pk).exists())

