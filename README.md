# Devil Resting

Актуальный README для текущего состояния проекта.

## Что это
`Devil Resting` — real-time чат-платформа на `Django + Channels + React + TypeScript`.

Проект поддерживает:
- авторизацию по login/email + password;
- Google OAuth;
- публичные идентификаторы пользователей и групп (`publicRef`, `publicId`);
- личные и групповые чаты;
- роли и права в комнатах;
- online/presence;
- вложения в сообщениях;
- защищённую отдачу медиа через подписанные URL.

## Технологический стек
- Backend: `Python 3.11+`, `Django`, `Django REST Framework`, `Channels`, `Redis`, `PostgreSQL`
- Frontend: `React 19`, `TypeScript`, `Vite`, `React Router`, `Zod`, `Vitest`, `Playwright`
- Infra: `Docker Compose`, `Nginx`

## Ключевая модель идентичности и чатов

### Внутренние идентификаторы
- Все room-scoped операции работают по внутреннему `roomId`.
- REST chat endpoints: `/api/chat/<room_id>/...`
- WebSocket чата: `/ws/chat/<room_id>/`

### Публичные идентификаторы
- Пользователи и группы открываются по внешним `publicRef` / `publicId`.
- `room.slug` удалён из рабочей модели и не используется для навигации.
- `roomId` — внутренний идентификатор транспорта и API.
- `publicRef/publicId` — внешний адрес для навигации и resolve.

### Prefixless chat routing
Frontend больше не использует `/direct/*` и `/rooms/*`.

Канонические chat routes:
- `/public` — публичный чат
- `/@username` — direct по handle пользователя
- `/<userPublicId>` — direct по публичному id пользователя
- `/<groupPublicRef>` — группа по публичному ref
- `/<groupPublicId>` — группа по публичному id

Зарезервированные route’ы не перехватываются chat resolver’ом:
- `/`
- `/login`
- `/register`
- `/profile`
- `/settings`
- `/friends`
- `/groups`
- `/invite/:code`
- `/users/:ref`

## Актуальная API карта

### Health / meta
- `GET /api/health/live/`
- `GET /api/health/ready/`
- `GET /api/meta/client-config/`

### Auth / profile / public resolve
- `GET /api/auth/csrf/`
- `GET /api/auth/session/`
- `GET /api/auth/presence-session/`
- `GET /api/auth/password-rules/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/oauth/google/`
- `GET /api/profile/`
- `PATCH /api/profile/`
- `PATCH /api/profile/handle/`
- `GET /api/settings/security/`
- `PATCH /api/settings/security/`
- `GET /api/public/resolve/{ref}`

### Chat
- `POST /api/chat/resolve/` — резолвит внешний chat target в комнату
- `GET /api/chat/inbox/` — direct inbox
- `GET /api/chat/unread/`
- `GET /api/chat/search/global/`
- `GET /api/chat/<room_id>/`
- `GET /api/chat/<room_id>/messages/`
- `GET /api/chat/<room_id>/messages/search/`
- `GET /api/chat/<room_id>/messages/<message_id>/`
- `GET /api/chat/<room_id>/messages/<message_id>/readers/`
- `POST /api/chat/<room_id>/attachments/`
- `POST /api/chat/<room_id>/read/`
- room roles / overrides / permissions под `/api/chat/<room_id>/...`

### Friends
- `/api/friends/`
- `/api/friends/requests/...`
- `/api/friends/block/...`

### Groups
- `POST /api/groups/`
- `GET /api/groups/public/`
- `GET /api/groups/my/`
- `GET /api/groups/<room_id>/`
- members / invites / requests / pins / transfer ownership под `/api/groups/<room_id>/...`
- invite preview/join:
  - `GET /api/invite/{code}/`
  - `POST /api/invite/{code}/join/`

### Audit
- `/api/admin/audit/events/`
- `/api/admin/audit/actions/`
- `/api/admin/audit/users/{user_id}/username-history/`

## WebSocket endpoints
- `ws://<host>/ws/chat/<room_id>/`
- `ws://<host>/ws/inbox/`
- `ws://<host>/ws/presence/`

## Структура репозитория

```text
backend/
  auditlog/         # аудит
  chat/             # chat REST API, search, attachments
  chat_app_django/  # settings, urls, asgi, health, meta API
  direct_inbox/     # direct inbox websocket
  friends/          # friends API
  groups/           # groups domain + invites + moderation
  messages/         # messages + attachments + reads
  presence/         # online / guest presence
  roles/            # роли и права
  rooms/            # Room entity
  users/            # auth / profile / identity

frontend/src/
  adapters/         # HTTP API layer
  app/              # app shell + routes
  controllers/      # orchestration layer
  domain/           # интерфейсы use-case
  dto/              # boundary parsing (HTTP / WS / route)
  entities/         # доменные типы
  hooks/            # React hooks
  pages/            # route pages
  shared/           # shared libs / ui / ws / auth
  widgets/          # composed UI blocks
```

## Локальный запуск

### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Vite proxy:
- `/api` -> `http://127.0.0.1:8000`
- `/ws` -> `ws://127.0.0.1:8000`

## Тесты и качество

### Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

### Frontend
```powershell
cd frontend
npm ci
npm run lint
npm run lint:css
npm run check:dto-boundary
npm run test:unit
npm run build
```

### E2E
```powershell
cd frontend
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

## Production
Основной compose-файл: `docker-compose.prod.yml`

Поднимает:
- `backend`
- `nginx`
- `redis`
- `postgres`

Запуск:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Важные замечания
- Внутренний транспорт чатов строго `roomId`-based.
- Внешняя навигация строится только через `publicRef/publicId` и `/api/chat/resolve/`.
- Старые `/direct/*` и `/rooms/*` считаются legacy и больше не являются каноническими путями.
- `ws/inbox` заменил старый direct inbox path.
- Для медиа используются подписанные URL с TTL.
