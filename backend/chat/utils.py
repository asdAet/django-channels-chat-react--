"""Shared chat utilities and backward-compatible re-exports."""

import re

from django.conf import settings

from chat_app_django.media_utils import (  # noqa: F401
    _signed_media_url_path,
    build_profile_url,
    build_profile_url_from_request,
    is_valid_media_signature,
    normalize_media_path,
    serialize_avatar_crop,
)


def is_valid_room_slug(value: str) -> bool:
    pattern = getattr(settings, "CHAT_ROOM_SLUG_REGEX", r"^[A-Za-z0-9_-]{3,50}$")
    try:
        return bool(re.match(pattern, value or ""))
    except re.error:
        return False
