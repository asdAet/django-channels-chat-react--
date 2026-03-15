import { expect, test, type Locator, type Page } from "@playwright/test";

import { loginWithRetry, registerWithRetry } from "./helpers/auth";

const hasNoHorizontalOverflow = async (page: Page) =>
  page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= window.innerWidth + 1;
  });

const isElementInViewport = async (locator: Locator) =>
  locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom <= window.innerHeight && rect.top >= 0;
  });

async function register(page: Page, username: string, password: string) {
  await registerWithRetry(page, username, password);
}

async function login(page: Page, identifier: string, password: string) {
  await loginWithRetry(page, identifier, password);
}

test("core routes have no horizontal overflow", async ({ page }) => {
  const routes = ["/", "/login", "/register", "/rooms/public"];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    await expect.poll(async () => hasNoHorizontalOverflow(page)).toBeTruthy();
  }
});

test("mobile shell switches between list and chat without clipping", async ({
  page,
}) => {
  const username = `m${Math.random().toString(36).slice(2, 9)}`;
  const password = "pass12345";

  await register(page, username, password);
  await page.goto("/rooms/public");

  const chatInput = page.locator("textarea").first();
  const joinCallout = page.getByTestId("group-join-callout");
  const readOnlyCallout = page.getByTestId("group-readonly-callout");
  const authCallout = page.getByTestId("chat-auth-callout");

  await expect
    .poll(
      async () =>
        (await chatInput.isVisible()) ||
        (await joinCallout.isVisible()) ||
        (await readOnlyCallout.isVisible()) ||
        (await authCallout.isVisible()),
      { timeout: 15_000 },
    )
    .toBeTruthy();
  await expect.poll(async () => hasNoHorizontalOverflow(page)).toBeTruthy();

  const isNarrowViewport = await page.evaluate(() => window.innerWidth <= 768);
  const searchInput = page.locator("aside input[aria-label]").first();
  if (isNarrowViewport) {
    await expect(searchInput).toBeHidden();
    const backButton = page
      .locator('button[aria-label]')
      .filter({
        has: page.locator('polyline[points="15 18 9 12 15 6"]'),
      })
      .first();
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(page).toHaveURL("/");
    await expect(searchInput).toBeVisible();
  } else {
    await expect(searchInput).toBeVisible();
    await page.goto("/");
  }

  await expect.poll(async () => hasNoHorizontalOverflow(page)).toBeTruthy();
});

test("mobile chat keeps input visible and opens own message actions on tap", async ({
  page,
}) => {
  const username = `k${Math.random().toString(36).slice(2, 9)}`;
  const password = "pass12345";

  await register(page, username, password);
  await page.goto("/rooms/public");
  await page.waitForLoadState("networkidle");

  const chatInput = page.getByTestId("chat-message-input");
  const sendButton = page.getByTestId("chat-send-button");
  const chatLog = page.locator('[aria-live="polite"]').first();
  const joinCallout = page.getByTestId("group-join-callout");
  const authCallout = page.getByTestId("chat-auth-callout");
  const readOnlyCallout = page.getByTestId("group-readonly-callout");

  await expect
    .poll(
      async () =>
        (await chatInput.isVisible()) ||
        (await joinCallout.isVisible()) ||
        (await authCallout.isVisible()) ||
        (await readOnlyCallout.isVisible()),
      { timeout: 15_000 },
    )
    .toBeTruthy();

  if (await authCallout.isVisible()) {
    await login(page, username, password);
    await page.goto("/rooms/public");
    await page.waitForLoadState("networkidle");
  }

  await expect(readOnlyCallout).toBeHidden();
  if (await joinCallout.isVisible()) {
    await joinCallout
      .getByRole("button", { name: /Присоединиться|Join/i })
      .click();
  }
  await expect(chatInput).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => isElementInViewport(chatInput)).toBeTruthy();

  const ownMessageText = `mobile viewport stability ${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  await chatInput.fill(ownMessageText);
  await expect(sendButton).toBeEnabled({ timeout: 15_000 });
  await sendButton.click();
  await expect.poll(async () => chatInput.inputValue()).toBe("");

  const ownMessage = page
    .locator("article")
    .filter({ has: page.getByText(ownMessageText) })
    .last();
  await expect(ownMessage).toBeVisible({ timeout: 20_000 });

  await chatLog.evaluate((el) => {
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  });
  await expect.poll(async () => isElementInViewport(chatInput)).toBeTruthy();

  await chatInput.fill("keyboard visible draft");
  const originalViewport = page.viewportSize();
  await chatInput.focus();
  if (originalViewport) {
    await page.setViewportSize({
      width: originalViewport.width,
      height: Math.max(420, originalViewport.height - 220),
    });
    await expect.poll(async () => isElementInViewport(chatInput)).toBeTruthy();
    await expect(chatInput).toHaveValue("keyboard visible draft");
    await page.setViewportSize(originalViewport);
  }
  await expect.poll(async () => isElementInViewport(chatInput)).toBeTruthy();

  const supportsTouchInput = await page.evaluate(
    () =>
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia?.("(pointer: coarse)").matches === true,
  );
  if (supportsTouchInput) {
    await ownMessage.tap();
  } else {
    await ownMessage.click({ button: "right" });
  }
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(5);
});
