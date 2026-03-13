"""Permission classes for role management API."""

from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission

from roles.application import management_service


class CanManageRoomRoles(BasePermission):
    """Allows access only to users with MANAGE_ROLES in the room."""

    def has_permission(self, request: Any, view: Any):  # pyright: ignore[reportIncompatibleMethodOverride]
        room_slug = getattr(view, "kwargs", {}).get("room_slug")
        if not isinstance(room_slug, str) or not room_slug:
            return False
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return management_service.actor_can_manage_roles(room_slug, user)

