"""Custom Django authentication backend for identifier/password identity."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password

from .identity import normalize_email, normalize_login
from .models import EmailIdentity, LoginIdentity


class EmailIdentityBackend(BaseBackend):
    """Класс EmailIdentityBackend объединяет связанную прикладную логику подсистемы."""
    def authenticate(self, request=None, username=None, password=None, **kwargs):
        """Аутентифицирует данные.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и входными данными.
            username: Публичное имя пользователя.
            password: Пароль пользователя.
            **kwargs: Дополнительные именованные аргументы вызова.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        raw_identifier = kwargs.get("identifier", username)
        identifier = str(raw_identifier or "").strip()
        if not identifier or not password:
            return None

        identity = None
        if "@" in identifier:
            normalized_email = normalize_email(identifier)
            email_identity = (
                EmailIdentity.objects.select_related("user", "user__login_identity")
                .filter(email_normalized=normalized_email)
                .first()
            )
            if email_identity is not None:
                identity = getattr(email_identity.user, "login_identity", None)
        else:
            normalized_login = normalize_login(identifier)
            identity = LoginIdentity.objects.select_related("user").filter(login_normalized=normalized_login).first()

        if identity is None:
            return None
        if not check_password(password, identity.password_hash):
            return None
        return identity.user

    def get_user(self, user_id):
        """Возвращает user из текущего контекста.
        
        Args:
            user_id: Идентификатор user.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        User = get_user_model()
        return User.objects.filter(pk=user_id).first()
