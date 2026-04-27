import { expect, type Page,test } from "@playwright/test";

import { ensureAuthenticated, registerWithRetry } from "./helpers/auth";

async function register(page: Page, username: string, password: string) {
  await registerWithRetry(page, username, password);
  await ensureAuthenticated(page, username, password);
  return username;
}

test("public chat allows authenticated send and keeps guest read-only mode", async ({
  page,
  browser,
}) => {
  const username = `c${Math.random().toString(36).slice(2, 7)}`;
  const password = "pass12345";
  const text = `hello-${Date.now()}`;

  const login = await register(page, username, password);

  await page.goto("/public");
  const authCallout = page.getByTestId("chat-auth-callout");
  if (await authCallout.isVisible().catch(() => false)) {
    await ensureAuthenticated(page, login, password);
    await page.goto("/public");
  }

  const joinCallout = page.getByTestId("group-join-callout");
  if (await joinCallout.isVisible().catch(() => false)) {
    await joinCallout
      .getByRole("button", { name: /Присоединиться|Join/i })
      .click();
  }

  const input = page.getByTestId("chat-message-input");
  await expect(input).toBeVisible({ timeout: 30_000 });

  await input.fill(text);
  await page.getByTestId("chat-send-button").click();

  await expect(
    page.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto("/public");
  await expect(guestPage.getByTestId("chat-auth-callout")).toBeVisible();
  await expect(guestPage.getByTestId("chat-message-input")).toHaveCount(0);
  await guestContext.close();
});
