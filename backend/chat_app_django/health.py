"""Health endpoints for liveness and readiness checks."""

import logging
import uuid

from django.core.cache import cache
from django.db import connections
from django.db.utils import DatabaseError
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def live(_request):
    """Вспомогательная функция `live` реализует внутренний шаг бизнес-логики.
    
    Args:
        _request: HTTP-запрос, не используемый напрямую в теле функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    return Response(
        {
            "status": "ok",
            "check": "live",
            "timestamp": timezone.now().isoformat(),
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def ready(_request):
    """Инициализирует интеграции и сигналы при запуске приложения.
    
    Args:
        _request: HTTP-запрос, не используемый напрямую в теле функции.
    
    Returns:
        Результат вычислений, сформированный в ходе выполнения функции.
    """
    components: dict[str, str] = {}
    ok = True

    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        components["database"] = "ok"
    except DatabaseError:
        ok = False
        components["database"] = "error"
        logger.exception("Проверка здоровья не пройдена: база данных недоступна")

    cache_key = f"health:{uuid.uuid4().hex}"
    cache_value = "ok"
    try:
        cache.set(cache_key, cache_value, timeout=5)
        if cache.get(cache_key) != cache_value:
            raise RuntimeError("cache readback mismatch")
        cache.delete(cache_key)
        components["cache"] = "ok"
    except Exception:
        ok = False
        components["cache"] = "error"
        logger.exception("Проверка здоровья не пройдена: кэш недоступен")

    status_code = 200 if ok else 503
    payload = {
        "status": "ok" if ok else "error",
        "check": "ready",
        "timestamp": timezone.now().isoformat(),
        "components": components,
    }
    return Response(payload, status=status_code)
