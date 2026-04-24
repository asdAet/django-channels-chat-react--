import { expect, type Page, test } from "@playwright/test";

import { registerAndSetUsername } from "./helpers/profile";

function randomLetters(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

async function installWebSocketTracker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if ((window as typeof window & { __wsEvents?: unknown[] }).__wsEvents) {
      return;
    }

    const NativeWebSocket = window.WebSocket;
    const events: Array<Record<string, unknown>> = [];
    (
      window as typeof window & {
        __wsEvents: Array<Record<string, unknown>>;
      }
    ).__wsEvents = events;

    class TrackedWebSocket extends NativeWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        events.push({ kind: "construct", url: String(url), at: Date.now() });
        this.addEventListener("open", () => {
          events.push({ kind: "open", url: this.url, at: Date.now() });
        });
        this.addEventListener("close", (event) => {
          events.push({
            kind: "close",
            url: this.url,
            code: event.code,
            at: Date.now(),
          });
        });
        this.addEventListener("error", () => {
          events.push({ kind: "error", url: this.url, at: Date.now() });
        });
      }
    }

    Object.defineProperties(TrackedWebSocket, {
      CONNECTING: { value: NativeWebSocket.CONNECTING },
      OPEN: { value: NativeWebSocket.OPEN },
      CLOSING: { value: NativeWebSocket.CLOSING },
      CLOSED: { value: NativeWebSocket.CLOSED },
    });

    window.WebSocket = TrackedWebSocket as typeof window.WebSocket;
  });
}

test("chat websocket transport stays open while switching between chats", async ({
  page,
  browser,
}) => {
  const alice = `alice${randomLetters(6)}`;
  const bob = `bob${randomLetters(6)}`;
  const password = "pass12345";
  const text = `ws-lifecycle-${Date.now()}`;

  await registerAndSetUsername(page, alice, password);

  const bobContext = await browser.newContext();
  const bobPage = await bobContext.newPage();
  await registerAndSetUsername(bobPage, bob, password);

  await bobPage.goto(`/@${encodeURIComponent(alice)}`);
  await expect(bobPage.getByTestId("chat-message-input")).toBeVisible({
    timeout: 30_000,
  });
  await bobPage.getByTestId("chat-message-input").fill(text);
  await bobPage.getByTestId("chat-send-button").click();
  await expect(
    bobPage.getByRole("article").filter({ hasText: text }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await installWebSocketTracker(page);
  await page.goto("/");

  const directChatButton = page
    .getByRole("button")
    .filter({ hasText: new RegExp(bob, "i") })
    .first();

  await expect(directChatButton).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(async () => {
      return page.evaluate(() =>
        (
          (
            window as typeof window & {
              __wsEvents?: Array<{ kind?: string; url?: string }>;
            }
          ).__wsEvents ?? []
        ).filter(
          (event) =>
            event.kind === "open" &&
            typeof event.url === "string" &&
            event.url.includes("/ws/chat/"),
        ).length,
      );
    })
    .toBe(1);

  await directChatButton.click();
  await expect(page).toHaveURL(new RegExp(`/@${bob}$`));
  await expect(page.getByTestId("chat-message-input")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByLabel("Публичный чат").first().click();
  await expect(page).toHaveURL(/\/public$/);

  await directChatButton.click();
  await expect(page).toHaveURL(new RegExp(`/@${bob}$`));

  const chatTransportEvents = await page.evaluate(() =>
    (
      (
        window as typeof window & {
          __wsEvents?: Array<{
            kind?: string;
            url?: string;
            code?: number;
          }>;
        }
      ).__wsEvents ?? []
    ).filter(
      (event) =>
        typeof event.url === "string" && event.url.includes("/ws/chat/"),
    ),
  );

  expect(
    chatTransportEvents.filter((event) => event.kind === "construct"),
  ).toHaveLength(1);
  expect(
    chatTransportEvents.filter((event) => event.kind === "close"),
  ).toHaveLength(0);
  expect(
    chatTransportEvents.filter((event) => event.kind === "error"),
  ).toHaveLength(0);

  await bobContext.close();
});
