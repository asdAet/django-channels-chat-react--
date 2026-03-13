from __future__ import annotations

from auditlog.domain.actions import AuditAction
from auditlog.models import AuditEvent


def get_username_history(user_id: int, *, limit: int = 200):
    safe_limit = max(1, min(int(limit), 1000))
    queryset = (
        AuditEvent.objects.filter(
            actor_user_id_snapshot=user_id,
            action=AuditAction.USERNAME_CHANGED,
        )
        .order_by("-created_at", "-id")[:safe_limit]
    )

    items = []
    for event in queryset:
        metadata = event.metadata or {}
        items.append(
            {
                "id": getattr(event, "pk", None),
                "createdAt": event.created_at,
                "oldUsername": metadata.get("old_username"),
                "newUsername": metadata.get("new_username"),
                "requestId": event.request_id,
            }
        )
    return items
