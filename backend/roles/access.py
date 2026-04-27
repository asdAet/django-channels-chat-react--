"""Backward-compatible facade for permission checks."""

from __future__ import annotations

from roles.application.permission_service import (
    can_read,
    can_write,
    compute_permissions,
    ensure_can_read_or_404,
    ensure_can_write,
    get_user_role,
    has_permission,
)

__all__ = [
    "compute_permissions",
    "can_read",
    "can_write",
    "has_permission",
    "ensure_can_read_or_404",
    "ensure_can_write",
    "get_user_role",
]

