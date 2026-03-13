from __future__ import annotations

import base64
import json
from datetime import datetime
from datetime import timezone as dt_timezone

from django.utils import timezone


def encode_cursor(created_at: datetime, event_id: int) -> str:
    payload = {"ts": created_at.isoformat(), "id": int(event_id)}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def decode_cursor(value: str | None) -> tuple[datetime, int] | None:
    if not value:
        return None
    try:
        raw = base64.urlsafe_b64decode(value.encode("ascii")).decode("utf-8")
        payload = json.loads(raw)
        ts_raw = payload.get("ts")
        event_id = int(payload.get("id"))
        parsed = datetime.fromisoformat(str(ts_raw))
    except Exception:
        return None

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone=dt_timezone.utc)
    return parsed, event_id
