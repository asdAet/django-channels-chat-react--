import type { KeyboardEvent as ReactKeyboardEvent } from "react";

type DeleteDirection = "backward" | "forward";
type DeleteGranularity = "character" | "word";

export type MessageInputDraftOperation =
  | {
      kind: "delete";
      direction: DeleteDirection;
      granularity: DeleteGranularity;
    }
  | {
      kind: "insert";
      value: string;
    };

const CONTROLLED_TEXT_INPUT_TYPES = new Set([
  "insertReplacementText",
  "insertText",
]);

export const supportsBeforeInputEvents = (): boolean => {
  if (typeof document === "undefined" || typeof InputEvent === "undefined") {
    return false;
  }

  return "onbeforeinput" in document.createElement("div");
};

export const getBeforeInputDraftOperation = (
  event: InputEvent,
): MessageInputDraftOperation | null => {
  const { inputType } = event;

  if (
    CONTROLLED_TEXT_INPUT_TYPES.has(inputType) &&
    typeof event.data === "string" &&
    !event.isComposing
  ) {
    return {
      kind: "insert",
      value: event.data,
    };
  }

  if (inputType === "insertParagraph" || inputType === "insertLineBreak") {
    return {
      kind: "insert",
      value: "\n",
    };
  }

  if (inputType === "deleteContentBackward") {
    return {
      direction: "backward",
      granularity: "character",
      kind: "delete",
    };
  }

  if (inputType === "deleteWordBackward") {
    return {
      direction: "backward",
      granularity: "word",
      kind: "delete",
    };
  }

  if (inputType === "deleteContentForward") {
    return {
      direction: "forward",
      granularity: "character",
      kind: "delete",
    };
  }

  if (inputType === "deleteWordForward") {
    return {
      direction: "forward",
      granularity: "word",
      kind: "delete",
    };
  }

  return null;
};

export const getKeyboardDraftOperation = (
  event: ReactKeyboardEvent<HTMLElement>,
  beforeInputSupported: boolean,
): MessageInputDraftOperation | null => {
  if (event.nativeEvent.isComposing || event.key === "Process") {
    return null;
  }

  const shouldWaitForBeforeInput =
    beforeInputSupported && event.nativeEvent.isTrusted;

  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    return shouldWaitForBeforeInput
      ? null
      : {
          kind: "insert",
          value: event.key,
        };
  }

  if (event.key === "Backspace") {
    return shouldWaitForBeforeInput
      ? null
      : {
          direction: "backward",
          granularity:
            event.ctrlKey || event.metaKey || event.altKey
              ? "word"
              : "character",
          kind: "delete",
        };
  }

  if (event.key === "Delete") {
    return shouldWaitForBeforeInput
      ? null
      : {
          direction: "forward",
          granularity:
            event.ctrlKey || event.metaKey || event.altKey
              ? "word"
              : "character",
          kind: "delete",
        };
  }

  if (event.key === "Enter" && event.shiftKey) {
    return shouldWaitForBeforeInput
      ? null
      : {
          kind: "insert",
          value: "\n",
        };
  }

  return null;
};

export const areSameDraftOperations = (
  first: MessageInputDraftOperation,
  second: MessageInputDraftOperation,
): boolean => {
  if (first.kind !== second.kind) {
    return false;
  }

  if (first.kind === "insert" && second.kind === "insert") {
    return first.value === second.value;
  }

  if (first.kind === "delete" && second.kind === "delete") {
    return (
      first.direction === second.direction &&
      first.granularity === second.granularity
    );
  }

  return false;
};
