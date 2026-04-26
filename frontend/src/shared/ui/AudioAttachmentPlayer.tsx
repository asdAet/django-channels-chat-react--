import {
  type CSSProperties,
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "../../styles/ui/AudioAttachmentPlayer.module.css";

type Props = {
  src: string;
  title?: string;
  subtitle?: string;
  fileSizeLabel?: string;
  fileTypeLabel?: string;
  sentAtLabel?: string;
  sentAtIso?: string;
  downloadName?: string;
  compact?: boolean;
  className?: string;
};

type PlaybackState = {
  srcKey: string;
  isReady: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  hasError: boolean;
};

const DEFAULT_VOLUME = 0.9;
const VOLUME_MENU_MIN_TOP_SPACE = 112;

/**
 * Нормализует время аудио, чтобы UI не получал NaN и отрицательные значения.
 * @param value Время из HTMLAudioElement.
 * @returns Безопасное значение времени в секундах.
 */
const normalizeTime = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;

/**
 * Нормализует громкость аудио в диапазон браузерного media API.
 * @param value Новое значение громкости.
 * @returns Число от 0 до 1.
 */
const normalizeVolume = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
};

/**
 * Создает начальное состояние проигрывания для конкретного audio src.
 * @param srcKey Адрес текущего аудиофайла.
 * @returns Начальное состояние плеера.
 */
const createInitialPlaybackState = (srcKey: string): PlaybackState => ({
  srcKey,
  isReady: false,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  hasError: false,
});

/**
 * Форматирует секунды в компактную тайм-метку плеера.
 * @param value Количество секунд.
 * @returns Строка в формате mm:ss.
 */
const formatTime = (value: number) => {
  const total = Math.max(0, Math.floor(normalizeTime(value)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function AudioFileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 16v-5l5-1v5" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="14" cy="15" r="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted ? (
        <>
          <line x1="17" y1="9" x2="22" y2="14" />
          <line x1="22" y1="9" x2="17" y2="14" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

/**
 * Рендерит компактный аудиоплеер вложения с метаданными файла и управлением громкостью.
 * @param props Свойства аудиовложения.
 */
export function AudioAttachmentPlayer({
  src,
  title,
  subtitle,
  fileSizeLabel,
  fileTypeLabel,
  sentAtLabel,
  sentAtIso,
  downloadName,
  compact = false,
  className,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [volumePlacement, setVolumePlacement] = useState<"top" | "bottom">(
    "top",
  );
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() =>
    createInitialPlaybackState(src),
  );

  const currentState =
    playbackState.srcKey === src
      ? playbackState
      : createInitialPlaybackState(src);

  const patchState = useCallback(
    (patch: Partial<Omit<PlaybackState, "srcKey">>) => {
      setPlaybackState((prev) => {
        const base =
          prev.srcKey === src ? prev : createInitialPlaybackState(src);
        return { ...base, ...patch, srcKey: src };
      });
    },
    [src],
  );

  const handleToggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || currentState.hasError) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        patchState({ hasError: true, isPlaying: false });
      }
      return;
    }

    audio.pause();
  }, [currentState.hasError, patchState]);

  const handleSeek = useCallback(
    (nextValue: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(nextValue)) return;
      audio.currentTime = nextValue;
      patchState({ currentTime: nextValue });
    },
    [patchState],
  );

  const handleVolumeChange = useCallback((nextValue: number) => {
    const normalized = normalizeVolume(nextValue);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = normalized;
      audio.muted = normalized <= 0;
    }
    setVolume(normalized);
  }, []);

  const updateVolumePlacement = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setVolumePlacement(
      rect.top > VOLUME_MENU_MIN_TOP_SPACE ? "top" : "bottom",
    );
  }, []);

  const durationLabel = formatTime(currentState.duration);
  const currentLabel = formatTime(currentState.currentTime);
  const progressMax = useMemo(
    () => (currentState.duration > 0 ? currentState.duration : 0),
    [currentState.duration],
  );
  const progressValue = Math.min(currentState.currentTime, progressMax);
  const progressPercent =
    progressMax > 0 ? Math.min(100, (progressValue / progressMax) * 100) : 0;
  const progressStyle = {
    "--audio-progress": `${progressPercent}%`,
  } as CSSProperties;
  const volumeStyle = {
    "--audio-volume": `${volume * 100}%`,
  } as CSSProperties;
  const metadataItems = [fileSizeLabel ?? subtitle, sentAtLabel].filter(
    (item): item is string => Boolean(item),
  );
  const displayTitle = title || "Аудиофайл";
  const isMuted = volume <= 0;

  return (
    <div
      className={[styles.root, compact ? styles.compact : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      data-message-menu-ignore="true"
      data-testid="audio-attachment-player"
    >
      <audio
        key={src}
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          event.currentTarget.volume = volume;
          event.currentTarget.muted = volume <= 0;
          const duration = normalizeTime(event.currentTarget.duration);
          patchState({
            duration,
            currentTime: 0,
            isReady: true,
            hasError: false,
          });
        }}
        onTimeUpdate={(event) => {
          patchState({
            currentTime: normalizeTime(event.currentTarget.currentTime),
          });
        }}
        onPlay={() => patchState({ isPlaying: true })}
        onPause={() => patchState({ isPlaying: false })}
        onEnded={() => patchState({ isPlaying: false, currentTime: 0 })}
        onError={() =>
          patchState({ hasError: true, isPlaying: false, isReady: false })
        }
      />

      <div className={styles.mainRow}>
        <span className={styles.fileIcon} aria-hidden="true">
          <AudioFileIcon />
        </span>

        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <span className={styles.title} title={displayTitle}>
              {displayTitle}
            </span>
            {fileTypeLabel && (
              <span className={styles.typeBadge} title={fileTypeLabel}>
                {fileTypeLabel}
              </span>
            )}
          </div>

          {metadataItems.length > 0 && (
            <div className={styles.detailRow}>
              {metadataItems.map((item, index) => (
                <Fragment key={`${item}-${index}`}>
                  {index > 0 && (
                    <span className={styles.detailSeparator} aria-hidden="true">
                      •
                    </span>
                  )}
                  {item === sentAtLabel ? (
                    <time className={styles.detailItem} dateTime={sentAtIso}>
                      {item}
                    </time>
                  ) : (
                    <span className={styles.detailItem}>{item}</span>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.controlsRow}>
        <button
          type="button"
          className={styles.playButton}
          onClick={() => void handleToggle()}
          disabled={currentState.hasError}
          aria-label={currentState.isPlaying ? "Пауза" : "Воспроизвести"}
          title={currentState.isPlaying ? "Пауза" : "Воспроизвести"}
        >
          {currentState.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className={styles.timeLabel}>
          {currentLabel} / {durationLabel}
        </span>

        <input
          type="range"
          className={styles.progress}
          style={progressStyle}
          min={0}
          max={progressMax}
          step={0.1}
          value={progressValue}
          disabled={
            !currentState.isReady || currentState.hasError || progressMax <= 0
          }
          onChange={(event) => {
            const parsed = Number(event.currentTarget.value);
            if (Number.isFinite(parsed)) handleSeek(parsed);
          }}
          aria-label="Позиция воспроизведения"
        />

        <span
          className={styles.volumeWrap}
          data-volume-placement={volumePlacement}
          onFocus={(event) => updateVolumePlacement(event.currentTarget)}
          onMouseEnter={(event) => updateVolumePlacement(event.currentTarget)}
        >
          <button
            type="button"
            className={styles.volumeButton}
            aria-label="Громкость"
            title="Громкость"
          >
            <VolumeIcon muted={isMuted} />
          </button>
          <span className={styles.volumeMenu}>
            <input
              type="range"
              className={styles.volumeSlider}
              style={volumeStyle}
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => {
                const parsed = Number(event.currentTarget.value);
                handleVolumeChange(parsed);
              }}
              aria-label="Громкость аудио"
            />
          </span>
        </span>
      </div>

      {currentState.hasError && (
        <p className={styles.errorText}>
          Не удалось воспроизвести аудио.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" download={downloadName}>
            Скачать файл
          </a>
          .
        </p>
      )}
    </div>
  );
}
