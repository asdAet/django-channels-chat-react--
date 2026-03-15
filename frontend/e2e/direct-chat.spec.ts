import { expect, test, type Page } from "@playwright/test";

import { registerWithRetry } from "./helpers/auth";

function randomLetters(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

async function registerAndSetUsername(
  page: Page,
  username: string,
  password: string,
) {
  await registerWithRetry(page, username, password);

  await page.goto("/profile");
  await expect(page.getByTestId("profile-username-input")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("profile-username-input").fill(username);
  const profileUpdateResponsePromise = page.waitForResponse(
    (response) =>
      (response.url().includes("/api/profile/handle/") ||
        response.url().includes("/api/profile/")) &&
      response.request().method() === "PATCH",
  );
  await page.getByTestId("profile-save-button").click();
  const profileUpdateResponse = await profileUpdateResponsePromise;
  if (!profileUpdateResponse.ok()) {
    const body = await profileUpdateResponse.text().catch(() => "");
    throw new Error(
      `profile update failed: ${profileUpdateResponse.status()} ${body}`,
    );
  }
  await expect(page).toHaveURL(`/users/${encodeURIComponent(username)}`);
}

test("direct chat by username opens and delivers messages between users", async ({
  page,
  browser,
}) => {
  const alice = `alice${randomLetters(6)}`;
  const bob = `bob${randomLetters(6)}`;
  const password = "pass12345";
  const text = `dm-${Date.now()}`;

  await registerAndSetUsername(page, alice, password);

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await registerAndSetUsername(bobPage, bob, password);

  await bobPage.goto(`/direct/${encodeURIComponent(alice)}`);
  await expect(bobPage).toHaveURL(`/direct/${encodeURIComponent(alice)}`);

  const input = bobPage.getByTestId("chat-message-input");
  await expect(input).toBeVisible({ timeout: 30_000 });
  await input.fill(text);
  await bobPage.getByTestId("chat-send-button").click();
  await expect(
    bobPage.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto(`/direct/${encodeURIComponent(bob)}`);
  await expect(page.getByTestId("chat-message-input")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await bobPage.goto("/direct");
  await expect(bobPage.getByText(alice)).toBeVisible();

  await bobContext.close();
});
