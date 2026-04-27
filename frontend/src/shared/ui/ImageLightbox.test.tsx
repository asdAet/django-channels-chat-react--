import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DEVICE_SNAPSHOT,
  type DeviceSnapshot,
} from "../lib/device";
import { DeviceContext } from "../lib/device/device-context";
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

const renderWithDevice = (
  device: DeviceSnapshot,
  ui: Parameters<typeof render>[0],
) =>
  render(
    <DeviceContext.Provider value={device}>{ui}</DeviceContext.Provider>,
  );

describe("ImageLightbox", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders an image viewer and closes when the image is clicked", () => {
    const onClose = vi.fn();
    vi.useFakeTimers();

    render(
      <ImageLightbox
        src="/media/photo.png"
        alt="photo"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Просмотр изображения" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("photo")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Скачать preview\.png/i }),
    ).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole("dialog"), {
      clientX: 42,
      clientY: 64,
    });
    expect(
      screen.getByRole("menuitem", { name: "Скачать" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Закрыть" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByAltText("photo"));
    vi.advanceTimersByTime(221);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses desktop zoom interactions for fine pointer screens", () => {
    renderWithDevice(
      {
        ...DEFAULT_DEVICE_SNAPSHOT,
        viewportWidth: 1280,
        viewportHeight: 800,
        canHover: true,
        primaryPointer: "fine",
      },
      <ImageLightbox
        src="/media/photo.png"
        alt="photo"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("image-lightbox-stage")).toHaveAttribute(
      "data-zoom-mode",
      "desktop",
    );
  });

  it("uses mobile zoom interactions for coarse pointer screens", () => {
    renderWithDevice(
      {
        ...DEFAULT_DEVICE_SNAPSHOT,
        viewportWidth: 390,
        viewportHeight: 844,
        isMobileViewport: true,
        hasTouch: true,
        primaryPointer: "coarse",
      },
      <ImageLightbox
        src="/media/photo.png"
        alt="photo"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId("image-lightbox-stage")).toHaveAttribute(
      "data-zoom-mode",
      "mobile",
    );
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        src="/media/photo.png"
        alt="photo"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates through gallery items", () => {
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

    expect(screen.getByAltText("one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Следующее медиа" }));
    expect(screen.getByAltText("two")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Предыдущее медиа" }));
    expect(screen.getByAltText("one")).toBeInTheDocument();
  });

  it("renders one video player for video items and closes on viewport background click", async () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        mediaItems={[
          {
            src: "/media/clip.mp4",
            previewSrc: "/media/clip.jpg",
            kind: "video",
            alt: "clip",
            metadata: {
              ...baseMetadata,
              attachmentId: 5,
              fileName: "clip.mp4",
              contentType: "video/mp4",
            },
          },
        ]}
        initialIndex={0}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Просмотр видео" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("lightbox-video-player"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("lightbox-video-element")).toHaveLength(1);

    fireEvent.click(screen.getByTestId("lightbox-media-viewport"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes a video viewer by vertical swipe", async () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        mediaItems={[
          {
            src: "/media/clip.mp4",
            previewSrc: "/media/clip.jpg",
            kind: "video",
            alt: "clip",
            metadata: {
              ...baseMetadata,
              attachmentId: 5,
              fileName: "clip.mp4",
              contentType: "video/mp4",
            },
          },
        ]}
        initialIndex={0}
        onClose={onClose}
      />,
    );

    const player = await screen.findByTestId("lightbox-video-player-desktop");
    fireEvent.pointerDown(player, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 120,
      clientY: 220,
    });
    fireEvent.pointerMove(player, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 124,
      clientY: 410,
    });
    fireEvent.pointerUp(player, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 124,
      clientY: 410,
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
