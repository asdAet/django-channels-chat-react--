import { expect, type Page } from "@playwright/test";

import { registerWithRetry } from "./auth";

export async function registerAndSetUsername(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await registerWithRetry(page, username, password);

  await page.goto("/profile");
  const usernameInput = page.getByLabel("Юзернейм (@username)");
  await expect(usernameInput).toBeVisible({ timeout: 15_000 });
  await usernameInput.fill(username);

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

  const sessionResponse = await page.request.get("/api/auth/session/");
  const sessionPayload = (await sessionResponse.json().catch(() => null)) as
    | { user?: { publicRef?: string; publicId?: string } }
    | null;
  const profileId = String(sessionPayload?.user?.publicId || "").trim();
  const profileRef = String(sessionPayload?.user?.publicRef || "")
    .trim()
    .replace(/^@+/, "");
  const routeRef = profileId || profileRef;

  expect(routeRef.length).toBeGreaterThan(0);
  await expect(page).toHaveURL(`/users/${encodeURIComponent(routeRef)}`);
}
