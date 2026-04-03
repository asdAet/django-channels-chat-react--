import { expect, test } from "@playwright/test";

import { ensureAuthenticated, registerWithRetry } from "./helpers/auth";

test("public chat uploads attachments through chunked flow with progress feedback", async ({
  page,
}) => {
  const username = `u${Math.random().toString(36).slice(2, 8)}`;
  const password = "pass12345";
  const attachmentName = `chunk-${Date.now()}.txt`;
  const attachmentBody = `chunked upload integration ${"x".repeat(700 * 1024)}`;
  const attachmentBuffer = Buffer.from(attachmentBody, "utf8");
  const attachmentRequests: Array<{ method: string; path: string }> = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.includes("/attachments/")) {
      attachmentRequests.push({
        method: request.method(),
        path: url.pathname,
      });
    }
  });

  await registerWithRetry(page, username, password);
  await ensureAuthenticated(page, username, password);

  await page.goto("/public");
  const authCallout = page.getByTestId("chat-auth-callout");
  if (await authCallout.isVisible().catch(() => false)) {
    await ensureAuthenticated(page, username, password);
    await page.goto("/public");
  }

  const joinCallout = page.getByTestId("group-join-callout");
  if (await joinCallout.isVisible().catch(() => false)) {
    await joinCallout
      .getByRole("button", { name: /Присоединиться|Join/i })
      .click();
  }

  const attachInput = page.locator('input[type="file"]');
  await attachInput.setInputFiles({
    name: attachmentName,
    mimeType: "text/plain",
    buffer: attachmentBuffer,
  });

  await expect(page.getByText(attachmentName)).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("chat-send-button").click();

  const progressBar = page.getByRole("progressbar");
  await expect
    .poll(
      async () =>
        progressBar.evaluateAll((nodes) =>
          nodes
            .map((node) => node.getAttribute("aria-valuetext") ?? "")
            .filter((value) => value.length > 0)
            .join(" || "),
        ),
      {
        timeout: 10_000,
      },
    )
    .toMatch(
      /(Подготовка загрузки|Загрузка файлов:|Публикуем сообщение).+\/.+/u,
    );

  await expect(
    page.getByRole("article").filter({ hasText: attachmentName }).first(),
  ).toBeVisible({ timeout: 20_000 });

  expect(
    attachmentRequests.some(
      ({ method, path }) =>
        method === "POST" && /\/api\/chat\/\d+\/attachments\/uploads\/$/.test(path),
    ),
  ).toBe(true);
  expect(
    attachmentRequests.some(
      ({ method, path }) =>
        method === "PUT" &&
        /\/api\/chat\/\d+\/attachments\/uploads\/[^/]+\/chunk\/$/.test(path),
    ),
  ).toBe(true);
  expect(
    attachmentRequests.filter(
      ({ method, path }) =>
        method === "PUT" &&
        /\/api\/chat\/\d+\/attachments\/uploads\/[^/]+\/chunk\/$/.test(path),
    ).length,
  ).toBeGreaterThanOrEqual(2);
  expect(
    attachmentRequests.some(
      ({ method, path }) =>
        method === "POST" && /\/api\/chat\/\d+\/attachments\/$/.test(path),
    ),
  ).toBe(true);
});
