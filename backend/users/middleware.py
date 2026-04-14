
"""Модуль middleware реализует прикладную логику подсистемы users."""


from datetime import timedelta

from django.core.cache import cache
from django.db import OperationalError, ProgrammingError
from django.utils import timezone

from .models import Profile


_SKIP_PATHS = {
    "/api/health/live/",
    "/api/health/ready/",
    "/metrics/",
}


class UpdateLastSeenMiddleware:
    """Класс UpdateLastSeenMiddleware инкапсулирует связанную бизнес-логику модуля."""

    def __init__(self, get_response):
        """Инициализирует экземпляр класса и подготавливает внутреннее состояние.
        
        Args:
            get_response: Следующий middleware-обработчик в цепочке Django.
        """
        self.get_response = get_response

    def __call__(self, request):
        """Выполняет объект как вызываемый обработчик.
        
        Args:
            request: HTTP-запрос с контекстом пользователя и параметрами вызова.
        
        Returns:
            Результат вычислений, сформированный в ходе выполнения функции.
        """
        path = getattr(request, "path", "") or ""
        if path in _SKIP_PATHS:
            return self.get_response(request)

        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            try:
                now = timezone.now()
                cache_key = f"last_seen:{user.id}"
                cached = cache.get(cache_key)
                if cached and now - cached <= timedelta(seconds=10):
                    return self.get_response(request)

                Profile.objects.filter(user_id=user.id).update(last_seen=now)
                cache.set(cache_key, now, timeout=60)
            except (OperationalError, ProgrammingError):
                # База без миграции last_seen — просто пропускаем обновление.
                pass
        return self.get_response(request)
