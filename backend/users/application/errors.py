"""Service-layer errors for users auth/identity use-cases."""

from __future__ import annotations


class IdentityServiceError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str = "invalid_request",
        status_code: int = 400,
        errors: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.errors = errors or {}


class IdentityUnauthorizedError(IdentityServiceError):
    def __init__(self, message: str = "Неверные учетные данные") -> None:
        super().__init__(message, code="auth_failed", status_code=400, errors={"credentials": [message]})


class IdentityConflictError(IdentityServiceError):
    def __init__(self, message: str, *, errors: dict[str, list[str]] | None = None) -> None:
        super().__init__(message, code="conflict", status_code=409, errors=errors)


class IdentityForbiddenError(IdentityServiceError):
    def __init__(self, message: str = "Доступ запрещен") -> None:
        super().__init__(message, code="forbidden", status_code=403, errors={"detail": [message]})
