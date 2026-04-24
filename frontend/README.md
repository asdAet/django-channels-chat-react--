# Devil Frontend

React SPA для Devil.

## Стек

- React 19
- TypeScript
- Vite
- React Router
- Zod
- Vitest
- Playwright

## Локальный запуск

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Локальный frontend dev server ожидает, что API уже доступен до запросов браузера в
`/api` или `/ws`.

Локальный dev server проксирует:

- `/api` на `VITE_BACKEND_ORIGIN` или `http://127.0.0.1:8000`;
- `/ws` на `VITE_WS_BACKEND_ORIGIN` или WebSocket origin, выведенный из `VITE_BACKEND_ORIGIN`.

## Скрипты

```powershell
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:css
npm run lint:css:fix
npm run check:dto-boundary
npm run test:unit
npm run test:coverage
npm run test:e2e
```

`dev`, `build` и unit-тесты автоматически генерируют manifest custom emoji. `npm run prepare:custom-emoji` нужен только для отдельной генерации manifest.

## Конфигурация

- `VITE_ENABLE_PWA=1` включает PWA build integration.
- `VITE_BACKEND_ORIGIN` задает HTTP-адрес backend для локального Vite proxy.
- `VITE_WS_BACKEND_ORIGIN` переопределяет WebSocket origin только в dev; обычно пустой, потому что выводится из `VITE_BACKEND_ORIGIN`.
- Runtime-лимиты и доступность OAuth загружаются из `GET /api/meta/client-config/`.

В production эти `VITE_*` origin-переменные не нужны: frontend открывает
WebSocket от текущего домена (`wss://<домен>/ws/...`), а nginx проксирует
`/ws/` во внутренний `backend:8000`.

## Маршруты

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

Chat targets вроде `/public`, `/@username`, user public id и group ref резолвятся через `POST /api/chat/resolve/`.

## Структура

```text
src/adapters/      HTTP API implementation
src/app/           App shell и routes
src/controllers/   UI orchestration
src/domain/        Interfaces и domain contracts
src/dto/           Zod codecs и boundary validation
src/entities/      Domain types
src/hooks/         Shared React hooks
src/pages/         Route pages
src/shared/        Common UI, config, auth, ws и utilities
src/widgets/       Feature UI blocks
src/styles/        CSS modules и global styles
```
