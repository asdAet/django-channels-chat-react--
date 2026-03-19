"""Общие HTTP-утилиты для API-слоя: парсинг payload и единые ошибки."""

from __future__ import annotations

import json
from collections.abc import Mapping

from django.http.request import RawPostDataException
from rest_framework.response import Response


def parse_request_payload(request) -> Mapping[str, object]:
    """Разбирает request payload из входных данных с валидацией формата.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Объект типа Mapping[str, object], сформированный в рамках обработки.
    """
    content_type = request.META.get("CONTENT_TYPE", "")
    if content_type.startswith("multipart/form-data") or content_type.startswith(
        "application/x-www-form-urlencoded"
    ):
        return request.POST if request.POST else {}

    try:
        raw_body = request.body
    except RawPostDataException:
        return request.POST if request.POST else {}

    if raw_body:
        try:
            payload = json.loads(raw_body)
            if isinstance(payload, dict):
                return payload
        except json.JSONDecodeError:
            pass

    return request.POST if request.POST else {}


def error_response(
    *,
    status: int,
    error: str | None = None,
    detail: str | None = None,
    errors: Mapping[str, list[str] | str] | None = None,
) -> Response:
    """Формирует структуру ошибки response для ответа API.
    
    Args:
        status: HTTP-статус ответа, который будет возвращен клиенту.
        error: Короткий код ошибки для машинной обработки на клиенте.
        detail: Подробное описание ошибки для отображения и диагностики.
        errors: Набор ошибок валидации, сгруппированных по полям.
    
    Returns:
        HTTP-ответ с данными результата операции.
    """
    payload: dict[str, object] = {}
    if error:
        payload["error"] = error
    if detail:
        payload["detail"] = detail
    if errors:
        payload["errors"] = errors
    return Response(payload, status=status)
