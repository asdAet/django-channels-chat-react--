"""Service-layer errors for users auth/identity use-cases."""

from __future__ import annotations


class IdentityServiceError(Exception):
    """Класс IdentityServiceError объединяет связанную прикладную логику подсистемы."""
    def __init__(
        self,
        message: str,
        *,
        code: str = "invalid_request",
        status_code: int = 400,
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Сообщение, участвующее в обработке.
            code: Параметр code, используемый в логике функции.
            status_code: HTTP-код результата операции.
            errors: Параметр errors, используемый в логике функции.
        """
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.errors = errors or {}


class IdentityUnauthorizedError(IdentityServiceError):
    """Класс IdentityUnauthorizedError объединяет связанную прикладную логику подсистемы."""
    def __init__(self, message: str = "Неверные учетные данные") -> None:
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Сообщение, участвующее в обработке.
        """
        super().__init__(
            message,
            code="invalid_credentials",
            status_code=400,
            errors={"credentials": [message]},
        )


class IdentityConflictError(IdentityServiceError):
    """Класс IdentityConflictError объединяет связанную прикладную логику подсистемы."""
    def __init__(
        self,
        message: str,
        *,
        code: str = "conflict",
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Сообщение, участвующее в обработке.
            code: Параметр code, используемый в логике функции.
            errors: Параметр errors, используемый в логике функции.
        """
        super().__init__(message, code=code, status_code=409, errors=errors)


class IdentityForbiddenError(IdentityServiceError):
    """Класс IdentityForbiddenError объединяет связанную прикладную логику подсистемы."""
    def __init__(self, message: str = "Доступ запрещен") -> None:
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            message: Сообщение, участвующее в обработке.
        """
        super().__init__(message, code="forbidden", status_code=403, errors={"detail": [message]})
