"""Facade for centralized security audit."""

from auditlog.application.write_service import (
    LOGGER_NAME,
    audit_http_event,
    audit_security_event,
    audit_ws_event,
)

__all__ = [
    "LOGGER_NAME",
    "audit_security_event",
    "audit_http_event",
    "audit_ws_event",
]
