"""Typed application errors for friend management use-cases."""

from __future__ import annotations


class FriendServiceError(Exception):
    """Класс FriendServiceError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Экземпляр сообщения для обработки.
        """
        super().__init__(message)
        self.message = message


class FriendNotFoundError(FriendServiceError):
    """Класс FriendNotFoundError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 404
    code = "not_found"


class FriendForbiddenError(FriendServiceError):
    """Класс FriendForbiddenError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 403
    code = "forbidden"


class FriendConflictError(FriendServiceError):
    """Класс FriendConflictError инкапсулирует связанную бизнес-логику модуля."""
    status_code = 409
    code = "conflict"
