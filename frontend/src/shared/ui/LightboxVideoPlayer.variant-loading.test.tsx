import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const baseProps = {
  src: "/media/video.mp4",
  fileName: "video.mp4",
  mediaClassName: "media",
  mediaTransformClassName: "transform",
  onRequestFullscreen: vi.fn(),
};

describe("LightboxVideoPlayer variant loading", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("./LightboxVideoPlayer.loaders");
  });

  it("loads only the desktop player view loader for desktop layout", async () => {
    const desktopLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="desktop-player-loader-hit" />,
    });
    const mobileLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="mobile-player-loader-hit" />,
    });

    vi.doMock("./LightboxVideoPlayer.loaders", () => ({
      loadLightboxVideoPlayerDesktopView: desktopLoader,
      loadLightboxVideoPlayerMobileView: mobileLoader,
    }));

    const { LightboxVideoPlayer } = await import("./LightboxVideoPlayer");

    render(<LightboxVideoPlayer {...baseProps} layout="desktop" />);

    expect(await screen.findByTestId("desktop-player-loader-hit")).toBeInTheDocument();
    expect(desktopLoader).toHaveBeenCalledTimes(1);
    expect(mobileLoader).not.toHaveBeenCalled();
  });

  it("loads only the mobile player view loader for mobile layout", async () => {
    const desktopLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="desktop-player-loader-hit" />,
    });
    const mobileLoader = vi.fn().mockResolvedValue({
      default: () => <div data-testid="mobile-player-loader-hit" />,
    });

    vi.doMock("./LightboxVideoPlayer.loaders", () => ({
      loadLightboxVideoPlayerDesktopView: desktopLoader,
      loadLightboxVideoPlayerMobileView: mobileLoader,
    }));

    const { LightboxVideoPlayer } = await import("./LightboxVideoPlayer");

    render(<LightboxVideoPlayer {...baseProps} layout="mobile" />);

    expect(await screen.findByTestId("mobile-player-loader-hit")).toBeInTheDocument();
    expect(mobileLoader).toHaveBeenCalledTimes(1);
    expect(desktopLoader).not.toHaveBeenCalled();
  });
});
