import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CUSTOM_EMOJI_CLIPBOARD_MIME,
  CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE,
  CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER,
  type CustomEmoji,
  getCustomEmojiDraftLength,
  getCustomEmojiPackSummaries,
  serializeCustomEmojiRoot,
  setCustomEmojiDraftSelection,
} from "../../shared/customEmoji";
import * as customEmojiModule from "../../shared/customEmoji";
import { MessageInput } from "./MessageInput";

// Use the actual first emoji from the catalog to ensure consistency
const firstEmojiPackPreview = getCustomEmojiPackSummaries()[0]?.preview;
if (!firstEmojiPackPreview) {
  throw new Error("No custom emoji packs available for testing");
}

const mockCustomEmoji: CustomEmoji = firstEmojiPackPreview;

vi.mock("./TelegramEmojiPicker", () => ({
  TelegramEmojiPicker: ({
    onSelect,
  }: {
    onSelect: (emoji: CustomEmoji) => void;
    onClose: () => void;
  }) => (
    <button type="button" onClick={() => onSelect(mockCustomEmoji)}>
      Pick custom emoji
    </button>
  ),
}));

function ControlledMessageInput({
  initialDraft = "",
}: {
  initialDraft?: string;
}) {
  const [draft, setDraft] = useState(initialDraft);

  return (
    <>
      <MessageInput draft={draft} onDraftChange={setDraft} onSend={vi.fn()} />
      <output data-testid="draft-value">{draft}</output>
    </>
  );
}

describe("MessageInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the native picker through showPicker when the browser supports it", () => {
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", {
      configurable: true,
      value: showPicker,
    });

    render(
      <MessageInput
        draft=""
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        onAttach={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("chat-attach-button"));

    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it("passes selected files to onAttach and resets the input value", () => {
    const onAttach = vi.fn();

    render(
      <MessageInput
        draft=""
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        onAttach={onAttach}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    const fileInput = input as HTMLInputElement;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(onAttach).toHaveBeenCalledWith([file]);
  });

  it("renders a video thumbnail preview for queued video files", () => {
    const file = new File(["video"], "clip.mp4", { type: "video/mp4" });
    const createObjectURL = vi.fn(() => "blob:preview-video");
    const revokeObjectURL = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    const { container } = render(
      <MessageInput
        draft=""
        onDraftChange={vi.fn()}
        onSend={vi.fn()}
        pendingFiles={[file]}
      />,
    );

    const preview = container.querySelector("video");
    expect(preview).toBeInstanceOf(HTMLVideoElement);
    expect(screen.queryByText("VIDEO")).not.toBeInTheDocument();
  });

  it("renders selected custom emoji directly in the rich editor", () => {
    render(<ControlledMessageInput />);

    fireEvent.click(screen.getByTestId("chat-emoji-button"));
    fireEvent.click(screen.getByRole("button", { name: "Pick custom emoji" }));

    expect(screen.getByTestId("draft-value")).toHaveTextContent(
      mockCustomEmoji.token,
    );
    expect(
      screen
        .getByTestId("chat-message-input")
        .querySelector(`[data-custom-emoji-id="${mockCustomEmoji.id}"]`),
    ).toBeTruthy();
    expect(screen.getByTestId("chat-message-input")).not.toHaveTextContent(
      mockCustomEmoji.token,
    );
  });

  it("keeps the caret after an inserted custom emoji", () => {
    render(<ControlledMessageInput />);

    const editor = screen.getByTestId("chat-message-input");
    fireEvent.click(screen.getByTestId("chat-emoji-button"));
    fireEvent.click(screen.getByRole("button", { name: "Pick custom emoji" }));
    fireEvent.keyDown(editor, { key: "a" });

    expect(screen.getByTestId("draft-value").textContent).toBe(
      `${mockCustomEmoji.token}a`,
    );
  });

  it("renders Shift+Enter as a visible editor line break", () => {
    render(<ControlledMessageInput />);

    const editor = screen.getByTestId("chat-message-input");
    fireEvent.keyDown(editor, { key: "a" });
    fireEvent.keyDown(editor, { key: "Enter", shiftKey: true });
    fireEvent.keyDown(editor, { key: "b" });

    expect(screen.getByTestId("draft-value").textContent).toBe("a\nb");
    expect(editor.querySelector("br")).toBeTruthy();
  });

  it("renders a visible empty line immediately after Shift+Enter following a custom emoji", () => {
    render(<ControlledMessageInput />);

    const editor = screen.getByTestId("chat-message-input");
    fireEvent.click(screen.getByTestId("chat-emoji-button"));
    fireEvent.click(screen.getByRole("button", { name: "Pick custom emoji" }));
    fireEvent.keyDown(editor, { key: "Enter", shiftKey: true });

    const sentinel = editor.querySelector(
      `[${CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE}]`,
    );

    expect(screen.getByTestId("draft-value").textContent).toBe(
      `${mockCustomEmoji.token}\n`,
    );
    expect(editor.querySelector("br")).toBeTruthy();
    expect(sentinel).toBeTruthy();
    expect(serializeCustomEmojiRoot(editor)).toBe(`${mockCustomEmoji.token}\n`);

    fireEvent.keyDown(editor, { key: "t" });

    expect(screen.getByTestId("draft-value").textContent).toBe(
      `${mockCustomEmoji.token}\nt`,
    );
    expect(
      editor.querySelector(`[${CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE}]`),
    ).toBeNull();
  });

  it("turns pasted custom emoji tokens into rendered emoji nodes", () => {
    render(<ControlledMessageInput />);

    fireEvent.paste(screen.getByTestId("chat-message-input"), {
      clipboardData: {
        files: [],
        items: [],
        getData: (type: string) => {
          if (type === "text/plain") {
            return mockCustomEmoji.token;
          }
          return "";
        },
      },
    });

    expect(screen.getByTestId("draft-value")).toHaveTextContent(
      mockCustomEmoji.token,
    );
    expect(
      screen
        .getByTestId("chat-message-input")
        .querySelector(`[data-custom-emoji-id="${mockCustomEmoji.id}"]`),
    ).toBeTruthy();
  });

  it("types plain keyboard text once through the rich editor", () => {
    render(<ControlledMessageInput />);

    const editor = screen.getByTestId("chat-message-input");
    fireEvent.keyDown(editor, { key: "t" });
    fireEvent.keyDown(editor, { key: "e" });
    fireEvent.keyDown(editor, { key: "s" });
    fireEvent.keyDown(editor, { key: "t" });

    expect(screen.getByTestId("draft-value").textContent).toBe("test");
    expect(editor.textContent).toBe("test");
  });

  it("copies a selected custom emoji as one visible clipboard symbol", () => {
    render(<ControlledMessageInput initialDraft={mockCustomEmoji.token} />);

    const editor = screen.getByTestId("chat-message-input");
    setCustomEmojiDraftSelection(editor, {
      start: 0,
      end: 1,
    });

    const clipboardData = {
      setData: vi.fn(),
    };

    fireEvent.copy(editor, { clipboardData });

    expect(clipboardData.setData).toHaveBeenCalledWith(
      CUSTOM_EMOJI_CLIPBOARD_MIME,
      mockCustomEmoji.token,
    );
    expect(clipboardData.setData).toHaveBeenCalledWith(
      "text/plain",
      CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER,
    );
    expect(CUSTOM_EMOJI_PLAIN_TEXT_PLACEHOLDER).toHaveLength(1);
  });

  it("clears mixed text and custom emoji atomically with keyboard delete", () => {
    const initialDraft = `text ${mockCustomEmoji.token}`;
    render(<ControlledMessageInput initialDraft={initialDraft} />);

    const editor = screen.getByTestId("chat-message-input");
    setCustomEmojiDraftSelection(editor, {
      start: 0,
      end: getCustomEmojiDraftLength(initialDraft),
    });

    fireEvent.keyDown(editor, { key: "Delete" });

    expect(screen.getByTestId("draft-value").textContent).toBe("");
    expect(editor.querySelector("[data-custom-emoji-id]")).toBeNull();
  });

  it("renders a single draft custom emoji as the small inline editor glyph", () => {
    render(<ControlledMessageInput initialDraft={mockCustomEmoji.token} />);

    const editor = screen.getByTestId("chat-message-input");
    const emoji = editor.querySelector(
      `[data-custom-emoji-id="${mockCustomEmoji.id}"]`,
    );

    expect(emoji?.className).toContain("editorCustomEmojiInline");
    expect(emoji?.className).not.toContain("editorCustomEmojiLarge");
  });

  it("highlights a selected custom emoji in the rich editor", () => {
    render(
      <ControlledMessageInput initialDraft={`A${mockCustomEmoji.token}B`} />,
    );

    const editor = screen.getByTestId("chat-message-input");
    setCustomEmojiDraftSelection(editor, {
      start: 1,
      end: 2,
    });
    fireEvent.keyUp(editor, { key: "Shift" });

    const emoji = editor.querySelector(
      `[data-custom-emoji-id="${mockCustomEmoji.id}"]`,
    );
    expect(emoji?.className).toContain("editorCustomEmojiSelected");
  });

  it("deletes the previous word with Ctrl+Backspace without splitting emoji tokens", () => {
    const initialDraft = `hello ${mockCustomEmoji.token} world`;
    render(<ControlledMessageInput initialDraft={initialDraft} />);

    const editor = screen.getByTestId("chat-message-input");
    const end = getCustomEmojiDraftLength(initialDraft);
    setCustomEmojiDraftSelection(editor, {
      start: end,
      end,
    });

    fireEvent.keyDown(editor, { key: "Backspace", ctrlKey: true });

    expect(screen.getByTestId("draft-value").textContent).toBe(
      `hello ${mockCustomEmoji.token} `,
    );
    expect(
      screen
        .getByTestId("chat-message-input")
        .querySelector(`[data-custom-emoji-id="${mockCustomEmoji.id}"]`),
    ).toBeTruthy();
  });
});
