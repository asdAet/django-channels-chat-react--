import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import styles from "../../styles/ui/ZoomableImageStage.module.css";

type Point = {
  x: number;
  y: number;
};

type TransformState = {
  scale: number;
  x: number;
  y: number;
};

type ZoomableImageStageProps = {
  src: string;
  alt: string;
  onRequestClose?: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;
const CLOSE_TAP_DELAY_MS = 220;
const DOUBLE_TAP_CLICK_SUPPRESS_MS = 320;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getDistance = (first: Point, second: Point): number =>
  Math.hypot(first.x - second.x, first.y - second.y);

/**
 * Renders a contained image viewer with wheel/double-click zoom and pointer pan.
 *
 * The stage keeps fit-to-screen as the base state. Every zoom step is applied
 * around the visual center of the viewer, while pan stays unrestricted after
 * the image has already been scaled.
 */
export function ZoomableImageStage({
  src,
  alt,
  onRequestClose,
}: ZoomableImageStageProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const panSessionRef = useRef<{
    pointerId: number;
    startPoint: Point;
    startTransform: TransformState;
  } | null>(null);
  const pinchSessionRef = useRef<{
    startDistance: number;
    startScale: number;
  } | null>(null);
  const lastTapRef = useRef<number>(0);
  const gestureMovedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const suppressCloseUntilRef = useRef(0);

  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

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

  const clampTransform = useCallback(
    (next: TransformState): TransformState => {
      const clampedScale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
      if (clampedScale <= MIN_SCALE) {
        return { scale: MIN_SCALE, x: 0, y: 0 };
      }

      return {
        scale: clampedScale,
        x: next.x,
        y: next.y,
      };
    },
    [],
  );

  const applyScale = useCallback(
    (nextScale: number) => {
      setTransform((current) => {
        const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        if (clampedScale <= MIN_SCALE) {
          return { scale: MIN_SCALE, x: 0, y: 0 };
        }

        const previousScale = current.scale <= 0 ? MIN_SCALE : current.scale;
        const scaleRatio = clampedScale / previousScale;

        return clampTransform({
          scale: clampedScale,
          x: current.x * scaleRatio,
          y: current.y * scaleRatio,
        });
      });
    },
    [clampTransform],
  );

  const toggleZoom = useCallback(() => {
    setTransform((current) => {
      if (current.scale > MIN_SCALE) {
        return { scale: MIN_SCALE, x: 0, y: 0 };
      }

      return clampTransform({
        scale: DOUBLE_TAP_SCALE,
        x: 0,
        y: 0,
      });
    });
  }, [clampTransform]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      clearScheduledClose();
      if (event.cancelable) {
        event.preventDefault();
      }

      const step = event.deltaY < 0 ? 0.18 : -0.18;
      applyScale(transform.scale + step);
    },
    [applyScale, clearScheduledClose, transform.scale],
  );

  const updatePointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): Point => {
    const point = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, point);
    return point;
  };

  const clearPointer = (pointerId: number) => {
    pointersRef.current.delete(pointerId);
  };

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      clearScheduledClose();
      gestureMovedRef.current = false;
      const point = updatePointer(event);
      if (event.pointerType === "touch") {
        const now = Date.now();
        if (now - lastTapRef.current < 260) {
          suppressCloseUntilRef.current = now + DOUBLE_TAP_CLICK_SUPPRESS_MS;
          toggleZoom();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
      }

      if (pointersRef.current.size === 2) {
        gestureMovedRef.current = true;
        const [first, second] = Array.from(pointersRef.current.values());
        pinchSessionRef.current = {
          startDistance: getDistance(first, second),
          startScale: transform.scale,
        };
        panSessionRef.current = null;
        setIsDragging(false);
        return;
      }

      if (transform.scale <= MIN_SCALE) {
        return;
      }

      panSessionRef.current = {
        pointerId: event.pointerId,
        startPoint: point,
        startTransform: transform,
      };
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [clearScheduledClose, toggleZoom, transform],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      updatePointer(event);

      if (pinchSessionRef.current && pointersRef.current.size >= 2) {
        gestureMovedRef.current = true;
        const [first, second] = Array.from(pointersRef.current.values());
        const nextDistance = getDistance(first, second);
        const ratio = nextDistance / pinchSessionRef.current.startDistance;
        const nextScale = pinchSessionRef.current.startScale * ratio;
        applyScale(nextScale);
        return;
      }

      const panSession = panSessionRef.current;
      if (!panSession || panSession.pointerId !== event.pointerId) {
        return;
      }

      const nextX =
        panSession.startTransform.x + (event.clientX - panSession.startPoint.x);
      const nextY =
        panSession.startTransform.y + (event.clientY - panSession.startPoint.y);

      if (
        Math.abs(event.clientX - panSession.startPoint.x) > 2 ||
        Math.abs(event.clientY - panSession.startPoint.y) > 2
      ) {
        gestureMovedRef.current = true;
      }

      setTransform((current) =>
        clampTransform({
          ...current,
          x: nextX,
          y: nextY,
        }),
      );
    },
    [applyScale, clampTransform],
  );

  const finishGesture = useCallback(
    (pointerId: number) => {
      clearPointer(pointerId);
      if (panSessionRef.current?.pointerId === pointerId) {
        panSessionRef.current = null;
        setIsDragging(false);
      }

      if (pointersRef.current.size < 2) {
        pinchSessionRef.current = null;
      }
    },
    [],
  );

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      clearScheduledClose();
      suppressCloseUntilRef.current = Date.now() + DOUBLE_TAP_CLICK_SUPPRESS_MS;
      event.preventDefault();
      event.stopPropagation();
      toggleZoom();
    },
    [clearScheduledClose, toggleZoom],
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
      className={styles.imageStage}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishGesture(event.pointerId)}
      onPointerCancel={(event) => finishGesture(event.pointerId)}
      onPointerLeave={(event) => finishGesture(event.pointerId)}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      data-testid="image-lightbox-stage"
    >
      <img
        ref={imageRef}
        className={[
          styles.image,
          transform.scale > MIN_SCALE ? styles.imageZoomed : "",
          isDragging ? styles.imageDragging : "",
        ]
          .filter(Boolean)
          .join(" ")}
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
        }}
      />
    </div>
  );
}
