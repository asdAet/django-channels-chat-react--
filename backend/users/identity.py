from __future__ import annotations

import re
import secrets
from typing import Any

from django.conf import settings
from django.contrib.auth import get_user_model

from .models import Profile

User = get_user_model()

USERNAME_ALLOWED_RE = re.compile(r"^[A-Za-z]+$")


def normalize_email(email: str | None) -> str:
    if not isinstance(email, str):
        return ""
    return email.strip().lower()


def normalize_public_username(username: str | None) -> str:
    if not isinstance(username, str):
        return ""
    value = username.strip()
    if value.startswith("@"):
        value = value[1:]
    return value.strip()


def validate_public_username(username: str) -> str:
    value = normalize_public_username(username)
    max_len = max(1, min(int(getattr(settings, "USERNAME_MAX_LENGTH", 30)), 150))
    if not value:
        raise ValueError("Укажите username")
    if len(value) > max_len:
        raise ValueError(f"Максимум {max_len} символов")
    if not USERNAME_ALLOWED_RE.fullmatch(value):
        raise ValueError("Допустимы только латинские буквы (A-Z, a-z)")
    return value


def generate_technical_username(seed: str = "") -> str:
    base = re.sub(r"[^A-Za-z0-9_]", "", seed.strip().lower())
    if base:
        base = base[:20]
    if not base:
        base = "user"

    for _ in range(16):
        suffix = secrets.token_hex(3)
        candidate = f"{base}_{suffix}"[:150]
        if not User.objects.filter(username=candidate).exists():
            return candidate

    # Last-resort fallback.
    while True:
        candidate = f"u_{secrets.token_hex(8)}"
        if not User.objects.filter(username=candidate).exists():
            return candidate


def user_public_username(user: Any) -> str:
    profile = getattr(user, "profile", None)
    profile_username = getattr(profile, "username", None)
    if isinstance(profile_username, str) and profile_username.strip():
        return profile_username.strip()
    username = getattr(user, "username", "")
    return str(username).strip()


def user_display_name(user: Any) -> str:
    profile = getattr(user, "profile", None)
    name = getattr(profile, "name", None)
    if isinstance(name, str) and name.strip():
        return name.strip()

    first_name = getattr(user, "first_name", None)
    if isinstance(first_name, str) and first_name.strip():
        return first_name.strip()

    return user_public_username(user)


def get_user_by_public_username(username: str | None):
    normalized = normalize_public_username(username)
    if not normalized:
        return None

    user = (
        User.objects.select_related("profile")
        .filter(profile__username=normalized)
        .first()
    )
    if user is not None:
        return user

    # Legacy fallback for accounts without public profile username set yet.
    return (
        User.objects.select_related("profile")
        .filter(username=normalized)
        .first()
    )


def ensure_profile(user) -> Profile:
    profile = getattr(user, "profile", None)
    if profile is not None:
        return profile
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile
