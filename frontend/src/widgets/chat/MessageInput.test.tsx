import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MessageInput } from "./MessageInput";

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
      <MessageInput draft="" onDraftChange={vi.fn()} onSend={vi.fn()} onAttach={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId("chat-attach-button"));

    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it("passes selected files to onAttach and resets the input value", () => {
    const onAttach = vi.fn();

    render(
      <MessageInput draft="" onDraftChange={vi.fn()} onSend={vi.fn()} onAttach={onAttach} />,
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
});
