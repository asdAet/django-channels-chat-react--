"""Typed helpers around Django's dynamic user model for tests."""

from __future__ import annotations

from typing import Any, Protocol, cast

from django.contrib.auth import get_user_model


class UserFactoryProtocol(Protocol):
    def create_user(self, *args: Any, **kwargs: Any) -> Any: ...
    def create_superuser(self, *args: Any, **kwargs: Any) -> Any: ...


class UserModelProtocol(Protocol):
    objects: UserFactoryProtocol


def typed_user_model() -> UserModelProtocol:
    return cast(UserModelProtocol, get_user_model())
