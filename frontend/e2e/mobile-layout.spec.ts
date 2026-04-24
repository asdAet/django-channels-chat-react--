import { expect, type Locator, type Page,test } from "@playwright/test";

import { loginWithRetry, registerWithRetry } from "./helpers/auth";
import {
  expectChatDraft,
  getChatComposer,
  sendChatDraft,
  typeChatDraft,
} from "./helpers/chatComposer";

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

const isElementAboveKeyboardInset = async (
  locator: Locator,
  keyboardInset: number,
) =>
  locator.evaluate((el, inset) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom <= window.innerHeight - inset + 1 && rect.top >= 0;
  }, keyboardInset);

async function register(page: Page, username: string, password: string) {
  await registerWithRetry(page, username, password);
}

async function login(page: Page, identifier: string, password: string) {
  await loginWithRetry(page, identifier, password);
}

test("core routes have no horizontal overflow", async ({ page }) => {
  const routes = ["/", "/login", "/register", "/public"];
  for (const route of routes) {
    await page.goto(route);
    await expect.poll(async () => hasNoHorizontalOverflow(page)).toBeTruthy();
  }
});

test("mobile shell switches between list and chat without clipping", async ({
  page,
}) => {
  const username = `m${Math.random().toString(36).slice(2, 9)}`;
  const password = "pass12345";

  await register(page, username, password);
  await page.goto("/public");

  const composer = getChatComposer(page);
  const joinCallout = page.getByTestId("group-join-callout");
  const readOnlyCallout = page.getByTestId("group-readonly-callout");
  const authCallout = page.getByTestId("chat-auth-callout");

  await expect
    .poll(
      async () =>
        (await composer.editor.isVisible()) ||
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
    const openButton = page.getByTestId("chat-mobile-open-button");
    await expect(openButton).toBeVisible();
    await openButton.click();
    await expect(page.getByTestId("sidebar-mobile-close")).toBeVisible();
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
  await page.goto("/public");

  const composer = getChatComposer(page);
  const chatLog = page.locator('[aria-live="polite"]').first();
  const joinCallout = page.getByTestId("group-join-callout");
  const authCallout = page.getByTestId("chat-auth-callout");
  const readOnlyCallout = page.getByTestId("group-readonly-callout");

  await expect
    .poll(
      async () =>
        (await composer.editor.isVisible()) ||
        (await joinCallout.isVisible()) ||
        (await authCallout.isVisible()) ||
        (await readOnlyCallout.isVisible()),
      { timeout: 15_000 },
    )
    .toBeTruthy();

  if (await authCallout.isVisible()) {
    await login(page, username, password);
    await page.goto("/public");
  }

  await expect(readOnlyCallout).toBeHidden();
  if (await joinCallout.isVisible()) {
    await joinCallout
      .getByRole("button", { name: /Присоединиться|Join/i })
      .click();
  }
  await expect(composer.editor).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => isElementInViewport(composer.editor))
    .toBeTruthy();

  const ownMessageText = `mobile viewport stability ${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  await typeChatDraft(composer, ownMessageText);
  await sendChatDraft(composer);
  await expectChatDraft(composer, "", { timeout: 15_000 });

  const ownMessage = page
    .locator("article")
    .filter({ has: page.getByText(ownMessageText) })
    .last();
  await expect(ownMessage).toBeVisible({ timeout: 20_000 });

  await chatLog.evaluate((el) => {
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  });
  await expect
    .poll(async () => isElementInViewport(composer.editor))
    .toBeTruthy();

  await typeChatDraft(composer, "keyboard visible draft");
  const originalViewport = page.viewportSize();
  await composer.editor.focus();
  const isNarrowViewport = await page.evaluate(() => window.innerWidth <= 768);
  if (isNarrowViewport) {
    const simulatedKeyboardInset = 180;
    await page.evaluate((inset) => {
      document.documentElement.style.setProperty(
        "--keyboard-inset-bottom",
        `${inset}px`,
      );
    }, simulatedKeyboardInset);
    await expect
      .poll(async () =>
        isElementAboveKeyboardInset(composer.editor, simulatedKeyboardInset),
      )
      .toBeTruthy();
    await expectChatDraft(composer, "keyboard visible draft");
    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--keyboard-inset-bottom",
        "0px",
      );
    });
  }
  if (originalViewport) {
    await page.setViewportSize({
      width: originalViewport.width,
      height: Math.max(420, originalViewport.height - 220),
    });
    await expect
      .poll(async () => isElementInViewport(composer.editor))
      .toBeTruthy();
    await expectChatDraft(composer, "keyboard visible draft");
    await page.setViewportSize(originalViewport);
  }
  await expect
    .poll(async () => isElementInViewport(composer.editor))
    .toBeTruthy();

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
  await expect(menu.getByRole("menuitem")).toHaveCount(6);
});
