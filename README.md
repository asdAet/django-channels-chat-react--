# EchoChat

Realtime chat on **Django Channels + React (Vite)** with public/private rooms, profiles, and WebSocket presence.

## Features
- Public room (guests can read, only authorized users can write)
- Private rooms by slug with uniqueness check
- Message history with day separators (local user time)
- Presence: online users + guests (guests counted by IP, heartbeat + TTL)
- User profiles: avatar, bio (up to 1000 chars), registration date
- Open profile by clicking an avatar
- Rate limits for auth and messages
- Django admin (manage users/messages/rooms, edit message timestamps)

## Stack
- **Backend:** Django 4, Channels, Daphne
- **Frontend:** React + TypeScript, Vite
- **Infra:** Nginx, PostgreSQL, Redis, Docker Compose

## Project structure
- `backend/` - Django + Channels
- `frontend/` - React UI
- `deploy/` - Nginx config and prod setup
- `docker-compose.prod.yml` - production compose

## Local development

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` and `/ws` to `http://localhost:8000`.

## Docker (production)

1) Create `.env` from `example.env`:
```bash
cp example.env .env
# Windows
# copy example.env .env
```

2) Build and run:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### HTTPS
Place certificates here:
```
deploy/certs/fullchain.pem
deploy/certs/privkey.pem
```

> Avatar upload limits are controlled by `DJANGO_UPLOAD_MAX_MB` and `client_max_body_size` in `deploy/nginx.conf`.

## Environment variables

Minimal:
| Variable | Description |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django secret key |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |

Recommended:
| Variable | Description |
| --- | --- |
| `DJANGO_ALLOWED_HOSTS` | Allowed domains and IPs |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | CSRF trusted origins |
| `DJANGO_DEBUG` | Debug mode |
| `REDIS_URL` | Redis URL for Channels and cache |
| `DATABASE_URL` | Alternative to `DJANGO_DB_*` |
| `DJANGO_RELAX_PASSWORDS` | Relax password rules in dev |
| `DJANGO_UPLOAD_MAX_MB` | Upload limit in MB |
| `PRESENCE_TTL` | Presence TTL (seconds) |
| `PRESENCE_GRACE` | Presence grace window (seconds) |
| `AUTH_RATE_LIMIT` | Auth rate limit |
| `AUTH_RATE_WINDOW` | Auth window (seconds) |
| `CHAT_MESSAGE_MAX_LENGTH` | Max message length |
| `CHAT_MESSAGE_RATE_LIMIT` | Message rate limit |
| `CHAT_MESSAGE_RATE_WINDOW` | Message window (seconds) |
| `CHAT_ROOM_SLUG_REGEX` | Room slug regex |

## API

### REST
- `GET /api/auth/csrf/`
- `GET /api/auth/session/`
- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `GET /api/auth/password-rules/`
- `GET/POST /api/auth/profile/`
- `GET /api/auth/users/<username>/`
- `GET /api/chat/public-room/`
- `GET /api/chat/rooms/<slug>/`
- `GET /api/chat/rooms/<slug>/messages/?limit=&before=`

### WebSocket
- `ws://<host>/ws/chat/<room>/`
- `ws://<host>/ws/presence/`

## Admin
Admin is available at `/admin/`. Create a superuser:
```bash
python manage.py createsuperuser
```

## Roles
Django built-in roles:
- `is_staff`
- `is_superuser`

Show admin-only UI when `user.is_staff === true`.

## License
Not specified.
