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
import {
  buildPanTransform,
  buildPinchTransform,
  buildZoomAtPointTransform,
  constrainTransform,
  DEFAULT_TRANSFORM,
  getCenter,
  getDistance,
  isZoomedTransform,
  MIN_SCALE,
  type Point,
  type TransformGeometry,
  type TransformState,
} from "./zoomableImageGeometry";

type StageMode = "desktop" | "mobile";

type ZoomableImageStageProps = {
  src: string;
  alt: string;
  onRequestClose?: () => void;
};

type BaseZoomableImageStageProps = ZoomableImageStageProps & {
  mode: StageMode;
};

const DESKTOP_DOUBLE_CLICK_SCALE = 2.5;
const MOBILE_DOUBLE_TAP_SCALE = 2.35;
const CLOSE_TAP_DELAY_MS = 220;
const DOUBLE_TAP_CLICK_SUPPRESS_MS = 320;
const TAP_MAX_MOVEMENT_PX = 6;
const MOMENTUM_MIN_VELOCITY_PX_PER_MS = 0.08;
const MOMENTUM_DECAY_MS = 180;
const MOMENTUM_MAX_FRAME_MS = 32;

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
  const momentumFrameIdRef = useRef<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const requestFrame = useCallback((callback: FrameRequestCallback) => {
    const requestAnimationFrame =
      window.requestAnimationFrame ??
      ((nextCallback: FrameRequestCallback) =>
        window.setTimeout(() => nextCallback(performance.now()), 16));

    return requestAnimationFrame(callback);
  }, []);

  const cancelFrame = useCallback((frameId: number) => {
    const cancelAnimationFrame =
      window.cancelAnimationFrame ?? window.clearTimeout;
    cancelAnimationFrame(frameId);
  }, []);

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

    frameIdRef.current = requestFrame(applyTransform);
  }, [applyTransform, requestFrame]);

  const readGeometry = useCallback((): TransformGeometry | null => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) {
      return null;
    }

    const viewport = {
      width: frame.clientWidth,
      height: frame.clientHeight,
    };
    const content = {
      width: image.offsetWidth,
      height: image.offsetHeight,
    };

    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      content.width <= 0 ||
      content.height <= 0
    ) {
      return null;
    }

    return { viewport, content };
  }, [frameRef, imageRef]);

  const commitTransform = useCallback(
    (next: TransformState) => {
      const clamped = constrainTransform(next, readGeometry());
      const nextIsZoomed = isZoomedTransform(clamped);
      transformRef.current = clamped;
      setIsZoomed((current) =>
        current === nextIsZoomed ? current : nextIsZoomed,
      );
      scheduleApplyTransform();
      return clamped;
    },
    [readGeometry, scheduleApplyTransform],
  );

  const resetTransform = useCallback(() => {
    transformRef.current = DEFAULT_TRANSFORM;
    setIsZoomed(false);
    scheduleApplyTransform();
  }, [scheduleApplyTransform]);

  const zoomAt = useCallback(
    (nextScale: number, point: Point) => {
      commitTransform(
        buildZoomAtPointTransform(transformRef.current, nextScale, point),
      );
    },
    [commitTransform],
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

  const stopMomentum = useCallback(() => {
    if (momentumFrameIdRef.current === null) {
      return;
    }

    cancelFrame(momentumFrameIdRef.current);
    momentumFrameIdRef.current = null;
  }, [cancelFrame]);

  const startMomentum = useCallback(
    (velocity: Point, onDone: () => void) => {
      stopMomentum();

      if (
        !isZoomedTransform(transformRef.current) ||
        Math.hypot(velocity.x, velocity.y) < MOMENTUM_MIN_VELOCITY_PX_PER_MS
      ) {
        onDone();
        return;
      }

      let lastTimestamp: number | null = null;
      let currentVelocity = velocity;

      const step: FrameRequestCallback = (timestamp) => {
        const previousTimestamp = lastTimestamp ?? timestamp - 16;
        const elapsedMs = Math.min(
          MOMENTUM_MAX_FRAME_MS,
          Math.max(0, timestamp - previousTimestamp),
        );
        lastTimestamp = timestamp;

        const current = transformRef.current;
        const requested = {
          ...current,
          x: current.x + currentVelocity.x * elapsedMs,
          y: current.y + currentVelocity.y * elapsedMs,
        };
        const committed = commitTransform(requested);

        currentVelocity = {
          x: committed.x === requested.x ? currentVelocity.x : 0,
          y: committed.y === requested.y ? currentVelocity.y : 0,
        };

        const decay = Math.exp(-elapsedMs / MOMENTUM_DECAY_MS);
        currentVelocity = {
          x: currentVelocity.x * decay,
          y: currentVelocity.y * decay,
        };

        if (
          Math.hypot(currentVelocity.x, currentVelocity.y) <
          MOMENTUM_MIN_VELOCITY_PX_PER_MS
        ) {
          momentumFrameIdRef.current = null;
          onDone();
          return;
        }

        momentumFrameIdRef.current = requestFrame(step);
      };

      momentumFrameIdRef.current = requestFrame(step);
    },
    [commitTransform, requestFrame, stopMomentum],
  );

  useEffect(
    () => () => {
      if (frameIdRef.current !== null) {
        cancelFrame(frameIdRef.current);
      }

      if (momentumFrameIdRef.current !== null) {
        cancelFrame(momentumFrameIdRef.current);
      }
    },
    [cancelFrame],
  );

  return {
    commitTransform,
    isZoomed,
    panTo,
    reClampTransform,
    resetTransform,
    startMomentum,
    stopMomentum,
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
    lastPoint: Point;
    lastTimestamp: number;
    velocity: Point;
  } | null>(null);
  const pinchSessionRef = useRef<{
    startCenter: Point;
    startDistance: number;
    startTransform: TransformState;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapStartPointRef = useRef<Point | null>(null);
  const gestureMovedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const suppressCloseUntilRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const {
    commitTransform,
    isZoomed,
    panTo,
    reClampTransform,
    resetTransform,
    startMomentum,
    stopMomentum,
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

  const preventNativeTouchGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        event.pointerType === "touch" &&
        typeof event.preventDefault === "function" &&
        event.cancelable
      ) {
        event.preventDefault();
      }
    },
    [],
  );

  const getEventTimestamp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): number =>
      event.timeStamp > 0 ? event.timeStamp : performance.now(),
    [],
  );

  const endInteraction = useCallback(() => {
    setIsDragging(false);
    setIsInteracting(false);
    reClampTransform();
  }, [reClampTransform]);

  const startPanSession = useCallback(
    (
      pointerId: number,
      point: Point,
      timestamp: number,
      dragging = true,
    ) => {
      panSessionRef.current = {
        pointerId,
        startPoint: point,
        startTransform: transformRef.current,
        lastPoint: point,
        lastTimestamp: timestamp,
        velocity: { x: 0, y: 0 },
      };
      setIsDragging(dragging);
      setIsInteracting(true);
    },
    [transformRef],
  );

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
      stopMomentum();
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
    [clearScheduledClose, mode, stopMomentum, transformRef, zoomAt],
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
    lastTapRef.current = 0;
    setIsDragging(false);
    setIsInteracting(true);
    gestureMovedRef.current = true;
    return true;
  }, [transformRef]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      clearScheduledClose();
      stopMomentum();
      preventNativeTouchGesture(event);
      gestureMovedRef.current = false;
      tapStartPointRef.current = { x: event.clientX, y: event.clientY };
      const activePointerCountBeforeDown = pointersRef.current.size;
      const point = updatePointer(event);
      safeSetPointerCapture(event.currentTarget, event.pointerId);

      if (
        mode === "mobile" &&
        event.pointerType === "touch" &&
        activePointerCountBeforeDown === 0
      ) {
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

      startPanSession(event.pointerId, point, getEventTimestamp(event));
    },
    [
      clearScheduledClose,
      getEventTimestamp,
      mode,
      preventNativeTouchGesture,
      startPinch,
      startPanSession,
      stopMomentum,
      toggleZoomAt,
      transformRef,
      updatePointer,
    ],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      preventNativeTouchGesture(event);
      const point = updatePointer(event);
      const tapStartPoint = tapStartPointRef.current;
      if (
        tapStartPoint &&
        getDistance(tapStartPoint, { x: event.clientX, y: event.clientY }) >
          TAP_MAX_MOVEMENT_PX
      ) {
        gestureMovedRef.current = true;
      }

      if (mode === "mobile" && pinchSessionRef.current) {
        const frame = frameRef.current;
        const points = Array.from(pointersRef.current.values());
        if (frame && points.length >= 2) {
          const [first, second] = points;
          const pinchSession = pinchSessionRef.current;
          const nextDistance = getDistance(first, second);
          const nextCenter = getFrameCenterPoint(frame, first, second);
          commitTransform(
            buildPinchTransform({
              startCenter: pinchSession.startCenter,
              currentCenter: nextCenter,
              startDistance: pinchSession.startDistance,
              currentDistance: nextDistance,
              startTransform: pinchSession.startTransform,
            }),
          );
          return;
        }
      }

      const panSession = panSessionRef.current;
      if (!panSession || panSession.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = point.x - panSession.startPoint.x;
      const deltaY = point.y - panSession.startPoint.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        gestureMovedRef.current = true;
      }

      const timestamp = getEventTimestamp(event);
      const elapsedMs = Math.max(1, timestamp - panSession.lastTimestamp);
      const velocity = {
        x: (point.x - panSession.lastPoint.x) / elapsedMs,
        y: (point.y - panSession.lastPoint.y) / elapsedMs,
      };
      panSession.velocity = {
        x: panSession.velocity.x * 0.72 + velocity.x * 0.28,
        y: panSession.velocity.y * 0.72 + velocity.y * 0.28,
      };
      panSession.lastPoint = point;
      panSession.lastTimestamp = timestamp;

      const nextTransform = buildPanTransform(
        panSession.startTransform,
        panSession.startPoint,
        point,
      );
      panTo(nextTransform.x, nextTransform.y);
    },
    [
      commitTransform,
      getEventTimestamp,
      mode,
      panTo,
      preventNativeTouchGesture,
      updatePointer,
    ],
  );

  const finishGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      preventNativeTouchGesture(event);
      const finishingPanSession =
        panSessionRef.current?.pointerId === event.pointerId
          ? panSessionRef.current
          : null;

      clearPointer(event.pointerId);
      safeReleasePointerCapture(event.currentTarget, event.pointerId);

      if (finishingPanSession) {
        panSessionRef.current = null;
        setIsDragging(false);
      }

      if (pointersRef.current.size >= 2) {
        startPinch();
        return;
      }

      if (pinchSessionRef.current && pointersRef.current.size === 1) {
        pinchSessionRef.current = null;
        const [remainingPointer] = Array.from(pointersRef.current.entries());
        if (remainingPointer && isZoomedTransform(transformRef.current)) {
          startPanSession(
            remainingPointer[0],
            remainingPointer[1],
            getEventTimestamp(event),
            false,
          );
          return;
        }
      }

      if (pointersRef.current.size > 0) {
        return;
      }

      pinchSessionRef.current = null;
      tapStartPointRef.current = null;

      if (finishingPanSession) {
        startMomentum(finishingPanSession.velocity, endInteraction);
        return;
      }

      endInteraction();
    },
    [
      clearPointer,
      endInteraction,
      getEventTimestamp,
      preventNativeTouchGesture,
      startMomentum,
      startPanSession,
      startPinch,
      transformRef,
    ],
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
      stopMomentum();
      suppressCloseUntilRef.current = Date.now() + DOUBLE_TAP_CLICK_SUPPRESS_MS;
      event.preventDefault();
      event.stopPropagation();
      toggleZoomAt(getFramePoint(frame, event.clientX, event.clientY));
    },
    [clearScheduledClose, mode, stopMomentum, toggleZoomAt],
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

  const handleImageLoad = useCallback(() => {
    stopMomentum();
    setIsDragging(false);
    setIsInteracting(false);
    resetTransform();
  }, [resetTransform, stopMomentum]);

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
          isInteracting ? styles.imageInteracting : "",
          isDragging ? styles.imageDragging : "",
        ]
          .filter(Boolean)
          .join(" ")}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={handleImageLoad}
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
