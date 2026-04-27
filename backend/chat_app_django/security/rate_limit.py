"""Centralized persistent rate-limit service backed by the DB."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import math

from django.db import IntegrityError, transaction
from django.utils import timezone

from users.models import SecurityRateLimitBucket


@dataclass(frozen=True)
class RateLimitPolicy:
    """Класс RateLimitPolicy инкапсулирует связанную бизнес-логику модуля."""

    limit: int
    window_seconds: int

    def normalized_limit(self) -> int:
        """Вспомогательная функция `normalized_limit` реализует внутренний шаг бизнес-логики.
        
        Returns:
            Целочисленный результат вычисления.
        """
        return max(1, int(self.limit))

    def normalized_window(self) -> int:
        """Вспомогательная функция `normalized_window` реализует внутренний шаг бизнес-логики.
        
        Returns:
            Целочисленный результат вычисления.
        """
        return max(1, int(self.window_seconds))


class DbRateLimiter:
    """Класс DbRateLimiter инкапсулирует связанную бизнес-логику модуля."""

    _MAX_RETRIES = 3

    @classmethod
    def is_limited(cls, scope_key: str, policy: RateLimitPolicy) -> bool:
        """Проверяет условие limited и возвращает логический результат.
        
        Args:
            scope_key: Уникальный ключ области действия для счетчика лимитов.
            policy: Политика rate-limit с лимитом и временным окном.
        
        Returns:
            Логическое значение результата проверки.
        """
        if not scope_key:
            # Security fail-closed for invalid scope keys.
            return True

        limit = policy.normalized_limit()
        window = policy.normalized_window()

        for _attempt in range(cls._MAX_RETRIES):
            now = timezone.now()
            next_reset_at = now + timedelta(seconds=window)
            try:
                with transaction.atomic():
                    bucket = (
                        SecurityRateLimitBucket.objects.select_for_update()
                        .filter(scope_key=scope_key)
                        .first()
                    )

                    if bucket is None:
                        SecurityRateLimitBucket.objects.create(
                            scope_key=scope_key,
                            count=1,
                            reset_at=next_reset_at,
                        )
                        return False

                    if bucket.reset_at <= now:
                        bucket.count = 1
                        bucket.reset_at = next_reset_at
                        bucket.save(update_fields=["count", "reset_at", "updated_at"])
                        return False

                    if bucket.count >= limit:
                        return True

                    bucket.count += 1
                    bucket.save(update_fields=["count", "updated_at"])
                    return False
            except IntegrityError:
                # Retry on unique-key races.
                continue
            except Exception:
                # Security fail-closed.
                return True

        # Too many retries, fail-closed.
        return True

    @classmethod
    def retry_after_seconds(cls, scope_key: str) -> int | None:
        """Вспомогательная функция `retry_after_seconds` реализует внутренний шаг бизнес-логики.
        
        Args:
            scope_key: Параметр scope key, используемый в логике функции.
        
        Returns:
            Объект типа int | None, сформированный в ходе выполнения.
        """
        if not scope_key:
            # Keep fail-closed behavior for callers that need a cooldown value.
            return 1

        try:
            reset_at = (
                SecurityRateLimitBucket.objects
                .filter(scope_key=scope_key)
                .values_list("reset_at", flat=True)
                .first()
            )
            if reset_at is None:
                return None

            now = timezone.now()
            if reset_at <= now:
                return None

            remaining = math.ceil((reset_at - now).total_seconds())
            return max(1, int(remaining))
        except Exception:
            return None

