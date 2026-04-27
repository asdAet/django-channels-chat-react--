import { expect, test } from "@playwright/test";

import { loginWithRetry, logoutWithRetry } from "./helpers/auth";
import { registerAndSetUsername } from "./helpers/profile";

function randomLetters(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

test("register and login flow keeps session", async ({ page }) => {
  const username = randomLetters(8);
  const password = "pass12345";

  await registerAndSetUsername(page, username, password);

  await logoutWithRetry(page);
  await page.goto("/login");
  await expect(page).toHaveURL("/login");

  await loginWithRetry(page, username, password);

  await page.goto("/profile");
  const usernameInput = page.getByLabel("Юзернейм (@username)");
  await expect(usernameInput).toBeVisible();
  await expect(usernameInput).toHaveValue(username);
});
