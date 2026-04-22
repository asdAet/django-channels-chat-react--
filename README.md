<div align="center">
  <img src="frontend/public/MINI-direct-logo-avatar.png" alt="Devil logo" width="180">
  <h1>Devil</h1>
  <p><strong>Full-stack real-time чат-платформа на Django, Channels, React и TypeScript</strong></p>
  <p>
    <a href="https://github.com/asdAet/django-channels-chat-react">

      <img src="https://myhits.vercel.app/api/hit/https%3A%2F%2Fgithub.com%2FasdAet%2Fdjango-channels-chat-react?label=%D0%BF%D1%80%D0%BE%D1%81%D0%BC%D0%BE%D1%82%D1%80%D1%8B&color=0d1117&size=small" alt="Счетчик просмотров репозитория">
    </a>
  </p>
  <p>Личные и групповые чаты, WebSocket presence, роли и права внутри комнат, вложения, подписанные media URL и production-ready observability.</p>
</div>

---

## Возможности

- Регистрация и вход по логину или email
- Google OAuth
- Личные и групповые чаты
- Online / presence и realtime-обновления по WebSocket
- Роли, права и overrides внутри комнат
- Вложения, thumbnails и подписанные media URL с TTL
- Аудит действий и административные журналы
- Production deployment через Docker Compose
- Встроенный monitoring и alerting

## Технологический стек

- Backend: `Python 3.11`, `Django`, `Django REST Framework`, `Channels`, `Redis`, `PostgreSQL`
- Frontend: `React 19`, `TypeScript`, `Vite`, `React Router`, `Zod`
- Testing: `pytest`, `Vitest`, `Playwright`
- Infra: `Docker Compose`, `Nginx`, `Prometheus`, `Grafana`, `Loki`, `Alertmanager`, `Grafana Alloy`

## Архитектурные принципы

- Внешняя навигация по чатам строится через публичные идентификаторы `publicRef` / `publicId`
- Внутренний транспорт работает только через `roomId`
- Канонический resolve внешней цели чата выполняется через `POST /api/chat/resolve/`
- WebSocket чата использует путь `/ws/chat/<room_id>/`, а inbox работает через `/ws/inbox/`
- Старые внешние маршруты вида `/direct/*` и `/rooms/*` не считаются каноническими
- Медиа отдаются по подписанным URL с ограниченным временем жизни

## Структура репозитория

```text

backend/                  Django-приложение и доменная логика
frontend/                 React-приложение
deploy/                   Nginx, TLS и observability-конфигурация
docs/                     Сгенерированная справочная документация
tools/                    Вспомогательные скрипты
docker-compose.prod.yml   Production compose
example.env               Пример production-конфигурации
```

Ключевые backend-модули:

- `backend/chat/` — REST и WebSocket логика чатов
- `backend/users/` — аутентификация, профиль, identity
- `backend/groups/` — группы, участники, инвайты, модерация
- `backend/friends/` — друзья, заявки и блокировки
- `backend/roles/` — роли и права
- `backend/presence/` — online / presence
- `backend/messages/` — сообщения, вложения, readers
- `backend/auditlog/` — аудит и административные логи

Ключевые frontend-модули:

- `frontend/src/app/` — app shell и маршрутизация
- `frontend/src/adapters/` — HTTP API слой
- `frontend/src/pages/` — страницы маршрутов
- `frontend/src/widgets/` — собранные UI-блоки
- `frontend/src/shared/` — общие хуки, утилиты, auth, ws, ui
- `frontend/src/dto/` — parsing и boundary-слой

## Требования

- `Python 3.11+`
- `Node.js 20+`
- `npm 10+`
- Для production: `Docker` и `Docker Compose`

## Локальная разработка

### Backend

```bash
cd backend
python -m venv .venv
```

Linux / macOS:

```bash
source .venv/bin/activate
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Установка и запуск:

```bash
pip install --upgrade pip
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Примечания:

- В debug-режиме `DJANGO_SECRET_KEY` генерируется автоматически, если не задан
- Если `REDIS_URL` не задан и включен debug, проект может использовать `InMemoryChannelLayer`

### Frontend

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

В dev-режиме frontend проксирует:

- `/api` -> `http://127.0.0.1:8000`
- `/ws` -> `ws://127.0.0.1:8000`

## Тесты и проверка качества

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm run lint
npm run lint:css
npm run check:dto-boundary
npm run test:unit
npm run build
```

### E2E

```bash
cd frontend
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

## Конфигурация

Production-конфигурация хранится в `.env`. За основу нужно брать [example.env](example.env).

Минимально важные переменные для production:

- `DJANGO_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CSRF_TRUSTED_ORIGINS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_PUBLIC_BASE_URL`
- `REDIS_URL` или стандартный docker-режим с `redis`

Если нужен прямой HTTPS через `nginx` и `certbot`, также обязательны:

- `NGINX_HTTPS_BIND=443`
- `NGINX_SERVER_NAMES`
- `NGINX_PRIMARY_DOMAIN`
- `TLS_DOMAINS`
- `TLS_LETSENCRYPT_EMAIL`

Если используется внешний TLS-прокси, оставляй:

- `NGINX_HTTPS_BIND=127.0.0.1:8443`

## Production deployment

### Основной runtime

Базовый production stack поднимается из [docker-compose.prod.yml](docker-compose.prod.yml):

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Этот стек поднимает:

- `backend`
- `nginx`
- `certbot`
- `redis`
- `postgres`

Перед запуском production нужны:

1. Заполненный `.env`
2. Открытые порты `80` и `443`
3. Корректный DNS, указывающий на сервер

### HTTPS

Поддерживаются два режима:

- Внешний TLS-прокси: `NGINX_HTTPS_BIND=127.0.0.1:8443`
- Прямой публичный HTTPS через `nginx`: `NGINX_HTTPS_BIND=443`

В режиме прямого HTTPS:

- `nginx` обслуживает `/.well-known/acme-challenge/`
- `certbot` выпускает и обновляет сертификат `Let's Encrypt`
- `nginx` подхватывает выпущенный сертификат автоматически

Если trusted-сертификат еще не получен, `nginx` может стартовать с fallback-сертификатом только для того, чтобы стек не падал. Такой сертификат не подходит для браузеров и `Google OAuth`.

## Observability

Полный monitoring stack поднимается overlay-файлом:

```bash
docker compose -f docker-compose.prod.yml -f deploy/observability/compose.yml up --build -d
```

Он добавляет:

- `Prometheus`
- `Grafana`
- `Loki`
- `Alertmanager`
- `Grafana Alloy`
- `node_exporter`
- `cAdvisor`
- `blackbox_exporter`
- `nginx_exporter`
- `postgres_exporter`
- `redis_exporter`

Особенности:

- `Grafana` может работать в двух режимах: только `localhost` или публично через `https://<domain>/grafana/`
- публичный `nginx` не отдает `/metrics`
- dashboards и datasources provisioned из репозитория

Доступ к Grafana:

- приватный режим: `ssh -L 3000:127.0.0.1:3000 <user>@<server>` и затем `http://127.0.0.1:3000`
- публичный режим: `https://<domain>/grafana/`

## Документация

Сгенерированная справочная документация лежит в `docs/generated/`:

- [docs/generated/backend-reference.md](docs/generated/backend-reference.md)
- [docs/generated/frontend-reference.md](docs/generated/frontend-reference.md)

Перегенерация:

```bash
python tools/generate_project_docs.py
```

## Что важно знать перед изменениями

- Канонический внешний вход в чат идет через `publicRef` / `publicId` и `/api/chat/resolve/`
- Внутренние REST и WebSocket операции используют `roomId`
- `ws/inbox` является текущим endpoint для inbox-сценария
- Подписанные media URL имеют TTL и не должны заменяться на публичные постоянные ссылки

## Лицензия

Лицензия в репозитории не объявлена. Если проект будет распространяться вне команды, лицензионные условия нужно определить отдельно.
