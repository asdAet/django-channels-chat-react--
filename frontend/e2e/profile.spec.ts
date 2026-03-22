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

test("profile update works with validation and save", async ({ page }) => {
  const username = `p${randomLetters(8)}`;
  const password = "pass12345";
  const nextBio = "Updated profile bio text";

  await registerAndSetUsername(page, username, password);

  await page.goto("/profile");
  const bioField = page.getByLabel("Биография (необязательно)");
  await expect(bioField).toBeVisible();
  await bioField.fill(nextBio);
  const profileUpdateResponsePromise = page.waitForResponse(
    (response) =>
      (response.url().includes("/api/profile/handle/") ||
        response.url().includes("/api/profile/")) &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Сохранить" }).click();
  const profileUpdateResponse = await profileUpdateResponsePromise;
  if (!profileUpdateResponse.ok()) {
    const body = await profileUpdateResponse.text().catch(() => "");
    throw new Error(
      `profile update failed: ${profileUpdateResponse.status()} ${body}`,
    );
  }

  await page.goto("/profile");
  await expect(page.getByLabel("Биография (необязательно)")).toHaveValue(
    nextBio,
  );
});
