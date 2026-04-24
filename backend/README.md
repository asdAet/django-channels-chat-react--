# Devil Backend

Django backend для API, WebSocket realtime и доменной логики Devil.

## Стек

- Python 3.11
- Django
- Django REST Framework
- Channels
- Redis channel layer
- SQLite для локальной разработки
- PostgreSQL для production
- pytest

## Локальный запуск

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

В debug-режиме используется SQLite по умолчанию. Если `DJANGO_SECRET_KEY` не задан, он генерируется автоматически.

## Конфигурация

Локальные env-файлы:

- корневой `.env`: по умолчанию загружается безопасный набор переменных
- `backend/.env`: загружается после корневого файла и может переопределять локальные настройки backend

`DJANGO_LOAD_ROOT_ENV_ALL=1` нужен только если корневой `.env` предназначен для локального backend-процесса.

Основные переменные:

- `DJANGO_DEBUG`
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_PUBLIC_BASE_URL`
- `DATABASE_URL` или `DJANGO_DB_*`
- `REDIS_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Если `REDIS_URL` не задан в debug-режиме, проект может использовать in-memory channel layer.

## Проверки

```powershell
pytest
```

## HTTP

- `/api/`
- `/api/health/live/`
- `/api/health/ready/`
- `/api/meta/client-config/`
- `/api/auth/`
- `/api/profile/`
- `/api/chat/`
- `/api/friends/`
- `/api/groups/`
- `/api/admin/audit/`
- `/metrics/`

## WebSocket

- `/ws/chat/`
- `/ws/inbox/`
- `/ws/presence/`

## Модули

```text
auditlog/         Аудит и admin history
chat/             Chat API, сообщения, вложения, WebSocket transport
direct_inbox/     WebSocket-состояние direct inbox
friends/          Заявки в друзья и блокировки
groups/           Группы, инвайты и модерация
messages/         Модели сообщений и вложений
presence/         Presence пользователей
roles/            Роли комнат и permission overrides
rooms/            Модели комнат
users/            Auth, профили и публичная identity
```

## Production

Production запускается из корня через `docker-compose.prod.yml`. Backend-контейнер выполняет миграции, собирает static files и стартует Daphne через `backend/entrypoint.sh`.
