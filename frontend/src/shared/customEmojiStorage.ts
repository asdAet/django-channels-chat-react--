import type { CustomEmoji, CustomEmojiPack } from "./customEmoji.types";
import { getCustomEmojiById } from "./customEmojiCatalog";

const CUSTOM_EMOJI_RECENT_STORAGE_KEY = "chat.customEmoji.recent";
const CUSTOM_EMOJI_RECENT_LIMIT = 24;
const CUSTOM_EMOJI_RECENT_PACK_ID = "__recent__";

const readRecentEmojiIds = (): string[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_EMOJI_RECENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
};

export const getRecentCustomEmojiPack = (): CustomEmojiPack | null => {
  const emojis = readRecentEmojiIds()
    .map((id) => getCustomEmojiById(id) ?? null)
    .filter((emoji): emoji is CustomEmoji => emoji !== null);

  if (emojis.length === 0) {
    return null;
  }

  return {
    id: CUSTOM_EMOJI_RECENT_PACK_ID,
    name: "Recent",
    preview: emojis[0],
    emojis,
  };
};

export const recordRecentCustomEmoji = (emoji: CustomEmoji): void => {
  if (typeof window === "undefined") {
    return;
  }

  const nextIds = readRecentEmojiIds().filter((id) => id !== emoji.id);
  nextIds.unshift(emoji.id);

  try {
    window.localStorage.setItem(
      CUSTOM_EMOJI_RECENT_STORAGE_KEY,
      JSON.stringify(nextIds.slice(0, CUSTOM_EMOJI_RECENT_LIMIT)),
    );
  } catch {
    // Ignore storage write errors to keep composer usable in private mode.
  }
};
