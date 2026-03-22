import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import styles from "../../styles/ui/ImageLightbox.module.css";

const EXIT_ANIMATION_MS = 200;
const MIN_ZOOM_SCALE = 1;
const MAX_ZOOM_SCALE = 6;
const ZOOM_STEP = 0.2;
const FRAME_FULL_AT_SCALE = 2.6;
const MOBILE_BREAKPOINT_PX = 768;
const SWIPE_AXIS_LOCK_PX = 14;
const HORIZONTAL_SWIPE_TRIGGER_PX = 72;
const VERTICAL_DISMISS_TRIGGER_PX = 96;
const MAX_GESTURE_PREVIEW_PX = 160;
const DOUBLE_TAP_DELAY_MS = 280;
const DOUBLE_TAP_DISTANCE_PX = 24;
const DOUBLE_TAP_ZOOM_SCALE = 2.5;

const EXPAND_LABEL = "Развернуть";
const CLOSE_LABEL = "Закрыть";
const PREVIOUS_MEDIA_LABEL = "Предыдущее медиа";
const NEXT_MEDIA_LABEL = "Следующее медиа";
const IMAGE_DIALOG_LABEL = "Просмотр изображения";
const VIDEO_DIALOG_LABEL = "Просмотр видео";
const SENT_PREFIX = "Отправлено";

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

type SwipeAxis = "horizontal" | "vertical";

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
};

type PinchState = {
  distance: number;
  scale: number;
};

type TouchGestureState =
  | {
      mode: "pan";
      startClientX: number;
      startClientY: number;
      startOffsetX: number;
      startOffsetY: number;
      moved: boolean;
    }
  | {
      mode: "swipe";
      startClientX: number;
      startClientY: number;
      axis: SwipeAxis | null;
      deltaX: number;
      deltaY: number;
    };

type GesturePreview = {
  axis: SwipeAxis | null;
  x: number;
  y: number;
};

type TouchPointLike = {
  clientX: number;
  clientY: number;
};

type TouchListLike = ArrayLike<TouchPointLike> & {
  item?: (index: number) => TouchPointLike | null;
};

type TapSnapshot = {
  timestamp: number;
  clientX: number;
  clientY: number;
};

const DEFAULT_VIEW_STATE: ViewState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

const DEFAULT_GESTURE_PREVIEW: GesturePreview = {
  axis: null,
  x: 0,
  y: 0,
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const resolveFrameExpandProgress = (scale: number): number =>
  clampNumber(
    (scale - MIN_ZOOM_SCALE) / (FRAME_FULL_AT_SCALE - MIN_ZOOM_SCALE),
    0,
    1,
  );

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

const getTouchAt = (
  touches: TouchListLike,
  index: number,
): TouchPointLike | null => {
  if (typeof touches.item === "function") {
    return touches.item(index);
  }
  return touches[index] ?? null;
};

const getTouchDistance = (
  touches: ReactTouchEvent<HTMLDivElement>["touches"],
): number | null => {
  if (touches.length < 2) return null;
  const first = getTouchAt(touches, 0);
  const second = getTouchAt(touches, 1);
  if (!first || !second) return null;
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
};

const buildSingleItem = (props: SingleMediaProps): ImageLightboxMediaItem => ({
  src: props.src,
  kind: props.kind ?? "image",
  alt: props.alt,
  metadata: props.metadata,
});

const isGalleryMediaProps = (value: Props): value is GalleryMediaProps =>
  Array.isArray((value as Partial<GalleryMediaProps>).mediaItems);

/**
 * Lightbox для изображений и видео.
 * На десктопе поддерживает zoom через ctrl + wheel и drag, на мобильных —
 * pinch-to-zoom, горизонтальный swipe между медиа и вертикальный dismiss.
 */
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
  const [gesturePreview, setGesturePreview] = useState(DEFAULT_GESTURE_PREVIEW);

  const closeTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const viewStateRef = useRef<ViewState>({ ...DEFAULT_VIEW_STATE });
  const gestureOffsetRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef<DragState | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const touchGestureRef = useRef<TouchGestureState | null>(null);
  const lastTapRef = useRef<TapSnapshot | null>(null);
  const pointerMovedRef = useRef(false);

  const normalizedCurrentIndex = useMemo(
    () => normalizeIndex(currentIndex, mediaItems.length),
    [currentIndex, mediaItems.length],
  );
  const currentItem = mediaItems[normalizedCurrentIndex];
  const hasNavigation = mediaItems.length > 1;

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)
      .matches;
  }, []);

  const applyTransform = useCallback(() => {
    const transformElement = transformRef.current;
    if (!transformElement) return;

    const { scale, offsetX, offsetY } = viewStateRef.current;
    const { x, y } = gestureOffsetRef.current;
    transformElement.style.transform = `translate3d(${offsetX + x}px, ${offsetY + y}px, 0) scale(${scale})`;
  }, []);

  const applyTransformOnFrame = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const syncScaleUi = useCallback(
    (scale: number) => {
      setIsZoomed(scale > MIN_ZOOM_SCALE);
      setFrameExpandProgress(
        isMobileViewport() ? 0 : resolveFrameExpandProgress(scale),
      );
    },
    [isMobileViewport],
  );

  const resetGesturePreview = useCallback(() => {
    gestureOffsetRef.current = { x: 0, y: 0 };
    setGesturePreview(DEFAULT_GESTURE_PREVIEW);
  }, []);

  const resetTransform = useCallback(() => {
    viewStateRef.current = { ...DEFAULT_VIEW_STATE };
    dragStateRef.current = null;
    pinchStateRef.current = null;
    touchGestureRef.current = null;
    setIsDragging(false);
    syncScaleUi(MIN_ZOOM_SCALE);
    resetGesturePreview();
    applyTransform();
  }, [applyTransform, resetGesturePreview, syncScaleUi]);

  const applyScaleAtPoint = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewportRect = viewportRef.current?.getBoundingClientRect();
      const state = viewStateRef.current;
      const clampedScale = clampNumber(
        nextScale,
        MIN_ZOOM_SCALE,
        MAX_ZOOM_SCALE,
      );

      if (viewportRect && viewportRect.width > 0 && viewportRect.height > 0) {
        const relativeX = clientX - viewportRect.left;
        const relativeY = clientY - viewportRect.top;
        const dx = relativeX - viewportRect.width / 2;
        const dy = relativeY - viewportRect.height / 2;
        const scaleRatio = clampedScale / state.scale;
        state.offsetX = state.offsetX - dx * (scaleRatio - 1);
        state.offsetY = state.offsetY - dy * (scaleRatio - 1);
      }

      state.scale = clampedScale;
      if (clampedScale === MIN_ZOOM_SCALE) {
        state.offsetX = 0;
        state.offsetY = 0;
        setIsDragging(false);
      }

      syncScaleUi(clampedScale);
      applyTransform();
    },
    [applyTransform, syncScaleUi],
  );

  const updateGesturePreview = useCallback(
    (axis: SwipeAxis | null, x: number, y: number) => {
      gestureOffsetRef.current = { x, y };
      setGesturePreview({ axis, x, y });
      applyTransformOnFrame();
    },
    [applyTransformOnFrame],
  );

  /**
   * Двойной клик/тап переключает масштаб как в desktop viewer:
   * первое быстрое двойное нажатие приближает, повторное из любого zoom
   * возвращает медиа в исходное состояние.
   */
  const toggleZoomAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (viewStateRef.current.scale > MIN_ZOOM_SCALE) {
        resetTransform();
        return;
      }
      applyScaleAtPoint(clientX, clientY, DOUBLE_TAP_ZOOM_SCALE);
    },
    [applyScaleAtPoint, resetTransform],
  );

  const registerTapOrToggleZoom = useCallback(
    (clientX: number, clientY: number, timestamp: number): boolean => {
      const previousTap = lastTapRef.current;

      if (previousTap) {
        const elapsed = timestamp - previousTap.timestamp;
        const distance = Math.hypot(
          clientX - previousTap.clientX,
          clientY - previousTap.clientY,
        );

        if (
          elapsed <= DOUBLE_TAP_DELAY_MS &&
          distance <= DOUBLE_TAP_DISTANCE_PX
        ) {
          lastTapRef.current = null;
          toggleZoomAtPoint(clientX, clientY);
          return true;
        }
      }

      lastTapRef.current = { timestamp, clientX, clientY };
      return false;
    },
    [toggleZoomAtPoint],
  );

  const beginClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      props.onClose();
    }, EXIT_ANIMATION_MS);
  }, [isClosing, props]);

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
      window.removeEventListener("wheel", preventPageZoom, true);
    };
  }, []);

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

      const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      applyScaleAtPoint(
        event.clientX,
        event.clientY,
        viewStateRef.current.scale + delta,
      );
    },
    [applyScaleAtPoint],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") return;
      if (viewStateRef.current.scale <= MIN_ZOOM_SCALE) return;
      if (event.button !== 0) return;

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

  /**
   * Touch-жесты намеренно разделены на pan/pinch/swipe:
   * zoomed-медиа двигается как на десктопе, а unzoomed-медиа
   * использует горизонтальный swipe для навигации и вертикальный для dismiss.
   */
  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2) {
        const distance = getTouchDistance(event.touches);
        if (!distance) return;
        pinchStateRef.current = {
          distance,
          scale: viewStateRef.current.scale,
        };
        touchGestureRef.current = null;
        return;
      }

      if (event.touches.length !== 1) return;
      const touch = getTouchAt(event.touches, 0);
      if (!touch) return;

      pinchStateRef.current = null;

      if (viewStateRef.current.scale > MIN_ZOOM_SCALE) {
        touchGestureRef.current = {
          mode: "pan",
          startClientX: touch.clientX,
          startClientY: touch.clientY,
          startOffsetX: viewStateRef.current.offsetX,
          startOffsetY: viewStateRef.current.offsetY,
          moved: false,
        };
        setIsDragging(true);
        return;
      }

      touchGestureRef.current = {
        mode: "swipe",
        startClientX: touch.clientX,
        startClientY: touch.clientY,
        axis: null,
        deltaX: 0,
        deltaY: 0,
      };
      updateGesturePreview(null, 0, 0);
    },
    [updateGesturePreview],
  );

  const handleTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (event.touches.length === 2 && pinchStateRef.current) {
        const nextDistance = getTouchDistance(event.touches);
        const first = getTouchAt(event.touches, 0);
        const second = getTouchAt(event.touches, 1);
        if (!nextDistance || !first || !second) return;
        if (event.cancelable) {
          event.preventDefault();
        }
        const centerX = (first.clientX + second.clientX) / 2;
        const centerY = (first.clientY + second.clientY) / 2;
        const scale = nextDistance / pinchStateRef.current.distance;
        applyScaleAtPoint(
          centerX,
          centerY,
          pinchStateRef.current.scale * scale,
        );
        return;
      }

      if (event.touches.length !== 1) return;
      const touch = getTouchAt(event.touches, 0);
      if (!touch) return;

      const gesture = touchGestureRef.current;
      if (!gesture) return;

      if (gesture.mode === "pan") {
        if (event.cancelable) {
          event.preventDefault();
        }
        if (
          Math.abs(touch.clientX - gesture.startClientX) > 4 ||
          Math.abs(touch.clientY - gesture.startClientY) > 4
        ) {
          gesture.moved = true;
        }
        viewStateRef.current.offsetX =
          gesture.startOffsetX + (touch.clientX - gesture.startClientX);
        viewStateRef.current.offsetY =
          gesture.startOffsetY + (touch.clientY - gesture.startClientY);
        applyTransformOnFrame();
        return;
      }

      const deltaX = touch.clientX - gesture.startClientX;
      const deltaY = touch.clientY - gesture.startClientY;

      if (!gesture.axis) {
        if (
          Math.abs(deltaX) < SWIPE_AXIS_LOCK_PX &&
          Math.abs(deltaY) < SWIPE_AXIS_LOCK_PX
        ) {
          return;
        }
        gesture.axis =
          Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      gesture.deltaX = deltaX;
      gesture.deltaY = deltaY;

      if (event.cancelable) {
        event.preventDefault();
      }

      if (gesture.axis === "horizontal") {
        const clampedX = hasNavigation
          ? clampNumber(deltaX, -MAX_GESTURE_PREVIEW_PX, MAX_GESTURE_PREVIEW_PX)
          : clampNumber(
              deltaX * 0.2,
              -MAX_GESTURE_PREVIEW_PX / 2,
              MAX_GESTURE_PREVIEW_PX / 2,
            );
        updateGesturePreview("horizontal", clampedX, 0);
        return;
      }

      const clampedY = clampNumber(
        deltaY,
        -MAX_GESTURE_PREVIEW_PX,
        MAX_GESTURE_PREVIEW_PX,
      );
      updateGesturePreview("vertical", 0, clampedY);
    },
    [
      applyScaleAtPoint,
      applyTransformOnFrame,
      hasNavigation,
      updateGesturePreview,
    ],
  );

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const changedTouch = getTouchAt(event.changedTouches, 0);
      const gesture = touchGestureRef.current;
      pinchStateRef.current = null;
      touchGestureRef.current = null;

      if (!gesture) {
        setIsDragging(false);
        return;
      }

      if (gesture.mode === "pan") {
        setIsDragging(false);
        if (
          !gesture.moved &&
          changedTouch &&
          registerTapOrToggleZoom(
            changedTouch.clientX,
            changedTouch.clientY,
            event.timeStamp,
          )
        ) {
          return;
        }
        return;
      }

      const { axis, deltaX, deltaY } = gesture;

      if (!axis) {
        if (changedTouch) {
          registerTapOrToggleZoom(
            changedTouch.clientX,
            changedTouch.clientY,
            event.timeStamp,
          );
        }
        resetGesturePreview();
        applyTransform();
        return;
      }

      resetGesturePreview();
      applyTransform();

      if (
        axis === "vertical" &&
        Math.abs(deltaY) >= VERTICAL_DISMISS_TRIGGER_PX
      ) {
        beginClose();
        return;
      }

      if (
        axis === "horizontal" &&
        hasNavigation &&
        Math.abs(deltaX) >= HORIZONTAL_SWIPE_TRIGGER_PX
      ) {
        if (deltaX < 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    },
    [
      applyTransform,
      beginClose,
      goToNext,
      goToPrevious,
      hasNavigation,
      registerTapOrToggleZoom,
      resetGesturePreview,
    ],
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

  const stopClickPropagation = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleFrameClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      if (pointerMovedRef.current) {
        pointerMovedRef.current = false;
      }
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

  const handleViewportDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      toggleZoomAtPoint(event.clientX, event.clientY);
    },
    [toggleZoomAtPoint],
  );

  const metadataLines = useMemo(() => {
    if (!currentItem) return [];

    const { metadata } = currentItem;
    const detailParts = [
      `ID: ${metadata.attachmentId}`,
      formatFileSize(metadata.fileSize),
    ];

    if (metadata.width && metadata.height) {
      detailParts.push(`${metadata.width}x${metadata.height}`);
    }

    return [
      metadata.fileName,
      detailParts.join(" • "),
      `${SENT_PREFIX}: ${formatSentAt(metadata.sentAt)}`,
    ];
  }, [currentItem]);

  const frameStyle = useMemo(() => {
    if (frameExpandProgress <= 0 || isMobileViewport()) {
      return undefined;
    }

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 1080;
    const baseWidth = clampNumber(viewportWidth * 0.38, 320, 980);
    const baseHeight = clampNumber(viewportHeight * 0.38, 220, 620);

    const width = baseWidth + (viewportWidth - baseWidth) * frameExpandProgress;
    const height =
      baseHeight + (viewportHeight - baseHeight) * frameExpandProgress;

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [frameExpandProgress, isMobileViewport]);

  const overlayStyle = useMemo(() => {
    if (gesturePreview.axis !== "vertical") {
      return undefined;
    }

    const progress = clampNumber(
      Math.abs(gesturePreview.y) / VERTICAL_DISMISS_TRIGGER_PX,
      0,
      1,
    );

    return {
      background: `rgba(0, 0, 0, ${0.9 - progress * 0.35})`,
    };
  }, [gesturePreview.axis, gesturePreview.y]);

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
    gesturePreview.axis ? styles.mediaTransformGesture : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={[styles.overlay, isClosing ? styles.exiting : ""]
        .filter(Boolean)
        .join(" ")}
      style={overlayStyle}
    >
      <div
        className={styles.frame}
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
          ref={viewportRef}
          className={styles.mediaViewport}
          data-testid="lightbox-media-viewport"
          onWheel={handleViewportWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
          onPointerLeave={endPointerDrag}
          onDoubleClick={handleViewportDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
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
