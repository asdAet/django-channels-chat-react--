"""Typed application errors for friend management use-cases."""

from __future__ import annotations


class FriendServiceError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class FriendNotFoundError(FriendServiceError):
    status_code = 404
    code = "not_found"


class FriendForbiddenError(FriendServiceError):
    status_code = 403
    code = "forbidden"


class FriendConflictError(FriendServiceError):
    status_code = 409
    code = "conflict"
