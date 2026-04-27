import { describe, expect, it } from "vitest";

import {
  buildCustomEmojiClipboardHtml,
  buildCustomEmojiClipboardPlainText,
  CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE,
  CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER,
  CUSTOM_EMOJI_TOKEN_ATTRIBUTE,
  deleteCustomEmojiDraftSelection,
  getCustomEmojiDraftLength,
  getCustomEmojiPackSummaries,
  getSingleCustomEmojiOnly,
  parseCustomEmojiClipboardHtml,
  replaceCustomEmojiDraftSelection,
  serializeCustomEmojiRoot,
  serializeCustomEmojiSelection,
  setCustomEmojiDraftSelection,
} from "./customEmoji";

const getTestEmoji = (index = 0) => {
  const emoji = getCustomEmojiPackSummaries()[index]?.preview;
  if (!emoji) {
    throw new Error("Expected custom emoji test fixture");
  }

  return emoji;
};

describe("customEmojiRichText", () => {
  it("round-trips custom emoji through clipboard html", () => {
    const firstEmoji = getTestEmoji();

    const content = `hi ${firstEmoji.token}\nnext`;
    const html = buildCustomEmojiClipboardHtml(content);

    expect(parseCustomEmojiClipboardHtml(html)).toBe(content);
  });

  it("represents copied custom emoji as one user-visible text symbol", () => {
    const firstEmoji = getTestEmoji();

    const plainText = buildCustomEmojiClipboardPlainText(firstEmoji.token);

    expect(plainText).toBe(CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER);
    expect(plainText).toHaveLength(1);
    expect(plainText).not.toContain(firstEmoji.token);
  });

  it("detects a strictly single custom emoji only message", () => {
    const firstEmoji = getTestEmoji();
    const secondEmoji = getTestEmoji(1);

    expect(getSingleCustomEmojiOnly(firstEmoji.token)).toEqual(firstEmoji);
    expect(
      getSingleCustomEmojiOnly(`${firstEmoji.token}${secondEmoji.token}`),
    ).toBeNull();
    expect(getSingleCustomEmojiOnly(`test ${firstEmoji.token}`)).toBeNull();
  });

  it("serializes custom emoji selections using one-symbol emoji offsets", () => {
    const firstEmoji = getTestEmoji();

    const root = document.createElement("div");
    root.append("A");

    const emojiNode = document.createElement("span");
    emojiNode.setAttribute(CUSTOM_EMOJI_TOKEN_ATTRIBUTE, firstEmoji.token);
    root.append(emojiNode);
    root.append("B");
    document.body.append(root);

    setCustomEmojiDraftSelection(root, {
      start: 1,
      end: 2,
    });

    expect(serializeCustomEmojiSelection(root)).toBe(firstEmoji.token);

    root.remove();
  });

  it("serializes selections that start inside a custom emoji placeholder", () => {
    const firstEmoji = getTestEmoji();

    const root = document.createElement("div");
    const emojiNode = document.createElement("span");
    const placeholder = document.createElement("span");
    placeholder.textContent = CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER;
    emojiNode.setAttribute(CUSTOM_EMOJI_TOKEN_ATTRIBUTE, firstEmoji.token);
    emojiNode.append(placeholder);
    root.append(emojiNode);
    document.body.append(root);

    const range = document.createRange();
    const placeholderText = placeholder.firstChild;
    if (!placeholderText) {
      throw new Error("Expected custom emoji placeholder text node");
    }

    range.setStart(placeholderText, 0);
    range.setEnd(placeholderText, 1);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);

    expect(serializeCustomEmojiSelection(root)).toBe(firstEmoji.token);

    root.remove();
  });

  it("ignores editor-only line break sentinels during serialization", () => {
    const root = document.createElement("div");
    root.append("A");
    root.append(document.createElement("br"));

    const sentinel = document.createElement("span");
    sentinel.setAttribute(CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE, "true");
    sentinel.textContent = "\u200B";
    root.append(sentinel);

    expect(serializeCustomEmojiRoot(root)).toBe("A\n");
  });

  it("deletes custom emoji as an atomic draft unit", () => {
    const firstEmoji = getTestEmoji();

    const content = `A${firstEmoji.token}B`;
    const result = deleteCustomEmojiDraftSelection(
      content,
      {
        start: 2,
        end: 2,
      },
      "backward",
    );

    expect(result.nextValue).toBe("AB");
    expect(result.nextSelection).toEqual({ start: 1, end: 1 });
  });

  it("reports custom emoji as one draft symbol", () => {
    const firstEmoji = getTestEmoji();

    expect(getCustomEmojiDraftLength(`A${firstEmoji.token}B`)).toBe(3);
  });

  it("maps legacy emoji tokens by their raw token length", () => {
    const legacyToken = "[[ce:Animated%2F001_5372954454653933911.tgs]]";

    expect(getCustomEmojiDraftLength(`A${legacyToken}B`)).toBe(3);
    expect(
      replaceCustomEmojiDraftSelection(
        `A${legacyToken}B`,
        { start: 1, end: 2 },
        "X",
      ).nextValue,
    ).toBe("AXB");
  });

  it("replaces a selected custom emoji by visual offsets", () => {
    const firstEmoji = getTestEmoji();

    const result = replaceCustomEmojiDraftSelection(
      `A${firstEmoji.token}B`,
      { start: 1, end: 2 },
      "X",
    );

    expect(result.nextValue).toBe("AXB");
    expect(result.nextSelection).toEqual({ start: 2, end: 2 });
  });

  it("deletes words without splitting custom emoji tokens", () => {
    const firstEmoji = getTestEmoji();

    const content = `hello ${firstEmoji.token} world`;
    const result = deleteCustomEmojiDraftSelection(
      content,
      { start: 13, end: 13 },
      "backward",
      "word",
    );

    expect(result.nextValue).toBe(`hello ${firstEmoji.token} `);
    expect(result.nextSelection).toEqual({ start: 8, end: 8 });
  });
});
