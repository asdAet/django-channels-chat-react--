# EchoChat

Реалтайм‑чат на **Django Channels + React (Vite)** с публичными и приватными комнатами, профилями и WebSocket‑присутствием.

## Возможности
- Публичная комната (чтение для гостей, запись для авторизованных)
- Приватные комнаты по slug
- История сообщений
- Онлайн‑присутствие и список пользователей
- Профили с аватаром
- Rate‑limit сообщений и авторизации

## Стек
- **Backend:** Django 4, Channels, Daphne
- **Frontend:** React + TypeScript, Vite
- **Infra:** Nginx, PostgreSQL, Redis, Docker Compose

## Структура проекта
- `backend/` — Django + Channels
- `frontend/` — React интерфейс
- `deploy/` — Nginx конфиг и прод‑настройки
- `docker-compose.prod.yml` — production compose

## Быстрый старт (локально)

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

Vite проксирует `/api` и `/ws` на `http://localhost:8000`.

## Запуск в Docker (production)

1) Создай `.env` на базе `example.env`:
```bash
cp example.env .env
# Windows
# copy example.env .env
```

2) Запусти сборку:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### HTTPS
Если используешь HTTPS на собственном сервере, положи сертификаты в:
```
deploy/certs/fullchain.pem
deploy/certs/privkey.pem
```

## Переменные окружения

Минимальные:
| Переменная | Описание |
| --- | --- |
| `DJANGO_SECRET_KEY` | Секретный ключ Django |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL |
| `POSTGRES_DB` | Имя БД |
| `POSTGRES_USER` | Пользователь БД |

Дополнительно:
| Переменная | Описание |
| --- | --- |
| `DJANGO_ALLOWED_HOSTS` | Список доменов |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Доверенные источники CSRF |
| `DJANGO_DEBUG` | Режим отладки |
| `REDIS_URL` | Redis URL для Channels |
| `DATABASE_URL` | Альтернатива DJANGO_DB_* |

## API

### REST
- `GET /api/auth/csrf/`
- `GET /api/auth/session/`
- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `GET/POST /api/auth/profile/`
- `GET /api/chat/public-room/`
- `GET /api/chat/rooms/<slug>/`
- `GET /api/chat/rooms/<slug>/messages/?limit=&before=`

### WebSocket
- `ws://<host>/ws/chat/<room>/`
- `ws://<host>/ws/presence/`

## Роли
В Django доступны стандартные роли:
- `is_staff`
- `is_superuser`

Для UI‑кнопок показывай их только при `user.is_staff === true`.

## Лицензия
Не указана.
