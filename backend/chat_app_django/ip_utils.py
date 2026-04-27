
"""Модуль ip_utils реализует прикладную логику подсистемы chat_app_django."""


from __future__ import annotations

from functools import lru_cache
from ipaddress import ip_address, ip_network

from django.conf import settings


def _decode_header(value: bytes | None) -> str | None:
    """Декодирует header из внешнего представления.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not value:
        return None
    try:
        return value.decode("utf-8")
    except UnicodeDecodeError:
        return value.decode("latin-1", errors="ignore")


def _first_value(value: str | None) -> str | None:
    """Выполняет вспомогательную обработку для first value.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, полученный при выполнении операции.
    """
    if not value:
        return None
    return value.split(",")[0].strip()


def _split_values(value: str | None) -> list[str]:
    """Разбивает цепочку IP-адресов заголовка на отдельные значения."""
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_ip(value: str | None) -> str | None:
    """Разбирает ip из входных данных с валидацией формата.
    
    Args:
        value: Входное значение для проверки или преобразования.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    if not value:
        return None
    try:
        ip_address(value)
    except ValueError:
        return None
    return value


def _pick_ip_from_chain(value: str | None) -> str | None:
    """Выбирает клиентский IP из цепочки X-Forwarded-For-подобного заголовка.

    Логика:
    1. Валидируем все IP из цепочки.
    2. Идем справа налево и пропускаем доверенные proxy.
    3. Берем первый IP, который не входит в trusted proxy ranges.
    4. Если все IP доверенные, возвращаем первый валидный.
    """
    parsed_ips: list[str] = []
    for item in _split_values(value):
        ip_val = _parse_ip(item)
        if ip_val:
            parsed_ips.append(ip_val)
    if not parsed_ips:
        return None

    for ip_val in reversed(parsed_ips):
        if not is_trusted_proxy(ip_val):
            return ip_val
    return parsed_ips[0]


@lru_cache(maxsize=1)
def _trusted_networks() -> list:
    """Выполняет вспомогательную обработку для trusted networks.
    
    Returns:
        Список типа list с результатами операции.
    """
    raw = []
    raw.extend(getattr(settings, "TRUSTED_PROXY_IPS", []) or [])
    raw.extend(getattr(settings, "TRUSTED_PROXY_RANGES", []) or [])
    networks = []
    for item in raw:
        try:
            networks.append(ip_network(item, strict=False))
        except ValueError:
            continue
    return networks


def is_trusted_proxy(ip: str | None) -> bool:
    """Проверяет условие trusted proxy и возвращает логический результат.
    
    Args:
        ip: IP-адрес клиента или узла, выполняющего запрос.
    
    Returns:
        Логическое значение результата проверки.
    """
    parsed = _parse_ip(ip)
    if not parsed:
        return False
    ip_obj = ip_address(parsed)
    for net in _trusted_networks():
        if ip_obj in net:
            return True
    return False


def _pick_ip(candidates: list[str | None]) -> str | None:
    """Выбирает ip из набора кандидатов по заданным правилам.
    
    Args:
        candidates: Набор кандидатных значений для выбора валидного результата.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    for value in candidates:
        ip_val = _pick_ip_from_chain(value)
        if ip_val:
            return ip_val
    return None


def get_client_ip_from_request(request) -> str | None:
    """Возвращает client ip from request из текущего контекста или хранилища.
    
    Args:
        request: HTTP-запрос с контекстом пользователя и параметрами вызова.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    remote = request.META.get("REMOTE_ADDR")
    if not is_trusted_proxy(remote):
        return _parse_ip(remote) or remote

    ip_val = _pick_ip(
        [
            request.META.get("HTTP_CF_CONNECTING_IP"),
            request.META.get("HTTP_X_FORWARDED_FOR"),
            request.META.get("HTTP_X_REAL_IP"),
        ]
    )
    return ip_val or (_parse_ip(remote) or remote)


def get_client_ip_from_scope(scope) -> str | None:
    """Возвращает client ip from scope из текущего контекста или хранилища.
    
    Args:
        scope: ASGI-scope с метаданными соединения.
    
    Returns:
        Объект типа str | None, сформированный в рамках обработки.
    """
    client = scope.get("client")
    remote = str(client[0]) if client else None
    if not is_trusted_proxy(remote):
        return _parse_ip(remote) or remote

    def header(name: bytes) -> str | None:
        """Вспомогательная функция `header` реализует внутренний шаг бизнес-логики.
        
        Args:
            name: Имя сущности или параметра.
        
        Returns:
            Объект типа str | None, сформированный в ходе выполнения.
        """
        for key, value in scope.get("headers", []):
            if key == name:
                return _decode_header(value)
        return None

    ip_val = _pick_ip(
        [
            header(b"cf-connecting-ip"),
            header(b"x-forwarded-for"),
            header(b"x-real-ip"),
        ]
    )
    return ip_val or (_parse_ip(remote) or remote)
