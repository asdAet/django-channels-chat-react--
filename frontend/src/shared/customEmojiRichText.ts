import type { CustomEmoji } from "./customEmoji.types";
import { getCustomEmojiById } from "./customEmojiCatalog";
import { parseCustomEmojiText } from "./customEmojiParser";

export type CustomEmojiDraftSelection = {
  start: number;
  end: number;
};

export type CustomEmojiDeleteDirection = "backward" | "forward";

export type CustomEmojiDeleteGranularity = "character" | "word";

export const CUSTOM_EMOJI_CLIPBOARD_MIME =
  "application/x-devil-custom-emoji-text";
export const CUSTOM_EMOJI_TOKEN_ATTRIBUTE = "data-custom-emoji-token";
export const CUSTOM_EMOJI_ID_ATTRIBUTE = "data-custom-emoji-id";
export const CUSTOM_EMOJI_LABEL_ATTRIBUTE = "data-custom-emoji-label";
export const CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE =
  "data-custom-emoji-editor-sentinel";
export const CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER = "\uFFFC";

const BLOCK_TAG_NAMES = new Set(["DIV", "LI", "P", "PRE"]);
const CUSTOM_EMOJI_TOKEN_PATTERN = /\[\[ce:([^\]]+)\]\]/g;

const clampSelectionOffset = (value: number, max: number): number =>
  Math.min(Math.max(value, 0), max);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const getCustomEmojiTokenFromNode = (node: Node): string | null => {
  if (!(node instanceof HTMLElement)) {
    return null;
  }

  return node.getAttribute(CUSTOM_EMOJI_TOKEN_ATTRIBUTE);
};

const getClosestCustomEmojiElement = (
  root: HTMLElement,
  node: Node,
): HTMLElement | null => {
  const element =
    node instanceof HTMLElement ? node : node.parentElement;
  const customEmojiElement = element?.closest<HTMLElement>(
    `[${CUSTOM_EMOJI_TOKEN_ATTRIBUTE}]`,
  );

  if (!customEmojiElement) {
    return null;
  }

  return root === customEmojiElement || root.contains(customEmojiElement)
    ? customEmojiElement
    : null;
};

const doesRangeIntersectNode = (range: Range, node: Node): boolean => {
  if (typeof range.intersectsNode === "function") {
    return range.intersectsNode(node);
  }

  const ownerDocument = node.ownerDocument;
  if (!ownerDocument) {
    return false;
  }

  const nodeRange = ownerDocument.createRange();
  nodeRange.selectNode(node);

  return (
    range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0 &&
    range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0
  );
};

const isEditorSentinelNode = (node: Node): boolean =>
  node instanceof HTMLElement &&
  node.hasAttribute(CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE);

type CustomEmojiDraftSpan = {
  rawStart: number;
  rawEnd: number;
  visualStart: number;
  visualEnd: number;
  type: "emoji" | "text";
};

const resolveCustomEmojiIdFromToken = (encodedId: string): string | null => {
  try {
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
};

const getCustomEmojiDraftSpans = (value: string): CustomEmojiDraftSpan[] => {
  const spans: CustomEmojiDraftSpan[] = [];
  let rawCursor = 0;
  let visualCursor = 0;

  const pushSpan = (
    type: CustomEmojiDraftSpan["type"],
    rawLength: number,
    visualLength: number,
  ) => {
    if (rawLength <= 0 && visualLength <= 0) {
      return;
    }

    spans.push({
      rawStart: rawCursor,
      rawEnd: rawCursor + rawLength,
      visualStart: visualCursor,
      visualEnd: visualCursor + visualLength,
      type,
    });

    rawCursor += rawLength;
    visualCursor += visualLength;
  };

  for (const match of value.matchAll(CUSTOM_EMOJI_TOKEN_PATTERN)) {
    const matchIndex = match.index ?? rawCursor;
    if (matchIndex > rawCursor) {
      const textLength = matchIndex - rawCursor;
      pushSpan("text", textLength, textLength);
    }

    const token = match[0] ?? "";
    const id = resolveCustomEmojiIdFromToken(match[1] ?? "");
    const emoji = id ? getCustomEmojiById(id) : null;
    pushSpan(emoji ? "emoji" : "text", token.length, emoji ? 1 : token.length);
  }

  if (rawCursor < value.length) {
    const textLength = value.length - rawCursor;
    pushSpan("text", textLength, textLength);
  }

  return spans;
};

export const getCustomEmojiDraftLength = (value: string): number => {
  const spans = getCustomEmojiDraftSpans(value);
  return spans.at(-1)?.visualEnd ?? 0;
};

const getRawOffsetFromVisualOffset = (
  value: string,
  visualOffset: number,
): number => {
  const spans = getCustomEmojiDraftSpans(value);
  const max = spans.at(-1)?.visualEnd ?? 0;
  const offset = clampSelectionOffset(visualOffset, max);

  for (const span of spans) {
    if (offset <= span.visualStart) {
      return span.rawStart;
    }

    if (offset >= span.visualEnd) {
      continue;
    }

    if (span.type === "emoji") {
      return span.rawEnd;
    }

    return span.rawStart + (offset - span.visualStart);
  }

  return value.length;
};

const getCustomEmojiVisualText = (value: string): string =>
  parseCustomEmojiText(value)
    .map((part) =>
      part.type === "text"
        ? part.value
        : CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER,
    )
    .join("");

const serializeCustomEmojiNodeList = (
  nodes: ArrayLike<Node>,
  appendBlockBreaks: boolean,
): string => {
  const entries = Array.from(nodes);
  let result = "";

  entries.forEach((node, index) => {
    result += serializeCustomEmojiNode(node);

    if (
      appendBlockBreaks &&
      node instanceof HTMLElement &&
      BLOCK_TAG_NAMES.has(node.tagName) &&
      index < entries.length - 1 &&
      !result.endsWith("\n")
    ) {
      result += "\n";
    }
  });

  return result;
};

export const serializeCustomEmojiNode = (node: Node): string => {
  if (isEditorSentinelNode(node)) {
    return "";
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replaceAll("\u00A0", " ");
  }

  const token = getCustomEmojiTokenFromNode(node);
  if (token) {
    return token;
  }

  if (node instanceof HTMLBRElement) {
    return "\n";
  }

  return serializeCustomEmojiNodeList(node.childNodes, true);
};

export const serializeCustomEmojiRoot = (root: Node): string =>
  serializeCustomEmojiNodeList(root.childNodes, true);

export const serializeCustomEmojiSelection = (
  root: HTMLElement,
): string | null => {
  const selection = root.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  if (commonAncestor !== root && !root.contains(commonAncestor)) {
    return null;
  }

  const normalizedRange = range.cloneRange();
  const startEmojiElement = getClosestCustomEmojiElement(
    root,
    range.startContainer,
  );
  const endEmojiElement = getClosestCustomEmojiElement(
    root,
    range.endContainer,
  );

  if (startEmojiElement) {
    normalizedRange.setStartBefore(startEmojiElement);
  }
  if (endEmojiElement) {
    normalizedRange.setEndAfter(endEmojiElement);
  }

  const fragment = normalizedRange.cloneContents();
  const text = serializeCustomEmojiRoot(fragment);
  return text.length > 0 ? text : null;
};

export const getSelectedCustomEmojiNodeIndexes = (
  root: HTMLElement,
): Set<number> => {
  const selection = root.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return new Set();
  }

  const range = selection.getRangeAt(0);
  if (!doesRangeIntersectNode(range, root)) {
    return new Set();
  }

  const selectedIndexes = new Set<number>();
  const emojiNodes = root.querySelectorAll<HTMLElement>(
    `[${CUSTOM_EMOJI_TOKEN_ATTRIBUTE}]`,
  );

  emojiNodes.forEach((node, index) => {
    if (doesRangeIntersectNode(range, node)) {
      selectedIndexes.add(index);
    }
  });

  return selectedIndexes;
};

const getRangeOffsetWithinRoot = (
  root: HTMLElement,
  container: Node,
  offset: number,
): number => {
  const range = root.ownerDocument.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);
  return getNodeDraftLength(range.cloneContents());
};

export const getCustomEmojiDraftSelection = (
  root: HTMLElement,
): CustomEmojiDraftSelection | null => {
  const selection = root.ownerDocument.defaultView?.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset, endContainer, endOffset } = range;

  const startInsideRoot =
    startContainer === root || root.contains(startContainer);
  const endInsideRoot = endContainer === root || root.contains(endContainer);
  if (!startInsideRoot || !endInsideRoot) {
    return null;
  }

  return {
    start: getRangeOffsetWithinRoot(root, startContainer, startOffset),
    end: getRangeOffsetWithinRoot(root, endContainer, endOffset),
  };
};

const getNodeDraftLength = (node: Node): number => {
  if (isEditorSentinelNode(node)) {
    return 0;
  }

  const token = getCustomEmojiTokenFromNode(node);
  if (token) {
    return 1;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length ?? 0;
  }

  if (node instanceof HTMLBRElement) {
    return 1;
  }

  return Array.from(node.childNodes).reduce(
    (total, child) => total + getNodeDraftLength(child),
    0,
  );
};

type DraftDomPoint = {
  container: Node;
  offset: number;
};

const getChildIndex = (node: Node): number => {
  const parent = node.parentNode;
  if (!parent) {
    return 0;
  }

  return Array.prototype.indexOf.call(parent.childNodes, node) as number;
};

const resolveDraftDomPoint = (
  root: HTMLElement,
  targetOffset: number,
): DraftDomPoint => {
  const remaining = { value: targetOffset };

  const visit = (node: Node): DraftDomPoint | null => {
    if (isEditorSentinelNode(node)) {
      return null;
    }

    const token = getCustomEmojiTokenFromNode(node);
    if (token) {
      const parent = node.parentNode ?? root;
      const childIndex = getChildIndex(node);

      if (remaining.value <= 0) {
        return { container: parent, offset: childIndex };
      }
      if (remaining.value <= 1) {
        return { container: parent, offset: childIndex + 1 };
      }

      remaining.value -= 1;
      return null;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent?.length ?? 0;
      if (remaining.value <= length) {
        return { container: node, offset: remaining.value };
      }

      remaining.value -= length;
      return null;
    }

    if (node instanceof HTMLBRElement) {
      const parent = node.parentNode ?? root;
      const childIndex = getChildIndex(node);

      if (remaining.value <= 0) {
        return { container: parent, offset: childIndex };
      }
      if (remaining.value <= 1) {
        return { container: parent, offset: childIndex + 1 };
      }

      remaining.value -= 1;
      return null;
    }

    for (const child of Array.from(node.childNodes)) {
      const result = visit(child);
      if (result) {
        return result;
      }
    }

    return null;
  };

  const resolved = visit(root);
  if (resolved) {
    return resolved;
  }

  return {
    container: root,
    offset: root.childNodes.length,
  };
};

export const setCustomEmojiDraftSelection = (
  root: HTMLElement,
  selection: CustomEmojiDraftSelection,
): void => {
  const totalLength = getNodeDraftLength(root);
  const start = clampSelectionOffset(selection.start, totalLength);
  const end = clampSelectionOffset(selection.end, totalLength);
  const startPoint = resolveDraftDomPoint(root, start);
  const endPoint = resolveDraftDomPoint(root, end);
  const documentSelection = root.ownerDocument.defaultView?.getSelection();
  if (!documentSelection) {
    return;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(startPoint.container, startPoint.offset);
  range.setEnd(endPoint.container, endPoint.offset);
  documentSelection.removeAllRanges();
  documentSelection.addRange(range);
};

export const replaceCustomEmojiDraftSelection = (
  value: string,
  selection: CustomEmojiDraftSelection,
  insertion: string,
): {
  nextValue: string;
  nextSelection: CustomEmojiDraftSelection;
} => {
  const draftLength = getCustomEmojiDraftLength(value);
  const start = clampSelectionOffset(selection.start, draftLength);
  const end = clampSelectionOffset(selection.end, draftLength);
  const selectionStart = Math.min(start, end);
  const selectionEnd = Math.max(start, end);
  const rawSelectionStart = getRawOffsetFromVisualOffset(
    value,
    selectionStart,
  );
  const rawSelectionEnd = getRawOffsetFromVisualOffset(value, selectionEnd);
  const nextValue =
    value.slice(0, rawSelectionStart) +
    insertion +
    value.slice(rawSelectionEnd);
  const caret = selectionStart + getCustomEmojiDraftLength(insertion);

  return {
    nextValue,
    nextSelection: {
      start: caret,
      end: caret,
    },
  };
};

const getPreviousVisualUnitStart = (
  value: string,
  offset: number,
): number => {
  if (offset <= 0) {
    return 0;
  }

  const visualText = getCustomEmojiVisualText(value);
  const prefix = visualText.slice(0, offset);
  const codePoints = Array.from(prefix);
  codePoints.pop();
  return codePoints.join("").length;
};

const getNextVisualUnitEnd = (value: string, offset: number): number => {
  const draftLength = getCustomEmojiDraftLength(value);
  if (offset >= draftLength) {
    return draftLength;
  }

  const visualText = getCustomEmojiVisualText(value);
  return offset + (Array.from(visualText.slice(offset))[0]?.length ?? 0);
};

const getWordDeleteSelection = (
  value: string,
  offset: number,
  direction: CustomEmojiDeleteDirection,
): CustomEmojiDraftSelection => {
  const visualText = getCustomEmojiVisualText(value);
  const isBoundary = (char: string | undefined) =>
    char === undefined || /\s/.test(char);
  const isEmojiPlaceholder = (char: string | undefined) =>
    char === CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER;

  if (direction === "backward") {
    let start = offset;

    while (start > 0 && isBoundary(visualText[start - 1])) {
      start -= 1;
    }

    if (isEmojiPlaceholder(visualText[start - 1])) {
      start -= 1;
    } else {
      while (
        start > 0 &&
        !isBoundary(visualText[start - 1]) &&
        !isEmojiPlaceholder(visualText[start - 1])
      ) {
        start -= 1;
      }
    }

    return { start, end: offset };
  }

  let end = offset;
  while (end < visualText.length && isBoundary(visualText[end])) {
    end += 1;
  }

  if (isEmojiPlaceholder(visualText[end])) {
    end += 1;
  } else {
    while (
      end < visualText.length &&
      !isBoundary(visualText[end]) &&
      !isEmojiPlaceholder(visualText[end])
    ) {
      end += 1;
    }
  }

  return { start: offset, end };
};

export const deleteCustomEmojiDraftSelection = (
  value: string,
  selection: CustomEmojiDraftSelection,
  direction: CustomEmojiDeleteDirection,
  granularity: CustomEmojiDeleteGranularity = "character",
): {
  nextValue: string;
  nextSelection: CustomEmojiDraftSelection;
} => {
  const draftLength = getCustomEmojiDraftLength(value);
  const start = clampSelectionOffset(selection.start, draftLength);
  const end = clampSelectionOffset(selection.end, draftLength);
  const selectionStart = Math.min(start, end);
  const selectionEnd = Math.max(start, end);

  if (selectionStart !== selectionEnd) {
    return replaceCustomEmojiDraftSelection(
      value,
      { start: selectionStart, end: selectionEnd },
      "",
    );
  }

  const deleteSelection =
    granularity === "word"
      ? getWordDeleteSelection(value, selectionStart, direction)
      : direction === "backward"
        ? {
            start: getPreviousVisualUnitStart(value, selectionStart),
            end: selectionStart,
          }
        : {
            start: selectionStart,
            end: getNextVisualUnitEnd(value, selectionStart),
          };

  return replaceCustomEmojiDraftSelection(value, deleteSelection, "");
};

export const buildCustomEmojiClipboardHtml = (content: string): string =>
  parseCustomEmojiText(content)
    .map((part) => {
      if (part.type === "text") {
        return escapeHtml(part.value).replaceAll("\n", "<br>");
      }

      return `<span ${CUSTOM_EMOJI_TOKEN_ATTRIBUTE}="${escapeHtml(part.value.token)}" ${CUSTOM_EMOJI_ID_ATTRIBUTE}="${escapeHtml(part.value.id)}" ${CUSTOM_EMOJI_LABEL_ATTRIBUTE}="${escapeHtml(part.value.label)}" aria-label="${escapeHtml(part.value.label)}">${escapeHtml(part.value.token)}</span>`;
    })
    .join("");

export const buildCustomEmojiClipboardPlainText = (content: string): string =>
  parseCustomEmojiText(content)
    .map((part) =>
      part.type === "text" ? part.value : part.value.token,
    )
    .join("");

export const writeCustomEmojiClipboardData = (
  clipboardData: Pick<DataTransfer, "setData">,
  content: string,
): void => {
  clipboardData.setData(CUSTOM_EMOJI_CLIPBOARD_MIME, content);
  clipboardData.setData("text/html", buildCustomEmojiClipboardHtml(content));
  clipboardData.setData(
    "text/plain",
    buildCustomEmojiClipboardPlainText(content),
  );
};

export const parseCustomEmojiClipboardHtml = (html: string): string | null => {
  if (!html) {
    return null;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const text = serializeCustomEmojiRoot(document.body);
  return text.length > 0 ? text : null;
};

export const getSingleCustomEmojiOnly = (content: string): CustomEmoji | null => {
  const parts = parseCustomEmojiText(content);
  if (parts.length === 0) {
    return null;
  }

  let singleEmoji: CustomEmoji | null = null;
  for (const part of parts) {
    if (part.type === "text") {
      if (part.value.trim().length > 0) {
        return null;
      }

      continue;
    }

    if (singleEmoji) {
      return null;
    }

    singleEmoji = part.value;
  }

  return singleEmoji;
};

export const writeCustomEmojiClipboardContent = async (
  content: string,
): Promise<void> => {
  const plainText = buildCustomEmojiClipboardPlainText(content);
  const clipboard = navigator.clipboard;

  if (!clipboard) {
    return;
  }

  if (
    typeof ClipboardItem !== "undefined" &&
    typeof clipboard.write === "function"
  ) {
    try {
      await clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([buildCustomEmojiClipboardHtml(content)], {
            type: "text/html",
          }),
          "text/plain": new Blob([plainText], {
            type: "text/plain",
          }),
        }),
      ]);
      return;
    } catch {
      // Fall back to plain text below when rich clipboard writes are blocked.
    }
  }

  await clipboard.writeText(plainText);
};
