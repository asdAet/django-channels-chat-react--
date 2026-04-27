import type { CSSProperties } from "react";

import type { CustomEmoji } from "./customEmoji.types";
import { CustomEmojiRenderer } from "./CustomEmojiRenderer";
import {
  CUSTOM_EMOJI_ID_ATTRIBUTE,
  CUSTOM_EMOJI_LABEL_ATTRIBUTE,
  CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER,
  CUSTOM_EMOJI_TOKEN_ATTRIBUTE,
} from "./customEmojiRichText";

type Props = {
  emoji: CustomEmoji;
  size: number;
  className?: string;
  atomic?: boolean;
  priority?: boolean;
  visibilityRoot?: Element | null;
  preloadMargin?: string;
};

const customEmojiRootStyle: CSSProperties = {
  position: "relative",
};

const customEmojiVisualStyle: CSSProperties = {
  display: "inline-flex",
  pointerEvents: "none",
};

const getCustomEmojiCopyPlaceholderStyle = (size: number): CSSProperties => ({
  alignItems: "center",
  color: "transparent",
  cursor: "text",
  display: "inline-flex",
  fontSize: size,
  height: "100%",
  inset: 0,
  justifyContent: "center",
  lineHeight: `${size}px`,
  opacity: 0,
  overflow: "hidden",
  pointerEvents: "auto",
  position: "absolute",
  userSelect: "text",
  whiteSpace: "nowrap",
  width: "100%",
  zIndex: 1,
});

export function CustomEmojiNode({
  emoji,
  size,
  className,
  atomic = false,
  priority = false,
  visibilityRoot,
  preloadMargin,
}: Props) {
  return (
    <span
      className={className}
      draggable={false}
      style={customEmojiRootStyle}
      contentEditable={atomic ? false : undefined}
      suppressContentEditableWarning={atomic}
      {...{
        [CUSTOM_EMOJI_ID_ATTRIBUTE]: emoji.id,
        [CUSTOM_EMOJI_LABEL_ATTRIBUTE]: emoji.label,
        [CUSTOM_EMOJI_TOKEN_ATTRIBUTE]: emoji.token,
      }}
    >
      <span
        aria-hidden="true"
        data-custom-emoji-copy-placeholder="true"
        style={getCustomEmojiCopyPlaceholderStyle(size)}
      >
        {CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER}
      </span>
      <span style={customEmojiVisualStyle}>
        <CustomEmojiRenderer
          emoji={emoji}
          size={size}
          priority={priority}
          visibilityRoot={visibilityRoot}
          preloadMargin={preloadMargin}
        />
      </span>
    </span>
  );
}
