from __future__ import annotations

import asyncio
import json
import logging
import uuid
from collections.abc import Awaitable, Callable, Iterable, Mapping
from typing import cast

from asgiref.sync import sync_to_async
from django.db import IntegrityError, OperationalError, ProgrammingError

from auditlog.domain.actions import AuditAction
from auditlog.domain.sanitize import sanitize_value
from auditlog.infrastructure.repository import AuditEventRepository
from chat_app_django.ip_utils import get_client_ip_from_request, get_client_ip_from_scope

LOGGER_NAME = "security.audit"

_audit_logger = logging.getLogger(LOGGER_NAME)
_internal_logger = logging.getLogger("auditlog")


def _normalize_int(value):
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _scope_header(scope, name: bytes) -> str | None:
    for key, value in scope.get("headers", []):
        if key == name:
            try:
                return value.decode("utf-8")
            except UnicodeDecodeError:
                return value.decode("latin-1", errors="ignore")
    return None


def _get_or_create_request_id_for_request(request) -> str:
    existing = getattr(request, "audit_request_id", None) or request.META.get("HTTP_X_REQUEST_ID")
    if existing:
        request_id = str(existing)
        setattr(request, "audit_request_id", request_id)
        return request_id
    request_id = uuid.uuid4().hex
    setattr(request, "audit_request_id", request_id)
    return request_id


def _get_or_create_request_id_for_scope(scope) -> str:
    existing = scope.get("audit_request_id") or _scope_header(scope, b"x-request-id")
    if existing:
        request_id = str(existing)
        scope["audit_request_id"] = request_id
        return request_id
    request_id = uuid.uuid4().hex
    scope["audit_request_id"] = request_id
    return request_id


def _extract_actor(actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None):
    user = actor_user
    snapshot_id = _normalize_int(actor_user_id)
    snapshot_username = str(actor_username) if actor_username is not None else None
    authenticated = bool(is_authenticated) if is_authenticated is not None else False

    if user is not None:
        user_authenticated = bool(getattr(user, "is_authenticated", False))
        if is_authenticated is None:
            authenticated = user_authenticated
        if user_authenticated:
            snapshot_id = snapshot_id or getattr(user, "id", None)
            snapshot_username = snapshot_username or getattr(user, "username", None)

    if not authenticated:
        user = None
    return user, _normalize_int(snapshot_id), snapshot_username, authenticated


def _safe_metadata(metadata) -> dict:
    if metadata is None:
        return {}
    if isinstance(metadata, Mapping):
        sanitized = sanitize_value(dict(metadata))
        if isinstance(sanitized, dict):
            return sanitized
        return {"value": sanitized}
    sanitized = sanitize_value(metadata)
    return {"value": sanitized}


def _default_success(event: str, status_code: int | None) -> bool:
    if status_code is not None:
        return status_code < 400
    lowered = event.lower()
    negative_markers = ("failed", "denied", "invalid", "expired", "forbidden", "rate_limited", "rejected")
    return not any(marker in lowered for marker in negative_markers)


def _persist_event_row(payload: dict) -> None:
    try:
        AuditEventRepository.create(**payload)
    except (OperationalError, ProgrammingError, IntegrityError):
        _internal_logger.exception("Failed to persist audit event")


def _persist_event(payload: dict) -> None:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        _persist_event_row(payload)
        return

    async def _persist_event_async() -> None:
        persist_row_async = cast(
            Callable[[dict], Awaitable[None]],
            sync_to_async(_persist_event_row, thread_sensitive=True),
        )
        await persist_row_async(payload)

    # WebSocket handlers run in async context, so persist through sync_to_async.
    loop.create_task(_persist_event_async())


def write_event(
    action: str,
    *,
    protocol=None,
    method=None,
    path=None,
    status_code=None,
    success=None,
    ip=None,
    request_id=None,
    actor_user=None,
    actor_user_id=None,
    actor_username=None,
    is_authenticated=None,
    metadata=None,
    **fields,
):
    event_metadata = _safe_metadata(metadata)
    if fields:
        event_metadata.update(_safe_metadata(fields))

    actor_user, actor_user_id_snapshot, actor_username_snapshot, actor_authenticated = _extract_actor(
        actor_user=actor_user,
        actor_user_id=actor_user_id,
        actor_username=actor_username,
        is_authenticated=is_authenticated,
    )

    normalized_status_code = _normalize_int(status_code)
    if success is None:
        success = _default_success(action, normalized_status_code)
    success = bool(success)

    payload = {
        "protocol": protocol,
        "method": method,
        "path": path,
        "ip": ip,
        "status_code": normalized_status_code,
        "success": success,
        "request_id": request_id,
        "actor_user_id": actor_user_id_snapshot,
        "username": actor_username_snapshot,
        "is_authenticated": actor_authenticated,
        **event_metadata,
    }
    safe_payload = sanitize_value(payload)
    if not isinstance(safe_payload, Mapping):
        safe_payload = {"value": safe_payload}
    _audit_logger.info(
        json.dumps(
            {
                "event": action,
                **safe_payload,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )

    _persist_event(
        {
            "action": action,
            "protocol": protocol,
            "actor_user": actor_user,
            "actor_user_id_snapshot": actor_user_id_snapshot,
            "actor_username_snapshot": actor_username_snapshot,
            "is_authenticated": actor_authenticated,
            "method": method,
            "path": path,
            "status_code": normalized_status_code,
            "success": success,
            "ip": ip,
            "request_id": request_id,
            "metadata": event_metadata,
        }
    )


def audit_security_event(event: str, **fields) -> None:
    protocol = fields.pop("protocol", "system")
    write_event(
        event,
        protocol=protocol,
        status_code=fields.pop("status_code", None),
        success=fields.pop("success", True),
        request_id=fields.pop("request_id", None),
        actor_user=fields.pop("actor_user", None),
        actor_user_id=fields.pop("actor_user_id", None),
        actor_username=fields.pop("actor_username", None),
        is_authenticated=fields.pop("is_authenticated", None),
        metadata=fields,
    )


def audit_http_event(event: str, request, **fields) -> None:
    user = getattr(request, "user", None)
    write_event(
        event,
        protocol="http",
        method=getattr(request, "method", None),
        path=getattr(request, "path", None),
        ip=get_client_ip_from_request(request),
        request_id=fields.pop("request_id", None) or _get_or_create_request_id_for_request(request),
        status_code=fields.pop("status_code", None),
        success=fields.pop("success", None),
        actor_user=user,
        actor_user_id=fields.pop("actor_user_id", None),
        actor_username=fields.pop("actor_username", None),
        is_authenticated=fields.pop("is_authenticated", None),
        metadata=fields,
    )


def audit_ws_event(event: str, scope, **fields) -> None:
    user = scope.get("user")
    write_event(
        event,
        protocol="ws",
        path=scope.get("path"),
        ip=get_client_ip_from_scope(scope),
        request_id=fields.pop("request_id", None) or _get_or_create_request_id_for_scope(scope),
        status_code=fields.pop("status_code", None),
        success=fields.pop("success", None),
        actor_user=user,
        actor_user_id=fields.pop("actor_user_id", None),
        actor_username=fields.pop("actor_username", None),
        is_authenticated=fields.pop("is_authenticated", None),
        metadata=fields,
    )


def audit_http_request(request, response=None, exception: Exception | None = None) -> None:
    status_code = getattr(response, "status_code", None)
    if status_code is None:
        status_code = 500 if exception else None

    resolver_match = getattr(request, "resolver_match", None)
    route_name = getattr(resolver_match, "view_name", None) if resolver_match else None
    query_data: dict[str, object] = {}
    raw_query = getattr(request, "GET", None)
    if raw_query is not None:
        lists_method = getattr(raw_query, "lists", None)
        if callable(lists_method):
            raw_pairs = cast("Iterable[tuple[object, object]]", lists_method())
            if isinstance(raw_pairs, Iterable):
                query_data = {str(key): value for key, value in raw_pairs}
        elif isinstance(raw_query, Mapping):
            query_data = {str(key): value for key, value in raw_query.items()}

    metadata = {
        "route_name": route_name,
        "query": query_data,
    }
    if exception is not None:
        metadata["exception"] = exception.__class__.__name__

    action = AuditAction.HTTP_EXCEPTION if exception else AuditAction.HTTP_REQUEST
    write_event(
        action,
        protocol="http",
        method=getattr(request, "method", None),
        path=getattr(request, "path", None),
        status_code=status_code,
        success=exception is None and (status_code is not None and status_code < 400),
        ip=get_client_ip_from_request(request),
        request_id=_get_or_create_request_id_for_request(request),
        actor_user=getattr(request, "user", None),
        metadata=metadata,
    )
