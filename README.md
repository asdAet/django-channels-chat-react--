# Devil Resting

Актуальный README для текущего состояния проекта (backend + frontend + deploy).

## Что это
`Devil Resting` — real-time чат-платформа на `Django + Channels + React + TypeScript`.

Проект поддерживает:
- авторизацию (login/email + password);
- Google OAuth;
- публичные `@handle` и fallback `public_id`;
- direct-чаты и групповые чаты;
- роли/права в комнатах;
- присутствие (online/guest);
- вложения в сообщениях;
- защищенную отдачу медиа через подписанные URL.

## Технологический стек
- Backend: `Python 3.11`, `Django 4.1`, `Django REST Framework`, `Channels`, `Redis`, `PostgreSQL`.
- Frontend: `React 19`, `TypeScript`, `Vite`, `React Router`, `Zod`, `Vitest`, `Playwright`.
- Infra: `Docker Compose`, `Nginx`, TLS termination.

## Ключевая доменная модель (identity + public refs)

### Внутренние идентификаторы
- Все внутренние связи (membership, сообщения, read-state, permissions, WS transport) работают по внутренним ID.
- Для комнат transport строго по `room_id`:
  - REST: `/api/chat/rooms/{room_id}/...`
  - WS: `/ws/chat/{room_id}/`

### Публичная идентичность
- Пользователь:
  - `UserIdentityCore.public_id` — положительный 10-значный numeric string.
  - `PublicHandle.handle` (опционально) — публичный username.
- Группа:
  - `Room.public_id` — отрицательный 10-значный numeric string.
  - `PublicHandle.handle` (опционально) — публичный username.
- Глобальная уникальность `@handle` для users и groups обеспечивается таблицей `PublicHandle`.

### Таблицы identity
- `UserIdentityCore(user OneToOne, public_id unique, created_at, updated_at)`
- `LoginIdentity(user OneToOne, login_normalized unique, password_hash, created_at, updated_at)`
- `EmailIdentity(user OneToOne, email_normalized unique nullable, email_verified, created_at, updated_at)`
- `OAuthIdentity(user FK, provider, provider_user_id, ..., unique(provider, provider_user_id))`
- `PublicHandle(handle unique, user OneToOne nullable, room OneToOne nullable, XOR-check owner)`

### Public resolver
`GET /api/public/resolve/{ref}` резолвит:
- `@handle`
- `handle`
- `public_id`

в канонический ответ вида:
- `ownerType`: `user | group`
- `ownerId`: внутренний ID
- `publicRef`, `handle`, `publicId`

## Архитектура репозитория

```text
backend/
  auditlog/         # аудит
  chat/             # chat REST API, WS-помощники, search, attachments
  chat_app_django/  # settings, urls, asgi, health, meta API
  direct_inbox/     # WS inbox для direct unread/state
  friends/          # friend requests/blocking
  groups/           # group domain + invites + moderation
  messages/         # message entities + attachments + reads
  presence/         # online/guest presence
  roles/            # role/permission model и API
  rooms/            # Room entity (public/private/direct/group)
  users/            # auth/profile/identity/public resolve

frontend/src/
  adapters/         # HTTP API layer
  app/              # app shell + routes
  controllers/      # orchestration layer
  domain/           # интерфейсы use-case
  dto/              # Zod boundary (HTTP/WS/route/storage)
  entities/         # доменные типы
  hooks/            # react hooks
  pages/            # route pages
  shared/           # shared libs, auth, presence, ws, ui
  widgets/          # composed UI blocks

deploy/
  nginx.conf
  nginx.Dockerfile
```

## API карта (основное)

### Health / meta
- `GET /api/health/live/`
- `GET /api/health/ready/`
- `GET /api/meta/client-config/` — runtime-лимиты/политики для frontend.

### Auth
- `GET /api/auth/csrf/`
- `GET /api/auth/session/`
- `GET /api/auth/presence-session/`
- `GET /api/auth/password-rules/`
- `POST /api/auth/register/`
  - payload: `{ login, password, passwordConfirm, name, username?, email? }`
- `POST /api/auth/login/`
  - payload: `{ identifier, password }`
  - `identifier = login | email`
- `POST /api/auth/oauth/google/`
  - payload: `{ idToken?, accessToken?, username? }`
  - минимум один токен обязателен.
- `POST /api/auth/logout/`
- `GET /api/auth/media/{path}?exp={unix}&sig={hmac}` — signed media access.

### Profile / security / public
- `GET /api/profile/`
- `PATCH /api/profile/`
- `PATCH /api/profile/handle/` — `{ username }`
- `GET /api/settings/security/`
- `PATCH /api/settings/security/`
  - email/verify/password/unlink OAuth.
- `GET /api/public/resolve/{ref}`

### Chat
- `GET /api/chat/public-room/`
- `POST /api/chat/direct/start/` — `{ ref }`
- `GET /api/chat/direct/chats/`
- `GET /api/chat/search/global/?q=...`
- `GET /api/chat/rooms/unread/`
- `GET /api/chat/rooms/{room_id}/`
- `GET /api/chat/rooms/{room_id}/messages/`
- `POST /api/chat/rooms/{room_id}/attachments/`
- `POST /api/chat/rooms/{room_id}/read/`
- reactions/edit/delete/search messages
- roles/overrides/permissions под `/api/chat/rooms/{room_id}/...`

### Friends
- `/api/friends/` + requests/block/unblock

### Groups
- `/api/groups/` CRUD/list
- `/api/groups/{room_id}/...` members/moderation/invites/pins/ownership
- `/api/invite/{code}/` preview
- `/api/invite/{code}/join/`

### Audit
- `/api/admin/audit/events/`
- `/api/admin/audit/actions/`
- `/api/admin/audit/users/{user_id}/username-history/`

## WebSocket endpoints
- `ws(s)://<host>/ws/chat/{room_id}/`
- `ws(s)://<host>/ws/direct/inbox/`
- `ws(s)://<host>/ws/presence/`

Замечания:
- `chat` и `direct` требуют активной сессии и прав доступа.
- `presence` работает и для гостя (через `presence-session` bootstrap).
- frontend использует reconnect с backoff (`useReconnectingWebSocket`).

## Frontend маршруты
- `/` home
- `/login`
- `/register`
- `/profile`
- `/settings`
- `/friends`
- `/groups`
- `/invite/:code`
- `/direct`
- `/direct/:ref`
- `/users/:ref`
- `/rooms/:roomRef`

`roomRef` в UI: `public` или положительный room id.

## Вложения и типы файлов
По умолчанию backend разрешает любые MIME-типы:
- `CHAT_ATTACHMENT_ALLOW_ANY_TYPE=1`

Если выключить (`0`), применяется allowlist `CHAT_ATTACHMENT_ALLOWED_TYPES`.

Дополнительно:
- максимальный размер одного файла: `CHAT_ATTACHMENT_MAX_SIZE_MB`
- максимум файлов в сообщении: `CHAT_ATTACHMENT_MAX_PER_MESSAGE`
- физическое удаление файлов при удалении сообщения: `CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE` (`1`/`0`)
- есть fallback-обработка неизвестных multipart-ключей.

## Локальный запуск

## Требования
- `Python 3.11+`
- `Node.js 20+`
- (опционально) `Redis`

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Примечание: в `DEBUG` допускается in-memory channel layer, если Redis не задан.

## Frontend

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Vite proxy:
- `/api` -> `http://localhost:8000`
- `/ws` -> `ws://localhost:8000`

## Тесты и качество

## Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
coverage run --rcfile=.coveragerc -m pytest
coverage report --rcfile=.coveragerc
```

## Frontend

```powershell
cd frontend
npm ci
npm run lint
npm run check:dto-boundary
npm run test:coverage
npm run build
```

## E2E

```powershell
cd frontend
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

CI pipeline: `.github/workflows/test.yml`.

## Конфигурация окружения

Минимум для production:
- `DJANGO_SECRET_KEY`
- `POSTGRES_PASSWORD` (и DB параметры)
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `REDIS_URL` (или явно разрешить in-memory, не рекомендуется)
- TLS-сертификаты для nginx

Часто используемые переменные:
- `GOOGLE_OAUTH_CLIENT_ID`
- `AUTH_RATE_LIMIT`, `AUTH_RATE_WINDOW`
- `WS_CONNECT_RATE_LIMIT`, `WS_CONNECT_RATE_WINDOW`
- `CHAT_MESSAGE_MAX_LENGTH`
- `CHAT_ATTACHMENT_MAX_SIZE_MB`, `CHAT_ATTACHMENT_MAX_PER_MESSAGE`, `CHAT_ATTACHMENT_ALLOW_ANY_TYPE`, `CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE`
- `DJANGO_MEDIA_URL_TTL_SECONDS`, `DJANGO_MEDIA_SIGNING_KEY`

## Production deployment

`docker-compose.prod.yml` поднимает:
- `backend` (Daphne)
- `nginx`
- `redis`
- `postgres`

Запуск:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Nginx:
- проксирует `/api/` и `/ws/` в backend;
- отдает frontend SPA из `/usr/share/nginx/html`;
- `/media/` закрыт снаружи;
- `/_protected_media/` используется только internal redirect.

TLS-файлы должны лежать в `deploy/certs/`:
- `fullchain.pem`
- `privkey.pem`

## Частые проблемы

## Google OAuth не работает
Проверьте:
- заполнен ли `GOOGLE_OAUTH_CLIENT_ID`;
- совпадают ли Authorized origins в Google Cloud;
- нет ли блокировщиков (`ERR_BLOCKED_BY_CLIENT`, FedCM/OneTap блокировки);
- запускается ли frontend по origin, разрешенному в OAuth-клиенте.

## WS 403 / reconnect loop
Проверьте:
- авторизацию (cookie-сессия);
- права доступа к комнате;
- корректный `room_id` в URL;
- `ALLOWED_HOSTS`, CORS/CSRF и proxy headers в проде.

## Медиа не открывается
Проверьте:
- URL должен быть подписан (`exp` + `sig`);
- TTL не истек;
- файл физически существует в storage.

## Attachment upload 400
Проверьте:
- количество файлов (`CHAT_ATTACHMENT_MAX_PER_MESSAGE`);
- размер файла (`CHAT_ATTACHMENT_MAX_SIZE_MB`);
- MIME-policy (`CHAT_ATTACHMENT_ALLOW_ANY_TYPE`/allowlist).
- политика физического удаления файлов при удалении сообщения (`CHAT_ATTACHMENT_DELETE_FILES_ON_MESSAGE_DELETE`).

## Что важно помнить при разработке
- Внутренний transport чатов строго `room_id`-based.
- `@username` не участвует в auth.
- Публичные ссылки должны идти через `PublicHandle`/`public_id` и `/api/public/resolve/{ref}`.
- Frontend DTO boundary (Zod) обязателен для внешних данных.

## Todo
- Смена пароля (отдельный UX-поток с проверкой текущего пароля, кроме OAuth-only аккаунтов).
- Восстановление доступа к аккаунту с отправкой временного нового пароля на email.
- Смена почты с подтверждением новой почты (double opt-in + ограничение частоты запросов).
- Установка почты для OAuth-only аккаунтов с обязательным подтверждением.

### Идеи для развития
- 2FA для входа.
- Сессии и устройства: список активных сессий, принудительный logout по устройствам.
- E2E-шифрование direct-чатов (опционально) с безопасным хранением ключей.
- Версионирование сообщений и прозрачная история правок.
- Расширенный поиск: фильтры по вложениям, автору, диапазону дат.
- Уведомления (web push/email) с гибкими пользовательскими настройками.
- Базовая anti-spam/anti-abuse модель (rate, reputation, challenge-механики).
