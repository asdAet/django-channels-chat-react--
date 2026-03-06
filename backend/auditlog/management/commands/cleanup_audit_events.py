from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from auditlog.models import AuditEvent


class Command(BaseCommand):
    help = "Delete audit events older than N days."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=int(getattr(settings, "AUDIT_RETENTION_DAYS", 180)),
            help="Retention period in days (default from AUDIT_RETENTION_DAYS).",
        )

    def handle(self, *args, **options):
        days = int(options["days"])
        if days < 1:
            raise CommandError("--days must be >= 1")

        cutoff = timezone.now() - timezone.timedelta(days=days)
        deleted, _details = AuditEvent.objects.filter(created_at__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} audit events older than {days} days"))
