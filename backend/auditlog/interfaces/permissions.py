from typing import Any

from rest_framework.permissions import BasePermission


class IsStaffAuditReader(BasePermission):
    def has_permission(self, request: Any, view: Any):  # pyright: ignore[reportIncompatibleMethodOverride]
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)
