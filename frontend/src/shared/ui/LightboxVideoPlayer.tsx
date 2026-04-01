import {
  type CSSProperties,
  lazy,
  type Ref,
  Suspense,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import mediaStyles from "../../styles/ui/LightboxVideoPlayer.media.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import {
  loadLightboxVideoPlayerDesktopView,
  loadLightboxVideoPlayerMobileView,
} from "./LightboxVideoPlayer.loaders";
import {
  type LightboxVideoPlayerLayout,
  type LightboxVideoPlayerViewProps,
} from "./LightboxVideoPlayer.types";
import {
  clampNumber,
  formatTime,
  stopPropagation,
} from "./LightboxVideoPlayer.utils";

const LightboxVideoPlayerDesktopView = lazy(loadLightboxVideoPlayerDesktopView);
const LightboxVideoPlayerMobileView = lazy(loadLightboxVideoPlayerMobileView);

type Props = {
  src: string;
  fileName: string;
  mediaClassName: string;
  mediaTransformClassName: string;
  mediaTransformRef?: Ref<HTMLDivElement>;
  onRequestFullscreen: () => void;
  layout: LightboxVideoPlayerLayout;
};

type PictureInPictureVideo = HTMLVideoElement & {
  disablePictureInPicture?: boolean;
  requestPictureInPicture?: () => Promise<unknown>;
};

type PictureInPictureDocument = Document & {
  exitPictureInPicture?: () => Promise<void>;
  pictureInPictureElement?: Element | null;
  pictureInPictureEnabled?: boolean;
};

function LightboxVideoPlayerFallback({
  mediaViewport,
}: Pick<LightboxVideoPlayerViewProps, "mediaViewport">) {
  return (
    <div
      className={frameStyles.root}
      data-testid="lightbox-video-player-loading"
    >
      {mediaViewport}
      <div className={frameStyles.controls} />
    </div>
  );
}

export function LightboxVideoPlayer({
  src,
  fileName,
  mediaClassName,
  mediaTransformClassName,
  mediaTransformRef,
  onRequestFullscreen,
  layout,
}: Props) {
  return (
    <LightboxVideoPlayerSession
      key={src}
      src={src}
      fileName={fileName}
      mediaClassName={mediaClassName}
      mediaTransformClassName={mediaTransformClassName}
      mediaTransformRef={mediaTransformRef}
      onRequestFullscreen={onRequestFullscreen}
      layout={layout}
    />
  );
}

function LightboxVideoPlayerSession({
  src,
  fileName,
  mediaClassName,
  mediaTransformClassName,
  mediaTransformRef,
  onRequestFullscreen: _onRequestFullscreen,
  layout,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRateMenuOpen, setIsRateMenuOpen] = useState(false);
  const [canUsePictureInPicture, setCanUsePictureInPicture] = useState(false);
  const [isInPictureInPicture, setIsInPictureInPicture] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsRateMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  const syncPictureInPictureCapability = useCallback(() => {
    if (typeof document === "undefined") {
      setCanUsePictureInPicture(false);
      return;
    }

    const pipDocument = document as PictureInPictureDocument;
    const pipVideo = videoRef.current as PictureInPictureVideo | null;

    setCanUsePictureInPicture(
      Boolean(
        pipDocument.pictureInPictureEnabled &&
          pipVideo &&
          !pipVideo.disablePictureInPicture &&
          typeof pipVideo.requestPictureInPicture === "function",
      ),
    );
    setIsInPictureInPicture(
      Boolean(
        pipDocument.pictureInPictureElement &&
          pipDocument.pictureInPictureElement === pipVideo,
      ),
    );
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleEnterPictureInPicture = () => {
      setIsInPictureInPicture(true);
    };
    const handleLeavePictureInPicture = () => {
      setIsInPictureInPicture(false);
    };

    video.addEventListener(
      "enterpictureinpicture",
      handleEnterPictureInPicture as EventListener,
    );
    video.addEventListener(
      "leavepictureinpicture",
      handleLeavePictureInPicture as EventListener,
    );

    return () => {
      video.removeEventListener(
        "enterpictureinpicture",
        handleEnterPictureInPicture as EventListener,
      );
      video.removeEventListener(
        "leavepictureinpicture",
        handleLeavePictureInPicture as EventListener,
      );
    };
  }, [src]);

  const handleTogglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
  }, []);

  const handleSeek = useCallback((nextValue: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextValue)) {
      return;
    }

    video.currentTime = nextValue;
    setCurrentTime(nextValue);
  }, []);

  const handleVolumeChange = useCallback((nextValue: number) => {
    const video = videoRef.current;
    const clampedValue = clampNumber(nextValue, 0, 1);

    setVolume(clampedValue);
    setIsMuted(clampedValue === 0);

    if (!video) {
      return;
    }

    video.volume = clampedValue;
    video.muted = clampedValue === 0;
  }, []);

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.muted || video.volume === 0) {
      const restoredVolume = volume > 0 ? volume : 1;
      video.muted = false;
      video.volume = restoredVolume;
      setIsMuted(false);
      setVolume(restoredVolume);
      return;
    }

    video.muted = true;
    setIsMuted(true);
  }, [volume]);

  const handleSetPlaybackRate = useCallback((nextRate: number) => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    setIsRateMenuOpen(false);
  }, []);

  const handleTogglePictureInPicture = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    const pipDocument = document as PictureInPictureDocument;
    const video = videoRef.current as PictureInPictureVideo | null;
    if (!video) {
      return;
    }

    try {
      if (pipDocument.pictureInPictureElement === video) {
        await pipDocument.exitPictureInPicture?.();
        return;
      }

      await video.requestPictureInPicture?.();
    } catch {
      setIsInPictureInPicture(false);
    }
  }, []);

  const progressPercent = useMemo(() => {
    if (duration <= 0) {
      return 0;
    }

    return clampNumber((currentTime / duration) * 100, 0, 100);
  }, [currentTime, duration]);

  const volumePercent = clampNumber(volume * 100, 0, 100);
  const progressStyle = {
    "--player-range-progress": `${progressPercent}%`,
  } as CSSProperties;
  const volumeStyle = {
    "--player-range-progress": `${volumePercent}%`,
  } as CSSProperties;
  const remainingLabel = formatTime(Math.max(0, duration - currentTime));

  const handleVideoClick = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      event.stopPropagation();

      const video = videoRef.current;
      if (!video || video.paused) {
        return;
      }

      video.pause();
    },
    [],
  );

  const mediaViewport = (
    <div
      className={mediaStyles.mediaViewport}
      onDoubleClick={stopPropagation}
    >
      <div
        className={mediaTransformClassName}
        ref={mediaTransformRef}
        data-testid="lightbox-media-transform"
        onPointerDownCapture={stopPropagation}
        onPointerUpCapture={stopPropagation}
        onClickCapture={stopPropagation}
        onClick={stopPropagation}
      >
        <video
          ref={videoRef}
          className={mediaClassName}
          src={src}
          title={fileName}
          aria-label={fileName}
          playsInline
          preload="metadata"
          autoPlay
          onPointerDownCapture={stopPropagation}
          onPointerUpCapture={stopPropagation}
          onClickCapture={stopPropagation}
          onClick={handleVideoClick}
          onDoubleClick={stopPropagation}
          onLoadedMetadata={(event) => {
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : 0,
            );
            setCurrentTime(
              Number.isFinite(event.currentTarget.currentTime)
                ? event.currentTarget.currentTime
                : 0,
            );
            setPlaybackRate(event.currentTarget.playbackRate || 1);
            setIsReady(true);
            setVolume(event.currentTarget.volume);
            setIsMuted(event.currentTarget.muted);
            syncPictureInPictureCapability();
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(
              Number.isFinite(event.currentTarget.currentTime)
                ? event.currentTarget.currentTime
                : 0,
            );
          }}
          onDurationChange={(event) => {
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : 0,
            );
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={(event) => {
            setIsPlaying(false);
            setCurrentTime(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : duration,
            );
          }}
          onRateChange={(event) => {
            setPlaybackRate(event.currentTarget.playbackRate || 1);
          }}
          onVolumeChange={(event) => {
            setVolume(event.currentTarget.volume);
            setIsMuted(event.currentTarget.muted);
          }}
          onCanPlay={syncPictureInPictureCapability}
          onLoadedData={syncPictureInPictureCapability}
        >
          <track kind="captions" />
        </video>
      </div>
    </div>
  );

  const SelectedView =
    layout === "mobile"
      ? LightboxVideoPlayerMobileView
      : LightboxVideoPlayerDesktopView;

  const viewProps: LightboxVideoPlayerViewProps = {
    rootRef,
    mediaViewport,
    isReady,
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    playbackRate,
    isRateMenuOpen,
    canUsePictureInPicture,
    isInPictureInPicture,
    progressStyle,
    volumeStyle,
    remainingLabel,
    onTogglePlayback: () => {
      void handleTogglePlayback();
    },
    onSeek: handleSeek,
    onVolumeChange: handleVolumeChange,
    onToggleMute: handleToggleMute,
    onSetPlaybackRate: handleSetPlaybackRate,
    onToggleRateMenu: () => {
      setIsRateMenuOpen((previousValue) => !previousValue);
    },
    onTogglePictureInPicture: () => {
      void handleTogglePictureInPicture();
    },
    onControlsInteraction: stopPropagation,
  };

  return (
    <Suspense fallback={<LightboxVideoPlayerFallback mediaViewport={mediaViewport} />}>
      <SelectedView {...viewProps} />
    </Suspense>
  );
}
