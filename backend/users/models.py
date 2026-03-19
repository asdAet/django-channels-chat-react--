"""Модели пользователей, идентичностей и профиля."""

from __future__ import annotations

import uuid
import warnings
from pathlib import Path

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.core.files.storage import default_storage
from django.db import models
from django.db.models import Q
from django.utils.html import strip_tags
from PIL import Image

from .avatar_service import profile_avatar_upload_to

MAX_PROFILE_IMAGE_SIDE = 4096
MAX_PROFILE_IMAGE_PIXELS = MAX_PROFILE_IMAGE_SIDE * MAX_PROFILE_IMAGE_SIDE
Image.MAX_IMAGE_PIXELS = MAX_PROFILE_IMAGE_PIXELS
JPEG_EXTENSIONS = {".jpg", ".jpeg"}
SVG_EXTENSIONS = {".svg"}
USER_PUBLIC_ID_VALIDATOR = RegexValidator(
    regex=r"^[1-9]\d{9}$",
    message="public_id must be a positive 10-digit numeric value.",
)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=150, blank=True, default="")
    image = models.ImageField(default="avatars/Password_defualt.jpg", upload_to=profile_avatar_upload_to)
    avatar_url = models.URLField(max_length=2048, blank=True, default="")
    avatar_crop_x = models.FloatField(null=True, blank=True)
    avatar_crop_y = models.FloatField(null=True, blank=True)
    avatar_crop_width = models.FloatField(null=True, blank=True)
    avatar_crop_height = models.FloatField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    bio = models.TextField(blank=True, max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._old_image_name = self.image.name

    def __str__(self):
        return f"{self.user.username} profile"

    def save(self, *args, **kwargs):
        """Нормализует профиль и безопасно обрабатывает файл аватара."""
        if isinstance(self.bio, str):
            self.bio = strip_tags(self.bio).strip()
        if isinstance(self.name, str):
            self.name = strip_tags(self.name).strip()

        default_name = self._meta.get_field("image").default
        old_image_name = getattr(self, "_old_image_name", None)
        new_image_name = self.image.name if self.image else None

        if new_image_name and new_image_name != old_image_name:
            ext = Path(new_image_name).suffix or ".jpg"
            self.image.name = f"{uuid.uuid4().hex}{ext}"
            new_image_name = self.image.name

        super().save(*args, **kwargs)

        if (
            old_image_name
            and old_image_name != new_image_name
            and old_image_name != default_name
            and default_storage.exists(old_image_name)
        ):
            default_storage.delete(old_image_name)

        try:
            ext = Path(self.image.name or "").suffix.lower()
            if ext in SVG_EXTENSIONS:
                self._old_image_name = self.image.name
                return

            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(self.image.path) as img:
                    should_resize = (
                        img.height > MAX_PROFILE_IMAGE_SIDE
                        or img.width > MAX_PROFILE_IMAGE_SIDE
                        or (img.width * img.height) > MAX_PROFILE_IMAGE_PIXELS
                    )
                    if not should_resize:
                        self._old_image_name = self.image.name
                        return
                    img.thumbnail((MAX_PROFILE_IMAGE_SIDE, MAX_PROFILE_IMAGE_SIDE))

                    if ext in JPEG_EXTENSIONS and img.mode not in {"RGB", "L", "CMYK", "YCbCr"}:
                        img = img.convert("RGB")

                    img.save(self.image.path)
        except (
            FileNotFoundError,
            ValueError,
            OSError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
        ):
            self._old_image_name = self.image.name
            return

        self._old_image_name = self.image.name


class UserIdentityCore(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="identity_core")
    public_id = models.CharField(
        max_length=10,
        unique=True,
        db_index=True,
        validators=[USER_PUBLIC_ID_VALIDATOR],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"user:{self.public_id}"

    def save(self, *args, **kwargs):
        if self.pk is not None:
            old_public_id = (
                type(self).objects.filter(pk=self.pk).values_list("public_id", flat=True).first()
            )
            if old_public_id and old_public_id != self.public_id:
                raise ValidationError({"public_id": "public_id is immutable."})
        super().save(*args, **kwargs)


class LoginIdentity(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="login_identity")
    login_normalized = models.CharField(max_length=64, unique=True, db_index=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"login:{self.login_normalized}"


class EmailIdentity(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_identity")
    email_normalized = models.EmailField(unique=True, db_index=True, null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"email:{self.email_normalized or ''}"


class OAuthIdentity(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="oauth_identities")
    provider = models.CharField(max_length=32, choices=Provider.choices)
    provider_user_id = models.CharField(max_length=191)
    email_from_provider = models.EmailField(blank=True, default="")
    name_from_provider = models.CharField(max_length=150, blank=True, default="")
    avatar_url_from_provider = models.URLField(max_length=2048, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_user_id"],
                name="users_oauth_provider_uid_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["provider", "provider_user_id"], name="users_oauth_provider_uid_idx"),
        ]

    def __str__(self):
        return f"{self.provider}:{self.provider_user_id}"


class PublicHandle(models.Model):
    handle = models.CharField(max_length=30, unique=True, db_index=True)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="public_handle",
        null=True,
        blank=True,
    )
    room = models.OneToOneField(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="public_handle",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(user__isnull=False) & Q(room__isnull=True))
                    | (Q(user__isnull=True) & Q(room__isnull=False))
                ),
                name="users_public_handle_xor_owner",
            ),
        ]

    def __str__(self):
        return f"@{self.handle}"


class SecurityRateLimitBucket(models.Model):
    """Хранит состояние ограничений запросов для защитных сценариев."""

    scope_key = models.CharField(max_length=191, unique=True, db_index=True)
    count = models.PositiveIntegerField(default=0)
    reset_at = models.DateTimeField(db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["reset_at"], name="users_rl_reset_idx"),
        ]

    def __str__(self):
        return f"{self.scope_key}:{self.count}"
