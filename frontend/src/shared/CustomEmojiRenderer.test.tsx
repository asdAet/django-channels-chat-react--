import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CustomEmoji } from "./customEmoji.types";
import { CustomEmojiRenderer } from "./CustomEmojiRenderer";

vi.mock("./TgsLottie", () => ({
  TgsLottie: ({
    src,
    label,
    size,
  }: {
    src: string;
    label: string;
    size: number;
  }) => (
    <span
      data-testid="tgs-lottie"
      data-src={src}
      data-size={String(size)}
      aria-label={label}
    />
  ),
}));

const createEmoji = (
  overrides: Partial<CustomEmoji>,
): CustomEmoji => ({
  id: "mixed/item",
  packId: "mixed",
  packName: "mixed",
  fileName: "item.tgs",
  assetKind: "tgs",
  label: "mixed item",
  src: "/emoji/item.tgs",
  token: "[[ce:mixed%2Fitem.tgs]]",
  ...overrides,
});

describe("CustomEmojiRenderer", () => {
  it("renders tgs emoji through the lottie renderer", () => {
    render(<CustomEmojiRenderer emoji={createEmoji({})} size={26} />);

    expect(screen.getByTestId("tgs-lottie")).toHaveAttribute(
      "data-src",
      "/emoji/item.tgs",
    );
  });

  it("renders webp emoji as an image", () => {
    render(
      <CustomEmojiRenderer
        emoji={createEmoji({
          fileName: "item.webp",
          assetKind: "webp",
          src: "/emoji/item.webp",
          token: "[[ce:mixed%2Fitem.webp]]",
        })}
        size={26}
      />,
    );

    const image = screen.getByRole("img", { name: "mixed item" });
    const shell = image.parentElement;
    expect(image).toHaveAttribute("src", "/emoji/item.webp");
    expect(image).toHaveAttribute("width", "26");
    expect(image).toHaveAttribute("height", "26");
    expect(shell).toHaveAttribute("data-custom-emoji-kind", "webp");
  });

  it("renders webm emoji as a muted looping video", () => {
    const { container } = render(
      <CustomEmojiRenderer
        emoji={createEmoji({
          fileName: "item.webm",
          assetKind: "webm",
          src: "/emoji/item.webm",
          token: "[[ce:mixed%2Fitem.webm]]",
        })}
        size={26}
      />,
    );

    const shell = screen.getByRole("img", { name: "mixed item" });
    const video = container.querySelector("video");
    expect(shell).toHaveAttribute("data-custom-emoji-kind", "webm");
    expect(video).toHaveAttribute("src", "/emoji/item.webm");
    expect(video).toHaveAttribute("width", "26");
    expect(video).toHaveAttribute("height", "26");
    expect(video).toBeInstanceOf(HTMLVideoElement);
    expect((video as HTMLVideoElement).loop).toBe(true);
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect((video as HTMLVideoElement).playsInline).toBe(true);
  });
});
