import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageLightbox } from "./ImageLightbox";
import { consumePendingDesktopMediaDragRelease } from "./ImageLightbox.dragRelease";

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

const createVideoMediaItem = (
  attachmentId: number,
  fileName: string,
  previewFileName = fileName.replace(/\.[^.]+$/, ".jpg"),
) => ({
  src: `/media/${fileName}`,
  previewSrc: `/media/${previewFileName}`,
  kind: "video" as const,
  alt: fileName,
  metadata: {
    ...baseMetadata,
    attachmentId,
    fileName,
    contentType: "video/mp4",
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
  Object.defineProperty(window, "PointerEvent", {
    configurable: true,
    writable: true,
    value: MouseEvent,
  });
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

  it("closes the desktop image when the stage background is clicked", async () => {
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();
    fireEvent.click(screen.getByTestId("lightbox-desktop-stage"), {
      clientX: 40,
      clientY: 40,
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the desktop image when the image itself is clicked", async () => {
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();
    fireEvent.click(screen.getByAltText("preview"));

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the desktop image even when stage click lands inside image bounds", async () => {
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    await waitForDesktopView();

    const stage = screen.getByTestId("lightbox-desktop-stage");
    const transform = screen.getByTestId("lightbox-media-transform");
    vi.spyOn(transform, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      top: 100,
      right: 400,
      bottom: 300,
      left: 100,
      toJSON: () => ({}),
    });

    fireEvent.click(stage, { clientX: 220, clientY: 180 });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it("closes the desktop image after zoom on image click too", async () => {
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);

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
    fireEvent.doubleClick(viewport, { clientX: 200, clientY: 180 });
    fireEvent.click(screen.getByAltText("preview"));

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
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

  it("keeps desktop video action labels but omits the play aria-label", async () => {
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
      container.querySelectorAll('button[aria-label="Воспроизвести"]'),
    ).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /Полный экран/i }),
    ).toBeInTheDocument();
  });

  it("shares one dropdown controller between speed and more menus", async () => {
    render(
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

    const speedButton = screen.getByRole("button", {
      name: "Скорость воспроизведения",
    });

    fireEvent.click(speedButton);
    expect(
      within(screen.getByRole("menu")).getByRole("menuitem", { name: /1\.5x/i }),
    ).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(speedButton);
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(speedButton);
    fireEvent.click(
      within(screen.getByRole("menu")).getByRole("menuitem", {
        name: /1\.5x/i,
      }),
    );
    expect(screen.queryByRole("menu")).toBeNull();
    expect(speedButton).toHaveTextContent("1.5x");

    fireEvent.click(speedButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("lightbox-more-button"));
    const moreMenu = screen.getByRole("menu");
    expect(
      within(moreMenu).getByRole("menuitem", {
        name: /Открыть оригинал/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(moreMenu).queryByRole("menuitem", { name: /1\.5x/i }),
    ).toBeNull();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByTestId("image-lightbox-desktop-view")).toBeInTheDocument();
  });

  it("closes outside the video and toggles playback on the video itself", async () => {
    const onClose = vi.fn();
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          writable: true,
          value: false,
        });
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      });
    const pauseSpy = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          writable: true,
          value: true,
        });
        this.dispatchEvent(new Event("pause"));
      });

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
        onClose={onClose}
      />,
    );

    await waitForDesktopView();
    await screen.findByTestId("lightbox-video-player-desktop");

    const stage = screen.getByTestId("lightbox-desktop-stage");
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", {
      configurable: true,
      writable: true,
      value: true,
    });
    const transform = screen.getByTestId("lightbox-media-transform");
    vi.spyOn(transform, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      top: 100,
      right: 400,
      bottom: 300,
      left: 100,
      toJSON: () => ({}),
    });

    fireEvent.click(transform);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(historyBackSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(transform);
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(stage, {
      clientX: 40,
      clientY: 40,
    });
    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps video clicks inside media after zoom and closes only outside media", async () => {
    const onClose = vi.fn();
    const historyBackSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined);
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          writable: true,
          value: false,
        });
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      });

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
        onClose={onClose}
      />,
    );

    await waitForDesktopView();
    await screen.findByTestId("lightbox-video-player-desktop");

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const stage = screen.getByTestId("lightbox-desktop-stage");
    const transform = screen.getByTestId("lightbox-media-transform");
    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", {
      configurable: true,
      writable: true,
      value: true,
    });
    vi.spyOn(transform, "getBoundingClientRect").mockReturnValue({
      x: 120,
      y: 90,
      width: 520,
      height: 320,
      top: 90,
      right: 640,
      bottom: 410,
      left: 120,
      toJSON: () => ({}),
    });

    fireEvent.doubleClick(viewport, { clientX: 280, clientY: 220 });
    expect(transform.getAttribute("style")).toContain("scale(2.5)");

    fireEvent.click(stage, { clientX: 280, clientY: 220 });
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(historyBackSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(stage, { clientX: 40, clientY: 40 });
    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it("consumes a pending desktop image drag-release only once", () => {
    const pointerMovedRef = { current: true };

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: false,
        currentKind: "image",
        pointerMovedRef,
      }),
    ).toBe(true);
    expect(pointerMovedRef.current).toBe(false);

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: false,
        currentKind: "image",
        pointerMovedRef,
      }),
    ).toBe(false);
  });

  it("consumes a pending desktop video drag-release only once", () => {
    const pointerMovedRef = { current: true };

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: false,
        currentKind: "video",
        pointerMovedRef,
      }),
    ).toBe(true);
    expect(pointerMovedRef.current).toBe(false);

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: false,
        currentKind: "video",
        pointerMovedRef,
      }),
    ).toBe(false);
  });

  it("does not consume drag-release suppression for mobile layout or unknown kind", () => {
    const mobileVideoRef = { current: true };
    const unknownKindRef = { current: true };

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: false,
        currentKind: undefined,
        pointerMovedRef: unknownKindRef,
      }),
    ).toBe(false);
    expect(unknownKindRef.current).toBe(true);

    expect(
      consumePendingDesktopMediaDragRelease({
        isMobileLayout: true,
        currentKind: "video",
        pointerMovedRef: mobileVideoRef,
      }),
    ).toBe(false);
    expect(mobileVideoRef.current).toBe(true);
  });

  it("toggles desktop video playback with the space key", async () => {
    const playSpy = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          writable: true,
          value: false,
        });
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      });
    const pauseSpy = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(function (this: HTMLMediaElement) {
        Object.defineProperty(this, "paused", {
          configurable: true,
          writable: true,
          value: true,
        });
        this.dispatchEvent(new Event("pause"));
      });

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

    const video = container.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", {
      configurable: true,
      writable: true,
      value: true,
    });

    fireEvent.keyDown(document, { key: " " });
    expect(playSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: " " });
    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it("uses the same zoom layer for active video media", async () => {
    render(
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

    const viewport = screen.getByTestId("lightbox-media-viewport");
    const transform = screen.getByTestId("lightbox-media-transform");

    fireEvent.doubleClick(viewport, { clientX: 200, clientY: 180 });

    expect(transform.getAttribute("style")).toContain("scale(2.5)");
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

  it("renders only one playable video in the mobile deck and uses posters for neighbors", async () => {
    installDeviceEnvironment({ viewportWidth: 390 });
    const { container } = render(
      <ImageLightbox
        mediaItems={[
          createVideoMediaItem(1, "one.mp4", "one-thumb.jpg"),
          createVideoMediaItem(2, "two.mp4", "two-thumb.jpg"),
          createVideoMediaItem(3, "three.mp4", "three-thumb.jpg"),
        ]}
        initialIndex={1}
        onClose={vi.fn()}
      />,
    );

    await waitForMobileView();

    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    expect(
      container.querySelector('img[src="/media/one-thumb.jpg"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('img[src="/media/three-thumb.jpg"]'),
    ).not.toBeNull();
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

  it.skip("toggles media fullscreen mode without browser fullscreen", async () => {
    const requestFullscreen = vi.fn();
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

    const transform = screen.getByTestId("lightbox-media-transform");
    await act(async () => {
      await Promise.resolve();
    });

    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    expect(transform.getAttribute("style")).toContain("scale(1)");
    expect(transform).toHaveAttribute("data-media-fullscreen", "true");
    // eslint-disable-next-line no-irregular-whitespace
    fireEvent.click(screen.getByRole("button", { name: /Р Р°Р·РІРµСЂРЅСѓС‚СЊ/i }));
    expect(transform.getAttribute("style")).toContain("scale(1)");
    expect(transform).toHaveAttribute("data-media-fullscreen", "false");
  });
});
