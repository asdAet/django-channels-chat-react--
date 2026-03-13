"""Backward-compatible re-exports from direct_inbox.state."""

from direct_inbox.state import (  # noqa: F401
    clear_active_room,
    get_unread_slugs,
    get_unread_state,
    is_room_active,
    mark_read,
    mark_unread,
    set_active_room,
    touch_active_room,
    user_group_name,
)
