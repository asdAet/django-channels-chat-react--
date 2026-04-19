import {
  type CSSProperties,
  forwardRef,
  useId,
  lazy,
  type Ref,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import mediaStyles from "../../styles/ui/LightboxVideoPlayer.media.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import type { LightboxDropdownMenuController, LightboxDropdownMenuId } from "./lightboxControls/types";
import {
  loadLightboxVideoPlayerDesktopView,
  loadLightboxVideoPlayerMobileView,
} from "./LightboxVideoPlayer.loaders";
import {
  type LightboxVideoPlayerHandle,
  type LightboxVideoPlayerLayout,
  type LightboxVideoPlayerViewProps,
} from "./LightboxVideoPlayer.types";
import {
  LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE,
  claimLightboxPlaybackOwner,
  claimActiveLightboxVideo,
  isActiveLightboxPlaybackOwner,
  readLightboxVideoAudioState,
  releaseLightboxPlaybackOwner,
  registerLightboxVideo,
  subscribeLightboxPlaybackOwner,
  releaseActiveLightboxVideo,
  stopLightboxVideoPlayback,
  unregisterLightboxVideo,
  writeLightboxVideoAudioState,
} from "./LightboxVideoPlayer.session";
import {
  clampNumber,
  formatTime,
  stopPropagation,
} from "./LightboxVideoPlayer.utils";

const LightboxVideoPlayerDesktopView = lazy(loadLightboxVideoPlayerDesktopView);
const LightboxVideoPlayerMobileView = lazy(loadLightboxVideoPlayerMobileView);

const CONTROLS_HIDE_DELAY_MS = 2600;
const SEEK_SYNC_EPSILON_SECONDS = 0.75;

const normalizePlaybackTime = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;

const clampSeekTime = (value: number, nextDuration: number) => {
  const normalizedValue = normalizePlaybackTime(value);
  const maxValue =
    Number.isFinite(nextDuration) && nextDuration > 0
      ? nextDuration
      : normalizedValue;

  return clampNumber(normalizedValue, 0, maxValue);
};

type Props = {
  src: string;
  posterSrc?: string | null;
  fileName: string;
  mediaClassName: string;
  mediaTransformClassName: string;
  mediaTransformRef?: Ref<HTMLDivElement>;
  consumeMediaClickSuppression?: () => boolean;
  menuController?: LightboxDropdownMenuController;
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
    </div>
  );
}

/**
 * Функция `LightboxVideoPlayer`.
 */
export const LightboxVideoPlayer = forwardRef<LightboxVideoPlayerHandle, Props>(
  function LightboxVideoPlayer(
    {
      src,
      posterSrc,
      fileName,
      mediaClassName,
      mediaTransformClassName,
      mediaTransformRef,
      consumeMediaClickSuppression,
      menuController,
      onRequestFullscreen,
      layout,
    },
    ref,
  ) {
    return (
      <LightboxVideoPlayerSession
        key={`${layout}:${src}`}
        src={src}
        posterSrc={posterSrc}
        fileName={fileName}
        mediaClassName={mediaClassName}
        mediaTransformClassName={mediaTransformClassName}
        mediaTransformRef={mediaTransformRef}
        consumeMediaClickSuppression={consumeMediaClickSuppression}
        menuController={menuController}
        onRequestFullscreen={onRequestFullscreen}
        layout={layout}
        imperativeRef={ref}
      />
    );
  },
);

LightboxVideoPlayer.displayName = "LightboxVideoPlayer";

function LightboxVideoPlayerSession({
  src,
  posterSrc,
  fileName,
  mediaClassName,
  mediaTransformClassName,
  mediaTransformRef,
  consumeMediaClickSuppression,
  menuController,
  onRequestFullscreen,
  layout,
  imperativeRef,
}: Props & { imperativeRef?: Ref<LightboxVideoPlayerHandle> }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackOwnerId = useId();
  const initialAudioStateRef = useRef(readLightboxVideoAudioState());
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [controlsWakeToken, setControlsWakeToken] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekDraftTime, setSeekDraftTime] = useState<number | null>(null);
  const [volume, setVolume] = useState(initialAudioStateRef.current.volume);
  const [isMuted, setIsMuted] = useState(initialAudioStateRef.current.muted);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaybackArmed, setIsPlaybackArmed] = useState(false);
  const [isPlayerViewReady, setIsPlayerViewReady] = useState(false);
  const [mountedVideoElement, setMountedVideoElement] =
    useState<HTMLVideoElement | null>(null);
  const [internalActiveMenuId, setInternalActiveMenuId] =
    useState<LightboxDropdownMenuId | null>(null);
  const [canUsePictureInPicture, setCanUsePictureInPicture] = useState(false);
  const [isInPictureInPicture, setIsInPictureInPicture] = useState(false);
  const isSeekInteractionActiveRef = useRef(false);
  const pendingSeekTargetRef = useRef<number | null>(null);
  const activeMenuId = menuController?.activeMenuId ?? internalActiveMenuId;
  const isAnyMenuOpen = activeMenuId !== null;
  const isPlaybackOwner = useSyncExternalStore(
    subscribeLightboxPlaybackOwner,
    () => isActiveLightboxPlaybackOwner(playbackOwnerId),
    () => false,
  );
  const shouldRenderPlayableVideo =
    isPlayerViewReady && isPlaybackArmed && isPlaybackOwner;

  const handleVideoElementRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setMountedVideoElement(node);
  }, []);

  const markControlsActive = useCallback(() => {
    setIsControlsVisible(true);
    setControlsWakeToken((previousValue) => previousValue + 1);
  }, []);

  const closeActiveMenu = useCallback(() => {
    if (menuController) {
      menuController.onCloseMenu();
      return;
    }

    setInternalActiveMenuId(null);
  }, [menuController]);

  const toggleMenu = useCallback(
    (menuId: LightboxDropdownMenuId) => {
      if (menuController) {
        menuController.onToggleMenu(menuId);
        return;
      }

      setInternalActiveMenuId((previousValue) =>
        previousValue === menuId ? null : menuId,
      );
    },
    [menuController],
  );

  const persistAudioState = useCallback(
    (nextVolume: number, nextMuted: boolean) => {
      const normalizedVolume = clampNumber(nextVolume, 0, 1);
      initialAudioStateRef.current = {
        volume: normalizedVolume,
        muted: nextMuted,
      };
      writeLightboxVideoAudioState({
        volume: normalizedVolume,
        muted: nextMuted,
      });
    },
    [],
  );

  useEffect(() => {
    if (layout === "mobile" || !isReady || !isPlaying || isAnyMenuOpen) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsControlsVisible(false);
    }, CONTROLS_HIDE_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [controlsWakeToken, isAnyMenuOpen, isPlaying, isReady, layout]);

  useEffect(() => {
    if (shouldRenderPlayableVideo) {
      return;
    }

    setIsReady(false);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setSeekDraftTime(null);
    setCanUsePictureInPicture(false);
    setIsInPictureInPicture(false);
  }, [shouldRenderPlayableVideo]);

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

  useLayoutEffect(() => {
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.volume = volume;
    video.muted = isMuted || volume === 0;
  }, [isMuted, volume]);

  useLayoutEffect(() => {
    claimLightboxPlaybackOwner(playbackOwnerId);
    setIsPlaybackArmed(true);

    return () => {
      setIsPlaybackArmed(false);
      releaseLightboxPlaybackOwner(playbackOwnerId);
    };
  }, [playbackOwnerId, src]);

  useEffect(() => {
    if (!mountedVideoElement) {
      return;
    }

    registerLightboxVideo(mountedVideoElement);
    return () => {
      unregisterLightboxVideo(mountedVideoElement);
      stopLightboxVideoPlayback(mountedVideoElement, { detachSource: true });
    };
  }, [mountedVideoElement]);

  const handleTogglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    markControlsActive();

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
  }, [markControlsActive]);

  useImperativeHandle(
    imperativeRef,
    () => ({
      togglePlayback: () => {
        void handleTogglePlayback();
      },
      pausePlayback: () => {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        stopLightboxVideoPlayback(video);
        setIsPlaying(false);
        setIsControlsVisible(true);
      },
    }),
    [handleTogglePlayback],
  );

  useEffect(() => {
    if (layout !== "desktop") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Spacebar") {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      void handleTogglePlayback();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleTogglePlayback, layout]);

  const syncMeasuredCurrentTime = useCallback(
    (nextValue: number) => {
      const resolvedTime = normalizePlaybackTime(nextValue);
      const pendingSeekTarget = pendingSeekTargetRef.current;

      if (pendingSeekTarget !== null) {
        if (
          Math.abs(resolvedTime - pendingSeekTarget) <= SEEK_SYNC_EPSILON_SECONDS
        ) {
          pendingSeekTargetRef.current = null;
          isSeekInteractionActiveRef.current = false;
          setCurrentTime(resolvedTime);
          setSeekDraftTime(null);
        }

        return;
      }

      setCurrentTime(resolvedTime);
      setSeekDraftTime((previousValue) => {
        if (previousValue === null) {
          return previousValue;
        }

        if (Math.abs(resolvedTime - previousValue) <= SEEK_SYNC_EPSILON_SECONDS) {
          return null;
        }

        return previousValue;
      });
    },
    [],
  );

  const writeSeekDraft = useCallback(
    (nextValue: number) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(nextValue)) {
        return;
      }

      const clampedValue = clampSeekTime(nextValue, duration);
      markControlsActive();
      pendingSeekTargetRef.current = clampedValue;
      setCurrentTime(clampedValue);
      setSeekDraftTime(clampedValue);
      video.currentTime = clampedValue;
    },
    [duration, markControlsActive],
  );

  const handleSeekPreview = useCallback(
    (nextValue: number) => {
      writeSeekDraft(nextValue);
    },
    [writeSeekDraft],
  );

  const handleSeekCommit = useCallback(
    (nextValue: number) => {
      writeSeekDraft(nextValue);
    },
    [writeSeekDraft],
  );

  const handleSeekInteractionStart = useCallback(() => {
    isSeekInteractionActiveRef.current = true;
    markControlsActive();
  }, [markControlsActive]);

  const handleSeekInteractionEnd = useCallback(() => {
    isSeekInteractionActiveRef.current = false;
  }, []);

  const displayTime = seekDraftTime ?? currentTime;

  const progressPercent = useMemo(() => {
    if (duration <= 0) {
      return 0;
    }

    return clampNumber((displayTime / duration) * 100, 0, 100);
  }, [displayTime, duration]);

  const remainingLabel = formatTime(Math.max(0, duration - displayTime));
  const resolvedControlsVisible =
    layout === "mobile" ||
    !isReady ||
    !isPlaying ||
    isAnyMenuOpen ||
    isControlsVisible;
  const volumePercent = clampNumber(volume * 100, 0, 100);
  const progressStyle = {
    "--player-range-progress": `${progressPercent}%`,
  } as CSSProperties;
  const volumeStyle = {
    "--player-range-progress": `${volumePercent}%`,
  } as CSSProperties;
  const clearSeekDraft = useCallback(() => {
    pendingSeekTargetRef.current = null;
    setSeekDraftTime(null);
    isSeekInteractionActiveRef.current = false;
  }, []);

  const markSeekSettled = useCallback(
    (nextValue: number) => {
      syncMeasuredCurrentTime(nextValue);
    },
    [syncMeasuredCurrentTime],
  );

  const handleVolumeChange = useCallback(
    (nextValue: number) => {
      const video = videoRef.current;
      const clampedValue = clampNumber(nextValue, 0, 1);
      const nextMuted = clampedValue === 0;

      markControlsActive();
      setVolume(clampedValue);
      setIsMuted(nextMuted);
      persistAudioState(clampedValue, nextMuted);

      if (!video) {
        return;
      }

      video.volume = clampedValue;
      video.muted = nextMuted;
    },
    [markControlsActive, persistAudioState],
  );

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    markControlsActive();

    if (video.muted || video.volume === 0) {
      const restoredVolume = volume > 0 ? volume : 1;
      video.muted = false;
      video.volume = restoredVolume;
      setIsMuted(false);
      setVolume(restoredVolume);
      persistAudioState(restoredVolume, false);
      return;
    }

    video.muted = true;
    setIsMuted(true);
    persistAudioState(volume, true);
  }, [markControlsActive, persistAudioState, volume]);

  const handleSetPlaybackRate = useCallback(
    (nextRate: number) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      markControlsActive();
      video.playbackRate = nextRate;
      setPlaybackRate(nextRate);
      closeActiveMenu();
    },
    [closeActiveMenu, markControlsActive],
  );

  const handleTogglePictureInPicture = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    const pipDocument = document as PictureInPictureDocument;
    const video = videoRef.current as PictureInPictureVideo | null;
    if (!video) {
      return;
    }

    markControlsActive();

    try {
      if (pipDocument.pictureInPictureElement) {
        await pipDocument.exitPictureInPicture?.();
        setIsInPictureInPicture(false);
        return;
      }

      await video.requestPictureInPicture?.();
    } catch {
      syncPictureInPictureCapability();
    }
  }, [markControlsActive, syncPictureInPictureCapability]);

  const handlePlayerViewReady = useCallback(() => {
    setIsPlayerViewReady(true);
  }, []);

  const posterViewport = (
    <div className={mediaStyles.mediaSurface} data-testid="lightbox-video-surface">
      <div
        className={[
          mediaTransformClassName,
          mediaStyles.videoTransform,
          layout === "desktop" ? mediaStyles.desktopVideoTransform : "",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={mediaTransformRef}
        data-testid="lightbox-media-transform"
        onClick={(event) => {
          event.stopPropagation();
          if (consumeMediaClickSuppression?.()) {
            event.preventDefault();
            return;
          }
          void handleTogglePlayback();
        }}
      >
        {posterSrc ? (
          <img
            className={[mediaClassName, mediaStyles.mediaVideoPreview].join(" ")}
            src={posterSrc}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        ) : (
          <div
            className={[mediaClassName, mediaStyles.mediaVideoFallback].join(" ")}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  const mediaViewport = (
    <div className={mediaStyles.mediaSurface} data-testid="lightbox-video-surface">
      <div
        className={[
          mediaTransformClassName,
          mediaStyles.videoTransform,
          layout === "desktop" ? mediaStyles.desktopVideoTransform : "",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={mediaTransformRef}
        data-testid="lightbox-media-transform"
        onClick={(event) => {
          event.stopPropagation();
          if (consumeMediaClickSuppression?.()) {
            event.preventDefault();
            return;
          }
          void handleTogglePlayback();
        }}
      >
        <video
          ref={handleVideoElementRef}
          className={[mediaClassName, mediaStyles.mediaVideo].join(" ")}
          {...{ [LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE]: "true" }}
          src={src}
          title={fileName}
          aria-label={fileName}
          playsInline
          preload="metadata"
          autoPlay
          muted={isMuted || volume === 0}
          tabIndex={-1}
          onLoadedMetadata={(event) => {
            const nextDuration = normalizePlaybackTime(event.currentTarget.duration);
            event.currentTarget.volume = volume;
            event.currentTarget.muted = isMuted || volume === 0;
            setDuration(nextDuration);
            clearSeekDraft();
            syncMeasuredCurrentTime(event.currentTarget.currentTime);
            setPlaybackRate(event.currentTarget.playbackRate || 1);
            setIsReady(true);
            syncPictureInPictureCapability();
          }}
          onTimeUpdate={(event) => {
            markSeekSettled(event.currentTarget.currentTime);
          }}
          onSeeked={(event) => {
            markSeekSettled(event.currentTarget.currentTime);
          }}
          onDurationChange={(event) => {
            setDuration(
              normalizePlaybackTime(event.currentTarget.duration),
            );
          }}
          onPlay={(event) => {
            claimActiveLightboxVideo(event.currentTarget);
            setIsPlaying(true);
            markControlsActive();
          }}
          onPause={(event) => {
            releaseActiveLightboxVideo(event.currentTarget);
            setIsPlaying(false);
            setIsControlsVisible(true);
          }}
          onEnded={(event) => {
            setIsPlaying(false);
            setIsControlsVisible(true);
            clearSeekDraft();
            syncMeasuredCurrentTime(
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
            persistAudioState(
              event.currentTarget.volume,
              event.currentTarget.muted,
            );
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
    mediaViewport: shouldRenderPlayableVideo ? mediaViewport : posterViewport,
    isReady,
    isPlaying,
    isControlsVisible: resolvedControlsVisible,
    duration,
    displayTime,
    volume,
    isMuted,
    playbackRate,
    activeMenuId,
    canUsePictureInPicture,
    isInPictureInPicture,
    progressStyle,
    volumeStyle,
    remainingLabel,
    onTogglePlayback: () => {
      void handleTogglePlayback();
    },
    onSeekPreview: handleSeekPreview,
    onSeekCommit: handleSeekCommit,
    onSeekInteractionStart: handleSeekInteractionStart,
    onSeekInteractionEnd: handleSeekInteractionEnd,
    onVolumeChange: handleVolumeChange,
    onToggleMute: handleToggleMute,
    onSetPlaybackRate: handleSetPlaybackRate,
    onToggleMenu: (menuId) => {
      markControlsActive();
      toggleMenu(menuId);
    },
    onCloseMenu: () => {
      markControlsActive();
      closeActiveMenu();
    },
    onTogglePictureInPicture: () => {
      void handleTogglePictureInPicture();
    },
    onRequestFullscreen,
    onControlsInteraction: (event) => {
      stopPropagation(event);
      markControlsActive();
    },
    onSurfaceInteraction: markControlsActive,
    onViewReady: handlePlayerViewReady,
  };

  return (
    <Suspense
      fallback={<LightboxVideoPlayerFallback mediaViewport={posterViewport} />}
    >
      <SelectedView {...viewProps} />
    </Suspense>
  );
}
