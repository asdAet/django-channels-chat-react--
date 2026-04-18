import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LightboxVideoPlayer } from "./LightboxVideoPlayer";

const baseProps = {
  src: "/media/video.mp4",
  fileName: "video.mp4",
  mediaClassName: "media",
  mediaTransformClassName: "transform",
  onRequestFullscreen: vi.fn(),
};

type MockVideoState = {
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
};

const installMockVideoState = (
  video: HTMLVideoElement,
  overrides?: Partial<MockVideoState>,
) => {
  const state: MockVideoState = {
    currentTime: 0,
    duration: 120,
    playbackRate: 1,
    volume: 1,
    muted: false,
    ...overrides,
  };

  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => state.currentTime,
    set: (nextValue: number) => {
      state.currentTime = Number(nextValue);
    },
  });
  Object.defineProperty(video, "duration", {
    configurable: true,
    get: () => state.duration,
  });
  Object.defineProperty(video, "playbackRate", {
    configurable: true,
    get: () => state.playbackRate,
    set: (nextValue: number) => {
      state.playbackRate = Number(nextValue);
    },
  });
  Object.defineProperty(video, "volume", {
    configurable: true,
    get: () => state.volume,
    set: (nextValue: number) => {
      state.volume = Number(nextValue);
    },
  });
  Object.defineProperty(video, "muted", {
    configurable: true,
    get: () => state.muted,
    set: (nextValue: boolean) => {
      state.muted = Boolean(nextValue);
    },
  });

  return state;
};

describe("LightboxVideoPlayer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps manual seek preview stable until media events catch up", async () => {
    const { container } = render(
      <LightboxVideoPlayer {...baseProps} layout="desktop" />,
    );

    await screen.findByTestId("lightbox-video-player-desktop");

    const video = container.querySelector("video") as HTMLVideoElement;
    const videoState = installMockVideoState(video, { duration: 120 });
    fireEvent.loadedMetadata(video);

    const [progressRange] = screen.getAllByRole("slider");

    fireEvent.pointerDown(progressRange);
    fireEvent.input(progressRange, { target: { value: "45.5" } });

    expect(videoState.currentTime).toBe(45.5);
    expect((progressRange as HTMLInputElement).value).toBe("45.5");
    expect(screen.getByText("00:45")).toBeInTheDocument();
    expect(screen.getByText("-01:14")).toBeInTheDocument();

    videoState.currentTime = 45.5;
    fireEvent.seeked(video);

    videoState.currentTime = 46.8;
    fireEvent.timeUpdate(video);

    expect((progressRange as HTMLInputElement).value).toBe("46.8");
    expect(screen.getByText("00:46")).toBeInTheDocument();
    expect(screen.getByText("-01:13")).toBeInTheDocument();
  });

  it("ignores stale timeupdate events while a manual seek is still pending", async () => {
    const { container } = render(
      <LightboxVideoPlayer {...baseProps} layout="desktop" />,
    );

    await screen.findByTestId("lightbox-video-player-desktop");

    const video = container.querySelector("video") as HTMLVideoElement;
    const videoState = installMockVideoState(video, { duration: 39.734 });
    fireEvent.loadedMetadata(video);

    const [progressRange] = screen.getAllByRole("slider");

    fireEvent.pointerDown(progressRange);
    fireEvent.input(progressRange, { target: { value: "9.3" } });
    fireEvent.change(progressRange, { target: { value: "9.3" } });

    expect(videoState.currentTime).toBe(9.3);
    expect((progressRange as HTMLInputElement).value).toBe("9.3");
    expect(screen.getByText("00:09")).toBeInTheDocument();

    videoState.currentTime = 0;
    fireEvent.timeUpdate(video);

    expect((progressRange as HTMLInputElement).value).toBe("9.3");
    expect(screen.getByText("00:09")).toBeInTheDocument();

    videoState.currentTime = 9.3;
    fireEvent.seeked(video);

    expect((progressRange as HTMLInputElement).value).toBe("9.3");
  });

  it("commits seek to middle and end positions without resetting to start", async () => {
    const { container } = render(
      <LightboxVideoPlayer {...baseProps} layout="mobile" />,
    );

    await screen.findByTestId("lightbox-video-player-mobile");

    const video = container.querySelector("video") as HTMLVideoElement;
    const videoState = installMockVideoState(video, { duration: 120 });
    fireEvent.loadedMetadata(video);

    const [progressRange] = screen.getAllByRole("slider");

    fireEvent.focus(progressRange);
    fireEvent.input(progressRange, { target: { value: "61.2" } });
    fireEvent.change(progressRange, { target: { value: "61.2" } });

    expect(videoState.currentTime).toBe(61.2);
    expect((progressRange as HTMLInputElement).value).toBe("61.2");
    expect(screen.getByText("01:01")).toBeInTheDocument();
    expect(screen.getByText("-00:58")).toBeInTheDocument();

    videoState.currentTime = 61.2;
    fireEvent.seeked(video);

    fireEvent.input(progressRange, { target: { value: "120" } });
    fireEvent.change(progressRange, { target: { value: "120" } });

    expect(videoState.currentTime).toBe(120);
    expect((progressRange as HTMLInputElement).value).toBe("120");
    expect(screen.getByText("02:00")).toBeInTheDocument();
    expect(screen.getByText("-00:00")).toBeInTheDocument();

    videoState.currentTime = 120;
    fireEvent.seeked(video);
    fireEvent.timeUpdate(video);

    expect((progressRange as HTMLInputElement).value).toBe("120");
  });

  it("toggles the standalone speed menu and closes it on outside click or Escape", async () => {
    render(<LightboxVideoPlayer {...baseProps} layout="desktop" />);

    await screen.findByTestId("lightbox-video-player-desktop");

    const speedButton = screen.getByRole("button", { expanded: false });

    fireEvent.click(speedButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.click(speedButton);
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(speedButton);
    fireEvent.pointerDown(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(speedButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("stops playback and detaches the video source on unmount", async () => {
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause");
    const loadSpy = vi.spyOn(HTMLMediaElement.prototype, "load");
    const { container, unmount } = render(
      <LightboxVideoPlayer {...baseProps} layout="desktop" />,
    );

    await screen.findByTestId("lightbox-video-player-desktop");

    const video = container.querySelector("video") as HTMLVideoElement;
    installMockVideoState(video, { duration: 120 });
    fireEvent.loadedMetadata(video);
    fireEvent.play(video);

    unmount();

    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(video.getAttribute("src")).toBeNull();
  });

  it("restores the previously selected volume for the next opened video", async () => {
    const firstRender = render(
      <LightboxVideoPlayer {...baseProps} layout="desktop" />,
    );

    await screen.findByTestId("lightbox-video-player-desktop");

    const firstVideo = firstRender.container.querySelector(
      "video",
    ) as HTMLVideoElement;
    const firstState = installMockVideoState(firstVideo, { duration: 120 });
    fireEvent.loadedMetadata(firstVideo);

    const [, firstVolumeRange] = screen.getAllByRole("slider");
    fireEvent.input(firstVolumeRange, { target: { value: "0.35" } });

    expect(firstState.volume).toBeCloseTo(0.35, 5);

    firstRender.unmount();

    const secondRender = render(
      <LightboxVideoPlayer
        {...baseProps}
        src="/media/video-2.mp4"
        fileName="video-2.mp4"
        layout="desktop"
      />,
    );

    await screen.findByTestId("lightbox-video-player-desktop");

    const secondVideo = secondRender.container.querySelector(
      "video",
    ) as HTMLVideoElement;
    const secondState = installMockVideoState(secondVideo, { duration: 120 });
    fireEvent.loadedMetadata(secondVideo);

    const [, secondVolumeRange] = screen.getAllByRole(
      "slider",
    ) as HTMLInputElement[];

    expect(secondState.volume).toBeCloseTo(0.35, 5);
    expect(secondVolumeRange.value).toBe("0.35");
  });
});
