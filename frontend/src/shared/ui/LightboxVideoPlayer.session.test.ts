import { describe, expect, it, vi } from "vitest";

import {
  LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE,
  claimActiveLightboxVideo,
  registerLightboxVideo,
  stopAllLightboxVideos,
  unregisterLightboxVideo,
} from "./LightboxVideoPlayer.session";

const createVideoDouble = () => {
  const video = document.createElement("video");
  const pauseSpy = vi.fn();
  const loadSpy = vi.fn();

  Object.defineProperty(video, "pause", {
    configurable: true,
    value: pauseSpy,
  });
  Object.defineProperty(video, "load", {
    configurable: true,
    value: loadSpy,
  });

  return { video, pauseSpy, loadSpy };
};

describe("LightboxVideoPlayer.session", () => {
  it("pauses every other registered video when a new player claims audio", () => {
    const first = createVideoDouble();
    const second = createVideoDouble();

    registerLightboxVideo(first.video);
    registerLightboxVideo(second.video);

    claimActiveLightboxVideo(first.video);
    first.pauseSpy.mockClear();
    second.pauseSpy.mockClear();

    claimActiveLightboxVideo(second.video);

    expect(first.pauseSpy).toHaveBeenCalledTimes(1);
    expect(second.pauseSpy).not.toHaveBeenCalled();

    unregisterLightboxVideo(first.video);
    unregisterLightboxVideo(second.video);
  });

  it("stops all registered videos on a global close", () => {
    const first = createVideoDouble();
    const second = createVideoDouble();

    registerLightboxVideo(first.video);
    registerLightboxVideo(second.video);

    stopAllLightboxVideos();

    expect(first.pauseSpy).toHaveBeenCalledTimes(1);
    expect(second.pauseSpy).toHaveBeenCalledTimes(1);

    unregisterLightboxVideo(first.video);
    unregisterLightboxVideo(second.video);
  });

  it("stops lightbox videos discovered directly in the DOM even before registration", () => {
    const first = createVideoDouble();
    const second = createVideoDouble();
    first.video.setAttribute(LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE, "true");
    second.video.setAttribute(LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE, "true");
    document.body.append(first.video, second.video);

    stopAllLightboxVideos();

    expect(first.pauseSpy).toHaveBeenCalledTimes(1);
    expect(second.pauseSpy).toHaveBeenCalledTimes(1);

    first.video.remove();
    second.video.remove();
  });
});
