import { describe, expect, it } from "vitest";

import {
  buildCustomEmojiCatalog,
  buildCustomEmojiToken,
  getCustomEmojiPacks,
  getCustomEmojiPackSummaries,
  isCustomEmojiOnlyText,
  loadCustomEmojiPack,
  parseCustomEmojiText,
} from "./customEmoji";

describe("customEmoji", () => {
  it("builds lazy pack summaries and loads full pack indexes on demand", async () => {
    const summaries = getCustomEmojiPackSummaries();

    expect(summaries.length).toBeGreaterThan(0);
    const packNames = summaries.map((pack) => pack.name);
    expect(packNames.some((name) => name.toLowerCase() === "animated")).toBe(
      true,
    );
    expect(packNames.some((name) => name.toLowerCase() === "creepyemoji")).toBe(
      true,
    );

    const firstPack = await loadCustomEmojiPack(summaries[0]?.id ?? "");
    expect(firstPack).toBeTruthy();
    expect(firstPack?.preview).toEqual(firstPack?.emojis[0]);
    expect(firstPack?.emojis[0]?.src).toBeNull();
    expect(
      getCustomEmojiPacks().some((pack) => pack.id === firstPack?.id),
    ).toBe(true);
  });

  it("parses custom emoji tokens inline and detects emoji-only content", () => {
    const firstEmoji = getCustomEmojiPackSummaries()[0]?.preview;
    expect(firstEmoji).toBeTruthy();

    if (!firstEmoji) {
      throw new Error("Expected at least one custom emoji");
    }

    const token = buildCustomEmojiToken(firstEmoji.id);
    const parts = parseCustomEmojiText(`Hello ${token}`);

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({
      type: "text",
      value: "Hello ",
    });
    expect(parts[1]).toEqual({
      type: "emoji",
      value: firstEmoji,
    });
    expect(isCustomEmojiOnlyText(token)).toBe(true);
    expect(isCustomEmojiOnlyText(`test ${token}`)).toBe(false);
  });

  it("supports tgs, webp and webm assets in the same lazy catalog", async () => {
    const preview = {
      id: "Mixed/001.tgs",
      packId: "Mixed",
      packName: "Mixed",
      fileName: "001.tgs",
      assetKind: "tgs" as const,
      assetChunkId: "mixed_000",
      label: "Mixed 001",
      src: null,
      token: "[[ce:Mixed%2F001.tgs]]",
    };
    const webpEmoji = {
      id: "Mixed/002.webp",
      packId: "Mixed",
      packName: "Mixed",
      fileName: "002.webp",
      assetKind: "webp" as const,
      assetChunkId: "mixed_000",
      label: "Mixed 002",
      src: null,
      token: "[[ce:Mixed%2F002.webp]]",
    };
    const webmEmoji = {
      id: "Mixed/003.webm",
      packId: "Mixed",
      packName: "Mixed",
      fileName: "003.webm",
      assetKind: "webm" as const,
      assetChunkId: "mixed_000",
      label: "Mixed 003",
      src: null,
      token: "[[ce:Mixed%2F003.webm]]",
    };
    const catalog = buildCustomEmojiCatalog(
      [
        {
          id: "Mixed",
          name: "Mixed",
          preview,
          emojiCount: 2,
        },
      ],
      {
        Mixed: async () => ({
          customEmojiPack: {
            id: "Mixed",
            name: "Mixed",
            preview,
            emojis: [preview, webpEmoji, webmEmoji],
          },
        }),
      },
      {
        mixed_000: async () => ({
          resolveCustomEmojiAssetSrc: (id) =>
            id === "Mixed/001.tgs"
              ? "/assets/001.tgs"
              : id === "Mixed/002.webp"
                ? "/assets/002.webp"
                : id === "Mixed/003.webm"
                  ? "/assets/003.webm"
                  : null,
        }),
      },
    );
    const packs = await catalog.loadCustomEmojiPack("Mixed");
    const tgsEmoji = await catalog.loadCustomEmojiById("Mixed/001.tgs");
    const unresolvedWebpEmoji = catalog.getCustomEmojiById("Mixed/002.webp");
    const webmEmojiResult = await catalog.loadCustomEmojiById("Mixed/003.webm");

    expect(catalog.getCustomEmojiPacks()).toHaveLength(1);
    expect(packs?.name).toBe("Mixed");
    expect(packs?.preview.fileName).toBe("001.tgs");
    expect(packs?.preview.assetKind).toBe("tgs");
    expect(packs?.emojis.map((emoji) => emoji.fileName)).toEqual([
      "001.tgs",
      "002.webp",
      "003.webm",
    ]);
    expect(tgsEmoji?.label).toBe("Mixed 001");
    expect(tgsEmoji?.src).toBe("/assets/001.tgs");
    expect(unresolvedWebpEmoji?.assetKind).toBe("webp");
    expect(unresolvedWebpEmoji?.label).toBe("Mixed 002");
    expect(unresolvedWebpEmoji?.src).toBeNull();
    expect(webmEmojiResult?.assetKind).toBe("webm");
    expect(webmEmojiResult?.src).toBe("/assets/003.webm");
  });

  it("normalizes legacy emoji tokens to canonical generated assets", async () => {
    const preview = {
      id: "Mixed/1.tgs",
      packId: "Mixed",
      packName: "Mixed",
      fileName: "1.tgs",
      assetKind: "tgs" as const,
      assetChunkId: "mixed_000",
      label: "Mixed 1",
      src: null,
      token: "[[ce:Mixed%2F1.tgs]]",
    };
    const catalog = buildCustomEmojiCatalog(
      [
        {
          id: "Mixed",
          name: "Mixed",
          preview,
          emojiCount: 1,
        },
      ],
      {
        Mixed: async () => ({
          customEmojiPack: {
            id: "Mixed",
            name: "Mixed",
            preview,
            emojis: [preview],
          },
        }),
      },
      {
        mixed_000: async () => ({
          resolveCustomEmojiAssetSrc: (id) =>
            id === "Mixed/1.tgs" ? "/assets/1.tgs" : null,
        }),
      },
    );

    const legacyEmoji = catalog.getCustomEmojiById("mixed/001_123456789.tgs");
    const loadedEmoji = await catalog.loadCustomEmojiById(
      "mixed/001_123456789.tgs",
    );
    const loadedCanonicalEmoji =
      await catalog.loadCustomEmojiById("Mixed/1.tgs");

    expect(legacyEmoji?.id).toBe("Mixed/1.tgs");
    expect(legacyEmoji?.fileName).toBe("1.tgs");
    expect(legacyEmoji?.token).toBe("[[ce:Mixed%2F1.tgs]]");
    expect(loadedEmoji?.src).toBe("/assets/1.tgs");
    expect(loadedCanonicalEmoji).toBe(loadedEmoji);
  });
});
