import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const backendPython =
  process.env.E2E_BACKEND_PYTHON ??
  (process.platform === "win32"
    ? ".\\.venv\\Scripts\\python.exe"
    : existsSync("../backend/.venv/Scripts/python.exe")
      ? ".venv/Scripts/python.exe"
      : "python3");
const backendPort = process.env.E2E_BACKEND_PORT ?? "8000";
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "5173";
const backendOrigin =
  process.env.E2E_BACKEND_ORIGIN ?? `http://127.0.0.1:${backendPort}`;
const backendWsOrigin =
  process.env.E2E_WS_BACKEND_ORIGIN ?? `ws://127.0.0.1:${backendPort}`;
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: frontendOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: `${backendPython} manage.py migrate && ${backendPython} manage.py shell -c "from users.models import SecurityRateLimitBucket; SecurityRateLimitBucket.objects.all().delete()" && ${backendPython} manage.py runserver 127.0.0.1:${backendPort}`,
      url: `${backendOrigin}/api/health/live/`,
      cwd: "../backend",
      env: {
        ...process.env,
        E2E_BACKEND_ORIGIN: backendOrigin,
        E2E_WS_BACKEND_ORIGIN: backendWsOrigin,
        AUTH_RATE_LIMIT: "10000",
        AUTH_RATE_WINDOW: "60",
        AUTH_RATE_LIMIT_DISABLED: "1",
        CHAT_MESSAGE_RATE_LIMIT: "10000",
        CHAT_MESSAGE_RATE_WINDOW: "60",
        CHAT_MESSAGE_RATE_LIMIT_DISABLED: "1",
        WS_CONNECT_RATE_LIMIT: "10000",
        WS_CONNECT_RATE_LIMIT_PRESENCE: "10000",
        WS_CONNECT_RATE_LIMIT_DISABLED: "1",
      },
      // Always restart backend for e2e to guarantee deterministic env/rate-limit settings.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${frontendPort}`,
      url: frontendOrigin,
      cwd: ".",
      env: {
        ...process.env,
        E2E_BACKEND_ORIGIN: backendOrigin,
        E2E_WS_BACKEND_ORIGIN: backendWsOrigin,
        VITE_BACKEND_ORIGIN: backendOrigin,
        VITE_WS_BACKEND_ORIGIN: backendWsOrigin,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile-layout\.spec\.ts$/,
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
      testMatch: /mobile-layout\.spec\.ts$/,
    },
  ],
});
