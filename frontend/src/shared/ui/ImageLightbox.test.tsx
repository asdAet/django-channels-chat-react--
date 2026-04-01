import { act, createEvent, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const createMediaItem = (attachmentId: number, fileName: string) => ({
  src: `/media/${fileName}`,
  kind: "image" as const,
  alt: fileName.replace(".png", ""),
  metadata: {
    ...baseMetadata,
    attachmentId,
    fileName,
  },
});

const installDeviceEnvironment = ({
  viewportWidth,
  viewportHeight = 720,
  coarsePointer,
  canHover,
}: {
  viewportWidth: number;
  viewportHeight?: number;
  coarsePointer?: boolean;
  canHover?: boolean;
}) => {
  const isCoarsePointer = coarsePointer ?? viewportWidth <= 768;
  const canUseHover = canHover ?? !isCoarsePointer;

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: viewportWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: viewportHeight,
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: isCoarsePointer ? 1 : 0,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        (query.includes("pointer: coarse") ||
          query.includes("any-pointer: coarse")) &&
        isCoarsePointer
          ? true
          : (query.includes("pointer: fine") && !isCoarsePointer) ||
              ((query.includes("hover: hover") ||
                query.includes("any-hover: hover")) &&
                canUseHover),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const waitForDesktopView = async () => {
  await screen.findByTestId("image-lightbox-desktop-view");
};

const waitForMobileView = async () => {
  await screen.findByTestId("image-lightbox-mobile-view");
};

describe("ImageLightbox", () => {
  beforeEach(() => {
    installDeviceEnvironment({ viewportWidth: 1280 });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders image metadata in preview mode", async () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

    expect(
      screen.getByRole("dialog", { name: /Просмотр изображения/i }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("preview")).toBeInTheDocument();
    expect(screen.getByText("preview.png")).toBeInTheDocument();
    expect(screen.getByText(/ID: 77/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/1280x720/i)).toBeInTheDocument();
  });

  it("does not close when the overlay background is clicked", async () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    await waitForDesktopView();
    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes after pressing the close button and waiting for the animation", async () => {
    const onClose = vi.fn();
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    await waitForDesktopView();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(historyBackSpy).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
      vi.advanceTimersByTime(199);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders a desktop video player variant for video media", async () => {
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

    await waitForDesktopView();
    await screen.findByTestId("lightbox-video-player-desktop");
    expect(
      screen.getByRole("dialog", { name: /Просмотр видео/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("lightbox-video-player-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("lightbox-video-player-mobile")).not.toBeInTheDocument();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("uses a single desktop stage without mobile deck markup", async () => {
    render(
      <ImageLightbox
        mediaItems={[
          createMediaItem(1, "one.png"),
          createMediaItem(2, "two.png"),
          createMediaItem(3, "three.png"),
        ]}
        initialIndex={1}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

    expect(screen.getByTestId("lightbox-desktop-stage")).toBeInTheDocument();
    expect(screen.queryByTestId("lightbox-mobile-deck")).not.toBeInTheDocument();
    expect(screen.getByAltText("two")).toBeInTheDocument();
    expect(screen.queryByAltText("one")).not.toBeInTheDocument();
    expect(screen.queryByAltText("three")).not.toBeInTheDocument();
  });

  it("supports navigation across media items on desktop", async () => {
    render(
      <ImageLightbox
        mediaItems={[createMediaItem(1, "one.png"), createMediaItem(2, "two.png")]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();
    expect(screen.getByText("one.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Следующее медиа/i }));
    expect(screen.getByText("two.png")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText("one.png")).toBeInTheDocument();
  });

  it("renders only the mobile deck and updates the current item after swipe settle", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });

    render(
      <ImageLightbox
        mediaItems={[createMediaItem(1, "one.png"), createMediaItem(2, "two.png")]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const track = screen.getByTestId("lightbox-mobile-track");

    expect(screen.getByTestId("lightbox-mobile-deck")).toBeInTheDocument();
    expect(screen.queryByTestId("lightbox-desktop-stage")).not.toBeInTheDocument();

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 220, clientY: 180 }],
    });
    fireEvent.touchMove(viewport, {
      touches: [{ clientX: 120, clientY: 176 }],
    });

    expect(track.getAttribute("style")).toContain("translate3d(-100px, 0px, 0px)");

    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 120, clientY: 176 }],
    });

    fireEvent.transitionEnd(track, {
      propertyName: "transform",
    });

    expect(screen.getByText("two.png")).toBeInTheDocument();
  });

  it("returns to the current mobile item when horizontal swipe is cancelled", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });

    render(
      <ImageLightbox
        mediaItems={[createMediaItem(1, "one.png"), createMediaItem(2, "two.png")]}
        initialIndex={0}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const track = screen.getByTestId("lightbox-mobile-track");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 220, clientY: 180 }],
    });
    fireEvent.touchMove(viewport, {
      touches: [{ clientX: 170, clientY: 176 }],
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 170, clientY: 176 }],
    });
    fireEvent.transitionEnd(track, {
      propertyName: "transform",
    });

    expect(screen.getByText("one.png")).toBeInTheDocument();
    expect(track.getAttribute("style")).toContain("translate3d(0px, 0px, 0px)");
  });

  it("closes after a vertical swipe gesture on mobile", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });
    const onClose = vi.fn();
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    await waitForMobileView();
    vi.useFakeTimers();
    const viewport = screen.getByTestId("lightbox-media-viewport");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 160, clientY: 140 }],
    });
    fireEvent.touchMove(viewport, {
      touches: [{ clientX: 162, clientY: 280 }],
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 162, clientY: 280 }],
    });

    act(() => {
      expect(historyBackSpy).toHaveBeenCalledTimes(1);
      window.dispatchEvent(new PopStateEvent("popstate"));
      vi.advanceTimersByTime(200);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on browser back before page navigation", async () => {
    const onClose = vi.fn();

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={onClose}
      />,
    );

    await waitForDesktopView();
    vi.useFakeTimers();

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
      vi.advanceTimersByTime(199);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("zooms media with ctrl + wheel", async () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    expect(transform.getAttribute("style")).toContain("scale(1)");
    fireEvent.wheel(viewport, {
      deltaY: -100,
      ctrlKey: true,
      clientX: 200,
      clientY: 200,
    });
    expect(transform.getAttribute("style")).toContain("scale(1.2)");
  });

  it("toggles zoom with double click", async () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    fireEvent.doubleClick(viewport, { clientX: 200, clientY: 180 });
    expect(transform.getAttribute("style")).toContain("scale(2.5)");

    fireEvent.doubleClick(viewport, { clientX: 200, clientY: 180 });
    expect(transform.getAttribute("style")).toContain("scale(1)");
  });

  it("toggles zoom with double tap", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 160, clientY: 180 }],
      timeStamp: 100,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 160, clientY: 180 }],
      timeStamp: 120,
    });
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 164, clientY: 184 }],
      timeStamp: 240,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 164, clientY: 184 }],
      timeStamp: 260,
    });
    expect(transform.getAttribute("style")).toContain("scale(2.5)");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 162, clientY: 182 }],
      timeStamp: 420,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 162, clientY: 182 }],
      timeStamp: 440,
    });
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 166, clientY: 186 }],
      timeStamp: 560,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 166, clientY: 186 }],
      timeStamp: 580,
    });
    expect(transform.getAttribute("style")).toContain("scale(1)");
  });

  it("ignores the synthetic double click that can follow a touch double tap", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 160, clientY: 180 }],
      timeStamp: 100,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 160, clientY: 180 }],
      timeStamp: 120,
    });
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 164, clientY: 184 }],
      timeStamp: 240,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 164, clientY: 184 }],
      timeStamp: 260,
    });
    expect(transform.getAttribute("style")).toContain("scale(2.5)");

    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 162, clientY: 182 }],
      timeStamp: 420,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 162, clientY: 182 }],
      timeStamp: 440,
    });
    fireEvent.touchStart(viewport, {
      touches: [{ clientX: 166, clientY: 186 }],
      timeStamp: 560,
    });
    fireEvent.touchEnd(viewport, {
      changedTouches: [{ clientX: 166, clientY: 186 }],
      timeStamp: 580,
    });
    expect(transform.getAttribute("style")).toContain("scale(1)");

    const syntheticDoubleClick = createEvent.dblClick(viewport, {
      clientX: 166,
      clientY: 186,
    });
    Object.defineProperty(syntheticDoubleClick, "timeStamp", {
      configurable: true,
      value: 620,
    });
    fireEvent(viewport, syntheticDoubleClick);

    expect(transform.getAttribute("style")).toContain("scale(1)");
  });

  it("supports pinch-to-zoom on touch devices", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    fireEvent.touchStart(viewport, {
      touches: [
        { clientX: 120, clientY: 120 },
        { clientX: 220, clientY: 120 },
      ],
    });
    fireEvent.touchMove(viewport, {
      touches: [
        { clientX: 90, clientY: 120 },
        { clientX: 250, clientY: 120 },
      ],
    });

    expect(transform.getAttribute("style")).not.toContain("scale(1);");
  });

  it("prevents default browser zoom while lightbox handles ctrl + wheel", async () => {
    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

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

    await waitForDesktopView();
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
