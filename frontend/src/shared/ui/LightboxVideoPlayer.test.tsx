import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LightboxVideoPlayer } from "./LightboxVideoPlayer";

describe("LightboxVideoPlayer", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a native video element with the standard browser controls", () => {
    render(
      <LightboxVideoPlayer
        src="/media/video.mp4"
        poster="/media/video.jpg"
        fileName="video.mp4"
      />,
    );

    const video = screen.getByTestId("lightbox-video-element") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "/media/video.mp4");
    expect(video).toHaveAttribute("poster", "/media/video.jpg");
    expect(video).toHaveAttribute("controls");
  });

  it("stops the media element on unmount without clearing its source", () => {
    const { unmount } = render(
      <LightboxVideoPlayer src="/media/video.mp4" fileName="video.mp4" />,
    );

    unmount();

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });
});
