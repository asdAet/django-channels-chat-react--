from __future__ import annotations

from auditlog.application.write_service import audit_http_request


class AuditHttpMiddleware:
    _SKIP_PATHS = {
        "/api/health/live/",
        "/api/health/ready/",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def _should_skip(self, request) -> bool:
        path = getattr(request, "path", "") or ""
        if path in self._SKIP_PATHS:
            return True
        if path.startswith("/static/"):
            return True
        return False

    def __call__(self, request):
        if self._should_skip(request):
            return self.get_response(request)

        try:
            response = self.get_response(request)
        except Exception as exc:
            audit_http_request(request, response=None, exception=exc)
            raise

        audit_http_request(request, response=response, exception=None)
        return response
