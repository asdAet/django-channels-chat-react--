import {
  customEmojiAssetChunkLoaders,
  customEmojiPackIndexLoaders,
  customEmojiPackManifests,
} from "../generated/customEmojiManifest.generated";
import type {
  CustomEmoji,
  CustomEmojiAssetKind,
  CustomEmojiPack,
  CustomEmojiPackSummary,
} from "./customEmoji.types";

type CustomEmojiPackManifest = {
  id: string;
  name: string;
  preview: CustomEmoji;
  emojiCount: number;
};

type CustomEmojiPackIndexLoader = () => Promise<{
  customEmojiPack: CustomEmojiPack;
}>;

type CustomEmojiAssetChunkLoader = () => Promise<{
  resolveCustomEmojiAssetSrc: (id: string) => string | null;
}>;

type CustomEmojiAssetChunkModule = Awaited<
  ReturnType<CustomEmojiAssetChunkLoader>
>;

type ResolvedCustomEmojiId = {
  assetKind: CustomEmojiAssetKind;
  fileName: string;
  packId: string;
};

type CanonicalCustomEmojiId = {
  id: string;
  manifest: CustomEmojiPackManifest;
  resolvedId: ResolvedCustomEmojiId;
};

const CUSTOM_EMOJI_EXTENSION_PATTERN = /\.(tgs|webm|webp)$/i;
const CUSTOM_EMOJI_LEGACY_INDEXED_FILE_NAME_PATTERN =
  /^0*([1-9]\d*)_\d+\.(tgs|webm|webp)$/i;
const CUSTOM_EMOJI_SAFE_FILE_NAME_PATTERN = /^[^/\\]+?\.(?:tgs|webm|webp)$/i;

const resolveCustomEmojiAssetKind = (
  fileName: string,
): CustomEmojiAssetKind | null => {
  const extension = fileName.toLowerCase().match(CUSTOM_EMOJI_EXTENSION_PATTERN);
  if (!extension) {
    return null;
  }

  if (extension[1] === "webp") {
    return "webp";
  }
  if (extension[1] === "webm") {
    return "webm";
  }

  return "tgs";
};

const buildCustomEmojiLabel = (packName: string, fileName: string): string =>
  `${packName} ${fileName.replace(CUSTOM_EMOJI_EXTENSION_PATTERN, "")}`;

const buildCustomEmojiToken = (id: string): string =>
  `[[ce:${encodeURIComponent(id)}]]`;

const isSafeCustomEmojiFileName = (fileName: string): boolean =>
  CUSTOM_EMOJI_SAFE_FILE_NAME_PATTERN.test(fileName) &&
  fileName !== "." &&
  fileName !== "..";

const resolveCustomEmojiId = (
  id: string,
): ResolvedCustomEmojiId | null => {
  const separatorIndex = id.indexOf("/");
  if (
    separatorIndex <= 0 ||
    separatorIndex !== id.lastIndexOf("/") ||
    separatorIndex >= id.length - 1
  ) {
    return null;
  }

  const packId = id.slice(0, separatorIndex);
  const fileName = id.slice(separatorIndex + 1);
  if (!isSafeCustomEmojiFileName(fileName)) {
    return null;
  }

  const assetKind = resolveCustomEmojiAssetKind(fileName);
  if (!assetKind) {
    return null;
  }

  return {
    assetKind,
    fileName,
    packId,
  };
};

const normalizeLegacyIndexedFileName = (fileName: string): string | null => {
  const match = fileName.match(CUSTOM_EMOJI_LEGACY_INDEXED_FILE_NAME_PATTERN);
  if (!match) {
    return null;
  }

  return `${Number.parseInt(match[1] ?? "", 10)}.${(
    match[2] ?? ""
  ).toLowerCase()}`;
};

const buildCustomEmojiStub = (
  manifest: CustomEmojiPackManifest,
  emojiId: string,
): CustomEmoji | null => {
  const resolvedId = resolveCustomEmojiId(emojiId);
  if (!resolvedId || resolvedId.packId !== manifest.id) {
    return null;
  }

  return {
    id: emojiId,
    packId: resolvedId.packId,
    packName: manifest.name,
    fileName: resolvedId.fileName,
    assetKind: resolvedId.assetKind,
    label: buildCustomEmojiLabel(manifest.name, resolvedId.fileName),
    src: null,
    token: buildCustomEmojiToken(emojiId),
  };
};

export const buildCustomEmojiCatalog = (
  packManifests: readonly CustomEmojiPackManifest[],
  packIndexLoaders: Record<string, CustomEmojiPackIndexLoader> = {},
  assetChunkLoaders: Record<string, CustomEmojiAssetChunkLoader> = {},
): {
  getCustomEmojiById: (id: string) => CustomEmoji | null;
  getCustomEmojiPacks: () => CustomEmojiPack[];
  getCustomEmojiPackSummaries: () => CustomEmojiPackSummary[];
  hasCustomEmojiPacks: () => boolean;
  loadCustomEmojiById: (id: string) => Promise<CustomEmoji | null>;
  loadCustomEmojiPack: (packId: string) => Promise<CustomEmojiPack | null>;
} => {
  const packManifestById = new Map<string, CustomEmojiPackManifest>();
  const packManifestByLowercaseId = new Map<string, CustomEmojiPackManifest>();
  const customEmojiById = new Map<string, CustomEmoji>();
  const customEmojiPackCache = new Map<string, CustomEmojiPack>();
  const customEmojiPackPromiseCache = new Map<
    string,
    Promise<CustomEmojiPack | null>
  >();
  const assetChunkPromiseCache = new Map<
    string,
    Promise<CustomEmojiAssetChunkModule>
  >();
  const assetSrcPromiseCache = new Map<string, Promise<string | null>>();
  const packSummaries: CustomEmojiPackSummary[] = [];

  for (const manifest of packManifests) {
    packManifestById.set(manifest.id, manifest);
    packManifestByLowercaseId.set(manifest.id.toLowerCase(), manifest);
    customEmojiById.set(manifest.preview.id, manifest.preview);
    packSummaries.push({
      id: manifest.id,
      name: manifest.name,
      preview: manifest.preview,
      emojiCount: manifest.emojiCount,
    });
  }

  const resolvePackManifest = (
    packId: string,
  ): CustomEmojiPackManifest | null =>
    packManifestById.get(packId) ??
    packManifestByLowercaseId.get(packId.toLowerCase()) ??
    null;

  const resolveCanonicalCustomEmojiId = (
    id: string,
  ): CanonicalCustomEmojiId | null => {
    const resolvedId = resolveCustomEmojiId(id);
    if (!resolvedId) {
      return null;
    }

    const manifest = resolvePackManifest(resolvedId.packId);
    if (!manifest) {
      return null;
    }

    const fileName =
      normalizeLegacyIndexedFileName(resolvedId.fileName) ??
      resolvedId.fileName;
    const canonicalId = `${manifest.id}/${fileName}`;
    const canonicalResolvedId = resolveCustomEmojiId(canonicalId);
    if (!canonicalResolvedId || canonicalResolvedId.packId !== manifest.id) {
      return null;
    }

    return {
      id: canonicalId,
      manifest,
      resolvedId: canonicalResolvedId,
    };
  };

  const getCustomEmojiById = (id: string): CustomEmoji | null => {
    const canonicalId = resolveCanonicalCustomEmojiId(id);
    if (!canonicalId) {
      return null;
    }

    const cached = customEmojiById.get(canonicalId.id);
    if (cached) {
      return cached;
    }

    const stub = buildCustomEmojiStub(canonicalId.manifest, canonicalId.id);
    if (!stub) {
      return null;
    }

    customEmojiById.set(canonicalId.id, stub);
    return stub;
  };

  const hydrateCachedPack = (pack: CustomEmojiPack): CustomEmojiPack => {
    const emojis = pack.emojis.map((emoji) => customEmojiById.get(emoji.id) ?? emoji);
    const preview =
      customEmojiById.get(pack.preview.id) ??
      emojis.find((emoji) => emoji.id === pack.preview.id) ??
      pack.preview;

    return {
      ...pack,
      preview,
      emojis,
    };
  };

  const rememberLoadedPack = (pack: CustomEmojiPack): CustomEmojiPack => {
    const emojis = pack.emojis.map((emoji) => {
      const cached = customEmojiById.get(emoji.id);
      const resolvedEmoji = cached?.src
        ? {
            ...emoji,
            src: cached.src,
          }
        : emoji;

      customEmojiById.set(resolvedEmoji.id, resolvedEmoji);
      return resolvedEmoji;
    });
    const preview =
      emojis.find((emoji) => emoji.id === pack.preview.id) ??
      customEmojiById.get(pack.preview.id) ??
      pack.preview;
    const resolvedPack = {
      ...pack,
      preview,
      emojis,
    };

    customEmojiPackCache.set(pack.id, resolvedPack);
    return resolvedPack;
  };

  const patchResolvedEmojiIntoPack = (emoji: CustomEmoji): void => {
    const pack = customEmojiPackCache.get(emoji.packId);
    if (!pack) {
      return;
    }

    customEmojiPackCache.set(emoji.packId, {
      ...pack,
      preview: pack.preview.id === emoji.id ? emoji : pack.preview,
      emojis: pack.emojis.map((item) =>
        item.id === emoji.id ? emoji : item,
      ),
    });
  };

  const loadCustomEmojiPack = async (
    packId: string,
  ): Promise<CustomEmojiPack | null> => {
    const manifest = resolvePackManifest(packId);
    if (!manifest) {
      return null;
    }

    const canonicalPackId = manifest.id;
    const cached = customEmojiPackCache.get(canonicalPackId);
    if (cached) {
      return hydrateCachedPack(cached);
    }

    const pending = customEmojiPackPromiseCache.get(canonicalPackId);
    if (pending) {
      return pending;
    }

    const loader = packIndexLoaders[canonicalPackId];
    if (!loader) {
      return null;
    }

    const promise = loader()
      .then(({ customEmojiPack }) => rememberLoadedPack(customEmojiPack))
      .catch((error) => {
        customEmojiPackPromiseCache.delete(canonicalPackId);
        throw error;
      });

    customEmojiPackPromiseCache.set(canonicalPackId, promise);
    return promise;
  };

  const loadAssetChunk = (
    assetChunkId: string,
  ): Promise<CustomEmojiAssetChunkModule> => {
    const cached = assetChunkPromiseCache.get(assetChunkId);
    if (cached) {
      return cached;
    }

    const loader = assetChunkLoaders[assetChunkId];
    if (!loader) {
      return Promise.reject(
        new Error(`Missing custom emoji asset chunk: ${assetChunkId}`),
      );
    }

    const promise = loader().catch((error) => {
      assetChunkPromiseCache.delete(assetChunkId);
      throw error;
    });

    assetChunkPromiseCache.set(assetChunkId, promise);
    return promise;
  };

  const loadCustomEmojiAssetSrc = (
    emoji: CustomEmoji,
  ): Promise<string | null> => {
    if (!emoji.assetChunkId) {
      return Promise.resolve(null);
    }

    const cached = assetSrcPromiseCache.get(emoji.id);
    if (cached) {
      return cached;
    }

    const promise = loadAssetChunk(emoji.assetChunkId)
      .then((chunk) => chunk.resolveCustomEmojiAssetSrc(emoji.id))
      .catch((error) => {
        assetSrcPromiseCache.delete(emoji.id);
        throw error;
      });

    assetSrcPromiseCache.set(emoji.id, promise);
    return promise;
  };

  const resolveIndexedEmoji = async (
    emoji: CustomEmoji,
  ): Promise<CustomEmoji | null> => {
    if (emoji.assetChunkId) {
      return emoji;
    }

    const pack = await loadCustomEmojiPack(emoji.packId);
    return pack?.emojis.find((item) => item.id === emoji.id) ?? null;
  };

  const loadCustomEmojiById = async (id: string): Promise<CustomEmoji | null> => {
    const emoji = getCustomEmojiById(id);
    if (!emoji) {
      return null;
    }

    if (emoji.src) {
      return emoji;
    }

    const indexedEmoji = await resolveIndexedEmoji(emoji);
    if (!indexedEmoji) {
      customEmojiById.delete(emoji.id);
      return null;
    }

    if (indexedEmoji.src) {
      return indexedEmoji;
    }

    const src = await loadCustomEmojiAssetSrc(indexedEmoji);
    if (!src) {
      return null;
    }

    const resolvedEmoji = {
      ...indexedEmoji,
      src,
    };
    customEmojiById.set(resolvedEmoji.id, resolvedEmoji);
    patchResolvedEmojiIntoPack(resolvedEmoji);
    return resolvedEmoji;
  };

  const getCustomEmojiPacks = (): CustomEmojiPack[] =>
    Array.from(customEmojiPackCache.values()).map((pack) =>
      hydrateCachedPack(pack),
    );

  return {
    getCustomEmojiById,
    getCustomEmojiPacks,
    getCustomEmojiPackSummaries: () => packSummaries,
    hasCustomEmojiPacks: () => packSummaries.length > 0,
    loadCustomEmojiById,
    loadCustomEmojiPack,
  };
};

const catalog = buildCustomEmojiCatalog(
  customEmojiPackManifests,
  customEmojiPackIndexLoaders,
  customEmojiAssetChunkLoaders,
);

export const getCustomEmojiById = catalog.getCustomEmojiById;
export const getCustomEmojiPacks = catalog.getCustomEmojiPacks;
export const getCustomEmojiPackSummaries = catalog.getCustomEmojiPackSummaries;
export const hasCustomEmojiPacks = catalog.hasCustomEmojiPacks;
export const loadCustomEmojiById = catalog.loadCustomEmojiById;
export const loadCustomEmojiPack = catalog.loadCustomEmojiPack;
