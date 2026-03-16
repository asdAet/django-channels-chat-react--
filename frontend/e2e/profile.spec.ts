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
  const sessionResponse = await page.request.get("/api/auth/session/");
  const sessionPayload = (await sessionResponse
    .json()
    .catch(() => null)) as { user?: { publicRef?: string; publicId?: string } } | null;
  const profileId = String(sessionPayload?.user?.publicId || "").trim();
  const profileRef = String(sessionPayload?.user?.publicRef || "")
    .trim()
    .replace(/^@+/, "");
  const routeRef = profileId || profileRef;
  expect(routeRef.length).toBeGreaterThan(0);
  await expect(page).toHaveURL(`/users/${encodeURIComponent(routeRef)}`);
}

test("profile update works with validation and save", async ({ page }) => {
  const username = `p${randomLetters(8)}`;
  const password = "pass12345";
  const nextBio = "Updated profile bio text";

  await registerAndSetUsername(page, username, password);

  await page.goto("/profile");
  const bioField = page.getByTestId("profile-bio-input");
  await expect(bioField).toBeVisible();
  await bioField.fill(nextBio);
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

  await page.goto("/profile");
  await expect(page.getByTestId("profile-bio-input")).toHaveValue(nextBio);
});
