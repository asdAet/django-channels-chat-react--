import { type SyntheticEvent, useCallback, useState } from "react";

import type { Attachment } from "../../entities/message/types";
import styles from "../../styles/chat/MessageBubble.module.css";

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
    // jsdom и часть браузерных teardown-сценариев могут бросать исключение.
  }
};

type VideoAttachmentPreviewProps = {
  /**
   * Вложение видео, которое отображается в ленте сообщений.
   */
  attachment: Attachment;
  /**
   * Открывает полноценный lightbox-просмотр.
   */
  onOpen: () => void;
};

/**
 * Рендерит безопасный inline preview видео для списка сообщений.
 *
 * Preview использует настоящий `<video>` только для чтения metadata и первого
 * кадра, но не владеет playback: он всегда `muted`, без `controls` и без
 * `autoplay`. Полноценное воспроизведение остается только у lightbox-player.
 */
export function VideoAttachmentPreview({
  attachment,
  onOpen,
}: VideoAttachmentPreviewProps) {
  const [durationLabel, setDurationLabel] = useState<string | null>(null);

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
      <video
        src={attachment.url ?? undefined}
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
      {durationLabel ? (
        <span className={styles.videoPreviewDuration}>{durationLabel}</span>
      ) : null}
    </button>
  );
}
