"""Backward-compatible re-exports for migrated access module."""

from roles.access import (  # noqa: F401
    READ_ROLES,
    WRITE_ROLES,
    can_read,
    can_write,
    ensure_can_read_or_404,
    ensure_can_write,
    get_user_role,
)
