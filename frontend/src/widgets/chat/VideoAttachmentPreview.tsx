import { type SyntheticEvent, useCallback, useState } from "react";

import type { Attachment } from "../../entities/message/types";
import styles from "../../styles/chat/VideoAttachmentPreview.module.css";

const formatPreviewDuration = (value: number): string => {
  const totalSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const freezePreviewPlayback = (
  event: SyntheticEvent<HTMLVideoElement>,
): void => {
  const video = event.currentTarget;
  try {
    video.pause();
    video.currentTime = 0;
  } catch {
    // Ignore teardown issues in test/runtime edge cases.
  }
};

type VideoAttachmentPreviewProps = {
  /**
   * Видео-вложение, которое отображается в ленте сообщений.
   */
  attachment: Attachment;
  /**
   * Открывает полноразмерный viewer.
   */
  onOpen: () => void;
};

/**
 * Inline preview для видео в ленте сообщений.
 *
 * Preview всегда использует обычный браузерный `<video>` без controls и без
 * playback-ownership: он нужен только для первого кадра и metadata.
 */
export function VideoAttachmentPreview({
  attachment,
  onOpen,
}: VideoAttachmentPreviewProps) {
  const [durationLabel, setDurationLabel] = useState<string | null>(null);
  const fallbackBadge =
    attachment.originalFilename.split(".").at(-1)?.toUpperCase() ?? "VIDEO";

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      const duration = event.currentTarget.duration;
      if (Number.isFinite(duration) && duration > 0) {
        setDurationLabel(formatPreviewDuration(duration));
      }
      freezePreviewPlayback(event);
    },
    [],
  );

  return (
    <button
      type="button"
      className={styles.videoPreviewTile}
      data-message-menu-ignore="true"
      onClick={onOpen}
      aria-label={`Открыть видео ${attachment.originalFilename}`}
    >
      {attachment.url ? (
        <video
          src={attachment.url}
          poster={attachment.thumbnailUrl ?? undefined}
          preload="metadata"
          muted
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          className={styles.attachVideoPreview}
          aria-hidden="true"
          tabIndex={-1}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={freezePreviewPlayback}
          onLoadedData={freezePreviewPlayback}
          onPlay={freezePreviewPlayback}
        >
          <track kind="captions" />
        </video>
      ) : attachment.thumbnailUrl ? (
        <img
          src={attachment.thumbnailUrl}
          alt=""
          aria-hidden="true"
          className={styles.attachVideoPreview}
          draggable={false}
        />
      ) : (
        <div className={styles.attachVideoPreviewFallback} aria-hidden="true">
          {fallbackBadge}
        </div>
      )}
      <span className={styles.videoPreviewPlayIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className={styles.videoPreviewDuration}>
        {durationLabel ?? fallbackBadge}
      </span>
    </button>
  );
}
