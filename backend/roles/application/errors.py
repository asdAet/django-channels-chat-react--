"""Typed application errors for role management use-cases."""

from __future__ import annotations


class RoleServiceError(Exception):
    """Класс RoleServiceError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Экземпляр сообщения для обработки.
        """
        super().__init__(message)
        self.message = message


class RoleNotFoundError(RoleServiceError):
    """Класс RoleNotFoundError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 404
    code = "not_found"


class RoleForbiddenError(RoleServiceError):
    """Класс RoleForbiddenError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 403
    code = "forbidden"


class RoleConflictError(RoleServiceError):
    """Класс RoleConflictError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 409
    code = "conflict"

