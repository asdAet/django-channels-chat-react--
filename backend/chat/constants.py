"""Chat subsystem constants and backward-compatible re-exports."""

PUBLIC_ROOM_TARGET = "public"
PUBLIC_ROOM_NAME = "Public Chat"

CHAT_CLOSE_IDLE_CODE = 4001

# Backward-compatible re-exports
from presence.constants import (  # noqa: F401, E402
    PRESENCE_CACHE_KEY_AUTH,
    PRESENCE_CACHE_KEY_GUEST,
    PRESENCE_CACHE_TTL_SECONDS,
    PRESENCE_CLOSE_IDLE_CODE,
    PRESENCE_GROUP_AUTH,
    PRESENCE_GROUP_GUEST,
)
from direct_inbox.constants import DIRECT_INBOX_CLOSE_IDLE_CODE  # noqa: F401, E402
