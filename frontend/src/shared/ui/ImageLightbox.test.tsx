import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImageLightbox } from "./ImageLightbox";

const baseMetadata = {
  attachmentId: 77,
  fileName: "preview.png",
  contentType: "image/png",
  fileSize: 2048,
  sentAt: "2026-03-19T09:15:00.000Z",
  width: 1280,
  height: 720,
};

describe("ImageLightbox", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders image metadata in preview mode", () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /Просмотр изображения/i }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("preview")).toBeInTheDocument();
    expect(screen.getByText("preview.png")).toBeInTheDocument();
    expect(screen.getByText(/MIME: image\/png/i)).toBeInTheDocument();
    expect(screen.getByText(/Размеры: 1280x720/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: 77/i)).toBeInTheDocument();
  });

  it("closes only after overlay click animation timeout", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByAltText("preview"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders video player when kind is video", () => {
    const { container } = render(
      <ImageLightbox
        src="/media/video.mp4"
        kind="video"
        metadata={{
          ...baseMetadata,
          fileName: "video.mp4",
          contentType: "video/mp4",
          width: 1920,
          height: 1080,
        }}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /Просмотр видео/i }),
    ).toBeInTheDocument();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("supports navigation across media items", () => {
    render(
      <ImageLightbox
        mediaItems={[
          {
            src: "/media/one.png",
            kind: "image",
            alt: "one",
            metadata: { ...baseMetadata, attachmentId: 1, fileName: "one.png" },
          },
          {
            src: "/media/two.png",
            kind: "image",
            alt: "two",
            metadata: { ...baseMetadata, attachmentId: 2, fileName: "two.png" },
          },
        ]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("one.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Следующее медиа/i }));
    expect(screen.getByText("two.png")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("one.png")).toBeInTheDocument();
  });

  it("zooms media with ctrl + wheel", () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    expect(transform.getAttribute("style")).toContain("scale(1)");
    fireEvent.wheel(viewport, { deltaY: -100, ctrlKey: true });
    expect(transform.getAttribute("style")).toContain("scale(1.2)");
  });

  it("prevents default browser zoom while lightbox handles ctrl + wheel", () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const wheelEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -100,
    });

    const dispatchResult = viewport.dispatchEvent(wheelEvent);
    expect(dispatchResult).toBe(false);
    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it("falls back to opening original media when fullscreen API fails", async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("blocked"));
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value: requestFullscreen,
    });

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Развернуть/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      "/media/preview.png",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
