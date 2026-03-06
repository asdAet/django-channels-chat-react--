from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class AuditQueryFilters:
    actor_user_id: int | None = None
    actor_username: str | None = None
    action: str | None = None
    action_prefix: str | None = None
    protocol: str | None = None
    method: str | None = None
    status_code: int | None = None
    success: bool | None = None
    ip: str | None = None
    path_contains: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    room_slug: str | None = None
    limit: int = 50
    cursor: str | None = None
