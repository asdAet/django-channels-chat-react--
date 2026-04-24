"""Typing helpers for groups API tests."""

from __future__ import annotations

from typing import Any, Protocol, cast

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


class TypedAPIClient(APIClient):
    """APIClient that returns Any for request methods to satisfy static typing."""

    def get(self, *args: Any, **kwargs: Any) -> Any:
        return super().get(*args, **kwargs)

    def post(self, *args: Any, **kwargs: Any) -> Any:
        return super().post(*args, **kwargs)

    def patch(self, *args: Any, **kwargs: Any) -> Any:
        return super().patch(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> Any:
        return super().delete(*args, **kwargs)


class UserFactoryProtocol(Protocol):
    def create_user(self, *args: Any, **kwargs: Any) -> Any: ...
    def create_superuser(self, *args: Any, **kwargs: Any) -> Any: ...


class UserModelProtocol(Protocol):
    objects: UserFactoryProtocol


def typed_user_model() -> UserModelProtocol:
    return cast(UserModelProtocol, get_user_model())
