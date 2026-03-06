from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from datetime import timezone as dt_timezone

from django.conf import settings
from django.db.models import Count
from django.utils import timezone

from auditlog.domain.context import AuditQueryFilters
from auditlog.infrastructure.cursor import encode_cursor
from auditlog.infrastructure.query_builder import apply_filters
from auditlog.infrastructure.repository import AuditEventRepository


def _parse_int(raw_value, *, field_name: str) -> int | None:
    if raw_value in (None, ""):
        return None
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid '{field_name}': must be an integer")


def _parse_bool(raw_value, *, field_name: str) -> bool | None:
    if raw_value in (None, ""):
        return None
    value = str(raw_value).strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"Invalid '{field_name}': must be boolean")


def _parse_datetime(raw_value, *, field_name: str) -> datetime | None:
    if raw_value in (None, ""):
        return None
    try:
        parsed = datetime.fromisoformat(str(raw_value))
    except ValueError:
        raise ValueError(f"Invalid '{field_name}': must be ISO datetime")
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone=dt_timezone.utc)
    return parsed


def parse_filters(params) -> AuditQueryFilters:
    default_limit = int(getattr(settings, "AUDIT_API_DEFAULT_LIMIT", 50))
    max_limit = int(getattr(settings, "AUDIT_API_MAX_LIMIT", 200))

    parsed_limit = _parse_int(params.get("limit"), field_name="limit")
    if parsed_limit is None:
        parsed_limit = default_limit
    if parsed_limit < 1:
        raise ValueError("Invalid 'limit': must be >= 1")

    return AuditQueryFilters(
        actor_user_id=_parse_int(params.get("actor_user_id"), field_name="actor_user_id"),
        actor_username=(params.get("actor_username") or "").strip() or None,
        action=(params.get("action") or "").strip() or None,
        action_prefix=(params.get("action_prefix") or "").strip() or None,
        protocol=(params.get("protocol") or "").strip() or None,
        method=(params.get("method") or "").strip().upper() or None,
        status_code=_parse_int(params.get("status_code"), field_name="status_code"),
        success=_parse_bool(params.get("success"), field_name="success"),
        ip=(params.get("ip") or "").strip() or None,
        path_contains=(params.get("path_contains") or "").strip() or None,
        date_from=_parse_datetime(params.get("date_from"), field_name="date_from"),
        date_to=_parse_datetime(params.get("date_to"), field_name="date_to"),
        room_slug=(params.get("room_slug") or "").strip() or None,
        limit=min(parsed_limit, max_limit),
        cursor=(params.get("cursor") or "").strip() or None,
    )


def list_events(filters: AuditQueryFilters):
    queryset = apply_filters(AuditEventRepository.all(), filters).order_by("-created_at", "-id")
    batch = list(queryset[: filters.limit + 1])
    has_more = len(batch) > filters.limit
    if has_more:
        batch = batch[: filters.limit]
    next_cursor = None
    if has_more and batch:
        last_event_id = getattr(batch[-1], "pk", None)
        if last_event_id is not None:
            next_cursor = encode_cursor(batch[-1].created_at, int(last_event_id))
    return batch, next_cursor


def get_event(event_id: int):
    return AuditEventRepository.all().filter(id=event_id).first()


def list_action_counts(filters: AuditQueryFilters):
    base_filters = replace(filters, action=None, action_prefix=None, cursor=None)
    queryset = apply_filters(
        AuditEventRepository.all(),
        base_filters,
        include_action_filters=False,
    )
    return list(
        queryset.values("action")
        .annotate(count=Count("id"))
        .order_by("-count", "action")
    )
