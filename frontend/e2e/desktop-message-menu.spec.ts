import { expect, test, type Page } from "@playwright/test";

import { registerWithRetry } from "./helpers/auth";

async function register(page: Page, username: string, password: string) {
  await registerWithRetry(page, username, password);
}

test("desktop opens message action menu with right click", async ({ page }) => {
  const username = `d${Math.random().toString(36).slice(2, 9)}`;
  const password = "pass12345";
  const text = `desktop-menu-${Date.now()}`;

  await register(page, username, password);

  await page.goto("/rooms/public");
  await page.waitForLoadState("networkidle");

  const joinCallout = page.getByTestId("group-join-callout");
  if (await joinCallout.isVisible()) {
    await joinCallout.getByRole("button", { name: /Присоединиться|Join/i }).click();
  }

  const input = page.getByTestId("chat-message-input");
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(text);
  await page.getByTestId("chat-send-button").click();

  const ownMessage = page
    .locator("article")
    .filter({ has: page.getByText(text) })
    .last();
  await expect(ownMessage).toBeVisible({ timeout: 20_000 });

  await ownMessage.click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(5);
});
