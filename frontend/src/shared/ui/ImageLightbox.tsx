import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "../../styles/ui/ImageLightbox.module.css";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
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

const triggerDownload = (url: string, fileName: string): void => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  anchor.target = "_blank";
  anchor.click();
};

const ACTION_MENU_LONG_PRESS_MS = 520;
const ACTION_MENU_TOUCH_MOVE_CANCEL_PX = 10;
const ACTION_MENU_CLICK_SUPPRESS_MS = 420;

type ActionMenuPosition = {
  x: number;
  y: number;
};

type ActionMenuTouchIntent = ActionMenuPosition & {
  pointerId: number;
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
  const longPressTimerRef = useRef<number | null>(null);
  const touchIntentRef = useRef<ActionMenuTouchIntent | null>(null);
  const suppressClickUntilRef = useRef(0);
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
  const [actionMenu, setActionMenu] = useState<ActionMenuPosition | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const hasNavigation = mediaItems.length > 1;
  const currentItem = mediaItems[activeIndex];

  const clearActionMenuIntent = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchIntentRef.current = null;
  }, []);

  useEffect(
    () => () => {
      clearActionMenuIntent();
    },
    [clearActionMenuIntent],
  );

  const closeActionMenu = useCallback(() => {
    setActionMenu(null);
  }, []);

  const goPrevious = useCallback(() => {
    closeActionMenu();
    setActiveIndex((current) => clampIndex(current - 1, mediaItems.length));
  }, [closeActionMenu, mediaItems.length]);

  const goNext = useCallback(() => {
    closeActionMenu();
    setActiveIndex((current) => clampIndex(current + 1, mediaItems.length));
  }, [closeActionMenu, mediaItems.length]);

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

  const openActionMenu = useCallback(
    (position: ActionMenuPosition) => {
      clearActionMenuIntent();
      setActionMenu(position);
    },
    [clearActionMenuIntent],
  );

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      openActionMenu({ x: event.clientX, y: event.clientY });
    },
    [openActionMenu],
  );

  const handleActionPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch") {
        return;
      }

      if (!event.isPrimary) {
        clearActionMenuIntent();
        return;
      }

      const intent = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      clearActionMenuIntent();
      touchIntentRef.current = intent;
      longPressTimerRef.current = window.setTimeout(() => {
        suppressClickUntilRef.current =
          Date.now() + ACTION_MENU_CLICK_SUPPRESS_MS;
        openActionMenu({ x: intent.x, y: intent.y });
      }, ACTION_MENU_LONG_PRESS_MS);
    },
    [clearActionMenuIntent, openActionMenu],
  );

  const handleActionPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const intent = touchIntentRef.current;
      if (!intent || intent.pointerId !== event.pointerId) {
        return;
      }

      if (
        Math.hypot(event.clientX - intent.x, event.clientY - intent.y) >
        ACTION_MENU_TOUCH_MOVE_CANCEL_PX
      ) {
        clearActionMenuIntent();
      }
    },
    [clearActionMenuIntent],
  );

  const handleActionPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const intent = touchIntentRef.current;
      if (intent?.pointerId === event.pointerId) {
        clearActionMenuIntent();
      }
    },
    [clearActionMenuIntent],
  );

  const handleShellClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[role="menu"]') !== null
      ) {
        return;
      }

      if (Date.now() < suppressClickUntilRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [],
  );

  const handleDownload = useCallback(() => {
    if (!currentItem) {
      return;
    }

    triggerDownload(
      currentItem.downloadUrl ?? currentItem.src,
      currentItem.metadata.fileName,
    );
  }, [currentItem]);

  const actionMenuItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: "Скачать",
        onClick: handleDownload,
      },
    ],
    [handleDownload],
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
      onContextMenu={handleContextMenu}
    >
      <div
        className={styles.shell}
        onPointerDown={handleActionPointerDown}
        onPointerMove={handleActionPointerMove}
        onPointerUp={handleActionPointerEnd}
        onPointerCancel={handleActionPointerEnd}
        onClickCapture={handleShellClickCapture}
      >
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

        {actionMenu ? (
          <ContextMenu
            items={actionMenuItems}
            x={actionMenu.x}
            y={actionMenu.y}
            onClose={closeActionMenu}
          />
        ) : null}
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
