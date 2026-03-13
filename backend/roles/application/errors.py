"""Typed application errors for role management use-cases."""

from __future__ import annotations


class RoleServiceError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class RoleNotFoundError(RoleServiceError):
    status_code = 404
    code = "not_found"


class RoleForbiddenError(RoleServiceError):
    status_code = 403
    code = "forbidden"


class RoleConflictError(RoleServiceError):
    status_code = 409
    code = "conflict"

