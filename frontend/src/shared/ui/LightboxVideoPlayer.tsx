import {
  type CSSProperties,
  type Ref,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "../../styles/ui/LightboxVideoPlayer.module.css";

type Props = {
  src: string;
  fileName: string;
  mediaClassName: string;
  mediaTransformClassName: string;
  mediaTransformRef?: Ref<HTMLDivElement>;
  onRequestFullscreen: () => void;
  layout: "desktop" | "mobile";
};

type PlaybackRateOption = {
  value: number;
  label: string;
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

const PLAYBACK_RATE_OPTIONS: PlaybackRateOption[] = [
  { value: 0.5, label: "Медленно" },
  { value: 1, label: "По умолчанию" },
  { value: 1.2, label: "Ускоренно" },
  { value: 1.5, label: "Быстро" },
  { value: 1.7, label: "Очень быстро" },
  { value: 2, label: "Сверхбыстро" },
];

const formatTime = (value: number): string => {
  const totalSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const stopPropagation = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
};

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5zM18 9l-4 6M14 9l4 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 9.5a4.5 4.5 0 0 1 0 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.5 7a8 8 0 0 1 0 10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5l9 6.5-9 6.5z" fill="currentColor" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4H4v4M16 4h4v4M8 20H4v-4M20 16v4h-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 9L4 4M15 9l5-5M9 15l-5 5M15 15l5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PictureInPictureIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="12.5" y="10" width="5.5" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 1 0 12 8.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12l1.6-1.2-1.5-2.6-2 .4a7 7 0 0 0-1.2-.7L15.4 5h-3l-.5 1.9a7 7 0 0 0-1.2.7l-2-.4-1.5 2.6L8 12l-1.6 1.2 1.5 2.6 2-.4c.4.3.8.5 1.2.7l.5 1.9h3l.5-1.9c.4-.2.8-.4 1.2-.7l2 .4 1.5-2.6z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
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
  const isMobilePlayer = layout === "mobile";
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
    setIsRateMenuOpen(false);
    setIsReady(false);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setPlaybackRate(1);
    setCanUsePictureInPicture(false);
    setIsInPictureInPicture(false);
  }, [src]);

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

  return (
    <div
      ref={rootRef}
      className={[
        styles.root,
        isMobilePlayer ? styles.rootMobile : styles.rootDesktop,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={styles.mediaViewport}
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
              setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0);
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
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(duration);
            }}
            onRateChange={(event) => {
              setPlaybackRate(event.currentTarget.playbackRate || 1);
            }}
            onVolumeChange={(event) => {
              setVolume(event.currentTarget.volume);
              setIsMuted(event.currentTarget.muted);
            }}
            onEnterPictureInPicture={() => setIsInPictureInPicture(true)}
            onLeavePictureInPicture={() => setIsInPictureInPicture(false)}
            onCanPlay={syncPictureInPictureCapability}
            onLoadedData={syncPictureInPictureCapability}
          >
            <track kind="captions" />
          </video>
        </div>
      </div>

      <div
        className={[
          styles.controls,
          isMobilePlayer ? styles.controlsMobile : styles.controlsDesktop,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onPointerDown={stopPropagation}
        onPointerMove={stopPropagation}
        onPointerUp={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchMove={stopPropagation}
        onTouchEnd={stopPropagation}
      >
        {!isMobilePlayer && (
          <div className={styles.controlsTop}>
            <div className={styles.leadingControls}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={isMuted || volume === 0 ? "Включить звук" : "Выключить звук"}
                onClick={() => void handleToggleMute()}
              >
                <VolumeIcon muted={isMuted || volume === 0} />
              </button>
              <input
                type="range"
                className={[styles.range, styles.volumeRange].join(" ")}
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                style={volumeStyle}
                aria-label="Громкость"
                onChange={(event) => {
                  handleVolumeChange(Number(event.currentTarget.value));
                }}
              />
            </div>

            <button
              type="button"
              className={styles.playPauseButton}
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
              onClick={() => void handleTogglePlayback()}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className={styles.trailingControls}>
              {/* <button
                type="button"
                className={styles.iconButton}
                aria-label="Открыть на весь экран"
                onClick={() => void onRequestFullscreen()}
              >
                <ExpandIcon />
              </button> */}

              {canUsePictureInPicture && (
                <button
                  type="button"
                  className={[
                    styles.iconButton,
                    isInPictureInPicture ? styles.iconButtonActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label="Картинка в картинке"
                  onClick={() => void handleTogglePictureInPicture()}
                >
                  <PictureInPictureIcon />
                </button>
              )}

              <div className={styles.settingsWrap}>
                <button
                  type="button"
                  className={[
                    styles.iconButton,
                    isRateMenuOpen ? styles.iconButtonActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label="Скорость воспроизведения"
                  onClick={() => {
                    setIsRateMenuOpen((prev) => !prev);
                  }}
                >
                  <SettingsIcon />
                </button>

                {isRateMenuOpen && (
                  <div className={styles.rateMenu}>
                    <div className={styles.rateMenuHeader}>
                      <span className={styles.rateMenuValue}>
                        {playbackRate.toFixed(1)}x
                      </span>
                      <div className={styles.rateMenuMeter}>
                        <div
                          className={styles.rateMenuMeterFill}
                          style={{
                            width: `${((playbackRate - 0.5) / 1.5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.rateMenuList}>
                      {PLAYBACK_RATE_OPTIONS.map((option) => {
                        const isSelected = playbackRate === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={[
                              styles.rateOption,
                              isSelected ? styles.rateOptionSelected : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              handleSetPlaybackRate(option.value);
                            }}
                          >
                            <span className={styles.rateOptionValue}>
                              {option.value.toFixed(1)}x
                            </span>
                            <span className={styles.rateOptionLabel}>
                              {option.label}
                            </span>
                            <span className={styles.rateOptionCheck}>
                              {isSelected ? "✓" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={[styles.timeline, isMobilePlayer ? styles.timelineMobile : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
          <input
            type="range"
            className={[styles.range, styles.progressRange].join(" ")}
            min={0}
            max={duration > 0 ? duration : 0}
            step={0.1}
            value={duration > 0 ? Math.min(currentTime, duration) : 0}
            style={progressStyle}
            aria-label="Позиция видео"
            disabled={!isReady || duration <= 0}
            onChange={(event) => {
              handleSeek(Number(event.currentTarget.value));
            }}
          />
          <span className={styles.timeLabel}>-{remainingLabel}</span>
        </div>
      </div>
    </div>
  );
}
