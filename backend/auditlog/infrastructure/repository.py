from __future__ import annotations

from django.db.models import QuerySet

from auditlog.models import AuditEvent


class AuditEventRepository:
    @staticmethod
    def create(**kwargs) -> AuditEvent:
        return AuditEvent.objects.create(**kwargs)

    @staticmethod
    def all() -> QuerySet[AuditEvent]:
        return AuditEvent.objects.all()
