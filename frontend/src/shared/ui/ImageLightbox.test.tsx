import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const fireTouchPointerEvent = (
  target: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  init: {
    pointerId: number;
    clientX: number;
    clientY: number;
    buttons?: number;
  },
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX,
    clientY: init.clientY,
    buttons: init.buttons ?? (type === "pointerup" ? 0 : 1),
  });

  Object.defineProperties(event, {
    pointerId: { value: init.pointerId },
    pointerType: { value: "touch" },
    isPrimary: { value: true },
  });

  fireEvent(target, event);
};

describe("ImageLightbox", () => {
  beforeEach(() => {
    window.history.replaceState({ route: "chat" }, "", "/public");
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.history.replaceState(null, "", "/");
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
      screen.queryByRole("menuitem", { name: "Закрыть" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByAltText("photo"));
    vi.advanceTimersByTime(402);

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

  it("closes on Escape", async () => {
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
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(window.location.pathname).toBe("/public");
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
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(window.location.pathname).toBe("/public");
  });

  it("closes on browser back without leaving the current page", async () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        src="/media/photo.png"
        alt="photo"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    fireEvent(
      window,
      new PopStateEvent("popstate", { state: { route: "chat" } }),
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(window.location.pathname).toBe("/public");
  });

  it("closes an image viewer by vertical swipe on mobile", async () => {
    const onClose = vi.fn();

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
        onClose={onClose}
      />,
    );

    const stage = screen.getByTestId("image-lightbox-stage");
    Object.defineProperty(stage, "clientHeight", {
      configurable: true,
      value: 800,
    });

    fireTouchPointerEvent(stage, "pointerdown", {
      pointerId: 1,
      clientX: 120,
      clientY: 220,
    });

    fireTouchPointerEvent(stage, "pointermove", {
      pointerId: 1,
      clientX: 124,
      clientY: 410,
    });

    fireTouchPointerEvent(stage, "pointerup", {
      pointerId: 1,
      clientX: 124,
      clientY: 410,
      buttons: 0,
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
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
    Object.defineProperty(player, "clientHeight", {
      configurable: true,
      value: 800,
    });

    fireTouchPointerEvent(player, "pointerdown", {
      pointerId: 1,
      clientX: 120,
      clientY: 220,
    });

    fireTouchPointerEvent(player, "pointermove", {
      pointerId: 1,
      clientX: 124,
      clientY: 410,
    });

    fireTouchPointerEvent(player, "pointerup", {
      pointerId: 1,
      clientX: 124,
      clientY: 410,
      buttons: 0,
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
