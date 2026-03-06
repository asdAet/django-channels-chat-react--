from __future__ import annotations

from django.db.models import Q, QuerySet

from auditlog.domain.context import AuditQueryFilters
from auditlog.infrastructure.cursor import decode_cursor
from auditlog.models import AuditEvent


def apply_filters(
    queryset: QuerySet[AuditEvent],
    filters: AuditQueryFilters,
    *,
    include_action_filters: bool = True,
) -> QuerySet[AuditEvent]:
    qs = queryset
    if filters.actor_user_id is not None:
        qs = qs.filter(actor_user_id_snapshot=filters.actor_user_id)
    if filters.actor_username:
        qs = qs.filter(actor_username_snapshot__icontains=filters.actor_username)
    if include_action_filters and filters.action:
        qs = qs.filter(action=filters.action)
    if include_action_filters and filters.action_prefix:
        qs = qs.filter(action__startswith=filters.action_prefix)
    if filters.protocol:
        qs = qs.filter(protocol=filters.protocol)
    if filters.method:
        qs = qs.filter(method=filters.method.upper())
    if filters.status_code is not None:
        qs = qs.filter(status_code=filters.status_code)
    if filters.success is not None:
        qs = qs.filter(success=filters.success)
    if filters.ip:
        qs = qs.filter(ip=filters.ip)
    if filters.path_contains:
        qs = qs.filter(path__icontains=filters.path_contains)
    if filters.date_from:
        qs = qs.filter(created_at__gte=filters.date_from)
    if filters.date_to:
        qs = qs.filter(created_at__lte=filters.date_to)
    if filters.room_slug:
        qs = qs.filter(metadata__room_slug=filters.room_slug)

    parsed_cursor = decode_cursor(filters.cursor)
    if parsed_cursor:
        created_at, event_id = parsed_cursor
        qs = qs.filter(Q(created_at__lt=created_at) | Q(created_at=created_at, id__lt=event_id))

    return qs
