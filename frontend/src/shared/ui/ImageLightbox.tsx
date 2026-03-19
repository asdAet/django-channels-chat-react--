import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import styles from "../../styles/ui/ImageLightbox.module.css";
import { resolveAttachmentTypeLabel } from "../lib/attachmentTypeLabel";

const EXIT_ANIMATION_MS = 200;
const MIN_ZOOM_SCALE = 1;
const MAX_ZOOM_SCALE = 6;
const ZOOM_STEP = 0.2;
const FRAME_FULL_AT_SCALE = 2.6;

const EXPAND_LABEL = "Развернуть";
const CLOSE_LABEL = "Закрыть";
const PREVIOUS_MEDIA_LABEL = "Предыдущее медиа";
const NEXT_MEDIA_LABEL = "Следующее медиа";
const IMAGE_DIALOG_LABEL = "Просмотр изображения";
const VIDEO_DIALOG_LABEL = "Просмотр видео";
const SENT_PREFIX = "Отправлено";
const DIMENSIONS_PREFIX = "Размеры";

export type ImageLightboxMediaKind = "image" | "video";

export type ImageLightboxMetadata = {
  attachmentId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  sentAt: string;
  width: number | null;
  height: number | null;
};

export type ImageLightboxMediaItem = {
  src: string;
  kind: ImageLightboxMediaKind;
  alt?: string;
  metadata: ImageLightboxMetadata;
};

type SingleMediaProps = {
  src: string;
  alt?: string;
  kind?: ImageLightboxMediaKind;
  metadata: ImageLightboxMetadata;
  mediaItems?: never;
  initialIndex?: never;
  onClose: () => void;
};

type GalleryMediaProps = {
  mediaItems: ImageLightboxMediaItem[];
  initialIndex?: number;
  src?: never;
  alt?: never;
  kind?: never;
  metadata?: never;
  onClose: () => void;
};

type Props = SingleMediaProps | GalleryMediaProps;

type ViewState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const DEFAULT_VIEW_STATE: ViewState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

const resolveFrameExpandProgress = (scale: number): number =>
  clampNumber(
    (scale - MIN_ZOOM_SCALE) / (FRAME_FULL_AT_SCALE - MIN_ZOOM_SCALE),
    0,
    1,
  );

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeIndex = (value: number, size: number): number => {
  if (size <= 0) return 0;
  const remainder = value % size;
  return remainder < 0 ? remainder + size : remainder;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatSentAt = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsed);
};

const buildSingleItem = (props: SingleMediaProps): ImageLightboxMediaItem => ({
  src: props.src,
  kind: props.kind ?? "image",
  alt: props.alt,
  metadata: props.metadata,
});

const isGalleryMediaProps = (value: Props): value is GalleryMediaProps =>
  Array.isArray((value as Partial<GalleryMediaProps>).mediaItems);

export function ImageLightbox(props: Props) {
  const mediaItems = useMemo<ImageLightboxMediaItem[]>(
    () =>
      isGalleryMediaProps(props) ? props.mediaItems : [buildSingleItem(props)],
    [props],
  );

  const initialIndex = useMemo(
    () =>
      isGalleryMediaProps(props)
        ? normalizeIndex(props.initialIndex ?? 0, mediaItems.length)
        : 0,
    [mediaItems.length, props],
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [frameExpandProgress, setFrameExpandProgress] = useState(0);

  const closeTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const viewStateRef = useRef<ViewState>({ ...DEFAULT_VIEW_STATE });
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const pointerMovedRef = useRef(false);

  const normalizedCurrentIndex = useMemo(
    () => normalizeIndex(currentIndex, mediaItems.length),
    [currentIndex, mediaItems.length],
  );
  const currentItem = mediaItems[normalizedCurrentIndex];
  const hasNavigation = mediaItems.length > 1;

  const applyTransform = useCallback(() => {
    const transformElement = transformRef.current;
    if (!transformElement) return;

    const { scale, offsetX, offsetY } = viewStateRef.current;
    transformElement.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
  }, []);

  const applyTransformOnFrame = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const resetTransform = useCallback(() => {
    viewStateRef.current = { ...DEFAULT_VIEW_STATE };
    dragStateRef.current = null;
    setIsZoomed(false);
    setIsDragging(false);
    setFrameExpandProgress(0);
    applyTransform();
  }, [applyTransform]);

  const beginClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      props.onClose();
    }, EXIT_ANIMATION_MS);
  }, [isClosing, props]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const overlayElement = overlayRef.current;
    if (!overlayElement) return;

    const preventPageZoom = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      if (!(event.target instanceof Node)) return;
      if (!overlayElement.contains(event.target)) return;
      event.preventDefault();
    };

    window.addEventListener("wheel", preventPageZoom, {
      passive: false,
      capture: true,
    });
    return () => {
      window.removeEventListener("wheel", preventPageZoom, {
        capture: true,
      });
    };
  }, []);

  const goToPrevious = useCallback(() => {
    if (!hasNavigation) return;
    resetTransform();
    setCurrentIndex((previous) =>
      normalizeIndex(previous - 1, mediaItems.length),
    );
  }, [hasNavigation, mediaItems.length, resetTransform]);

  const goToNext = useCallback(() => {
    if (!hasNavigation) return;
    resetTransform();
    setCurrentIndex((previous) =>
      normalizeIndex(previous + 1, mediaItems.length),
    );
  }, [hasNavigation, mediaItems.length, resetTransform]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginClose();
        return;
      }
      if (!hasNavigation) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [beginClose, goToNext, goToPrevious, hasNavigation]);

  const handleViewportWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();

      const state = viewStateRef.current;
      const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const nextScale = clampNumber(
        state.scale + delta,
        MIN_ZOOM_SCALE,
        MAX_ZOOM_SCALE,
      );

      state.scale = nextScale;
      if (nextScale === MIN_ZOOM_SCALE) {
        state.offsetX = 0;
        state.offsetY = 0;
        setIsDragging(false);
      }

      setIsZoomed(nextScale > MIN_ZOOM_SCALE);
      setFrameExpandProgress(resolveFrameExpandProgress(nextScale));
      applyTransform();
    },
    [applyTransform],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (viewStateRef.current.scale <= MIN_ZOOM_SCALE) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerMovedRef.current = false;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: viewStateRef.current.offsetX,
        startOffsetY: viewStateRef.current.offsetY,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || !isDragging) return;
      if (dragState.pointerId !== event.pointerId) return;

      if (
        Math.abs(event.clientX - dragState.startClientX) > 2 ||
        Math.abs(event.clientY - dragState.startClientY) > 2
      ) {
        pointerMovedRef.current = true;
      }

      viewStateRef.current.offsetX =
        dragState.startOffsetX + (event.clientX - dragState.startClientX);
      viewStateRef.current.offsetY =
        dragState.startOffsetY + (event.clientY - dragState.startClientY);
      applyTransformOnFrame();
    },
    [applyTransformOnFrame, isDragging],
  );

  const endPointerDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      dragStateRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const handleOpenFullscreen = useCallback(async () => {
    if (!currentItem) return;
    const frameElement = frameRef.current;

    const openInNewTab = () => {
      window.open(currentItem.src, "_blank", "noopener,noreferrer");
    };

    if (!frameElement?.requestFullscreen) {
      openInNewTab();
      return;
    }

    try {
      await frameElement.requestFullscreen();
    } catch {
      openInNewTab();
    }
  }, [currentItem]);

  const handleFrameClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();

      if (pointerMovedRef.current) {
        pointerMovedRef.current = false;
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        beginClose();
        return;
      }
      if (transformRef.current?.contains(target)) {
        return;
      }
      beginClose();
    },
    [beginClose],
  );

  const stopClickPropagation = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handlePreviousClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      goToPrevious();
    },
    [goToPrevious],
  );

  const handleNextClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      goToNext();
    },
    [goToNext],
  );

  const handleCloseClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      beginClose();
    },
    [beginClose],
  );

  const handleExpandClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      void handleOpenFullscreen();
    },
    [handleOpenFullscreen],
  );

  const metadataLines = useMemo(() => {
    if (!currentItem) return [];

    const { metadata } = currentItem;
    const attachmentType = resolveAttachmentTypeLabel(
      metadata.contentType,
      metadata.fileName,
    );

    const lines: string[] = [
      metadata.fileName,
      `ID: ${metadata.attachmentId} • ${formatFileSize(metadata.fileSize)} • ${metadata.width}x${metadata.height}`,
      // `${attachmentType}`,
      `${SENT_PREFIX}: ${formatSentAt(metadata.sentAt)}`,
    ];

    // if (metadata.width && metadata.height) {
    //   lines.splice(3, 0, `${DIMENSIONS_PREFIX}: `);
    // }

    return lines;
  }, [currentItem]);

  const frameStyle = useMemo(() => {
    if (frameExpandProgress <= 0) {
      return undefined;
    }

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 1080;
    const baseWidth = clampNumber(viewportWidth * 0.38, 320, 980);
    const baseHeight = clampNumber(viewportHeight * 0.38, 220, 620);

    const width =
      baseWidth + (viewportWidth - baseWidth) * frameExpandProgress;
    const height =
      baseHeight + (viewportHeight - baseHeight) * frameExpandProgress;

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [frameExpandProgress]);

  if (!currentItem) {
    return null;
  }

  const dialogLabel =
    currentItem.kind === "video" ? VIDEO_DIALOG_LABEL : IMAGE_DIALOG_LABEL;
  const mediaAlt = currentItem.alt ?? currentItem.metadata.fileName;
  const transformClassName = [
    styles.mediaTransform,
    isZoomed ? styles.mediaTransformZoomed : "",
    isDragging ? styles.mediaTransformDragging : "",
  ]
    .filter(Boolean)
    .join(" ");
  const frameClassName = styles.frame;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={[styles.overlay, isClosing ? styles.exiting : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={beginClose}
    >
      <div
        className={frameClassName}
        style={frameStyle}
        ref={frameRef}
        onClick={handleFrameClick}
      >
        <div className={styles.actions} onClick={stopClickPropagation}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExpandClick}
            aria-label={EXPAND_LABEL}
          >
            {"\u26F6"}
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleCloseClick}
            aria-label={CLOSE_LABEL}
          >
            {"\u00D7"}
          </button>
        </div>

        {hasNavigation && (
          <button
            type="button"
            className={[styles.navBtn, styles.navBtnPrev].join(" ")}
            aria-label={PREVIOUS_MEDIA_LABEL}
            onClick={handlePreviousClick}
          >
            {"\u2039"}
          </button>
        )}

        {hasNavigation && (
          <button
            type="button"
            className={[styles.navBtn, styles.navBtnNext].join(" ")}
            aria-label={NEXT_MEDIA_LABEL}
            onClick={handleNextClick}
          >
            {"\u203A"}
          </button>
        )}

        <div
          className={styles.mediaViewport}
          data-testid="lightbox-media-viewport"
          onWheel={handleViewportWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
          onPointerLeave={endPointerDrag}
        >
          <div
            className={transformClassName}
            style={{ transform: "translate3d(0px, 0px, 0) scale(1)" }}
            data-testid="lightbox-media-transform"
            ref={transformRef}
          >
            {currentItem.kind === "video" ? (
              <video
                className={styles.media}
                src={currentItem.src}
                controls
                playsInline
                autoPlay
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                className={styles.media}
                src={currentItem.src}
                alt={mediaAlt}
                draggable={false}
              />
            )}
          </div>
        </div>
      </div>

      <div className={styles.metaText}>
        {metadataLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
