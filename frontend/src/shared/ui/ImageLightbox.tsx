import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import styles from "../../styles/ui/ImageLightbox.module.css";
import type {
  ImageLightboxMediaItem,
  ImageLightboxProps,
  SingleMediaProps,
} from "./ImageLightbox.types";
import { LightboxVideoPlayer } from "./LightboxVideoPlayer";
import { useModalHistoryGuard } from "./useModalHistoryGuard";
import { ZoomableImageStage } from "./ZoomableImageStage";

const buildSingleItem = (props: SingleMediaProps): ImageLightboxMediaItem => ({
  src: props.src,
  previewSrc: props.previewSrc ?? null,
  downloadUrl: props.downloadUrl ?? props.src,
  kind: props.kind ?? "image",
  alt: props.alt,
  metadata: props.metadata,
});

const clampIndex = (index: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }

  const normalized = index % total;
  return normalized >= 0 ? normalized : normalized + total;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatSentAt = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsed);
};

/**
 * Unified media viewer shell for chat attachments.
 *
 * The shell restores the earlier fullscreen stage presentation for images and
 * videos while keeping the current native `<video controls>` implementation.
 */
export function ImageLightbox(props: ImageLightboxProps) {
  const { onClose } = props;
  const requestClose = useModalHistoryGuard(onClose);
  const mediaItems = useMemo<ImageLightboxMediaItem[]>(
    () =>
      "mediaItems" in props
        ? (props.mediaItems ?? [])
        : [buildSingleItem(props)],
    [props],
  );
  const requestedInitialIndex =
    "initialIndex" in props ? props.initialIndex ?? 0 : 0;

  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(requestedInitialIndex, mediaItems.length),
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const hasNavigation = mediaItems.length > 1;
  const currentItem = mediaItems[activeIndex];

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => clampIndex(current - 1, mediaItems.length));
  }, [mediaItems.length]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => clampIndex(current + 1, mediaItems.length));
  }, [mediaItems.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT");

      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          return;
        }

        requestClose();
        return;
      }

      if (!hasNavigation || isInputFocused) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrevious, hasNavigation, requestClose]);

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        requestClose();
      }
    },
    [requestClose],
  );

  const handleViewportClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        requestClose();
      }
    },
    [requestClose],
  );

  if (!currentItem) {
    return null;
  }

  const dialogLabel =
    currentItem.kind === "video" ? "Просмотр видео" : "Просмотр изображения";
  const metadataParts = [
    hasNavigation ? `${activeIndex + 1} / ${mediaItems.length}` : null,
    currentItem.metadata.contentType,
    formatFileSize(currentItem.metadata.fileSize),
    currentItem.metadata.width && currentItem.metadata.height
      ? `${currentItem.metadata.width} × ${currentItem.metadata.height}`
      : null,
    formatSentAt(currentItem.metadata.sentAt),
  ].filter((value): value is string => Boolean(value));

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      onClick={handleOverlayClick}
    >
      <div className={styles.shell}>
        {hasNavigation ? (
          <button
            type="button"
            className={[styles.navButton, styles.navButtonPrevious].join(" ")}
            onClick={goPrevious}
            aria-label="Предыдущее медиа"
          >
            ‹
          </button>
        ) : null}

        <div className={styles.frame}>
          <div
            className={styles.mediaViewport}
            onClick={handleViewportClick}
            data-testid="lightbox-media-viewport"
          >
            {currentItem.kind === "video" ? (
              <LightboxVideoPlayer
                key={currentItem.metadata.attachmentId}
                src={currentItem.src}
                poster={currentItem.previewSrc ?? null}
                fileName={currentItem.metadata.fileName}
                onRequestClose={requestClose}
              />
            ) : (
              <ZoomableImageStage
                key={currentItem.metadata.attachmentId}
                src={currentItem.src}
                alt={currentItem.alt ?? currentItem.metadata.fileName}
                onRequestClose={requestClose}
              />
            )}
          </div>
        </div>

        {hasNavigation ? (
          <button
            type="button"
            className={[styles.navButton, styles.navButtonNext].join(" ")}
            onClick={goNext}
            aria-label="Следующее медиа"
          >
            ›
          </button>
        ) : null}

        <div className={styles.metaPanel}>
          <div className={styles.metaFileName} title={currentItem.metadata.fileName}>
            {currentItem.metadata.fileName}
          </div>
          <div className={styles.metaDetails} aria-label="Данные файла">
            {metadataParts.map((part) => (
              <span className={styles.metaItem} key={part}>
                {part}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export type {
  ImageLightboxMediaItem,
  ImageLightboxMediaKind,
  ImageLightboxMetadata,
  ImageLightboxProps,
} from "./ImageLightbox.types";
