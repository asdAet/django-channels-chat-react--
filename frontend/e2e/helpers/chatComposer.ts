import { expect, type Locator, type Page } from "@playwright/test";

type TimeoutOption = {
  timeout?: number;
};

export type ChatComposerDriver = {
  page: Page;
  editor: Locator;
  sendButton: Locator;
};

export function getChatComposer(page: Page): ChatComposerDriver {
  return {
    page,
    editor: page.getByTestId("chat-message-input"),
    sendButton: page.getByTestId("chat-send-button"),
  };
}

export async function typeChatDraft(
  composer: ChatComposerDriver,
  draft: string,
): Promise<void> {
  await composer.editor.focus();
  await composer.page.keyboard.insertText(draft);
}

export async function expectChatDraft(
  composer: ChatComposerDriver,
  draft: string,
  options?: TimeoutOption,
): Promise<void> {
  await expect(composer.editor).toHaveText(draft, options);
}

export async function sendChatDraft(
  composer: ChatComposerDriver,
): Promise<void> {
  await expect(composer.sendButton).toBeEnabled({ timeout: 15_000 });
  await composer.sendButton.click();
}
