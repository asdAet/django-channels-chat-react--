
"""Модуль settings реализует прикладную логику подсистемы chat_app_django."""


import os
import secrets
import sys
from pathlib import Path
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv_file(path: Path, *, allowed_keys: set[str] | None = None) -> None:
    """Загружает dotenv file из базы данных или кэша.
    
    Args:
        path: Путь ресурса в storage или URL-маршруте.
        allowed_keys: Параметр allowed keys, используемый в логике функции.
    """
    if not path.exists() or not path.is_file():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key:
            continue
        if key.startswith("export "):
            key = key[len("export ") :].strip()
        if not key:
            continue
        if allowed_keys is not None and key not in allowed_keys:
            continue

        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        existing = os.environ.get(key)
        if existing is None or not str(existing).strip():
            os.environ[key] = value


# Load env files for local app run.
# Root `.env` may contain production-only infrastructure values (e.g. DB host
# `postgres` valid only inside docker network), so by default we import a safe
# subset required for local server behavior. Full import can be explicitly
# enabled via DJANGO_LOAD_ROOT_ENV_ALL=1.
IS_PYTEST_RUN = (
    "pytest" in Path(sys.argv[0]).name.lower()
    or "PYTEST_CURRENT_TEST" in os.environ
)
LOAD_ROOT_ENV_ALL = os.getenv("DJANGO_LOAD_ROOT_ENV_ALL", "").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
if not IS_PYTEST_RUN:
    if LOAD_ROOT_ENV_ALL:
        _load_dotenv_file(BASE_DIR.parent / ".env")
    else:
        _load_dotenv_file(
            BASE_DIR.parent / ".env",
            allowed_keys={
                "GOOGLE_OAUTH_CLIENT_ID",
                "DJANGO_SECRET_KEY",
                "CHAT_ATTACHMENT_MAX_PER_MESSAGE",
                "CHAT_ATTACHMENT_MAX_SIZE_MB",
                "CHAT_ATTACHMENT_ALLOW_ANY_TYPE",
                "CHAT_ATTACHMENT_ALLOWED_TYPES",
                "CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE",
                "CHAT_ATTACHMENT_UPLOAD_TTL_SECONDS",
                "CHAT_ATTACHMENT_CHUNK_MIN_SIZE_KB",
                "CHAT_ATTACHMENT_CHUNK_MAX_SIZE_MB",
                "CHAT_ATTACHMENT_TARGET_CHUNKS",
                "CHAT_THUMBNAIL_MAX_SIDE",
                "CHAT_THUMBNAIL_MAX_SOURCE_SIZE_MB",
                "CHAT_THUMBNAIL_MAX_SOURCE_PIXELS",
                "USER_PASSWORD_DEFAULT_AVATAR",
                "USER_OAUTH_DEFAULT_AVATAR",
                "GROUP_DEFAULT_AVATAR",
                "USER_AVATAR_UPLOAD_DIR",
                "GROUP_AVATAR_UPLOAD_DIR",
            },
        )
    _load_dotenv_file(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    """Вспомогательная функция `env_bool` реализует внутренний шаг бизнес-логики.
    
    Args:
        name: Имя сущности или параметра.
        default: Значение по умолчанию при отсутствии пользовательского ввода.
    
    Returns:
        Логическое значение результата проверки.
    """
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: list[str]) -> list[str]:
    """Возвращает список переменная окружения.
    
    Args:
        name: Имя сущности или параметра.
        default: Значение по умолчанию при отсутствии пользовательского ввода.
    
    Returns:
        Список типа list[str] с данными результата.
    """
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _extend_unique(items: list[str], extra: list[str]) -> list[str]:
    """Вспомогательная функция `_extend_unique` реализует внутренний шаг бизнес-логики.
    
    Args:
        items: Параметр items, используемый в логике функции.
        extra: Параметр extra, используемый в логике функции.
    
    Returns:
        Список типа list[str] с данными результата.
    """
    seen = {item for item in items if item}
    result = [item for item in items if item]
    for item in extra:
        if not item or item in seen:
            continue
        result.append(item)
        seen.add(item)
    return result


def env_int(name: str, default: int, minimum: int | None = None) -> int:
    """Преобразует значение переменной окружения в целое число."""
    raw = os.getenv(name)
    if raw is None:
        value = default
    else:
        try:
            value = int(raw)
        except ValueError as exc:
            raise ImproperlyConfigured(f"{name} должно быть целым числом.") from exc
    if minimum is not None and value < minimum:
        raise ImproperlyConfigured(f"{name} должно быть >= {minimum}.")
    return value


DEFAULT_FILE_UPLOAD_MAX_MEMORY_SIZE = 2_621_440


def resolve_upload_memory_limits(max_upload_mb: int) -> tuple[int | None, int]:
    """Разделяет лимит размера запроса и порог буферизации файлов в памяти."""
    data_upload_limit = None if max_upload_mb == 0 else max_upload_mb * 1024 * 1024
    return data_upload_limit, DEFAULT_FILE_UPLOAD_MAX_MEMORY_SIZE


DEBUG = env_bool("DJANGO_DEBUG", True)
TESTING = "test" in sys.argv

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = secrets.token_urlsafe(50)
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY должен быть задан в production.")

ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    ["localhost", "127.0.0.1"] if DEBUG else [],
)
ALLOW_LOCALHOST_DEV_ORIGINS = env_bool("DJANGO_ALLOW_LOCALHOST_DEV_ORIGINS", True)
if ALLOW_LOCALHOST_DEV_ORIGINS:
    ALLOWED_HOSTS = _extend_unique(
        ALLOWED_HOSTS,
        ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"],
    )
if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS должен быть задан в production.")


INSTALLED_APPS = [
    "django.contrib.postgres",
    "channels",
    "corsheaders",
    "crispy_forms",
    "crispy_bootstrap4",
    "rest_framework",
    "auditlog.apps.AuditlogConfig",
    "rooms.apps.RoomsConfig",
    "roles.apps.RolesConfig",
    "messages.apps.MessagesConfig",
    "presence.apps.PresenceConfig",
    "direct_inbox.apps.DirectInboxConfig",
    "friends.apps.FriendsConfig",
    "groups.apps.GroupsConfig",
    "chat.apps.ChatConfig",
    "users.apps.UsersConfig",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

def build_rest_renderer_classes(debug: bool) -> list[str]:
    """Формирует rest renderer classes для дальнейшего использования.
    
    Args:
        debug: Параметр debug, используемый в логике функции.
    
    Returns:
        Список типа list[str] с данными результата.
    """
    classes = ["rest_framework.renderers.JSONRenderer"]
    if debug:
        classes.append("rest_framework.renderers.BrowsableAPIRenderer")
    return classes


REST_RENDERER_CLASSES = build_rest_renderer_classes(DEBUG)

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        *REST_RENDERER_CLASSES,
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": None,
    "UNAUTHENTICATED_USER": None,
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "chat_app_django.metrics_middleware.HttpMetricsMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "auditlog.interfaces.middleware.AuditHttpMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "users.middleware.UpdateLastSeenMiddleware",
]

ROOT_URLCONF = "chat_app_django.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "chat_app_django.wsgi.application"
ASGI_APPLICATION = "chat_app_django.asgi.application"


REDIS_URL = os.getenv("REDIS_URL")
REQUIRE_REDIS = env_bool("DJANGO_REQUIRE_REDIS", not DEBUG)
ALLOW_INMEMORY_CHANNEL_LAYER = env_bool("DJANGO_ALLOW_INMEMORY_CHANNEL_LAYER", DEBUG)
if REQUIRE_REDIS and not REDIS_URL:
    raise ImproperlyConfigured("REDIS_URL должен быть задан в production.")

if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
elif ALLOW_INMEMORY_CHANNEL_LAYER:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }
else:
    raise ImproperlyConfigured(
        "Требуется REDIS_URL, если DJANGO_ALLOW_INMEMORY_CHANNEL_LAYER не равен 1."
    )


def _database_from_url(url: str) -> dict:
    """Вспомогательная функция `_database_from_url` реализует внутренний шаг бизнес-логики.
    
    Args:
        url: Параметр url, используемый в логике функции.
    
    Returns:
        Словарь типа dict с данными результата.
    """
    parsed = urlparse(url)
    if parsed.scheme in {"postgres", "postgresql"}:
        return {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": (parsed.path or "").lstrip("/"),
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "",
            "PORT": str(parsed.port or ""),
        }
    raise ImproperlyConfigured("Неподдерживаемая схема DATABASE_URL.")


DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASES = {"default": _database_from_url(DATABASE_URL)}
else:
    db_engine = os.getenv("DJANGO_DB_ENGINE", "")
    if db_engine:
        DATABASES = {
            "default": {
                "ENGINE": db_engine,
                "NAME": os.getenv("DJANGO_DB_NAME", ""),
                "USER": os.getenv("DJANGO_DB_USER", ""),
                "PASSWORD": os.getenv("DJANGO_DB_PASSWORD", ""),
                "HOST": os.getenv("DJANGO_DB_HOST", ""),
                "PORT": os.getenv("DJANGO_DB_PORT", ""),
            }
        }
    else:
        sqlite_path = os.getenv("DJANGO_SQLITE_PATH")
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": sqlite_path or (BASE_DIR / "db.sqlite3"),
                "OPTIONS": {
                    "timeout": 30,
                },
            }
        }

ALLOW_SQLITE_IN_PROD = env_bool("DJANGO_ALLOW_SQLITE", False)
if (
    not DEBUG
    and DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3"
    and not ALLOW_SQLITE_IN_PROD
):
    raise ImproperlyConfigured("SQLite не разрешен в production.")


RELAX_PASSWORDS = env_bool("DJANGO_RELAX_PASSWORDS", DEBUG)

if RELAX_PASSWORDS:
    AUTH_PASSWORD_VALIDATORS = [
        {
            "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
            "OPTIONS": {"min_length": 6},
        },
    ]
else:
    AUTH_PASSWORD_VALIDATORS = [
        {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
        {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
        {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
        {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
    ]


LANGUAGE_CODE = "ru"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
MEDIA_URL = "/media/"
USER_AVATAR_UPLOAD_DIR = os.getenv("USER_AVATAR_UPLOAD_DIR", "avatars/users").strip()
GROUP_AVATAR_UPLOAD_DIR = os.getenv("GROUP_AVATAR_UPLOAD_DIR", "avatars/groups").strip()
USER_PASSWORD_DEFAULT_AVATAR = os.getenv(
    "USER_PASSWORD_DEFAULT_AVATAR",
    "avatars/Password_defualt.jpg",
).strip()
USER_OAUTH_DEFAULT_AVATAR = os.getenv(
    "USER_OAUTH_DEFAULT_AVATAR",
    "avatars/OAuth_defualt.jpg",
).strip()
GROUP_DEFAULT_AVATAR = os.getenv(
    "GROUP_DEFAULT_AVATAR",
    "avatars/Group_defualt.jpg",
).strip()

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CRISPY_TEMPLATE_PACK = "bootstrap4"

LOGIN_REDIRECT_URL = "chat-home"
LOGIN_URL = "login"
AUTHENTICATION_BACKENDS = [
    "users.auth_backends.EmailIdentityBackend",
    # Keep Django ModelBackend for /admin login (createsuperuser uses username/password).
    "django.contrib.auth.backends.ModelBackend",
]
_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    _DEV_ORIGINS if DEBUG else [],
)
if ALLOW_LOCALHOST_DEV_ORIGINS:
    CSRF_TRUSTED_ORIGINS = _extend_unique(CSRF_TRUSTED_ORIGINS, _DEV_ORIGINS)

CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    _DEV_ORIGINS if DEBUG else [],
)
if ALLOW_LOCALHOST_DEV_ORIGINS:
    CORS_ALLOWED_ORIGINS = _extend_unique(CORS_ALLOWED_ORIGINS, _DEV_ORIGINS)
CORS_ALLOW_CREDENTIALS = env_bool("DJANGO_CORS_ALLOW_CREDENTIALS", True)
CORS_URLS_REGEX = r"^/api/.*$"
PUBLIC_BASE_URL = os.getenv("DJANGO_PUBLIC_BASE_URL", "").strip() or None
MEDIA_URL_TTL_SECONDS = env_int("DJANGO_MEDIA_URL_TTL_SECONDS", 300, minimum=1)
MEDIA_SIGNING_KEY = os.getenv("DJANGO_MEDIA_SIGNING_KEY", "").strip() or SECRET_KEY
TRUSTED_PROXY_IPS = env_list("DJANGO_TRUSTED_PROXY_IPS", [])
TRUSTED_PROXY_RANGES = env_list(
    "DJANGO_TRUSTED_PROXY_RANGES",
    [
        "127.0.0.1/32",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "::1/128",
        "fc00::/7",
    ],
)

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = env_bool("DJANGO_SESSION_COOKIE_SECURE", not DEBUG)
CSRF_COOKIE_SECURE = env_bool("DJANGO_CSRF_COOKIE_SECURE", not DEBUG)
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", not DEBUG)
SECURE_REDIRECT_EXEMPT = env_list(
    "DJANGO_SECURE_REDIRECT_EXEMPT",
    [
        r"^api/health/live/$",
        r"^api/health/ready/$",
        r"^metrics/$",
    ],
)
SECURE_CROSS_ORIGIN_OPENER_POLICY = (
    os.getenv("DJANGO_SECURE_COOP", "same-origin-allow-popups").strip()
    or "same-origin-allow-popups"
)

MAX_UPLOAD_SIZE_MB = env_int("DJANGO_UPLOAD_MAX_MB", 0, minimum=0)
DATA_UPLOAD_MAX_MEMORY_SIZE, FILE_UPLOAD_MAX_MEMORY_SIZE = resolve_upload_memory_limits(
    MAX_UPLOAD_SIZE_MB
)


# -- Unified rate-limit configuration -----------------------------------------
# Single source of truth for security throttling.
#
# Structure:
# RATE_LIMITS["<policy_name>"] = {
#   "limit": <max actions in window>,
#   "window_seconds": <window duration in seconds>,
# }
RATE_LIMITS = {
    # Login/register attempts per action and client IP.
    "auth_attempts": {
        "limit": env_int("AUTH_RATE_LIMIT", 10, minimum=1),
        "window_seconds": env_int("AUTH_RATE_WINDOW", 60, minimum=1),
        "disabled": env_bool("AUTH_RATE_LIMIT_DISABLED", False),
    },
    # Chat message send throttle per authenticated user.
    "chat_message_send": {
        "limit": env_int("CHAT_MESSAGE_RATE_LIMIT", 20, minimum=1),
        "window_seconds": env_int("CHAT_MESSAGE_RATE_WINDOW", 10, minimum=1),
        "disabled": env_bool("CHAT_MESSAGE_RATE_LIMIT_DISABLED", False),
    },
    # Default websocket connect throttle per endpoint/IP pair.
    "ws_connect_default": {
        "limit": env_int("WS_CONNECT_RATE_LIMIT", 60, minimum=1),
        "window_seconds": env_int("WS_CONNECT_RATE_WINDOW", 60, minimum=1),
    },
    # Dedicated websocket connect throttle for presence endpoint.
    "ws_connect_presence": {
        "limit": env_int("WS_CONNECT_RATE_LIMIT_PRESENCE", 180, minimum=1),
        "window_seconds": env_int("WS_CONNECT_RATE_WINDOW_PRESENCE", 60, minimum=1),
    },
    # Emergency switch to disable websocket connect throttling globally.
    "ws_connect": {
        "disabled": env_bool("WS_CONNECT_RATE_LIMIT_DISABLED", False),
    },
}

USERNAME_MAX_LENGTH = env_int("USERNAME_MAX_LENGTH", 30, minimum=1)
if USERNAME_MAX_LENGTH > 150:
    raise ImproperlyConfigured("USERNAME_MAX_LENGTH должен быть <= 150.")
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
CHAT_MESSAGE_EDIT_WINDOW_SECONDS = env_int("CHAT_MESSAGE_EDIT_WINDOW_SECONDS", 900, minimum=0)
CHAT_MESSAGE_MAX_LENGTH = int(os.getenv("CHAT_MESSAGE_MAX_LENGTH", "1000"))
CHAT_MESSAGES_PAGE_SIZE = int(os.getenv("CHAT_MESSAGES_PAGE_SIZE", "50"))
CHAT_MESSAGES_MAX_PAGE_SIZE = int(os.getenv("CHAT_MESSAGES_MAX_PAGE_SIZE", "200"))
CHAT_WS_IDLE_TIMEOUT = int(os.getenv("CHAT_WS_IDLE_TIMEOUT", "600"))
CHAT_TARGET_REGEX = os.getenv("CHAT_TARGET_REGEX", r"^[A-Za-z0-9_@-]{1,60}$")

# -- Attachments --------------------------------------------------------
CHAT_ATTACHMENT_MAX_SIZE_MB = env_int("CHAT_ATTACHMENT_MAX_SIZE_MB", 10, minimum=1)
CHAT_ATTACHMENT_MAX_PER_MESSAGE = env_int("CHAT_ATTACHMENT_MAX_PER_MESSAGE", 10, minimum=1)
CHAT_ATTACHMENT_ALLOW_ANY_TYPE = env_bool("CHAT_ATTACHMENT_ALLOW_ANY_TYPE", True)
CHAT_ATTACHMENT_ALLOWED_TYPES = env_list("CHAT_ATTACHMENT_ALLOWED_TYPES", [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf", "text/plain", "video/mp4", "audio/mpeg", "audio/webm",
])
CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE = env_bool(
    "CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE",
    True,
)
CHAT_ATTACHMENT_UPLOAD_TTL_SECONDS = env_int(
    "CHAT_ATTACHMENT_UPLOAD_TTL_SECONDS",
    21600,
    minimum=60,
)
CHAT_ATTACHMENT_CHUNK_MIN_SIZE_KB = env_int(
    "CHAT_ATTACHMENT_CHUNK_MIN_SIZE_KB",
    512,
    minimum=64,
)
CHAT_ATTACHMENT_CHUNK_MAX_SIZE_MB = env_int(
    "CHAT_ATTACHMENT_CHUNK_MAX_SIZE_MB",
    8,
    minimum=1,
)
CHAT_ATTACHMENT_TARGET_CHUNKS = env_int(
    "CHAT_ATTACHMENT_TARGET_CHUNKS",
    256,
    minimum=1,
)
CHAT_THUMBNAIL_MAX_SIDE = env_int("CHAT_THUMBNAIL_MAX_SIDE", 400, minimum=50)
CHAT_THUMBNAIL_MAX_SOURCE_SIZE_MB = env_int(
    "CHAT_THUMBNAIL_MAX_SOURCE_SIZE_MB",
    25,
    minimum=1,
)
CHAT_THUMBNAIL_MAX_SOURCE_PIXELS = env_int(
    "CHAT_THUMBNAIL_MAX_SOURCE_PIXELS",
    50_000_000,
    minimum=1,
)
PRESENCE_TTL = int(os.getenv("PRESENCE_TTL", "40"))
PRESENCE_GRACE = int(os.getenv("PRESENCE_GRACE", "5"))
PRESENCE_HEARTBEAT = int(os.getenv("PRESENCE_HEARTBEAT", "20"))
PRESENCE_IDLE_TIMEOUT = int(os.getenv("PRESENCE_IDLE_TIMEOUT", "90"))
PRESENCE_TOUCH_INTERVAL = int(os.getenv("PRESENCE_TOUCH_INTERVAL", "30"))

DIRECT_INBOX_UNREAD_TTL = int(os.getenv("DIRECT_INBOX_UNREAD_TTL", str(30 * 24 * 60 * 60)))
DIRECT_INBOX_ACTIVE_TTL = int(os.getenv("DIRECT_INBOX_ACTIVE_TTL", "90"))
DIRECT_INBOX_HEARTBEAT = int(os.getenv("DIRECT_INBOX_HEARTBEAT", "20"))
DIRECT_INBOX_IDLE_TIMEOUT = int(os.getenv("DIRECT_INBOX_IDLE_TIMEOUT", "90"))

# -- Groups -------------------------------------------------------------
GROUP_INVITE_CODE_LENGTH = env_int("GROUP_INVITE_CODE_LENGTH", 12, minimum=8)
GROUP_MAX_INVITES_PER_ROOM = env_int("GROUP_MAX_INVITES_PER_ROOM", 50, minimum=1)
GROUP_MAX_PINNED_MESSAGES = env_int("GROUP_MAX_PINNED_MESSAGES", 100, minimum=1)
GROUP_DEFAULT_MAX_MEMBERS = env_int("GROUP_DEFAULT_MAX_MEMBERS", 200000, minimum=1)

AUDIT_RETENTION_DAYS = env_int("AUDIT_RETENTION_DAYS", 180, minimum=1)
AUDIT_API_DEFAULT_LIMIT = env_int("AUDIT_API_DEFAULT_LIMIT", 50, minimum=1)
AUDIT_API_MAX_LIMIT = env_int("AUDIT_API_MAX_LIMIT", 200, minimum=1)

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }


LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()


# -- SQLite PRAGMAs via connection signal ------------------------------
def _sqlite_pragmas(sender, connection, **kwargs):
    """Вспомогательная функция `_sqlite_pragmas` реализует внутренний шаг бизнес-логики.
    
    Args:
        sender: Параметр sender, используемый в логике функции.
        connection: Параметр connection, используемый в логике функции.
        **kwargs: Дополнительные именованные аргументы вызова.
    """
    if connection.vendor == "sqlite":
        cursor = connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA busy_timeout=30000;")


from django.db.backends.signals import connection_created  # noqa: E402

connection_created.connect(_sqlite_pragmas)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR" if TESTING else "WARNING",
            "propagate": False,
        },
        "chat_app_django.health": {
            "handlers": ["console"],
            "level": "CRITICAL" if TESTING else LOG_LEVEL,
            "propagate": False,
        },
        "chat": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "users": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "security.audit": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}


