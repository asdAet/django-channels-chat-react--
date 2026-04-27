import type { CustomEmojiTextPart } from "./customEmoji.types";
import { getCustomEmojiById } from "./customEmojiCatalog";

const CUSTOM_EMOJI_TOKEN_PATTERN = /\[\[ce:([^\]]+)\]\]/g;

export const buildCustomEmojiToken = (id: string): string =>
  `[[ce:${encodeURIComponent(id)}]]`;

const resolveCustomEmojiIdFromToken = (encodedId: string): string | null => {
  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
};

export const parseCustomEmojiText = (content: string): CustomEmojiTextPart[] => {
  if (!content) {
    return [];
  }

  const parts: CustomEmojiTextPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(CUSTOM_EMOJI_TOKEN_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, matchIndex),
      });
    }

    const id = resolveCustomEmojiIdFromToken(match[1] ?? "");
    const emoji = id ? getCustomEmojiById(id) : null;

    if (emoji) {
      parts.push({
        type: "emoji",
        value: emoji,
      });
    } else {
      parts.push({
        type: "text",
        value: match[0],
      });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }];
};

export const isCustomEmojiOnlyText = (content: string): boolean => {
  const parts = parseCustomEmojiText(content);
  if (parts.length === 0) {
    return false;
  }

  let emojiCount = 0;
  for (const part of parts) {
    if (part.type === "emoji") {
      emojiCount += 1;
      continue;
    }

    if (part.value.trim().length > 0) {
      return false;
    }
  }

  return emojiCount > 0;
};
