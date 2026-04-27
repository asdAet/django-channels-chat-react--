import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "..");
const emojiRoot = join(projectRoot, "src", "emoji");
const generatedRoot = join(projectRoot, "src", "generated");
const generatedPackIndexesRoot = join(generatedRoot, "customEmojiPackIndexes");
const generatedAssetChunksRoot = join(generatedRoot, "customEmojiAssetChunks");
const legacyGeneratedPacksRoot = join(generatedRoot, "customEmojiPacks");
const manifestOutputPath = join(
  generatedRoot,
  "customEmojiManifest.generated.ts",
);

const CUSTOM_EMOJI_ASSET_CHUNK_SIZE = 128;

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const compareByName = (left, right) => collator.compare(left, right);

const normalizePath = (value) => value.replaceAll("\\", "/");

const toPosixRelativePath = (fromDir, absolutePath) =>
  normalizePath(relative(fromDir, absolutePath));

const resolveAssetKind = (fileName) => {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".tgs")) {
    return "tgs";
  }
  if (normalized.endsWith(".webp")) {
    return "webp";
  }
  if (normalized.endsWith(".webm")) {
    return "webm";
  }
  return null;
};

const createEmojiLabel = (packName, fileName) =>
  `${packName} ${fileName.replace(/\.(?:tgs|webm|webp)$/i, "")}`;

const buildEmojiToken = (id) => `[[ce:${encodeURIComponent(id)}]]`;

const sanitizePackModuleStem = (packName, index) => {
  const base = packName
    .normalize("NFKD")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  const stem = base.length > 0 ? base : "pack";
  return `${stem}_${String(index).padStart(3, "0")}`;
};

const buildAssetChunkId = (packModuleStem, chunkIndex) =>
  `${packModuleStem}_${String(chunkIndex).padStart(3, "0")}`;

const walkEmojiFiles = (dir) => {
  if (!existsSync(dir)) {
    return [];
  }

  const output = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      output.push(...walkEmojiFiles(fullPath));
      continue;
    }

    const assetKind = resolveAssetKind(entry);
    if (!assetKind) {
      continue;
    }

    output.push({
      absolutePath: fullPath,
      assetKind,
      fileName: entry,
      packName:
        normalizePath(relative(emojiRoot, dirname(fullPath))).split("/").at(-1) ??
        "",
    });
  }

  return output;
};

const buildManifest = () => {
  const files = walkEmojiFiles(emojiRoot)
    .filter((item) => item.packName.length > 0)
    .sort((left, right) => {
      const packOrder = compareByName(left.packName, right.packName);
      if (packOrder !== 0) {
        return packOrder;
      }
      return compareByName(left.fileName, right.fileName);
    });

  const packMap = new Map();
  for (const file of files) {
    const id = `${file.packName}/${file.fileName}`;
    const record = {
      id,
      packId: file.packName,
      packName: file.packName,
      fileName: file.fileName,
      assetKind: file.assetKind,
      label: createEmojiLabel(file.packName, file.fileName),
      token: buildEmojiToken(id),
      generatedAssetChunkRelativeImportPath: toPosixRelativePath(
        generatedAssetChunksRoot,
        file.absolutePath,
      ),
    };

    const pack = packMap.get(file.packName);
    if (pack) {
      pack.push(record);
    } else {
      packMap.set(file.packName, [record]);
    }
  }

  return Array.from(packMap.entries()).map(([packName, emojis], index) => {
    const moduleStem = sanitizePackModuleStem(packName, index);
    const sortedEmojis = emojis.sort((left, right) =>
      compareByName(left.fileName, right.fileName),
    );

    return {
      moduleStem,
      packName,
      emojis: sortedEmojis.map((emoji, emojiIndex) => {
        const assetChunkIndex = Math.floor(
          emojiIndex / CUSTOM_EMOJI_ASSET_CHUNK_SIZE,
        );

        return {
          ...emoji,
          assetChunkId: buildAssetChunkId(moduleStem, assetChunkIndex),
          assetChunkIndex,
        };
      }),
    };
  });
};

const renderEmojiRecord = (emoji, srcExpression) =>
  `{ id: ${JSON.stringify(emoji.id)}, packId: ${JSON.stringify(
    emoji.packId,
  )}, packName: ${JSON.stringify(emoji.packName)}, fileName: ${JSON.stringify(
    emoji.fileName,
  )}, assetKind: ${JSON.stringify(emoji.assetKind)}, assetChunkId: ${JSON.stringify(
    emoji.assetChunkId,
  )}, label: ${JSON.stringify(emoji.label)}, src: ${srcExpression}, token: ${JSON.stringify(
    emoji.token,
  )} }`;

const renderPackIndexModuleSource = (pack) => {
  const emojiLines = pack.emojis.map(
    (emoji) => `  ${renderEmojiRecord(emoji, "null")},`,
  );
  const previewId = pack.emojis[0]?.id ?? "";

  return `/* auto-generated by scripts/generate-custom-emoji-manifest.mjs */
import type { CustomEmojiPack } from "../../shared/customEmoji.types";

const emojis = [
${emojiLines.join("\n")}
] as const;

export const customEmojiPack = {
  id: ${JSON.stringify(pack.packName)},
  name: ${JSON.stringify(pack.packName)},
  preview: emojis.find((emoji) => emoji.id === ${JSON.stringify(previewId)}) ?? emojis[0],
  emojis: [...emojis],
} satisfies CustomEmojiPack;
`;
};

const renderAssetChunkModuleSource = (chunkEmojis) => {
  const assetLines = [];
  const mapLines = [];

  chunkEmojis.forEach((emoji, index) => {
    const assetName = `asset${String(index).padStart(4, "0")}`;
    assetLines.push(
      `const ${assetName} = new URL(${JSON.stringify(
        emoji.generatedAssetChunkRelativeImportPath,
      )}, import.meta.url).href;`,
    );
    mapLines.push(`  ${JSON.stringify(emoji.id)}: ${assetName},`);
  });

  return `/* auto-generated by scripts/generate-custom-emoji-manifest.mjs */
${assetLines.join("\n")}

const assetSrcById = {
${mapLines.join("\n")}
} as const;

export const resolveCustomEmojiAssetSrc = (id: string): string | null =>
  assetSrcById[id as keyof typeof assetSrcById] ?? null;
`;
};

const renderManifestSource = (packs) => {
  const manifestLines = [];
  const packIndexLoaderLines = [];
  const assetChunkLoaderLines = [];

  packs.forEach((pack) => {
    const preview = pack.emojis[0];
    if (!preview) {
      return;
    }

    manifestLines.push(
      `  { id: ${JSON.stringify(pack.packName)}, name: ${JSON.stringify(
        pack.packName,
      )}, preview: ${renderEmojiRecord(preview, "null")}, emojiCount: ${
        pack.emojis.length
      } },`,
    );

    packIndexLoaderLines.push(
      `  ${JSON.stringify(pack.packName)}: () => import(${JSON.stringify(
        `./customEmojiPackIndexes/${pack.moduleStem}.index.generated`,
      )}),`,
    );

    const chunkCount = Math.ceil(
      pack.emojis.length / CUSTOM_EMOJI_ASSET_CHUNK_SIZE,
    );
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunkId = buildAssetChunkId(pack.moduleStem, chunkIndex);
      assetChunkLoaderLines.push(
        `  ${JSON.stringify(chunkId)}: () => import(${JSON.stringify(
          `./customEmojiAssetChunks/${chunkId}.assets.generated`,
        )}),`,
      );
    }
  });

  return `/* auto-generated by scripts/generate-custom-emoji-manifest.mjs */
import type { CustomEmoji, CustomEmojiPack } from "../shared/customEmoji.types";

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

export const customEmojiPackManifests = [
${manifestLines.join("\n")}
] as const satisfies readonly CustomEmojiPackManifest[];

export const customEmojiPackIndexLoaders = {
${packIndexLoaderLines.join("\n")}
} satisfies Record<string, CustomEmojiPackIndexLoader>;

export const customEmojiAssetChunkLoaders = {
${assetChunkLoaderLines.join("\n")}
} satisfies Record<string, CustomEmojiAssetChunkLoader>;
`;
};

const writeIfChanged = (filePath, source) => {
  const previousSource = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  if (previousSource === source) {
    return false;
  }

  writeFileSync(filePath, source, "utf8");
  return true;
};

export const generateCustomEmojiManifest = () => {
  const packs = buildManifest();

  mkdirSync(generatedRoot, { recursive: true });
  rmSync(legacyGeneratedPacksRoot, { force: true, recursive: true });
  rmSync(generatedPackIndexesRoot, { force: true, recursive: true });
  rmSync(generatedAssetChunksRoot, { force: true, recursive: true });
  mkdirSync(generatedPackIndexesRoot, { recursive: true });
  mkdirSync(generatedAssetChunksRoot, { recursive: true });

  let changed = false;
  changed =
    writeIfChanged(manifestOutputPath, renderManifestSource(packs)) || changed;

  for (const pack of packs) {
    const packOutputPath = join(
      generatedPackIndexesRoot,
      `${pack.moduleStem}.index.generated.ts`,
    );
    changed =
      writeIfChanged(packOutputPath, renderPackIndexModuleSource(pack)) ||
      changed;

    const chunkCount = Math.ceil(
      pack.emojis.length / CUSTOM_EMOJI_ASSET_CHUNK_SIZE,
    );
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const chunkId = buildAssetChunkId(pack.moduleStem, chunkIndex);
      const start = chunkIndex * CUSTOM_EMOJI_ASSET_CHUNK_SIZE;
      const end = start + CUSTOM_EMOJI_ASSET_CHUNK_SIZE;
      const assetChunkOutputPath = join(
        generatedAssetChunksRoot,
        `${chunkId}.assets.generated.ts`,
      );

      changed =
        writeIfChanged(
          assetChunkOutputPath,
          renderAssetChunkModuleSource(pack.emojis.slice(start, end)),
        ) || changed;
    }
  }

  return changed;
};

if (process.argv[1] === __filename) {
  const changed = generateCustomEmojiManifest();
  console.log(
    changed
      ? "custom emoji manifest generated"
      : "custom emoji manifest is up to date",
  );
}
