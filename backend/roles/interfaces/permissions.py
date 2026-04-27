"""Permission classes for role management API."""

from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission

from roles.application import management_service


class CanManageRoomRoles(BasePermission):
    """Класс CanManageRoomRoles инкапсулирует связанную бизнес-логику модуля."""

    def has_permission(self, request: Any, view: Any):  # pyright: ignore[reportIncompatibleMethodOverride]
        """Проверяет условие permission и возвращает логический результат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            view: Экземпляр представления, для которого проверяется разрешение.
        
        Returns:
            Функция не возвращает значение.
        """
        room_id_raw = getattr(view, "kwargs", {}).get("room_id")
        if room_id_raw is None:
            return False
        try:
            room_id = int(room_id_raw)
        except (TypeError, ValueError):
            return False
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return management_service.actor_can_manage_roles(room_id, user)

