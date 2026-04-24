import { expect, test } from "@playwright/test";

import { registerAndSetUsername } from "./helpers/profile";

function randomLetters(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
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

  await bobPage.goto(`/@${encodeURIComponent(alice)}`);
  await expect(bobPage).toHaveURL(`/@${encodeURIComponent(alice)}`);

  const input = bobPage.getByTestId("chat-message-input");
  await expect(input).toBeVisible({ timeout: 30_000 });
  await input.fill(text);
  await bobPage.getByTestId("chat-send-button").click();
  await expect(
    bobPage.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await page.goto(`/@${encodeURIComponent(bob)}`);
  await expect(page.getByTestId("chat-message-input")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await bobContext.close();
});
