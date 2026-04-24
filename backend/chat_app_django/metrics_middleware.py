"""HTTP middleware for Prometheus request metrics."""

from __future__ import annotations

import time

from chat_app_django.metrics import HTTP_INFLIGHT_REQUESTS, observe_http_request


class HttpMetricsMiddleware:
    """Collect request count, latency, and in-flight metrics for Django."""

    _SKIP_PATHS = {
        "/api/health/live/",
        "/api/health/ready/",
        "/metrics/",
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

        started_at = time.perf_counter()
        status_code = 500
        HTTP_INFLIGHT_REQUESTS.inc()
        try:
            response = self.get_response(request)
            status_code = int(getattr(response, "status_code", 500) or 500)
            return response
        finally:
            HTTP_INFLIGHT_REQUESTS.dec()
            observe_http_request(
                request,
                status_code=status_code,
                duration_seconds=time.perf_counter() - started_at,
            )
