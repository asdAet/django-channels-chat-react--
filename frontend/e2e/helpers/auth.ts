import { expect, type Page } from "@playwright/test";

const RETRYABLE_AUTH_STATUSES = new Set([429, 500, 502, 503, 504]);

function getRetryDelayMs(
  response: { status(): number; headers(): Record<string, string> },
  attempt: number,
): number {
  const retryAfter = Number(response.headers()["retry-after"] || "");
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  if (response.status() === 429) {
    return 15_000 * attempt;
  }

  return 400 * attempt;
}

async function isSessionAuthenticated(page: Page): Promise<boolean> {
  const response = await page.request.get("/api/auth/session/");
  if (!response.ok()) {
    return false;
  }

  const payload = (await response.json().catch(() => null)) as
    | { authenticated?: boolean }
    | null;
  return payload?.authenticated === true;
}

async function expectAuthenticatedEntry(page: Page): Promise<void> {
  await expect(page).toHaveURL("/public", { timeout: 15_000 });
}

async function submitAuthWithRetry(
  page: Page,
  endpointPath: string,
  action: string,
): Promise<void> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(endpointPath) &&
        response.request().method() === "POST",
    );
    await page.getByTestId("auth-submit-button").click();
    const response = await responsePromise;

    if (response.ok()) {
      return;
    }

    if (!RETRYABLE_AUTH_STATUSES.has(response.status()) || attempt === 4) {
      const body = await response.text().catch(() => "");
      throw new Error(`${action} failed: ${response.status()} ${body}`);
    }

    await page.waitForTimeout(getRetryDelayMs(response, attempt));
  }
}

export async function loginWithRetry(
  page: Page,
  identifier: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("auth-identifier-input").fill(identifier);
  await page.getByTestId("auth-password-input").fill(password);
  await submitAuthWithRetry(page, "/api/auth/login/", "login");
  await expectAuthenticatedEntry(page);
}

export async function ensureAuthenticated(
  page: Page,
  identifier: string,
  password: string,
): Promise<void> {
  if (await isSessionAuthenticated(page)) {
    return;
  }

  await loginWithRetry(page, identifier, password);
  await expect
    .poll(async () => isSessionAuthenticated(page), { timeout: 15_000 })
    .toBe(true);
}

export async function registerWithRetry(
  page: Page,
  identifier: string,
  password: string,
): Promise<void> {
  const normalized = identifier.trim().toLowerCase();
  const login = normalized.includes("@")
    ? normalized.split("@", 1)[0]
    : normalized;
  const name = login || "user";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.goto("/register");
    await page.getByTestId("auth-login-input").fill(login);
    await page.getByTestId("auth-name-input").fill(name);
    await page.getByTestId("auth-password-input").fill(password);
    await page.getByTestId("auth-confirm-input").fill(password);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/register/") &&
        response.request().method() === "POST",
    );
    await page.getByTestId("auth-submit-button").click();
    const response = await responsePromise;

    if (response.status() === 201) {
      await expectAuthenticatedEntry(page);
      // Rebuild client auth state from the fresh session cookie before protected flows.
      await page.reload();
      await ensureAuthenticated(page, login, password);
      return;
    }

    if (RETRYABLE_AUTH_STATUSES.has(response.status()) && attempt < 4) {
      await page.waitForTimeout(getRetryDelayMs(response, attempt));
      continue;
    }

    const body = await response.text().catch(() => "");
    throw new Error(`register failed: ${response.status()} ${body}`);
  }
}

type CsrfPayload = {
  csrfToken?: string;
};

async function fetchCsrfToken(page: Page): Promise<string | null> {
  const response = await page.request.get("/api/auth/csrf/");
  if (!response.ok()) return null;
  const payload = (await response.json().catch(() => null)) as CsrfPayload | null;
  const token = typeof payload?.csrfToken === "string" ? payload.csrfToken.trim() : "";
  return token.length > 0 ? token : null;
}

export async function logoutWithRetry(page: Page): Promise<void> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const csrfToken = await fetchCsrfToken(page);
    const response = await page.request.post("/api/auth/logout/", {
      headers: csrfToken ? { "X-CSRFToken": csrfToken } : undefined,
    });

    if (response.ok() || response.status() === 401) {
      return;
    }

    if (!RETRYABLE_AUTH_STATUSES.has(response.status()) || attempt === 4) {
      const body = await response.text().catch(() => "");
      throw new Error(`logout failed: ${response.status()} ${body}`);
    }

    await page.waitForTimeout(300 * attempt);
  }
}
