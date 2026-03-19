"""Формы для регистрации, профиля и публичного имени пользователя."""

from __future__ import annotations

import re
import warnings
import xml.etree.ElementTree as ET
from pathlib import Path

from django import forms
from django.conf import settings
from django.contrib.auth import password_validation
from django.contrib.auth.models import User
from django.utils.html import strip_tags
from PIL import Image

from .identity import normalize_email
from .models import (
    EmailIdentity,
    MAX_PROFILE_IMAGE_PIXELS,
    MAX_PROFILE_IMAGE_SIDE,
    Profile,
    PublicHandle,
)


USERNAME_MAX_LENGTH = max(1, min(int(getattr(settings, "USERNAME_MAX_LENGTH", 30)), 150))
USERNAME_ALLOWED_RE = re.compile(r"^[a-z][a-z0-9_]{2,29}$")
USERNAME_ALLOWED_HINT = "Username: a-z, 0-9, _, длина 3-30, начинается с буквы."
SVG_CONTENT_TYPES = {"image/svg+xml", "image/svg", "text/svg"}
SVG_EXTENSION = ".svg"
SVG_DISALLOWED_SNIPPETS = (
    b"<script",
    b"javascript:",
    b"<!doctype",
    b"<!entity",
    b"<?xml-stylesheet",
    b"<iframe",
    b"<object",
    b"<embed",
    b"<foreignobject",
)
SVG_EVENT_HANDLER_RE = re.compile(r"\son[a-z0-9_-]+\s*=", flags=re.IGNORECASE)


def _validate_username_symbols(username: str) -> None:
    """Проверяет значение поля username symbols и возвращает нормализованный результат.
    
    Args:
        username: Публичное имя пользователя, используемое в событиях и ответах.
    """
    if username and not USERNAME_ALLOWED_RE.fullmatch(username):
        raise forms.ValidationError(USERNAME_ALLOWED_HINT)


def _is_svg_upload(uploaded_file) -> bool:
    """Проверяет условие svg upload и возвращает логический результат.
    
    Args:
        uploaded_file: Файл, загруженный пользователем через форму или API.
    
    Returns:
        Логическое значение результата проверки.
    """
    filename = str(getattr(uploaded_file, "name", "") or "")
    content_type = str(getattr(uploaded_file, "content_type", "") or "").strip().lower()
    extension = Path(filename).suffix.lower()
    return extension == SVG_EXTENSION or content_type in SVG_CONTENT_TYPES


def _read_uploaded_bytes(uploaded_file) -> bytes:
    """Читает uploaded байты.
    
    Args:
        uploaded_file: Файл, полученный из multipart-запроса.
    
    Returns:
        Объект типа bytes, сформированный в ходе выполнения.
    """
    if hasattr(uploaded_file, "seek"):
        uploaded_file.seek(0)
    raw = uploaded_file.read()
    if hasattr(uploaded_file, "seek"):
        uploaded_file.seek(0)
    if isinstance(raw, bytes):
        return raw
    if isinstance(raw, str):
        return raw.encode("utf-8", errors="ignore")
    return bytes(raw or b"")


def _validate_svg_avatar(uploaded_file) -> None:
    """Проверяет значение поля svg avatar и возвращает нормализованный результат.
    
    Args:
        uploaded_file: Файл, загруженный пользователем через форму или API.
    """
    raw = _read_uploaded_bytes(uploaded_file)
    if not raw:
        raise forms.ValidationError("SVG файл пустой.")

    lowered = raw.lower()
    for snippet in SVG_DISALLOWED_SNIPPETS:
        if snippet in lowered:
            raise forms.ValidationError("SVG содержит запрещенные элементы.")

    try:
        decoded = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise forms.ValidationError("SVG должен быть в кодировке UTF-8.") from exc

    if SVG_EVENT_HANDLER_RE.search(decoded):
        raise forms.ValidationError("SVG содержит запрещенные атрибуты.")

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise forms.ValidationError("Некорректный SVG файл.") from exc

    tag = str(getattr(root, "tag", "") or "")
    if "}" in tag:
        tag = tag.rsplit("}", 1)[-1]
    if tag.lower() != "svg":
        raise forms.ValidationError("Файл не является SVG изображением.")


class EmailRegisterForm(forms.Form):
    """Форма EmailRegisterForm валидирует и подготавливает входные данные."""
    email = forms.EmailField(required=True)
    password1 = forms.CharField(required=True)
    password2 = forms.CharField(required=True)

    def clean_email(self):
        """Проверяет и нормализует значение поля email.
        
        Returns:
            Функция не возвращает значение.
        """
        email = normalize_email(self.cleaned_data.get("email"))
        if not email:
            raise forms.ValidationError("Укажите email")
        if EmailIdentity.objects.filter(email_normalized=email).exists():
            raise forms.ValidationError("Email уже используется")
        return email

    def clean(self):
        """Проверяет согласованность и валидность данных формы.
        
        Returns:
            Функция не возвращает значение.
        """
        cleaned = super().clean()
        password1 = cleaned.get("password1")
        password2 = cleaned.get("password2")
        if not password1 or not password2:
            return cleaned
        if password1 != password2:
            self.add_error("password2", "Пароли не совпадают")
            return cleaned

        probe_user = User(email=cleaned.get("email", ""), username="temp")
        try:
            password_validation.validate_password(password1, user=probe_user)
        except forms.ValidationError as exc:
            self.add_error("password1", exc)
        except Exception:
            # Любая непредвиденная ошибка валидации возвращается как слабый пароль.
            self.add_error("password1", "Пароль слишком слабый")
        return cleaned


class UserUpdateForm(forms.ModelForm):
    """Форма UserUpdateForm валидирует и подготавливает входные данные."""
    email = forms.EmailField(required=False)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = User
        fields = ["username", "email"]

    def clean_username(self):
        """Проверяет и нормализует значение поля username.
        
        Returns:
            Функция не возвращает значение.
        """
        username = (self.cleaned_data.get("username") or "").strip()
        if not username:
            return ""
        if len(username) > USERNAME_MAX_LENGTH:
            raise forms.ValidationError(f"Максимум {USERNAME_MAX_LENGTH} символов.")

        qs = User.objects.filter(username=username)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Имя пользователя уже занято")
        return username

    def clean_email(self):
        """Проверяет и нормализует значение поля email.
        
        Returns:
            Функция не возвращает значение.
        """
        email = normalize_email(self.cleaned_data.get("email"))
        if not email:
            return ""
        qs = User.objects.filter(email__iexact=email)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Email уже используется")
        return email


class ProfileIdentityUpdateForm(forms.Form):
    """Форма ProfileIdentityUpdateForm валидирует и подготавливает входные данные."""
    name = forms.CharField(required=False, max_length=150)
    username = forms.CharField(required=False, max_length=USERNAME_MAX_LENGTH)

    def __init__(self, *args, user=None, **kwargs):
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            *args: Дополнительные позиционные аргументы вызова.
            user: Пользователь, для которого выполняется операция.
            **kwargs: Дополнительные именованные аргументы вызова.
        """
        super().__init__(*args, **kwargs)
        self.user = user

    def clean_name(self):
        """Проверяет и нормализует значение поля name.
        
        Returns:
            Функция не возвращает значение.
        """
        return strip_tags((self.cleaned_data.get("name") or "").strip())

    def clean_username(self):
        """Проверяет и нормализует значение поля username.
        
        Returns:
            Функция не возвращает значение.
        """
        raw = self.cleaned_data.get("username")
        if raw is None:
            return None
        username = str(raw).strip().lower()
        if not username:
            return None
        if len(username) > USERNAME_MAX_LENGTH:
            raise forms.ValidationError(f"Максимум {USERNAME_MAX_LENGTH} символов.")
        _validate_username_symbols(username)

        qs = PublicHandle.objects.filter(handle=username.lower())
        user_id = getattr(self.user, "pk", None)
        if user_id is not None:
            qs = qs.exclude(user_id=user_id)
        if qs.exists():
            raise forms.ValidationError("Имя пользователя уже занято")
        return username

    def save(self, profile: Profile) -> Profile:
        """Сохраняет изменения объекта в хранилище.
        
        Args:
            profile: Параметр profile, используемый в логике функции.
        
        Returns:
            Объект типа Profile, сформированный в ходе выполнения.
        """
        cleaned = self.cleaned_data
        if "name" in cleaned:
            profile.name = cleaned.get("name") or ""
        profile.save(update_fields=["name"])
        return profile


class ProfileUpdateForm(forms.ModelForm):
    """Форма ProfileUpdateForm валидирует и подготавливает входные данные."""
    image = forms.FileField(required=False)

    class Meta:
        """Класс Meta инкапсулирует связанную бизнес-логику модуля."""
        model = Profile
        fields = ["image", "bio"]
        widgets = {
            "bio": forms.Textarea(attrs={"rows": 4, "maxlength": 1000}),
        }

    def clean_bio(self):
        """Проверяет и нормализует значение поля bio.
        
        Returns:
            Функция не возвращает значение.
        """
        bio = self.cleaned_data.get("bio") or ""
        return strip_tags(bio).strip()

    def clean(self):
        """Проверяет согласованность и валидность данных формы.
        
        Returns:
            Функция не возвращает значение.
        """
        cleaned = super().clean()
        crop_field_map = {
            "avatarCropX": "avatar_crop_x",
            "avatarCropY": "avatar_crop_y",
            "avatarCropWidth": "avatar_crop_width",
            "avatarCropHeight": "avatar_crop_height",
        }

        raw_values = {}
        for request_field in crop_field_map:
            raw = self.data.get(request_field) if hasattr(self, "data") else None
            raw_values[request_field] = str(raw).strip() if raw is not None else ""

        provided = [field for field, value in raw_values.items() if value != ""]
        if provided and len(provided) != len(crop_field_map):
            raise forms.ValidationError({"image": ["Укажите все параметры обрезки аватарки."]})

        crop_update = None
        if len(provided) == len(crop_field_map):
            parsed = {}
            try:
                for request_field, model_field in crop_field_map.items():
                    parsed[model_field] = float(raw_values[request_field])
            except (TypeError, ValueError):
                raise forms.ValidationError({"image": ["Некорректные параметры обрезки аватарки."]})

            x = parsed["avatar_crop_x"]
            y = parsed["avatar_crop_y"]
            width = parsed["avatar_crop_width"]
            height = parsed["avatar_crop_height"]

            if not (0 <= x < 1 and 0 <= y < 1 and 0 < width <= 1 and 0 < height <= 1):
                raise forms.ValidationError(
                    {"image": ["Параметры обрезки аватарки выходят за допустимые границы."]}
                )

            if (x + width) > 1.000001 or (y + height) > 1.000001:
                raise forms.ValidationError(
                    {"image": ["Параметры обрезки аватарки выходят за границы изображения."]}
                )

            crop_update = parsed
        elif cleaned.get("image"):
            crop_update = {
                "avatar_crop_x": None,
                "avatar_crop_y": None,
                "avatar_crop_width": None,
                "avatar_crop_height": None,
            }

        self._avatar_crop_update = crop_update
        return cleaned

    def clean_image(self):
        """Проверяет и нормализует значение поля image.
        
        Returns:
            Функция не возвращает значение.
        """
        image = self.cleaned_data.get("image")
        if not image:
            return image

        if _is_svg_upload(image):
            _validate_svg_avatar(image)
            return image

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(image) as uploaded:
                    width, height = uploaded.size
                    if width > MAX_PROFILE_IMAGE_SIDE or height > MAX_PROFILE_IMAGE_SIDE:
                        raise forms.ValidationError(
                            f"Максимальный размер аватара: {MAX_PROFILE_IMAGE_SIDE}x{MAX_PROFILE_IMAGE_SIDE}."
                        )
                    if (width * height) > MAX_PROFILE_IMAGE_PIXELS:
                        raise forms.ValidationError(f"Максимум {MAX_PROFILE_IMAGE_PIXELS} пикселей.")
                    uploaded.verify()
        except forms.ValidationError:
            raise
        except (Image.DecompressionBombError, Image.DecompressionBombWarning):
            raise forms.ValidationError("Изображение слишком большое.")
        except (OSError, ValueError, Image.UnidentifiedImageError):
            raise forms.ValidationError("Некорректный формат изображения.")
        finally:
            if hasattr(image, "seek"):
                image.seek(0)

        return image

    def save(self, commit=True):
        """Сохраняет изменения объекта в хранилище.
        
        Args:
            commit: Параметр commit, используемый в логике функции.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        instance = super().save(commit=False)
        crop_update = getattr(self, "_avatar_crop_update", None)
        if crop_update is not None:
            for field, value in crop_update.items():
                setattr(instance, field, value)
        if "image" in self.changed_data and getattr(instance, "image", None):
            instance.avatar_url = ""

        if commit:
            instance.save()
            self.save_m2m()

        return instance
