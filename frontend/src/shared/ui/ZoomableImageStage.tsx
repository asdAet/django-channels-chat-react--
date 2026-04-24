import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import styles from "../../styles/ui/ZoomableImageStage.module.css";
import { useDevice } from "../lib/device";

type Point = {
  x: number;
  y: number;
};

type TransformState = {
  scale: number;
  x: number;
  y: number;
};

type StageMode = "desktop" | "mobile";

type ZoomableImageStageProps = {
  src: string;
  alt: string;
  onRequestClose?: () => void;
};

type BaseZoomableImageStageProps = ZoomableImageStageProps & {
  mode: StageMode;
};

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DESKTOP_DOUBLE_CLICK_SCALE = 2.5;
const MOBILE_DOUBLE_TAP_SCALE = 2.35;
const CLOSE_TAP_DELAY_MS = 220;
const DOUBLE_TAP_CLICK_SUPPRESS_MS = 320;
const DEFAULT_TRANSFORM: TransformState = { scale: MIN_SCALE, x: 0, y: 0 };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getDistance = (first: Point, second: Point): number =>
  Math.hypot(first.x - second.x, first.y - second.y);

const getCenter = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

const getFramePoint = (
  frame: HTMLElement,
  clientX: number,
  clientY: number,
): Point => {
  const rect = frame.getBoundingClientRect();
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  };
};

const getFrameCenterPoint = (
  frame: HTMLElement,
  first: Point,
  second: Point,
): Point => {
  const center = getCenter(first, second);
  return getFramePoint(frame, center.x, center.y);
};

const safeSetPointerCapture = (
  element: HTMLElement,
  pointerId: number,
): void => {
  if (typeof element.setPointerCapture !== "function") {
    return;
  }

  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture can fail for synthetic events or already released pointers.
  }
};

const safeReleasePointerCapture = (
  element: HTMLElement,
  pointerId: number,
): void => {
  if (typeof element.releasePointerCapture !== "function") {
    return;
  }

  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // The pointer may already be released by the browser.
  }
};

function useRafImageTransform(
  frameRef: RefObject<HTMLDivElement | null>,
  imageRef: RefObject<HTMLImageElement | null>,
) {
  const transformRef = useRef<TransformState>(DEFAULT_TRANSFORM);
  const frameIdRef = useRef<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const applyTransform = useCallback(() => {
    frameIdRef.current = null;
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const transform = transformRef.current;
    image.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
  }, [imageRef]);

  const scheduleApplyTransform = useCallback(() => {
    if (frameIdRef.current !== null) {
      return;
    }

    const requestFrame =
      window.requestAnimationFrame ??
      ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));
    frameIdRef.current = requestFrame(applyTransform);
  }, [applyTransform]);

  const clampTransform = useCallback(
    (next: TransformState): TransformState => {
      const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
      if (scale <= MIN_SCALE) {
        return DEFAULT_TRANSFORM;
      }

      const frame = frameRef.current;
      const image = imageRef.current;
      if (!frame || !image) {
        return { ...next, scale };
      }

      const frameWidth = frame.clientWidth;
      const frameHeight = frame.clientHeight;
      const imageWidth = image.offsetWidth;
      const imageHeight = image.offsetHeight;
      if (
        frameWidth <= 0 ||
        frameHeight <= 0 ||
        imageWidth <= 0 ||
        imageHeight <= 0
      ) {
        return { ...next, scale };
      }

      const maxX = Math.max(0, (imageWidth * scale - frameWidth) / 2);
      const maxY = Math.max(0, (imageHeight * scale - frameHeight) / 2);

      return {
        scale,
        x: clamp(next.x, -maxX, maxX),
        y: clamp(next.y, -maxY, maxY),
      };
    },
    [frameRef, imageRef],
  );

  const commitTransform = useCallback(
    (next: TransformState) => {
      const clamped = clampTransform(next);
      const nextIsZoomed = clamped.scale > MIN_SCALE;
      transformRef.current = clamped;
      setIsZoomed((current) =>
        current === nextIsZoomed ? current : nextIsZoomed,
      );
      scheduleApplyTransform();
      return clamped;
    },
    [clampTransform, scheduleApplyTransform],
  );

  const resetTransform = useCallback(() => {
    transformRef.current = DEFAULT_TRANSFORM;
    setIsZoomed(false);
    scheduleApplyTransform();
  }, [scheduleApplyTransform]);

  const zoomAt = useCallback(
    (nextScale: number, point: Point) => {
      const current = transformRef.current;
      const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      if (scale <= MIN_SCALE) {
        return resetTransform();
      }

      const previousScale = current.scale <= 0 ? MIN_SCALE : current.scale;
      const ratio = scale / previousScale;
      commitTransform({
        scale,
        x: point.x - (point.x - current.x) * ratio,
        y: point.y - (point.y - current.y) * ratio,
      });
    },
    [commitTransform, resetTransform],
  );

  const panTo = useCallback(
    (x: number, y: number) => {
      commitTransform({
        ...transformRef.current,
        x,
        y,
      });
    },
    [commitTransform],
  );

  const reClampTransform = useCallback(() => {
    commitTransform(transformRef.current);
  }, [commitTransform]);

  useEffect(
    () => () => {
      if (frameIdRef.current !== null) {
        const cancelFrame = window.cancelAnimationFrame ?? window.clearTimeout;
        cancelFrame(frameIdRef.current);
      }
    },
    [],
  );

  return {
    commitTransform,
    isZoomed,
    panTo,
    reClampTransform,
    resetTransform,
    transformRef,
    zoomAt,
  };
}

function BaseZoomableImageStage({
  src,
  alt,
  mode,
  onRequestClose,
}: BaseZoomableImageStageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const panSessionRef = useRef<{
    pointerId: number;
    startPoint: Point;
    startTransform: TransformState;
  } | null>(null);
  const pinchSessionRef = useRef<{
    startCenter: Point;
    startDistance: number;
    startTransform: TransformState;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const gestureMovedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const suppressCloseUntilRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const {
    commitTransform,
    isZoomed,
    panTo,
    reClampTransform,
    resetTransform,
    transformRef,
    zoomAt,
  } = useRafImageTransform(frameRef, imageRef);

  useEffect(() => {
    window.addEventListener("resize", reClampTransform, { passive: true });
    window.visualViewport?.addEventListener("resize", reClampTransform);

    return () => {
      window.removeEventListener("resize", reClampTransform);
      window.visualViewport?.removeEventListener("resize", reClampTransform);
    };
  }, [reClampTransform]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  const clearScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (!onRequestClose) {
      return;
    }

    clearScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onRequestClose();
    }, CLOSE_TAP_DELAY_MS);
  }, [clearScheduledClose, onRequestClose]);

  const updatePointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): Point => {
      const point = { x: event.clientX, y: event.clientY };
      pointersRef.current.set(event.pointerId, point);
      return point;
    },
    [],
  );

  const clearPointer = useCallback((pointerId: number) => {
    pointersRef.current.delete(pointerId);
  }, []);

  const toggleZoomAt = useCallback(
    (point: Point) => {
      const current = transformRef.current;
      if (current.scale > MIN_SCALE) {
        resetTransform();
        return;
      }

      zoomAt(
        mode === "mobile"
          ? MOBILE_DOUBLE_TAP_SCALE
          : DESKTOP_DOUBLE_CLICK_SCALE,
        point,
      );
    },
    [mode, resetTransform, transformRef, zoomAt],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (mode !== "desktop") {
        return;
      }

      clearScheduledClose();
      if (event.cancelable) {
        event.preventDefault();
      }

      const frame = frameRef.current;
      if (!frame) {
        return;
      }

      const currentScale = transformRef.current.scale;
      const scaleStep = event.deltaY < 0 ? 1.12 : 0.88;
      zoomAt(
        currentScale * scaleStep,
        getFramePoint(frame, event.clientX, event.clientY),
      );
    },
    [clearScheduledClose, mode, transformRef, zoomAt],
  );

  const startPinch = useCallback(() => {
    const frame = frameRef.current;
    const points = Array.from(pointersRef.current.values());
    if (!frame || points.length < 2) {
      return false;
    }

    const [first, second] = points;
    const startDistance = getDistance(first, second);
    if (startDistance <= 0) {
      return false;
    }

    pinchSessionRef.current = {
      startCenter: getFrameCenterPoint(frame, first, second),
      startDistance,
      startTransform: transformRef.current,
    };
    panSessionRef.current = null;
    setIsDragging(false);
    gestureMovedRef.current = true;
    return true;
  }, [transformRef]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      clearScheduledClose();
      gestureMovedRef.current = false;
      const point = updatePointer(event);
      safeSetPointerCapture(event.currentTarget, event.pointerId);

      if (mode === "mobile" && event.pointerType === "touch") {
        const now = Date.now();
        if (now - lastTapRef.current < 260) {
          const frame = frameRef.current;
          if (frame) {
            suppressCloseUntilRef.current = now + DOUBLE_TAP_CLICK_SUPPRESS_MS;
            toggleZoomAt(getFramePoint(frame, event.clientX, event.clientY));
          }
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
      }

      if (mode === "mobile" && pointersRef.current.size >= 2) {
        startPinch();
        return;
      }

      if (transformRef.current.scale <= MIN_SCALE) {
        return;
      }

      panSessionRef.current = {
        pointerId: event.pointerId,
        startPoint: point,
        startTransform: transformRef.current,
      };
      setIsDragging(true);
    },
    [
      clearScheduledClose,
      mode,
      startPinch,
      toggleZoomAt,
      transformRef,
      updatePointer,
    ],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      updatePointer(event);

      if (mode === "mobile" && pinchSessionRef.current) {
        const frame = frameRef.current;
        const points = Array.from(pointersRef.current.values());
        if (frame && points.length >= 2) {
          const [first, second] = points;
          const pinchSession = pinchSessionRef.current;
          const nextDistance = getDistance(first, second);
          const nextCenter = getFrameCenterPoint(frame, first, second);
          const nextScale =
            pinchSession.startTransform.scale *
            (nextDistance / pinchSession.startDistance);
          const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
          const ratio =
            clampedScale /
            Math.max(MIN_SCALE, pinchSession.startTransform.scale);

          commitTransform({
            scale: clampedScale,
            x:
              nextCenter.x -
              (pinchSession.startCenter.x - pinchSession.startTransform.x) *
                ratio,
            y:
              nextCenter.y -
              (pinchSession.startCenter.y - pinchSession.startTransform.y) *
                ratio,
          });
          return;
        }
      }

      const panSession = panSessionRef.current;
      if (!panSession || panSession.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - panSession.startPoint.x;
      const deltaY = event.clientY - panSession.startPoint.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        gestureMovedRef.current = true;
      }

      panTo(
        panSession.startTransform.x + deltaX,
        panSession.startTransform.y + deltaY,
      );
    },
    [commitTransform, mode, panTo, updatePointer],
  );

  const finishGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      clearPointer(event.pointerId);
      safeReleasePointerCapture(event.currentTarget, event.pointerId);

      if (panSessionRef.current?.pointerId === event.pointerId) {
        panSessionRef.current = null;
        setIsDragging(false);
      }

      if (pointersRef.current.size < 2) {
        pinchSessionRef.current = null;
      }
    },
    [clearPointer],
  );

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (mode !== "desktop") {
        return;
      }

      const frame = frameRef.current;
      if (!frame) {
        return;
      }

      clearScheduledClose();
      suppressCloseUntilRef.current = Date.now() + DOUBLE_TAP_CLICK_SUPPRESS_MS;
      event.preventDefault();
      event.stopPropagation();
      toggleZoomAt(getFramePoint(frame, event.clientX, event.clientY));
    },
    [clearScheduledClose, mode, toggleZoomAt],
  );

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();

      if (!onRequestClose) {
        return;
      }

      if (Date.now() < suppressCloseUntilRef.current) {
        return;
      }

      if (gestureMovedRef.current) {
        gestureMovedRef.current = false;
        return;
      }

      if (event.target === imageRef.current) {
        scheduleClose();
        return;
      }

      onRequestClose();
    },
    [onRequestClose, scheduleClose],
  );

  return (
    <div
      ref={frameRef}
      className={[
        styles.imageStage,
        mode === "mobile" ? styles.imageStageMobile : styles.imageStageDesktop,
      ]
        .filter(Boolean)
        .join(" ")}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      onPointerLeave={finishGesture}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      data-testid="image-lightbox-stage"
      data-zoom-mode={mode}
    >
      <img
        ref={imageRef}
        className={[
          styles.image,
          mode === "mobile" ? styles.imageMobile : styles.imageDesktop,
          isZoomed ? styles.imageZoomed : "",
          isDragging ? styles.imageDragging : "",
        ]
          .filter(Boolean)
          .join(" ")}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={resetTransform}
      />
    </div>
  );
}

function DesktopZoomableImageStage(props: ZoomableImageStageProps) {
  return <BaseZoomableImageStage {...props} mode="desktop" />;
}

function MobileZoomableImageStage(props: ZoomableImageStageProps) {
  return <BaseZoomableImageStage {...props} mode="mobile" />;
}

export function ZoomableImageStage(props: ZoomableImageStageProps) {
  const { isMobileViewport, primaryPointer, canHover } = useDevice();
  const shouldUseMobileInteractions =
    isMobileViewport || (primaryPointer === "coarse" && !canHover);

  return shouldUseMobileInteractions ? (
    <MobileZoomableImageStage {...props} />
  ) : (
    <DesktopZoomableImageStage {...props} />
  );
}
