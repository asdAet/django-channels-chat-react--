export type CustomEmojiAssetKind = "tgs" | "webm" | "webp";

export type CustomEmoji = {
  id: string;
  packId: string;
  packName: string;
  fileName: string;
  assetKind: CustomEmojiAssetKind;
  assetChunkId?: string;
  label: string;
  src: string | null;
  token: string;
};

export type CustomEmojiPack = {
  id: string;
  name: string;
  preview: CustomEmoji;
  emojis: CustomEmoji[];
};

export type CustomEmojiPackSummary = {
  id: string;
  name: string;
  preview: CustomEmoji;
  emojiCount: number;
};

export type CustomEmojiTextPart =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "emoji";
      value: CustomEmoji;
    };
