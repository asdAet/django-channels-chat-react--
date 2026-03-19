from __future__ import annotations

import base64
import json
from datetime import datetime
from datetime import timezone as dt_timezone

from django.utils import timezone


def encode_cursor(created_at: datetime, event_id: int) -> str:
    """Кодирует cursor в формат хранения или передачи.
    
    Args:
        created_at: Дата и время создания записи для курсорной пагинации.
        event_id: Идентификатор event, используемый для выборки данных.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    payload = {"ts": created_at.isoformat(), "id": int(event_id)}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def decode_cursor(value: str | None) -> tuple[datetime, int] | None:
    """Декодирует cursor из внешнего представления.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Кортеж типа tuple[datetime, int] | None с результатами операции.
    """
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
