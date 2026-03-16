import { expect, test, type Page } from "@playwright/test";

import { loginWithRetry, logoutWithRetry, registerWithRetry } from "./helpers/auth";

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

test("register and login flow keeps session", async ({ page }) => {
  const username = randomLetters(8);
  const password = "pass12345";

  await registerAndSetUsername(page, username, password);

  await logoutWithRetry(page);
  await page.goto("/login");
  await expect(page).toHaveURL("/login");

  await loginWithRetry(page, username, password);

  await page.goto("/profile");
  await expect(page.getByTestId("profile-username-input")).toBeVisible();
  await expect(page.getByTestId("profile-username-input")).toHaveValue(
    username,
  );
});
