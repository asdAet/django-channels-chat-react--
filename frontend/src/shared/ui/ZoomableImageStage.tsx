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
  areTransformsClose,
  buildMobilePinchTransform,
  buildPanTransform,
  buildSwipeDismissMetrics,
  buildZoomAtPointTransform,
  constrainTransform,
  type ConstrainTransformOptions,
  DEFAULT_TRANSFORM,
  getCenter,
  getDistance,
  hasVerticalSwipeIntent,
  isZoomedTransform,
  MAX_SCALE,
  MAX_SCALE_WITH_MOBILE_SPRING,
  MIN_SCALE,
  type Point,
  settleTransform,
  shouldDismissBySwipe,
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
const DOUBLE_TAP_CLICK_SUPPRESS_MS = 320;
const TAP_MAX_MOVEMENT_PX = 6;
const MOMENTUM_MIN_VELOCITY_PX_PER_MS = 0.08;
const MOMENTUM_DECAY_MS = 180;
const MOMENTUM_MAX_FRAME_MS = 32;
const WHEEL_ZOOM_SENSITIVITY = 0.0018;
const WHEEL_DELTA_LINE_HEIGHT_PX = 16;
const WHEEL_DELTA_MAX_PX = 240;
const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;

/**
 * Кэшированные размеры stage в координатах viewport.
 *
 * Нужны, чтобы не читать `getBoundingClientRect()` на каждом движении жеста.
 */
type FrameMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const getFramePoint = (
  frame: FrameMetrics,
  clientX: number,
  clientY: number,
): Point => {
  return {
    x: clientX - frame.left - frame.width / 2,
    y: clientY - frame.top - frame.height / 2,
  };
};

const getFrameCenterPoint = (
  frame: FrameMetrics,
  first: Point,
  second: Point,
): Point => {
  const center = getCenter(first, second);
  return getFramePoint(frame, center.x, center.y);
};

/**
 * Приводит wheel delta к пикселям и ограничивает одиночный скачок масштаба.
 *
 * @param event React wheel-событие из stage.
 * @returns Нормализованное значение прокрутки в пикселях.
 */
const normalizeWheelDelta = (
  event: ReactWheelEvent<HTMLDivElement>,
): number => {
  const viewportHeight =
    typeof window === "undefined" ? 800 : window.innerHeight || 800;
  const multiplier =
    event.deltaMode === WHEEL_DELTA_LINE
      ? WHEEL_DELTA_LINE_HEIGHT_PX
      : event.deltaMode === WHEEL_DELTA_PAGE
        ? viewportHeight
        : 1;

  return Math.max(
    -WHEEL_DELTA_MAX_PX,
    Math.min(WHEEL_DELTA_MAX_PX, event.deltaY * multiplier),
  );
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

function useImageTransform(
  frameRef: RefObject<HTMLDivElement | null>,
  imageRef: RefObject<HTMLImageElement | null>,
) {
  const transformRef = useRef<TransformState>(DEFAULT_TRANSFORM);
  const geometryRef = useRef<TransformGeometry | null>(null);
  const isZoomedRef = useRef(false);
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

  const writeTransform = useCallback(
    (transform: TransformState) => {
      const image = imageRef.current;
      if (!image) {
        return;
      }

      image.style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
    },
    [imageRef],
  );

  const refreshGeometry = useCallback((): TransformGeometry | null => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) {
      geometryRef.current = null;
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
      geometryRef.current = null;
      return null;
    }

    const geometry = { viewport, content };
    geometryRef.current = geometry;
    return geometry;
  }, [frameRef, imageRef]);

  const readGeometry = useCallback(
    (): TransformGeometry | null => geometryRef.current ?? refreshGeometry(),
    [refreshGeometry],
  );

  const commitTransform = useCallback(
    (next: TransformState, options?: ConstrainTransformOptions) => {
      const clamped = constrainTransform(next, readGeometry(), options);
      const nextIsZoomed = isZoomedTransform(clamped);
      transformRef.current = clamped;
      if (isZoomedRef.current !== nextIsZoomed) {
        isZoomedRef.current = nextIsZoomed;
        setIsZoomed(nextIsZoomed);
      }
      writeTransform(clamped);
      return clamped;
    },
    [readGeometry, writeTransform],
  );

  const resetTransform = useCallback(() => {
    transformRef.current = DEFAULT_TRANSFORM;
    if (isZoomedRef.current) {
      isZoomedRef.current = false;
      setIsZoomed(false);
    }
    writeTransform(DEFAULT_TRANSFORM);
  }, [writeTransform]);

  const applyVisualTransform = useCallback(
    (transform: TransformState) => {
      writeTransform(transform);
    },
    [writeTransform],
  );

  const zoomAt = useCallback(
    (nextScale: number, point: Point, options?: ConstrainTransformOptions) => {
      commitTransform(
        buildZoomAtPointTransform(transformRef.current, nextScale, point),
        options,
      );
    },
    [commitTransform],
  );

  const panTo = useCallback(
    (x: number, y: number, options?: ConstrainTransformOptions) => {
      commitTransform(
        {
          ...transformRef.current,
          x,
          y,
        },
        options,
      );
    },
    [commitTransform],
  );

  const reClampTransform = useCallback(() => {
    refreshGeometry();
    commitTransform(transformRef.current);
  }, [commitTransform, refreshGeometry]);

  const settleCurrentTransform = useCallback(() => {
    const settled = settleTransform(transformRef.current, readGeometry());
    return commitTransform(settled);
  }, [commitTransform, readGeometry]);

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

      const settledBeforeMomentum = settleTransform(
        transformRef.current,
        readGeometry(),
      );
      if (!areTransformsClose(transformRef.current, settledBeforeMomentum)) {
        onDone();
        return;
      }

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
    [commitTransform, readGeometry, requestFrame, stopMomentum],
  );

  useEffect(
    () => () => {
      if (momentumFrameIdRef.current !== null) {
        cancelFrame(momentumFrameIdRef.current);
      }
    },
    [cancelFrame],
  );

  return {
    applyVisualTransform,
    commitTransform,
    isZoomed,
    panTo,
    reClampTransform,
    refreshGeometry,
    resetTransform,
    settleCurrentTransform,
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
  const frameMetricsRef = useRef<FrameMetrics | null>(null);
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
  const dismissSessionRef = useRef<{
    pointerId: number;
    startPoint: Point;
    lastPoint: Point;
    lastTimestamp: number;
    offset: Point;
    velocity: Point;
    active: boolean;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapStartPointRef = useRef<Point | null>(null);
  const gestureMovedRef = useRef(false);
  const suppressCloseUntilRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const {
    commitTransform,
    isZoomed,
    panTo,
    applyVisualTransform,
    reClampTransform,
    refreshGeometry,
    resetTransform,
    settleCurrentTransform,
    startMomentum,
    stopMomentum,
    transformRef,
    zoomAt,
  } = useImageTransform(frameRef, imageRef);

  const refreshFrameMetrics = useCallback((): FrameMetrics | null => {
    const frame = frameRef.current;
    if (!frame) {
      frameMetricsRef.current = null;
      return null;
    }

    const rect = frame.getBoundingClientRect();
    const metrics = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    frameMetricsRef.current = metrics;
    return metrics;
  }, []);

  const readFrameMetrics = useCallback(
    (): FrameMetrics | null => frameMetricsRef.current ?? refreshFrameMetrics(),
    [refreshFrameMetrics],
  );

  const getFramePointFromClient = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const metrics = readFrameMetrics();
      return metrics ? getFramePoint(metrics, clientX, clientY) : null;
    },
    [readFrameMetrics],
  );

  const getFrameCenterFromPointers = useCallback(
    (first: Point, second: Point): Point | null => {
      const metrics = readFrameMetrics();
      return metrics ? getFrameCenterPoint(metrics, first, second) : null;
    },
    [readFrameMetrics],
  );

  const refreshStageMeasurements = useCallback(() => {
    refreshFrameMetrics();
    refreshGeometry();
  }, [refreshFrameMetrics, refreshGeometry]);

  useEffect(() => {
    const handleResize = () => {
      refreshStageMeasurements();
      reClampTransform();
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [reClampTransform, refreshStageMeasurements]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      refreshStageMeasurements();
      reClampTransform();
    });
    observer.observe(frame);
    observer.observe(image);

    return () => {
      observer.disconnect();
    };
  }, [reClampTransform, refreshStageMeasurements]);

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
    if (mode === "mobile") {
      settleCurrentTransform();
    }
  }, [mode, settleCurrentTransform]);

  const startPanSession = useCallback(
    (
      pointerId: number,
      point: Point,
      timestamp: number,
      dragging = true,
      updateVisualState = true,
    ) => {
      panSessionRef.current = {
        pointerId,
        startPoint: point,
        startTransform: transformRef.current,
        lastPoint: point,
        lastTimestamp: timestamp,
        velocity: { x: 0, y: 0 },
      };
      if (updateVisualState) {
        setIsDragging(dragging);
        setIsInteracting(true);
      }
    },
    [transformRef],
  );

  const readViewportHeight = useCallback((): number => {
    const frame = frameRef.current;
    return frame?.clientHeight || window.innerHeight || 0;
  }, []);

  const startDismissSession = useCallback(
    (pointerId: number, point: Point, timestamp: number) => {
      dismissSessionRef.current = {
        pointerId,
        startPoint: point,
        lastPoint: point,
        lastTimestamp: timestamp,
        offset: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        active: false,
      };
    },
    [],
  );

  const resetDismissVisual = useCallback(() => {
    setIsInteracting(false);
    requestAnimationFrame(() => {
      applyVisualTransform(transformRef.current);
    });
  }, [applyVisualTransform, transformRef]);

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

      stopMomentum();
      if (event.cancelable) {
        event.preventDefault();
      }

      const point = getFramePointFromClient(event.clientX, event.clientY);
      if (!point) {
        endInteraction();
        return;
      }

      const currentScale = transformRef.current.scale;
      const wheelDelta = normalizeWheelDelta(event);
      const nextScale =
        currentScale * Math.exp(-wheelDelta * WHEEL_ZOOM_SENSITIVITY);
      zoomAt(nextScale, point);
    },
    [
      endInteraction,
      getFramePointFromClient,
      mode,
      stopMomentum,
      transformRef,
      zoomAt,
    ],
  );

  const startPinch = useCallback(() => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) {
      return false;
    }

    const [first, second] = points;
    const startCenter = getFrameCenterFromPointers(first, second);
    const startDistance = getDistance(first, second);
    if (!startCenter || startDistance <= 0) {
      return false;
    }

    if (dismissSessionRef.current) {
      dismissSessionRef.current = null;
      resetDismissVisual();
    }
    pinchSessionRef.current = {
      startCenter,
      startDistance,
      startTransform: transformRef.current,
    };
    panSessionRef.current = null;
    lastTapRef.current = 0;
    setIsDragging(false);
    setIsInteracting(true);
    gestureMovedRef.current = true;
    return true;
  }, [
    getFrameCenterFromPointers,
    resetDismissVisual,
    transformRef,
  ]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      stopMomentum();
      preventNativeTouchGesture(event);
      refreshStageMeasurements();
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
          const point = getFramePointFromClient(event.clientX, event.clientY);
          if (point) {
            suppressCloseUntilRef.current = now + DOUBLE_TAP_CLICK_SUPPRESS_MS;
            toggleZoomAt(point);
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
        if (mode === "mobile" && event.pointerType === "touch") {
          startDismissSession(event.pointerId, point, getEventTimestamp(event));
        }
        return;
      }

      startPanSession(
        event.pointerId,
        point,
        getEventTimestamp(event),
        true,
        mode === "mobile",
      );
    },
    [
      getEventTimestamp,
      mode,
      preventNativeTouchGesture,
      getFramePointFromClient,
      refreshStageMeasurements,
      startPinch,
      startDismissSession,
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

      const dismissSession = dismissSessionRef.current;
      if (
        mode === "mobile" &&
        dismissSession?.pointerId === event.pointerId &&
        pointersRef.current.size === 1
      ) {
        const timestamp = getEventTimestamp(event);
        const metrics = buildSwipeDismissMetrics({
          startPoint: dismissSession.startPoint,
          currentPoint: point,
          previousPoint: dismissSession.lastPoint,
          elapsedMs: timestamp - dismissSession.lastTimestamp,
          viewportHeight: readViewportHeight(),
        });

        dismissSession.lastPoint = point;
        dismissSession.lastTimestamp = timestamp;
        dismissSession.offset = metrics.offset;
        dismissSession.velocity = metrics.velocity;

        if (dismissSession.active || hasVerticalSwipeIntent(metrics.offset)) {
          dismissSession.active = true;
          gestureMovedRef.current = true;
          setIsInteracting(true);
          applyVisualTransform({
            scale: metrics.scale,
            x: metrics.visualOffset.x,
            y: metrics.visualOffset.y,
          });
        }

        return;
      }

      if (mode === "mobile" && pinchSessionRef.current) {
        const points = Array.from(pointersRef.current.values());
        if (points.length >= 2) {
          const [first, second] = points;
          const pinchSession = pinchSessionRef.current;
          const nextDistance = getDistance(first, second);
          const nextCenter = getFrameCenterFromPointers(first, second);
          if (!nextCenter) {
            return;
          }
          const nextTransform = buildMobilePinchTransform({
            startCenter: pinchSession.startCenter,
            currentCenter: nextCenter,
            startDistance: pinchSession.startDistance,
            currentDistance: nextDistance,
            startTransform: pinchSession.startTransform,
          });
          commitTransform(nextTransform, {
            behavior: "rubber",
            maxScale: MAX_SCALE_WITH_MOBILE_SPRING,
          });
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
      panTo(
        nextTransform.x,
        nextTransform.y,
        mode === "mobile" ? { behavior: "rubber" } : undefined,
      );
    },
    [
      applyVisualTransform,
      commitTransform,
      getFrameCenterFromPointers,
      getEventTimestamp,
      mode,
      panTo,
      preventNativeTouchGesture,
      readViewportHeight,
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
      const finishingDismissSession =
        dismissSessionRef.current?.pointerId === event.pointerId
          ? dismissSessionRef.current
          : null;

      clearPointer(event.pointerId);
      safeReleasePointerCapture(event.currentTarget, event.pointerId);

      if (finishingDismissSession) {
        dismissSessionRef.current = null;
        tapStartPointRef.current = null;

        if (
          finishingDismissSession.active &&
          shouldDismissBySwipe({
            offset: finishingDismissSession.offset,
            velocity: finishingDismissSession.velocity,
            viewportHeight: readViewportHeight(),
          })
        ) {
          onRequestClose?.();
          return;
        }

        resetDismissVisual();
        endInteraction();
        return;
      }

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
        if (mode === "desktop" || transformRef.current.scale > MAX_SCALE) {
          endInteraction();
          return;
        }
        startMomentum(finishingPanSession.velocity, endInteraction);
        return;
      }

      endInteraction();
    },
    [
      clearPointer,
      endInteraction,
      getEventTimestamp,
      mode,
      onRequestClose,
      preventNativeTouchGesture,
      readViewportHeight,
      resetDismissVisual,
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

      refreshStageMeasurements();
      const point = getFramePointFromClient(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      stopMomentum();
      suppressCloseUntilRef.current = Date.now() + DOUBLE_TAP_CLICK_SUPPRESS_MS;
      event.preventDefault();
      event.stopPropagation();
      toggleZoomAt(point);
    },
    [
      getFramePointFromClient,
      mode,
      refreshStageMeasurements,
      stopMomentum,
      toggleZoomAt,
    ],
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
        return;
      }

      onRequestClose();
    },
    [onRequestClose],
  );

  const handleImageLoad = useCallback(() => {
    dismissSessionRef.current = null;
    pinchSessionRef.current = null;
    panSessionRef.current = null;
    stopMomentum();
    setIsDragging(false);
    setIsInteracting(false);
    refreshStageMeasurements();
    resetTransform();
  }, [
    refreshStageMeasurements,
    resetTransform,
    stopMomentum,
  ]);

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
