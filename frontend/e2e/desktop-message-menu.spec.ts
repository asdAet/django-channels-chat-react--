import { expect, type Page, test } from "@playwright/test";

import { registerWithRetry } from "./helpers/auth";

async function register(page: Page, username: string, password: string) {
  await registerWithRetry(page, username, password);
}

test("desktop opens message action menu with right click", async ({ page }) => {
  const username = `d${Math.random().toString(36).slice(2, 9)}`;
  const password = "pass12345";
  const text = `desktop-menu-${Date.now()}`;

  await register(page, username, password);

  await page.goto("/public");
  await expect(page).toHaveURL("/public");
  await expect(page.getByTestId("chat-page-root")).toBeVisible({
    timeout: 15_000,
  });

  const joinCallout = page.getByTestId("group-join-callout");
  const input = page.getByTestId("chat-message-input");

  await expect
    .poll(
      async () => {
        if (await input.isVisible().catch(() => false)) return "input";
        if (await joinCallout.isVisible().catch(() => false)) return "join";
        return "loading";
      },
      { timeout: 15_000 },
    )
    .not.toBe("loading");

  if (await joinCallout.isVisible().catch(() => false)) {
    await joinCallout
      .getByRole("button", { name: /Присоединиться|Join/i })
      .click();
  }

  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(text);
  await page.getByTestId("chat-send-button").click();

  const ownMessage = page.locator("article").filter({ has: page.getByText(text) }).last();
  await expect(ownMessage).toBeVisible({ timeout: 20_000 });

  await ownMessage.click({ button: "right" });

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveCount(6);
});
