"""Prometheus metrics for application and business observability."""

from __future__ import annotations

import time

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

from presence.constants import PRESENCE_CACHE_KEY_AUTH, PRESENCE_CACHE_KEY_GUEST

HTTP_INFLIGHT_REQUESTS = Gauge(
    "devils_http_inflight_requests",
    "Current number of in-flight HTTP requests.",
)
HTTP_REQUESTS_TOTAL = Counter(
    "devils_http_requests_total",
    "Total number of HTTP requests handled by Django.",
    ["method", "route", "status_code", "status_class"],
)
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "devils_http_request_duration_seconds",
    "Latency of HTTP requests handled by Django.",
    ["method", "route", "status_class"],
    buckets=(
        0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1.0,
        2.5,
        5.0,
        10.0,
        30.0,
    ),
)

WS_OPEN_CONNECTIONS = Gauge(
    "devils_ws_open_connections",
    "Current number of open WebSocket connections.",
    ["endpoint", "auth_state", "room_kind"],
)
WS_CONNECT_TOTAL = Counter(
    "devils_ws_connect_total",
    "Total number of WebSocket connect attempts.",
    ["endpoint", "auth_state", "room_kind", "result", "reason"],
)
WS_EVENTS_TOTAL = Counter(
    "devils_ws_events_total",
    "Total number of WebSocket events handled by endpoint.",
    ["endpoint", "event_type", "result"],
)
CHAT_MESSAGE_REJECTED_TOTAL = Counter(
    "devils_chat_message_rejected_total",
    "Total number of rejected chat message submissions.",
    ["room_kind", "reason"],
)

ACCOUNTS_CREATED_TOTAL = Counter(
    "devils_accounts_created_total",
    "Total number of accounts created by source.",
    ["source"],
)
CHAT_MESSAGES_CREATED_TOTAL = Counter(
    "devils_chat_messages_created_total",
    "Total number of persisted chat messages by room kind.",
    ["room_kind"],
)
CHAT_MESSAGE_BYTES_TOTAL = Counter(
    "devils_chat_message_bytes_total",
    "Total bytes persisted in chat messages by room kind.",
    ["room_kind"],
)
CHAT_ATTACHMENTS_CREATED_TOTAL = Counter(
    "devils_chat_attachments_created_total",
    "Total number of persisted chat attachments by content type group.",
    ["content_group"],
)
CHAT_ATTACHMENTS_BYTES_TOTAL = Counter(
    "devils_chat_attachments_bytes_total",
    "Total bytes persisted in chat attachments by content type group.",
    ["content_group"],
)
SITE_ONLINE_USERS = Gauge(
    "devils_site_online_users",
    "Cluster-wide online users derived from Redis-backed presence state.",
    ["kind"],
)


def _coerce_int(value: object, default: int = 0) -> int:
    if not isinstance(value, (int, float, str, bytes, bytearray)):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _coerce_float(value: object, default: float = 0.0) -> float:
    if not isinstance(value, (int, float, str, bytes, bytearray)):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_cache_mapping(key: str) -> dict[str, dict[str, object]]:
    value = cache.get(key, {}) or {}
    if not isinstance(value, dict):
        return {}
    return {
        str(actor_key): item
        for actor_key, item in value.items()
        if isinstance(actor_key, str) and isinstance(item, dict)
    }


def _presence_entry_alive(info: dict[str, object], *, now: float, ttl: int) -> bool:
    count = _coerce_int(info.get("count", 0))
    last_seen = _coerce_float(info.get("last_seen", 0))
    grace_until = _coerce_float(info.get("grace_until", 0))

    if count > 0 and (now - last_seen) <= ttl:
        return True
    if count <= 0 and grace_until > now and (now - last_seen) <= ttl:
        return True
    return False


def _count_authenticated_online_users() -> int:
    ttl = int(getattr(settings, "PRESENCE_TTL", 40) or 40)
    now = time.time()
    data = _safe_cache_mapping(PRESENCE_CACHE_KEY_AUTH)
    return sum(1 for info in data.values() if _presence_entry_alive(info, now=now, ttl=ttl))


def _count_guest_online_users() -> int:
    ttl = int(getattr(settings, "PRESENCE_TTL", 40) or 40)
    now = time.time()
    data = _safe_cache_mapping(PRESENCE_CACHE_KEY_GUEST)
    return sum(1 for info in data.values() if _presence_entry_alive(info, now=now, ttl=ttl))


SITE_ONLINE_USERS.labels(kind="authenticated").set_function(_count_authenticated_online_users)
SITE_ONLINE_USERS.labels(kind="guest").set_function(_count_guest_online_users)


def render_metrics_response(_request) -> HttpResponse:
    """Expose Prometheus metrics for internal scraping."""
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)


def normalize_http_method(method: str | None) -> str:
    return str(method or "GET").upper()


def normalize_http_route(request: object) -> str:
    resolver_match = getattr(request, "resolver_match", None)
    route = getattr(resolver_match, "route", None)
    if isinstance(route, str) and route.strip():
        normalized = route.strip()
        return normalized if normalized.startswith("/") else f"/{normalized}"
    view_name = getattr(resolver_match, "view_name", None)
    if isinstance(view_name, str) and view_name.strip():
        return f"<{view_name.strip()}>"
    return "<unresolved>"


def normalize_status_class(status_code: int | str | None) -> str:
    try:
        numeric = int(status_code or 0)
    except (TypeError, ValueError):
        return "unknown"
    if 100 <= numeric <= 599:
        return f"{numeric // 100}xx"
    return "unknown"


def normalize_ws_auth_state(user: object) -> str:
    if user is not None and bool(getattr(user, "is_authenticated", False)):
        return "authenticated"
    return "guest"


def normalize_room_kind(room_kind: object | None) -> str:
    if isinstance(room_kind, str):
        normalized = room_kind.strip().lower()
        if normalized:
            return normalized
    return "none"


def observe_http_request(request: object, status_code: int, duration_seconds: float) -> None:
    method = normalize_http_method(getattr(request, "method", None))
    route = normalize_http_route(request)
    status_class = normalize_status_class(status_code)
    status_code_text = str(int(status_code))

    HTTP_REQUESTS_TOTAL.labels(
        method=method,
        route=route,
        status_code=status_code_text,
        status_class=status_class,
    ).inc()
    HTTP_REQUEST_DURATION_SECONDS.labels(
        method=method,
        route=route,
        status_class=status_class,
    ).observe(max(0.0, float(duration_seconds)))


def observe_ws_connect(
    endpoint: str,
    *,
    auth_state: str,
    room_kind: str,
    result: str,
    reason: str = "none",
) -> None:
    WS_CONNECT_TOTAL.labels(
        endpoint=str(endpoint),
        auth_state=str(auth_state),
        room_kind=normalize_room_kind(room_kind),
        result=str(result),
        reason=str(reason or "none"),
    ).inc()


def inc_ws_open_connection(endpoint: str, *, auth_state: str, room_kind: str) -> None:
    WS_OPEN_CONNECTIONS.labels(
        endpoint=str(endpoint),
        auth_state=str(auth_state),
        room_kind=normalize_room_kind(room_kind),
    ).inc()


def dec_ws_open_connection(endpoint: str, *, auth_state: str, room_kind: str) -> None:
    WS_OPEN_CONNECTIONS.labels(
        endpoint=str(endpoint),
        auth_state=str(auth_state),
        room_kind=normalize_room_kind(room_kind),
    ).dec()


def observe_ws_event(endpoint: str, *, event_type: str, result: str) -> None:
    WS_EVENTS_TOTAL.labels(
        endpoint=str(endpoint),
        event_type=str(event_type),
        result=str(result),
    ).inc()


def observe_chat_message_rejected(*, room_kind: str, reason: str) -> None:
    CHAT_MESSAGE_REJECTED_TOTAL.labels(
        room_kind=normalize_room_kind(room_kind),
        reason=str(reason),
    ).inc()


def observe_account_created(source: str) -> None:
    ACCOUNTS_CREATED_TOTAL.labels(source=str(source)).inc()


def observe_message_created(*, room_kind: str, message_content: str) -> None:
    normalized_room_kind = normalize_room_kind(room_kind)
    CHAT_MESSAGES_CREATED_TOTAL.labels(room_kind=normalized_room_kind).inc()
    CHAT_MESSAGE_BYTES_TOTAL.labels(room_kind=normalized_room_kind).inc(
        len((message_content or "").encode("utf-8"))
    )


def _content_group(content_type: str | None) -> str:
    normalized = str(content_type or "").strip().lower()
    if not normalized:
        return "unknown"
    prefix = normalized.split("/", 1)[0]
    if prefix in {"image", "video", "audio", "text"}:
        return prefix
    if normalized.startswith("application/"):
        return "application"
    return "other"


def observe_attachment_created(*, content_type: str | None, file_size: int | None) -> None:
    group = _content_group(content_type)
    CHAT_ATTACHMENTS_CREATED_TOTAL.labels(content_group=group).inc()
    size = _coerce_int(file_size or 0)
    CHAT_ATTACHMENTS_BYTES_TOTAL.labels(content_group=group).inc(max(0, size))
