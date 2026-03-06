from __future__ import annotations

from collections.abc import Mapping

SENSITIVE_KEYS = {
    "password",
    "password1",
    "password2",
    "token",
    "csrf",
    "cookie",
    "authorization",
    "sessionid",
    "sig",
    "signature",
}


def sanitize_value(value):
    if isinstance(value, Mapping):
        return {
            str(key): ("***" if str(key).lower() in SENSITIVE_KEYS else sanitize_value(raw))
            for key, raw in value.items()
        }
    if isinstance(value, (list, tuple, set)):
        return [sanitize_value(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)
