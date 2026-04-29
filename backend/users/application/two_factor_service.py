"""TOTP two-factor authentication service."""

from __future__ import annotations

import base64
import hashlib
import io
import secrets
import time
from typing import Iterable

import pyotp
import qrcode
import qrcode.image.svg
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import transaction
from django.utils import timezone

from users.identity import user_public_ref
from users.models import UserTwoFactor

from .errors import IdentityServiceError, IdentityUnauthorizedError

TOTP_INTERVAL_SECONDS = 30
TOTP_VALID_WINDOW = 1
TWO_FACTOR_ISSUER = "Devil"


def _fernet_key(raw_secret: str) -> bytes:
    digest = hashlib.sha256(str(raw_secret or "").encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _candidate_fernets() -> Iterable[Fernet]:
    yield Fernet(_fernet_key(settings.SECRET_KEY))
    for fallback in getattr(settings, "SECRET_KEY_FALLBACKS", []) or []:
        yield Fernet(_fernet_key(str(fallback)))


def _encrypt_secret(secret: str) -> str:
    return Fernet(_fernet_key(settings.SECRET_KEY)).encrypt(secret.encode("utf-8")).decode("ascii")


def _decrypt_secret(secret_encrypted: str) -> str:
    for fernet in _candidate_fernets():
        try:
            return fernet.decrypt(secret_encrypted.encode("ascii")).decode("utf-8")
        except (InvalidToken, UnicodeDecodeError):
            continue
    raise IdentityServiceError(
        "Не удалось прочитать секрет двухфакторной защиты",
        code="two_factor_secret_unreadable",
        status_code=500,
    )


def _normalize_code(code: str | None) -> str:
    return "".join(char for char in str(code or "") if char.isdigit())


def _current_timestep(now: int | None = None) -> int:
    timestamp = int(time.time() if now is None else now)
    return timestamp // TOTP_INTERVAL_SECONDS


def _qr_svg_data_uri(otpauth_uri: str) -> str:
    image = qrcode.make(
        otpauth_uri,
        image_factory=qrcode.image.svg.SvgPathImage,
        border=2,
        box_size=8,
    )
    buffer = io.BytesIO()
    image.save(buffer)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def _credential_for_update(user: AbstractUser) -> UserTwoFactor:
    credential, _ = UserTwoFactor.objects.select_for_update().get_or_create(user=user)
    return credential


def get_two_factor_state(user: AbstractUser) -> dict[str, object]:
    credential = UserTwoFactor.objects.filter(user=user).first()
    enabled = bool(credential and credential.is_enabled)
    enabled_at = getattr(credential, "enabled_at", None)
    return {
        "twoFactorEnabled": enabled,
        "twoFactorEnabledAt": enabled_at.isoformat() if enabled and enabled_at else None,
    }


def is_two_factor_enabled(user: AbstractUser) -> bool:
    credential = getattr(user, "two_factor", None)
    if credential is None:
        credential = UserTwoFactor.objects.filter(user=user).first()
    return bool(credential and credential.is_enabled)


def begin_totp_setup(user: AbstractUser) -> dict[str, str]:
    with transaction.atomic():
        credential = _credential_for_update(user)
        if credential.is_enabled:
            raise IdentityServiceError(
                "Двухфакторная защита уже включена",
                code="two_factor_already_enabled",
                errors={"twoFactor": ["Двухфакторная защита уже включена"]},
            )

        secret = pyotp.random_base32()
        credential.secret_encrypted = _encrypt_secret(secret)
        credential.enabled_at = None
        credential.last_accepted_timestep = None
        credential.save(update_fields=["secret_encrypted", "enabled_at", "last_accepted_timestep", "updated_at"])

    account_name = user_public_ref(user) or str(getattr(user, "username", "") or user.pk)
    otpauth_uri = pyotp.TOTP(secret, interval=TOTP_INTERVAL_SECONDS).provisioning_uri(
        name=account_name,
        issuer_name=TWO_FACTOR_ISSUER,
    )
    return {
        "manualKey": secret,
        "otpauthUri": otpauth_uri,
        "qrSvg": _qr_svg_data_uri(otpauth_uri),
    }


def _verify_code_against_secret(
    *,
    secret: str,
    code: str | None,
    last_accepted_timestep: int | None,
    consume: bool,
) -> int | None:
    normalized_code = _normalize_code(code)
    if len(normalized_code) != 6:
        return None

    totp = pyotp.TOTP(secret, interval=TOTP_INTERVAL_SECONDS)
    current = _current_timestep()
    accepted_timestep: int | None = None
    for candidate in range(current - TOTP_VALID_WINDOW, current + TOTP_VALID_WINDOW + 1):
        if consume and last_accepted_timestep is not None and candidate <= last_accepted_timestep:
            continue
        expected = str(totp.at(candidate * TOTP_INTERVAL_SECONDS))
        if secrets.compare_digest(expected, normalized_code):
            accepted_timestep = candidate
            break
    return accepted_timestep


def confirm_totp_setup(user: AbstractUser, code: str | None) -> dict[str, object]:
    with transaction.atomic():
        credential = _credential_for_update(user)
        if not credential.secret_encrypted:
            raise IdentityServiceError(
                "Сначала начните настройку 2FA",
                code="two_factor_setup_missing",
                errors={"code": ["Сначала начните настройку 2FA"]},
            )
        if credential.is_enabled:
            raise IdentityServiceError(
                "Двухфакторная защита уже включена",
                code="two_factor_already_enabled",
                errors={"twoFactor": ["Двухфакторная защита уже включена"]},
            )

        secret = _decrypt_secret(credential.secret_encrypted)
        timestep = _verify_code_against_secret(
            secret=secret,
            code=code,
            last_accepted_timestep=credential.last_accepted_timestep,
            consume=True,
        )
        if timestep is None:
            raise IdentityUnauthorizedError("Неверный код двухфакторной защиты")

        credential.enabled_at = timezone.now()
        credential.last_accepted_timestep = timestep
        credential.save(update_fields=["enabled_at", "last_accepted_timestep", "updated_at"])
        return get_two_factor_state(user)


def verify_user_totp(user: AbstractUser, code: str | None, *, consume: bool = True) -> None:
    with transaction.atomic():
        credential = _credential_for_update(user)
        if not credential.is_enabled:
            raise IdentityServiceError(
                "Двухфакторная защита не включена",
                code="two_factor_disabled",
                errors={"code": ["Двухфакторная защита не включена"]},
            )

        secret = _decrypt_secret(credential.secret_encrypted)
        timestep = _verify_code_against_secret(
            secret=secret,
            code=code,
            last_accepted_timestep=credential.last_accepted_timestep,
            consume=consume,
        )
        if timestep is None:
            raise IdentityUnauthorizedError("Неверный код двухфакторной защиты")

        if consume:
            credential.last_accepted_timestep = timestep
            credential.save(update_fields=["last_accepted_timestep", "updated_at"])


def disable_totp(user: AbstractUser, code: str | None) -> dict[str, object]:
    with transaction.atomic():
        credential = _credential_for_update(user)
        if not credential.is_enabled:
            return get_two_factor_state(user)

        secret = _decrypt_secret(credential.secret_encrypted)
        timestep = _verify_code_against_secret(
            secret=secret,
            code=code,
            last_accepted_timestep=credential.last_accepted_timestep,
            consume=True,
        )
        if timestep is None:
            raise IdentityUnauthorizedError("Неверный код двухфакторной защиты")

        credential.secret_encrypted = ""
        credential.enabled_at = None
        credential.last_accepted_timestep = None
        credential.save(update_fields=["secret_encrypted", "enabled_at", "last_accepted_timestep", "updated_at"])
        return get_two_factor_state(user)
