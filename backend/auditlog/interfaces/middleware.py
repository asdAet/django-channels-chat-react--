from __future__ import annotations

from auditlog.application.write_service import audit_http_request


class AuditHttpMiddleware:
    """Класс AuditHttpMiddleware инкапсулирует связанную бизнес-логику модуля."""
    _SKIP_PATHS = {
        "/api/health/live/",
        "/api/health/ready/",
        "/metrics/",
    }

    def __init__(self, get_response):
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            get_response: Следующий middleware-обработчик в цепочке Django.
        """
        self.get_response = get_response

    def _should_skip(self, request) -> bool:
        """Определяет, нужно ли выполнять действие skip.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Логическое значение результата проверки.
        """
        path = getattr(request, "path", "") or ""
        if path in self._SKIP_PATHS:
            return True
        if path.startswith("/static/"):
            return True
        return False

    def __call__(self, request):
        """Выполняет объект как вызываемый обработчик.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        if self._should_skip(request):
            return self.get_response(request)

        try:
            response = self.get_response(request)
        except Exception as exc:
            audit_http_request(request, response=None, exception=exc)
            raise

        audit_http_request(request, response=response, exception=None)
        return response
