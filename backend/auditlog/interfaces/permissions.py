from typing import Any

from rest_framework.permissions import BasePermission


class IsStaffAuditReader(BasePermission):
    """Класс IsStaffAuditReader инкапсулирует связанную бизнес-логику модуля."""
    def has_permission(self, request: Any, view: Any):  # pyright: ignore[reportIncompatibleMethodOverride]
        """Проверяет условие permission и возвращает логический результат.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
            view: Экземпляр представления, для которого проверяется разрешение.
        
        Returns:
            Функция не возвращает значение.
        """
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)
