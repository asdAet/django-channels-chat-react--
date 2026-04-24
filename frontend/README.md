# Devil Frontend

SPA-клиент на `React + TypeScript + Vite` для `Devil`.

## Что важно сейчас

- Chat routing prefixless: используется `/:target`
- Канонические chat routes:
  - `/public`
- `/@username`
- `/<userPublicId>`
- `/<groupPublicRef>`
- `/<groupPublicId>`
- Внешний target сначала резолвится через `POST /api/chat/resolve/`, затем весь runtime работает по внутреннему `roomId`
- Chat realtime использует единый websocket `/ws/chat/`, а смена комнаты происходит через `set_active_room`
- Inbox диалогов использует `GET /api/chat/inbox/` и `ws://<host>/ws/inbox/`

## Локальный запуск

```bash
npm install
npm run dev
```

Vite проксирует:

- `/api` -> `http://127.0.0.1:8000`
- `/ws` -> `ws://127.0.0.1:8000`

Для production build:

```bash
npm run build
```

## Структура

- `src/adapters` — HTTP API layer
- `src/app` — shell и routing
- `src/controllers` — orchestration layer
- `src/dto` — Zod boundary
- `src/entities` — доменные типы
- `src/pages` — route pages
- `src/shared` — shared libs, ui, auth, ws
- `src/widgets` — composed UI blocks

## Основные frontend routes

- `/`
- `/login`
- `/register`
- `/profile`
- `/settings`
- `/friends`
- `/groups`
- `/invite/:code`
- `/users/:ref`
- `/:target`

## Основные chat API, которые использует frontend

- `POST /api/chat/resolve/`
- `GET /api/chat/inbox/`
- `GET /api/chat/<room_id>/`
- `GET /api/chat/<room_id>/messages/`
- `POST /api/chat/<room_id>/attachments/`
- `POST /api/chat/<room_id>/read/`
- `GET /api/chat/search/global/`

## Качество

```bash
npm run lint
npm run lint:css
npm run check:dto-boundary
npm run test:unit
npm run build
npm run test:e2e
```
