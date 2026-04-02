import {
  type CSSProperties,
  lazy,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  type TouchEvent as ReactTouchEvent,
  type TransitionEvent as ReactTransitionEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { flushSync } from "react-dom";

import mediaStyles from "../../styles/ui/ImageLightbox.media.module.css";
import shellStyles from "../../styles/ui/ImageLightbox.module.css";
import { useDevice } from "../lib/device";
import { consumePendingDesktopMediaDragRelease } from "./ImageLightbox.dragRelease";
import {
  loadImageLightboxDesktopView,
  loadImageLightboxMobileView,
} from "./ImageLightbox.loaders";
import type {
  GalleryMediaProps,
  ImageLightboxMediaItem,
  ImageLightboxProps,
  ImageLightboxViewProps,
  SingleMediaProps,
} from "./ImageLightbox.types";
import { LightboxChrome } from "./lightboxControls/LightboxChrome";
import {
  CopyLinkIcon,
  DownloadIcon,
  ExpandIcon,
  OpenInBrowserIcon,
  ResetZoomIcon,
  RotateIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./lightboxControls/LightboxIcons";
import type {
  LightboxActionItem,
  LightboxDropdownMenuController,
  LightboxDropdownMenuId,
} from "./lightboxControls/types";
import { LightboxVideoPlayer } from "./LightboxVideoPlayer";
import type { LightboxVideoPlayerHandle } from "./LightboxVideoPlayer.types";

export type {
  GalleryMediaProps,
  ImageLightboxMediaItem,
  ImageLightboxMediaKind,
  ImageLightboxMetadata,
  ImageLightboxProps,
  SingleMediaProps,
} from "./ImageLightbox.types";

const ImageLightboxDesktopView = lazy(loadImageLightboxDesktopView);
const ImageLightboxMobileView = lazy(loadImageLightboxMobileView);

const EXIT_ANIMATION_MS = 200;
const MIN_ZOOM_SCALE = 1;
const MAX_ZOOM_SCALE = 6;
const ZOOM_STEP = 0.2;
const FRAME_FULL_AT_SCALE = 2.6;
const SWIPE_AXIS_LOCK_PX = 14;
const HORIZONTAL_SWIPE_TRIGGER_PX = 72;
const VERTICAL_DISMISS_TRIGGER_PX = 96;
const DOUBLE_TAP_DELAY_MS = 280;
const DOUBLE_TAP_DISTANCE_PX = 24;
const DOUBLE_TAP_ZOOM_SCALE = 2.5;
const IGNORE_SYNTHETIC_DOUBLE_CLICK_AFTER_TOUCH_MS = 500;
const LIGHTBOX_HISTORY_STATE_KEY = "__imageLightbox";
const MOBILE_TRACK_GAP_PX = 16;

const IMAGE_DIALOG_LABEL = "Просмотр изображения";
const VIDEO_DIALOG_LABEL = "Просмотр видео";
const SENT_PREFIX = "Отправлено";

type MobileCarouselDirection = "previous" | "next";

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

type MobileCarouselAnimation = {
  mode: "return" | "settle";
  targetIndex: number;
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

const isPointInsideRect = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
): boolean =>
  clientX >= rect.left &&
  clientX <= rect.right &&
  clientY >= rect.top &&
  clientY <= rect.bottom;

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

const isGalleryMediaProps = (
  value: ImageLightboxProps,
): value is GalleryMediaProps =>
  Array.isArray((value as Partial<GalleryMediaProps>).mediaItems);

function ImageLightboxFallback({
  dialogLabel,
  isClosing,
  overlayStyle,
  metadataLines,
}: Pick<
  ImageLightboxViewProps,
  "dialogLabel" | "isClosing" | "overlayStyle" | "metadataLines"
>) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={[shellStyles.overlay, isClosing ? shellStyles.exiting : ""]
        .filter(Boolean)
        .join(" ")}
      style={overlayStyle}
      data-testid="image-lightbox-loading"
    >
      <div className={shellStyles.frame}>
        <div
          className={shellStyles.mediaViewport}
          data-testid="lightbox-media-viewport"
        >
          <div
            className={mediaStyles.mediaTransform}
            data-testid="lightbox-media-transform"
          />
        </div>
      </div>

      <div className={shellStyles.metaText}>
        {metadataLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

export function ImageLightbox(props: ImageLightboxProps) {
  const { isMobileViewport } = useDevice();
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
  const [displayIndex, setDisplayIndex] = useState(initialIndex);
  const [isClosing, setIsClosing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMediaFullscreen, setIsMediaFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [frameExpandProgress, setFrameExpandProgress] = useState(0);
  const [gesturePreview, setGesturePreview] = useState(DEFAULT_GESTURE_PREVIEW);
  const [verticalDismissDirection, setVerticalDismissDirection] = useState<
    -1 | 1 | null
  >(null);
  const [activeMenuId, setActiveMenuId] =
    useState<LightboxDropdownMenuId | null>(null);
  const isMobileLayout = isMobileViewport;

  const closeTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const videoPlayerRef = useRef<LightboxVideoPlayerHandle | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);
  const mobileTrackFrameRef = useRef<number | null>(null);
  const mobileTrackOffsetRef = useRef(0);
  const mobileTrackAnimationRef = useRef<MobileCarouselAnimation | null>(null);
  const viewStateRef = useRef<ViewState>({ ...DEFAULT_VIEW_STATE });
  const dragStateRef = useRef<DragState | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const touchGestureRef = useRef<TouchGestureState | null>(null);
  const lastTapRef = useRef<TapSnapshot | null>(null);
  const lastHandledTouchDoubleTapAtRef = useRef<number | null>(null);
  const pointerMovedRef = useRef(false);
  const historyEntryActiveRef = useRef(false);
  const historyBackPendingRef = useRef(false);

  const normalizedCurrentIndex = useMemo(
    () => normalizeIndex(currentIndex, mediaItems.length),
    [currentIndex, mediaItems.length],
  );
  const normalizedDisplayIndex = useMemo(
    () => normalizeIndex(displayIndex, mediaItems.length),
    [displayIndex, mediaItems.length],
  );
  const currentItem = mediaItems[normalizedDisplayIndex];
  const hasNavigation = mediaItems.length > 1;
  const canGoPrevious = normalizedDisplayIndex > 0;
  const canGoNext = normalizedDisplayIndex < mediaItems.length - 1;
  const closeActiveMenu = useCallback(() => {
    setActiveMenuId(null);
  }, []);
  const toggleActiveMenu = useCallback((menuId: LightboxDropdownMenuId) => {
    setActiveMenuId((previousValue) =>
      previousValue === menuId ? null : menuId,
    );
  }, []);
  const menuController = useMemo<LightboxDropdownMenuController>(
    () => ({
      activeMenuId,
      onToggleMenu: toggleActiveMenu,
      onCloseMenu: closeActiveMenu,
    }),
    [activeMenuId, closeActiveMenu, toggleActiveMenu],
  );

  const applyTransform = useCallback(() => {
    const transformElement = transformRef.current;
    if (!transformElement) return;

    const { scale, offsetX, offsetY } = viewStateRef.current;
    transformElement.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale}) rotate(${rotationDeg}deg)`;
  }, [rotationDeg]);

  const applyTransformOnFrame = useCallback(() => {
    if (animationFrameRef.current !== null) return;
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const syncScaleUi = useCallback((scale: number) => {
    setZoomScale(scale);
    setIsZoomed(scale > MIN_ZOOM_SCALE);
    setFrameExpandProgress(
      isMobileLayout ? 0 : resolveFrameExpandProgress(scale),
    );
  }, [isMobileLayout]);

  const resetGesturePreview = useCallback(() => {
    setGesturePreview(DEFAULT_GESTURE_PREVIEW);
  }, []);

  const getMobileViewportWidth = useCallback(() => {
    if (typeof window === "undefined") {
      return 1;
    }

    return Math.max(
      viewportRef.current?.clientWidth ?? window.innerWidth ?? 1,
      1,
    );
  }, []);

  const applyMobileTrackPosition = useCallback(
    (index: number, offsetX: number, animate: boolean) => {
      const trackElement = mobileTrackRef.current;
      if (!trackElement) {
        return;
      }

      const viewportWidth = getMobileViewportWidth();
      trackElement.style.transition = animate
        ? "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none";
      trackElement.style.transform = `translate3d(${-(index * (viewportWidth + MOBILE_TRACK_GAP_PX)) + offsetX}px, 0px, 0px)`;
    },
    [getMobileViewportWidth],
  );

  const queueMobileTrackPosition = useCallback(
    (index: number, offsetX: number, animate = false) => {
      mobileTrackOffsetRef.current = offsetX;
      if (mobileTrackFrameRef.current !== null) {
        window.cancelAnimationFrame(mobileTrackFrameRef.current);
      }

      mobileTrackFrameRef.current = window.requestAnimationFrame(() => {
        mobileTrackFrameRef.current = null;
        applyMobileTrackPosition(index, offsetX, animate);
      });
    },
    [applyMobileTrackPosition],
  );

  const resetViewStateForNavigation = useCallback(() => {
    viewStateRef.current = { ...DEFAULT_VIEW_STATE };
    dragStateRef.current = null;
    pinchStateRef.current = null;
    touchGestureRef.current = null;
    setIsMediaFullscreen(false);
    setRotationDeg(0);
    setVerticalDismissDirection(null);
    setIsDragging(false);
    syncScaleUi(MIN_ZOOM_SCALE);
    resetGesturePreview();
    applyTransform();
  }, [applyTransform, resetGesturePreview, syncScaleUi]);
  const applyScaleAtPoint = useCallback(
    (_clientX: number, _clientY: number, nextScale: number) => {
      const state = viewStateRef.current;
      const previousScale = state.scale;
      const clampedScale = clampNumber(
        nextScale,
        MIN_ZOOM_SCALE,
        MAX_ZOOM_SCALE,
      );

      state.scale = clampedScale;
      if (!isMobileLayout && previousScale > 0) {
        const scaleRatio = clampedScale / previousScale;
        state.offsetX *= scaleRatio;
        state.offsetY *= scaleRatio;
      }

      if (clampedScale === MIN_ZOOM_SCALE) {
        if (isMobileLayout) {
          state.offsetX = 0;
          state.offsetY = 0;
        }
        setIsDragging(false);
      }

      syncScaleUi(clampedScale);
      applyTransform();
    },
    [applyTransform, isMobileLayout, syncScaleUi],
  );

  const updateGesturePreview = useCallback(
    (axis: SwipeAxis | null, x: number, y: number) => {
      setGesturePreview({ axis, x, y });
    },
    [],
  );

  const toggleZoomAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (viewStateRef.current.scale > MIN_ZOOM_SCALE) {
        dragStateRef.current = null;
        pinchStateRef.current = null;
        touchGestureRef.current = null;
        setIsDragging(false);
        setVerticalDismissDirection(null);
        resetGesturePreview();
        applyScaleAtPoint(clientX, clientY, MIN_ZOOM_SCALE);
        return;
      }
      applyScaleAtPoint(clientX, clientY, DOUBLE_TAP_ZOOM_SCALE);
    },
    [applyScaleAtPoint, resetGesturePreview],
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
          lastHandledTouchDoubleTapAtRef.current = timestamp;
          toggleZoomAtPoint(clientX, clientY);
          return true;
        }
      }

      lastTapRef.current = { timestamp, clientX, clientY };
      return false;
    },
    [toggleZoomAtPoint],
  );

  const startCloseAnimation = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      props.onClose();
    }, EXIT_ANIMATION_MS);
  }, [isClosing, props]);

  const animateMobileCarouselToIndex = useCallback(
    (targetIndex: number) => {
      if (!isMobileLayout) {
        setDisplayIndex(targetIndex);
        setCurrentIndex(targetIndex);
        return;
      }

      setDisplayIndex(targetIndex);
      mobileTrackAnimationRef.current = {
        mode:
          targetIndex === normalizedDisplayIndex ? "return" : "settle",
        targetIndex,
      };
      queueMobileTrackPosition(targetIndex, 0, true);
    },
    [
      isMobileLayout,
      normalizedDisplayIndex,
      queueMobileTrackPosition,
      setDisplayIndex,
    ],
  );

  const beginClose = useCallback(() => {
    closeActiveMenu();
    mobileTrackAnimationRef.current = null;
    mobileTrackOffsetRef.current = 0;
    if (historyEntryActiveRef.current && !historyBackPendingRef.current) {
      historyBackPendingRef.current = true;
      window.history.back();
      return;
    }

    startCloseAnimation();
  }, [closeActiveMenu, startCloseAnimation]);

  const goToPrevious = useCallback(() => {
    if (!canGoPrevious) return;
    resetViewStateForNavigation();
    animateMobileCarouselToIndex(normalizedDisplayIndex - 1);
  }, [
    animateMobileCarouselToIndex,
    canGoPrevious,
    normalizedDisplayIndex,
    resetViewStateForNavigation,
  ]);

  const goToNext = useCallback(() => {
    if (!canGoNext) return;
    resetViewStateForNavigation();
    animateMobileCarouselToIndex(normalizedDisplayIndex + 1);
  }, [
    animateMobileCarouselToIndex,
    canGoNext,
    normalizedDisplayIndex,
    resetViewStateForNavigation,
  ]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (mobileTrackFrameRef.current !== null) {
        window.cancelAnimationFrame(mobileTrackFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setFrameExpandProgress(
      isMobileLayout ? 0 : resolveFrameExpandProgress(viewStateRef.current.scale),
    );
  }, [isMobileLayout]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setDisplayIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    setRotationDeg(0);
  }, [currentItem?.metadata.attachmentId]);

  useEffect(() => {
    closeActiveMenu();
  }, [closeActiveMenu, currentItem?.metadata.attachmentId]);

  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    if (!isMobileLayout) {
      return;
    }

    queueMobileTrackPosition(normalizedCurrentIndex, 0, false);

    const handleResize = () => {
      queueMobileTrackPosition(normalizedCurrentIndex, 0, false);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileLayout, normalizedCurrentIndex, queueMobileTrackPosition]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.history.pushState !== "function"
    ) {
      return;
    }

    const currentState = window.history.state;
    const nextState =
      currentState && typeof currentState === "object"
        ? { ...currentState, [LIGHTBOX_HISTORY_STATE_KEY]: true }
        : { [LIGHTBOX_HISTORY_STATE_KEY]: true };

    window.history.pushState(nextState, "", window.location.href);
    historyEntryActiveRef.current = true;

    const handlePopState = () => {
      if (!historyEntryActiveRef.current) {
        return;
      }

      historyEntryActiveRef.current = false;
      historyBackPendingRef.current = false;
      startCloseAnimation();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      historyEntryActiveRef.current = false;
      historyBackPendingRef.current = false;
    };
  }, [startCloseAnimation]);

  useEffect(() => {
    const overlayElement = overlayRef.current;
    if (!overlayElement) return;

    const preventPageZoom = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      if (!(event.target instanceof Node)) return;
      if (!overlayElement.contains(event.target)) return;
      event.preventDefault();
    };

    overlayElement.addEventListener("wheel", preventPageZoom, {
      passive: false,
      capture: true,
    });
    document.addEventListener("wheel", preventPageZoom, {
      passive: false,
      capture: true,
    });
    return () => {
      overlayElement.removeEventListener("wheel", preventPageZoom, true);
      document.removeEventListener("wheel", preventPageZoom, true);
    };
  }, []);

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
      if (!dragState) return;
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
    [applyTransformOnFrame],
  );

  const endPointerDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      if (
        Math.abs(event.clientX - dragState.startClientX) > 2 ||
        Math.abs(event.clientY - dragState.startClientY) > 2
      ) {
        pointerMovedRef.current = true;
      }
      dragStateRef.current = null;
      setIsDragging(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const handleTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (mobileTrackAnimationRef.current) {
        return;
      }

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
          if (!gesture.moved) {
            gesture.moved = true;
            setIsDragging(true);
          }
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

      if (!isMobileLayout) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      if (gesture.axis === "horizontal") {
        const wantsPrevious = deltaX > 0;
        const wantsNext = deltaX < 0;
        const isEdgeSwipe =
          (wantsPrevious && !canGoPrevious) || (wantsNext && !canGoNext);
        const nextOffsetX = hasNavigation
          ? isEdgeSwipe
            ? deltaX * 0.24
            : deltaX
          : deltaX * 0.18;

        queueMobileTrackPosition(normalizedCurrentIndex, nextOffsetX, false);
        return;
      }

      updateGesturePreview("vertical", 0, deltaY);
    },
    [
      applyScaleAtPoint,
      applyTransformOnFrame,
      canGoNext,
      canGoPrevious,
      hasNavigation,
      isMobileLayout,
      normalizedCurrentIndex,
      queueMobileTrackPosition,
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

      const { axis, deltaY } = gesture;
      const effectiveHorizontalOffset = mobileTrackOffsetRef.current;
      mobileTrackOffsetRef.current = 0;

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

      if (!isMobileLayout) {
        resetGesturePreview();
        applyTransform();
        return;
      }

      if (
        axis === "vertical" &&
        Math.abs(deltaY) >= VERTICAL_DISMISS_TRIGGER_PX
      ) {
        setVerticalDismissDirection(deltaY < 0 ? -1 : 1);
        applyTransform();
        beginClose();
        return;
      }

      if (
        axis === "horizontal" &&
        hasNavigation &&
        Math.abs(effectiveHorizontalOffset) >= HORIZONTAL_SWIPE_TRIGGER_PX
      ) {
        const direction: MobileCarouselDirection =
          effectiveHorizontalOffset < 0 ? "next" : "previous";
        const targetIndex =
          direction === "next"
            ? Math.min(normalizedCurrentIndex + 1, mediaItems.length - 1)
            : Math.max(normalizedCurrentIndex - 1, 0);

        animateMobileCarouselToIndex(targetIndex);
        return;
      }

      if (axis === "horizontal") {
        animateMobileCarouselToIndex(normalizedCurrentIndex);
        return;
      }

      resetGesturePreview();
      applyTransform();
    },
    [
      applyTransform,
      animateMobileCarouselToIndex,
      beginClose,
      hasNavigation,
      isMobileLayout,
      mediaItems.length,
      normalizedCurrentIndex,
      registerTapOrToggleZoom,
      resetGesturePreview,
    ],
  );
  const resetMediaPositionToDefault = useCallback(() => {
    viewStateRef.current = { ...DEFAULT_VIEW_STATE };
    dragStateRef.current = null;
    pinchStateRef.current = null;
    touchGestureRef.current = null;
    setIsDragging(false);
    setVerticalDismissDirection(null);
    resetGesturePreview();
    syncScaleUi(MIN_ZOOM_SCALE);
    applyTransform();
  }, [applyTransform, resetGesturePreview, syncScaleUi]);

  const handleOpenFullscreen = useCallback(() => {
    resetMediaPositionToDefault();
    setIsMediaFullscreen((previousValue) => !previousValue);
  }, [resetMediaPositionToDefault]);

  const getViewportCenterPoint = useCallback(() => {
    const fallbackX =
      typeof window === "undefined" ? 0 : (window.innerWidth || 0) / 2;
    const fallbackY =
      typeof window === "undefined" ? 0 : (window.innerHeight || 0) / 2;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: fallbackX, y: fallbackY };
    }

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const handleOpenOriginal = useCallback(() => {
    if (!currentItem) {
      return;
    }

    window.open(currentItem.src, "_blank", "noopener,noreferrer");
  }, [currentItem]);

  const handleDownloadCurrentItem = useCallback(async () => {
    if (!currentItem) {
      return;
    }

    const absoluteUrl = new URL(
      currentItem.src,
      window.location.origin,
    ).toString();
    const anchor = document.createElement("a");

    try {
      const response = await fetch(absoluteUrl, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("download_failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      anchor.href = objectUrl;
      anchor.download = currentItem.metadata.fileName;
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 0);
    } catch {
      anchor.href = absoluteUrl;
      anchor.download = currentItem.metadata.fileName;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      anchor.click();
    }
  }, [currentItem]);

  const handleCopyCurrentItemLink = useCallback(async () => {
    if (!currentItem || !navigator.clipboard?.writeText) {
      return;
    }

    const absoluteUrl = new URL(
      currentItem.src,
      window.location.origin,
    ).toString();

    try {
      await navigator.clipboard.writeText(absoluteUrl);
    } catch {
      return;
    }
  }, [currentItem]);

  const handleRotateCurrentItem = useCallback(() => {
    setRotationDeg((previousValue) => previousValue - 90);
  }, []);

  const handleZoomInAction = useCallback(() => {
    const center = getViewportCenterPoint();
    applyScaleAtPoint(
      center.x,
      center.y,
      viewStateRef.current.scale + ZOOM_STEP,
    );
  }, [applyScaleAtPoint, getViewportCenterPoint]);

  const handleZoomOutAction = useCallback(() => {
    const center = getViewportCenterPoint();
    applyScaleAtPoint(
      center.x,
      center.y,
      viewStateRef.current.scale - ZOOM_STEP,
    );
  }, [applyScaleAtPoint, getViewportCenterPoint]);

  const handleResetZoomAction = useCallback(() => {
    const center = getViewportCenterPoint();
    dragStateRef.current = null;
    pinchStateRef.current = null;
    touchGestureRef.current = null;
    setIsDragging(false);
    setVerticalDismissDirection(null);
    resetGesturePreview();
    applyScaleAtPoint(center.x, center.y, MIN_ZOOM_SCALE);
  }, [applyScaleAtPoint, getViewportCenterPoint, resetGesturePreview]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        beginClose();
        return;
      }
      if (event.key === "ArrowLeft" && hasNavigation) {
        event.preventDefault();
        goToPrevious();
        return;
      }
      if (event.key === "ArrowRight" && hasNavigation) {
        event.preventDefault();
        goToNext();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        handleZoomInAction();
        return;
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        handleZoomOutAction();
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        handleResetZoomAction();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleRotateCurrentItem();
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        handleOpenFullscreen();
        return;
      }
      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        void handleDownloadCurrentItem();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    beginClose,
    goToNext,
    goToPrevious,
    handleDownloadCurrentItem,
    handleOpenFullscreen,
    handleResetZoomAction,
    handleRotateCurrentItem,
    handleZoomInAction,
    handleZoomOutAction,
    hasNavigation,
  ]);

  const handleViewportBackgroundClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const mediaRect = transformRef.current?.getBoundingClientRect();
      const clickedInsideMedia = Boolean(
        mediaRect &&
          isPointInsideRect(event.clientX, event.clientY, mediaRect),
      );

      if (isMobileLayout) {
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          event.preventDefault();
          return;
        }

        if (event.target !== event.currentTarget) {
          return;
        }

        if (clickedInsideMedia) {
          return;
        }

        beginClose();
        return;
      }

      if (
        consumePendingDesktopMediaDragRelease({
          isMobileLayout,
          currentKind: currentItem?.kind,
          pointerMovedRef,
        })
      ) {
        event.preventDefault();
        return;
      }

      pointerMovedRef.current = false;

      if (currentItem?.kind === "image") {
        beginClose();
        return;
      }

      if (currentItem?.kind === "video") {
        if (clickedInsideMedia) {
          videoPlayerRef.current?.togglePlayback();
          return;
        }

        beginClose();
        return;
      }

      beginClose();
    },
    [beginClose, currentItem?.kind, isMobileLayout],
  );

  const consumeDesktopVideoClickSuppression = useCallback(() => {
    return consumePendingDesktopMediaDragRelease({
      isMobileLayout,
      currentKind: currentItem?.kind,
      pointerMovedRef,
    });
  }, [currentItem?.kind, isMobileLayout]);

  const handleImageClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();

      if (isMobileLayout) {
        if (pointerMovedRef.current) {
          pointerMovedRef.current = false;
          event.preventDefault();
        }
        return;
      }

      if (
        consumePendingDesktopMediaDragRelease({
          isMobileLayout,
          currentKind: currentItem?.kind,
          pointerMovedRef,
        })
      ) {
        event.preventDefault();
        return;
      }

      pointerMovedRef.current = false;
      beginClose();
    },
    [beginClose, currentItem?.kind, isMobileLayout],
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

  const handleViewportDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const lastHandledTouchDoubleTapAt =
        lastHandledTouchDoubleTapAtRef.current;
      if (
        lastHandledTouchDoubleTapAt !== null &&
        event.timeStamp - lastHandledTouchDoubleTapAt <=
          IGNORE_SYNTHETIC_DOUBLE_CLICK_AFTER_TOUCH_MS
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toggleZoomAtPoint(event.clientX, event.clientY);
    },
    [toggleZoomAtPoint],
  );

  const renderMediaElement = useCallback(
    (item: ImageLightboxMediaItem, isActive: boolean) => {
      if (item.kind === "video") {
        return (
          <video
            className={mediaStyles.media}
            src={item.src}
            controls={isActive}
            playsInline
            autoPlay={isActive}
            muted={!isActive}
            preload={isActive ? "metadata" : "none"}
            tabIndex={isActive ? undefined : -1}
          >
            <track kind="captions" />
          </video>
        );
      }

      return (
        <img
          className={mediaStyles.media}
          src={item.src}
          alt={item.alt ?? item.metadata.fileName}
          draggable={false}
        />
      );
    },
    [],
  );

  const buildTransformClassName = useCallback(
    (extraTransformClassName?: string) =>
      [
        mediaStyles.mediaTransform,
        isZoomed ? mediaStyles.mediaTransformZoomed : "",
        isDragging ? mediaStyles.mediaTransformDragging : "",
        gesturePreview.axis ? mediaStyles.mediaTransformGesture : "",
        extraTransformClassName ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    [gesturePreview.axis, isDragging, isZoomed],
  );

  const renderActiveMediaElement = useCallback(
    (
      item: ImageLightboxMediaItem,
      extraTransformClassName?: string,
    ) => {
      const transformClassName =
        buildTransformClassName(
          [
            extraTransformClassName,
            isMediaFullscreen ? mediaStyles.mediaTransformFullscreen : "",
          ]
            .filter(Boolean)
            .join(" "),
        );

      if (item.kind === "video") {
        return (
          <LightboxVideoPlayer
            ref={videoPlayerRef}
            src={item.src}
            fileName={item.metadata.fileName}
            mediaClassName={mediaStyles.media}
            mediaTransformClassName={transformClassName}
            mediaTransformRef={transformRef}
            consumeMediaClickSuppression={consumeDesktopVideoClickSuppression}
            menuController={menuController}
            layout={isMobileLayout ? "mobile" : "desktop"}
            onRequestFullscreen={handleOpenFullscreen}
          />
        );
      }

      return (
        <div
          className={transformClassName}
          style={{ transform: "translate3d(0px, 0px, 0) scale(1)" }}
          data-testid="lightbox-media-transform"
          data-media-fullscreen={isMediaFullscreen ? "true" : "false"}
          ref={transformRef}
          onClick={handleImageClick}
        >
          {renderMediaElement(item, true)}
        </div>
      );
    },
    [
      buildTransformClassName,
      handleImageClick,
      handleOpenFullscreen,
      consumeDesktopVideoClickSuppression,
      isMediaFullscreen,
      isMobileLayout,
      menuController,
      renderMediaElement,
    ],
  );

  const renderPreviewMediaElement = useCallback(
    (
      item: ImageLightboxMediaItem,
      extraTransformClassName?: string,
    ) => (
      <div
        className={buildTransformClassName(extraTransformClassName)}
        style={{ transform: "translate3d(0px, 0px, 0) scale(1)" }}
      >
        {renderMediaElement(item, false)}
      </div>
    ),
    [buildTransformClassName, renderMediaElement],
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

    return [`${SENT_PREFIX}: ${formatSentAt(metadata.sentAt)}`];
  }, [currentItem]);

  const frameStyle = useMemo(() => {
    if (frameExpandProgress <= 0 || !isMobileLayout) {
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
  }, [frameExpandProgress, isMobileLayout]);

  const frameMotionStyle = useMemo(() => {
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight || 1 : 1;

    if (verticalDismissDirection) {
      const dismissDistance = Math.min(viewportHeight * 0.22, 180);
      return {
        transform: `translate3d(0, ${verticalDismissDirection * dismissDistance}px, 0) scale(0.94)`,
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
      } satisfies CSSProperties;
    }

    if (gesturePreview.axis !== "vertical") {
      return undefined;
    }

    const progress = clampNumber(
      Math.abs(gesturePreview.y) / VERTICAL_DISMISS_TRIGGER_PX,
      0,
      1,
    );
    const previewOffset = gesturePreview.y * 0.92;
    const previewScale = 1 - progress * 0.09;

    return {
      transform: `translate3d(0, ${previewOffset}px, 0) scale(${previewScale})`,
      transition: "none",
    } satisfies CSSProperties;
  }, [gesturePreview.axis, gesturePreview.y, verticalDismissDirection]);

  const resolvedFrameStyle = useMemo(() => {
    if (!frameStyle && !frameMotionStyle) {
      return undefined;
    }

    return {
      ...frameStyle,
      ...frameMotionStyle,
    } satisfies CSSProperties;
  }, [frameMotionStyle, frameStyle]);

  const overlayStyle = useMemo(() => {
    if (verticalDismissDirection) {
      return {
        background: "rgba(0, 0, 0, 0.52)",
      } satisfies CSSProperties;
    }

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
    } satisfies CSSProperties;
  }, [gesturePreview.axis, gesturePreview.y, verticalDismissDirection]);

  const currentDetailLine = useMemo(() => {
    if (!currentItem) {
      return "";
    }

    const detailParts = [formatFileSize(currentItem.metadata.fileSize)];
    if (currentItem.metadata.width && currentItem.metadata.height) {
      detailParts.push(
        `${currentItem.metadata.width}x${currentItem.metadata.height}`,
      );
    }
    detailParts.push(`ID: ${currentItem.metadata.attachmentId}`);
    return detailParts.join(" | ");
  }, [currentItem]);

  const counterLabel = hasNavigation
    ? `${normalizedDisplayIndex + 1} / ${mediaItems.length}`
    : undefined;

  const chromeDirectActions = useMemo<LightboxActionItem[]>(() => {
    if (!currentItem) {
      return [];
    }

    const actions: LightboxActionItem[] = [
      {
        key: "fullscreen",
        label: "Развернуть",
        icon: <ExpandIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        active: isMediaFullscreen,
        onSelect: handleOpenFullscreen,
        testId: "lightbox-fullscreen-button",
      },
      {
        key: "download",
        label: "Скачать",
        icon: <DownloadIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: () => {
          void handleDownloadCurrentItem();
        },
        testId: "lightbox-download-button",
      },
    ];

    if (!isMobileLayout) {
      actions.push({
        key: "rotate",
        label: "Повернуть",
        icon: <RotateIcon />,
        onSelect: handleRotateCurrentItem,
        active: rotationDeg % 360 !== 0,
        testId: "lightbox-rotate-button",
      });
    }

    return actions;
  }, [
    currentItem,
    handleDownloadCurrentItem,
    handleOpenFullscreen,
    handleRotateCurrentItem,
    isMediaFullscreen,
    isMobileLayout,
    rotationDeg,
  ]);

  const chromeMenuActions = useMemo<LightboxActionItem[]>(() => {
    if (!currentItem) {
      return [];
    }

    return [
      {
        key: "fullscreen",
        label: "Полный экран",
        icon: <ExpandIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        active: isMediaFullscreen,
        onSelect: handleOpenFullscreen,
      },
      {
        key: "open-original",
        label: "Открыть оригинал",
        icon: (
          <OpenInBrowserIcon layout={isMobileLayout ? "mobile" : "desktop"} />
        ),
        onSelect: handleOpenOriginal,
      },
      {
        key: "copy-link",
        label: "Скопировать ссылку",
        icon: <CopyLinkIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: () => {
          void handleCopyCurrentItemLink();
        },
      },
      {
        key: "zoom-in",
        label: "Увеличить",
        icon: <ZoomInIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: handleZoomInAction,
        disabled: zoomScale >= MAX_ZOOM_SCALE,
        description: `Масштаб ${zoomScale.toFixed(1)}x`,
      },
      {
        key: "zoom-out",
        label: "Уменьшить",
        icon: <ZoomOutIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: handleZoomOutAction,
        disabled: zoomScale <= MIN_ZOOM_SCALE,
      },
      {
        key: "zoom-reset",
        label: "Сбросить масштаб",
        icon: <ResetZoomIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: handleResetZoomAction,
        disabled: zoomScale === MIN_ZOOM_SCALE,
      },
      {
        key: "rotate",
        label: "Повернуть на 90°",
        icon: <RotateIcon layout={isMobileLayout ? "mobile" : "desktop"} />,
        onSelect: handleRotateCurrentItem,
        description:
          rotationDeg % 360 === 0
            ? "Без поворота"
            : `Текущий угол ${Math.abs(rotationDeg % 360)} deg`,
      },
    ];
  }, [
    currentItem,
    handleCopyCurrentItemLink,
    handleOpenFullscreen,
    handleOpenOriginal,
    handleResetZoomAction,
    handleRotateCurrentItem,
    handleZoomInAction,
    handleZoomOutAction,
    isMediaFullscreen,
    isMobileLayout,
    rotationDeg,
    zoomScale,
  ]);

  const chromeNode = (
    <LightboxChrome
      layout={isMobileLayout ? "mobile" : "desktop"}
      title={currentItem?.metadata.fileName ?? ""}
      subtitle={currentDetailLine}
      counterLabel={counterLabel}
      directActions={chromeDirectActions}
      menuActions={chromeMenuActions}
      menuController={menuController}
      onClose={beginClose}
    />
  );

  const handleMobileTrackTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (
        event.target !== event.currentTarget ||
        (event.propertyName && event.propertyName !== "transform")
      ) {
        return;
      }

      const animation = mobileTrackAnimationRef.current;
      if (!animation) {
        return;
      }

      mobileTrackAnimationRef.current = null;

      if (animation.mode === "settle") {
        flushSync(() => {
          resetGesturePreview();
          setCurrentIndex(animation.targetIndex);
          setDisplayIndex(animation.targetIndex);
        });
      } else {
        flushSync(() => {
          resetGesturePreview();
          setDisplayIndex(animation.targetIndex);
        });
      }

      queueMobileTrackPosition(animation.targetIndex, 0, false);
    },
    [queueMobileTrackPosition, resetGesturePreview],
  );

  if (!currentItem) {
    return null;
  }

  const dialogLabel =
    currentItem.kind === "video" ? VIDEO_DIALOG_LABEL : IMAGE_DIALOG_LABEL;
  const SelectedView = isMobileLayout
    ? ImageLightboxMobileView
    : ImageLightboxDesktopView;
  const mobileTrackStyle = {
    transform: `translate3d(calc(-${normalizedCurrentIndex} * (100vw + ${MOBILE_TRACK_GAP_PX}px)), 0px, 0px)`,
  } satisfies CSSProperties;
  const viewProps: ImageLightboxViewProps = {
    layout: isMobileLayout ? "mobile" : "desktop",
    chrome: chromeNode,
    currentItem,
    mediaItems,
    normalizedCurrentIndex,
    normalizedDisplayIndex,
    isClosing,
    dialogLabel,
    overlayStyle,
    resolvedFrameStyle,
    metadataLines,
    hasNavigation,
    canGoPrevious,
    canGoNext,
    overlayRef,
    frameRef,
    viewportRef,
    mobileTrackRef,
    mobileTrackStyle,
    onMobileTrackTransitionEnd: handleMobileTrackTransitionEnd,
    onViewportWheel: handleViewportWheel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onEndPointerDrag: endPointerDrag,
    onViewportBackgroundClick: handleViewportBackgroundClick,
    onViewportDoubleClick: handleViewportDoubleClick,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onPreviousClick: handlePreviousClick,
    onNextClick: handleNextClick,
    renderActiveMediaElement,
    renderPreviewMediaElement,
  };

  return (
    <Suspense
      fallback={
        <ImageLightboxFallback
          dialogLabel={dialogLabel}
          isClosing={isClosing}
          overlayStyle={overlayStyle}
          metadataLines={metadataLines}
        />
      }
    >
      <SelectedView {...viewProps} />
    </Suspense>
  );
}


