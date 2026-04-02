import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const baseMetadata = {
  attachmentId: 77,
  fileName: "preview.png",
  contentType: "image/png",
  fileSize: 2048,
  sentAt: "2026-03-19T09:15:00.000Z",
  width: 1280,
  height: 720,
};

const installDeviceEnvironment = (viewportWidth: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: viewportWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: 720,
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: viewportWidth <= 768 ? 1 : 0,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        (query.includes("pointer: coarse") ||
          query.includes("any-pointer: coarse")) &&
        viewportWidth <= 768,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
};

describe("ImageLightbox variant loading", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./ImageLightbox.loaders");
  });

  it("loads only the desktop view loader on desktop", async () => {
    installDeviceEnvironment(1280);

    const desktopLoader = vi.fn().mockResolvedValue({
      default: ({ currentItem }: { currentItem: { metadata: { fileName: string } } }) => (
        <div data-testid="desktop-loader-hit">{currentItem.metadata.fileName}</div>
      ),
    });
    const mobileLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="mobile-loader-hit" />,
    });

    vi.doMock("./ImageLightbox.loaders", () => ({
      loadImageLightboxDesktopView: desktopLoader,
      loadImageLightboxMobileView: mobileLoader,
    }));

    const { ImageLightbox } = await import("./ImageLightbox");

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByTestId("desktop-loader-hit")).toBeInTheDocument();
    expect(desktopLoader).toHaveBeenCalledTimes(1);
    expect(mobileLoader).not.toHaveBeenCalled();
  });

  it("loads only the mobile view loader on mobile", async () => {
    installDeviceEnvironment(390);

    const desktopLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="desktop-loader-hit" />,
    });
    const mobileLoader = vi.fn().mockResolvedValue({
      default: ({ currentItem }: { currentItem: { metadata: { fileName: string } } }) => (
        <div data-testid="mobile-loader-hit">{currentItem.metadata.fileName}</div>
      ),
    });

    vi.doMock("./ImageLightbox.loaders", () => ({
      loadImageLightboxDesktopView: desktopLoader,
      loadImageLightboxMobileView: mobileLoader,
    }));

    const { ImageLightbox } = await import("./ImageLightbox");

    render(
      <ImageLightbox
        src="/media/preview.png"
        alt="preview"
        metadata={baseMetadata}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByTestId("mobile-loader-hit")).toBeInTheDocument();
    expect(mobileLoader).toHaveBeenCalledTimes(1);
    expect(desktopLoader).not.toHaveBeenCalled();
  });
});
