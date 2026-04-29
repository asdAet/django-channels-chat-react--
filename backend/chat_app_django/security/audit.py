"""Facade for centralized security audit."""

from auditlog.application.write_service import (
    LOGGER_NAME,
    audit_http_event,
    audit_security_event,
    audit_ws_event,
    drain_pending_audit_events,
    wait_for_audit_event,
)

__all__ = [
    "LOGGER_NAME",
    "audit_security_event",
    "audit_http_event",
    "audit_ws_event",
    "drain_pending_audit_events",
    "wait_for_audit_event",
]
