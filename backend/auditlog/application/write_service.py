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
_pending_persist_tasks: set[asyncio.Task] = set()


def _normalize_int(value):
    """Нормализует int к внутреннему формату приложения.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Функция не возвращает значение.
    """
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _scope_header(scope, name: bytes) -> str | None:
    """Выполняет вспомогательную обработку для scope header.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
        name: Человекочитаемое имя объекта или параметра.
    
    Returns:
        Объект типа str | None, полученный при выполнении операции.
    """
    for key, value in scope.get("headers", []):
        if key == name:
            try:
                return value.decode("utf-8")
            except UnicodeDecodeError:
                return value.decode("latin-1", errors="ignore")
    return None


def _get_or_create_request_id_for_request(request) -> str:
    """Возвращает or create request id for request из текущего контекста или хранилища.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    existing = getattr(request, "audit_request_id", None) or request.META.get("HTTP_X_REQUEST_ID")
    if existing:
        request_id = str(existing)
        setattr(request, "audit_request_id", request_id)
        return request_id
    request_id = uuid.uuid4().hex
    setattr(request, "audit_request_id", request_id)
    return request_id


def _get_or_create_request_id_for_scope(scope) -> str:
    """Возвращает or create request id for scope из текущего контекста или хранилища.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
    
    Returns:
        Строковое значение, сформированное функцией.
    """
    existing = scope.get("audit_request_id") or _scope_header(scope, b"x-request-id")
    if existing:
        request_id = str(existing)
        scope["audit_request_id"] = request_id
        return request_id
    request_id = uuid.uuid4().hex
    scope["audit_request_id"] = request_id
    return request_id


def _extract_actor(actor_user=None, actor_user_id=None, actor_username=None, is_authenticated=None):
    """Извлекает actor из источника данных.
    
    Args:
        actor_user: Пользователь, от имени которого пишется аудит-событие.
        actor_user_id: Идентификатор пользователя, от имени которого пишется аудит.
        actor_username: Публичное имя пользователя для аудита и ответа API.
        is_authenticated: Булев флаг условия authenticated.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
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
    """Вспомогательная функция `_safe_metadata` реализует внутренний шаг бизнес-логики.
    
    Args:
        metadata: Дополнительные поля события, включаемые в аудит-запись.
    
    Returns:
        Словарь типа dict с данными результата.
    """
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
    """Вспомогательная функция `_default_success` реализует внутренний шаг бизнес-логики.
    
    Args:
        event: Событие для логирования или трансляции.
        status_code: HTTP-код результата операции.
    
    Returns:
        Логическое значение результата проверки.
    """
    if status_code is not None:
        return status_code < 400
    lowered = event.lower()
    negative_markers = ("failed", "denied", "invalid", "expired", "forbidden", "rate_limited", "rejected")
    return not any(marker in lowered for marker in negative_markers)


def _persist_event_row(payload: dict) -> None:
    """Сохраняет event row в постоянном хранилище.
    
    Args:
        payload: Подготовленные данные для сохранения или отправки.
    """
    try:
        AuditEventRepository.create(**payload)
    except (OperationalError, ProgrammingError, IntegrityError):
        _internal_logger.exception("Failed to persist audit event")


def _persist_event(payload: dict) -> asyncio.Task | None:
    """Сохраняет event в постоянном хранилище.
    
    Args:
        payload: Подготовленные данные для сохранения или отправки.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        _persist_event_row(payload)
        return None

    async def _persist_event_async() -> None:
        """Выполняет вспомогательную обработку для persist event async."""
        persist_row_async = cast(
            Callable[[dict], Awaitable[None]],
            sync_to_async(_persist_event_row, thread_sensitive=True),
        )
        await persist_row_async(payload)

    # WebSocket handlers run in async context, so persist through sync_to_async.
    task = loop.create_task(_persist_event_async())
    if task is None:
        return None
    _pending_persist_tasks.add(task)

    def _cleanup_persist_task(done_task: asyncio.Task) -> None:
        _pending_persist_tasks.discard(done_task)
        try:
            done_task.result()
        except asyncio.CancelledError:
            return
        except Exception:
            _internal_logger.exception("Failed to persist audit event asynchronously")

    task.add_done_callback(_cleanup_persist_task)
    return task


async def drain_pending_audit_events() -> None:
    """Wait until scheduled audit writes from the current process are persisted."""

    while True:
        pending = [task for task in _pending_persist_tasks if not task.done()]
        if not pending:
            return
        await asyncio.gather(*pending, return_exceptions=True)


async def wait_for_audit_event(task: asyncio.Task | None) -> None:
    """Wait for one scheduled audit write without coupling unrelated sessions."""

    if task is None or task.done():
        return
    await asyncio.gather(task, return_exceptions=True)


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
) -> asyncio.Task | None:
    """Записывает event в хранилище или аудит.
    
    Args:
        action: Код или имя действия, которое фиксируется в аудите.
        protocol: Транспортный протокол текущего запроса или события.
        method: HTTP-метод текущего запроса.
        path: Путь ресурса в storage или URL-маршруте.
        status_code: HTTP-код результата операции.
        success: Флаг успешного выполнения операции.
        ip: IP-адрес клиента.
        request_id: Идентификатор request.
        actor_user: Пользователь, от имени которого пишется аудит-событие.
        actor_user_id: Идентификатор пользователя, от имени которого пишется аудит.
        actor_username: Публичное имя пользователя для аудита и ответа API.
        is_authenticated: Булев флаг условия authenticated.
        metadata: Дополнительные поля события, включаемые в аудит-запись.
        **fields: Дополнительные поля, переданные в функцию.
    """
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

    return _persist_event(
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


def audit_security_event(event: str, **fields) -> asyncio.Task | None:
    """Фиксирует security event в системе аудита.
    
    Args:
        event: Событие для логирования или трансляции.
        **fields: Дополнительные поля, переданные в функцию.
    """
    protocol = fields.pop("protocol", "system")
    return write_event(
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


def audit_http_event(event: str, request, **fields) -> asyncio.Task | None:
    """Фиксирует http event в системе аудита.
    
    Args:
        event: Событие для логирования или трансляции.
        request: HTTP-запрос с контекстом пользователя и входными данными.
        **fields: Дополнительные поля, переданные в функцию.
    """
    user = getattr(request, "user", None)
    return write_event(
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


def audit_ws_event(event: str, scope, **fields) -> asyncio.Task | None:
    """Фиксирует ws event в системе аудита.
    
    Args:
        event: Событие для логирования или трансляции.
        scope: ASGI-контекст соединения с метаданными клиента.
        **fields: Дополнительные поля, переданные в функцию.
    """
    user = scope.get("user")
    return write_event(
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


def audit_http_request(
    request,
    response=None,
    exception: Exception | None = None,
) -> asyncio.Task | None:
    """Фиксирует http request в системе аудита.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и входными данными.
        response: HTTP-ответ, который анализируется перед возвратом клиенту.
        exception: Параметр exception, используемый в логике функции.
    """
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
    return write_event(
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
