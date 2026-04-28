import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";

import styles from "../../styles/ui/LightboxVideoPlayer.module.css";
import {
  buildSwipeDismissMetrics,
  hasVerticalSwipeIntent,
  type Point,
  shouldDismissBySwipe,
} from "./zoomableImageGeometry";

type LightboxVideoPlayerProps = {
  src: string;
  poster?: string | null;
  fileName: string;
  onRequestClose?: () => void;
};

type SwipeDismissSession = {
  pointerId: number;
  startPoint: Point;
  lastPoint: Point;
  lastTimestamp: number;
  offset: Point;
  velocity: Point;
  active: boolean;
};

const SWIPE_RESET_TRANSITION_MS = 180;

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
    // Pointer capture can fail after browser-owned video control gestures.
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
    // The browser may already release the pointer from native video controls.
  }
};

const getEventTimestamp = (
  event: ReactPointerEvent<HTMLDivElement>,
): number => (event.timeStamp > 0 ? event.timeStamp : performance.now());

const getViewportHeight = (element: HTMLElement | null): number =>
  element?.clientHeight || window.innerHeight || 0;

const shouldReduceMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/**
 * Minimal native HTML5 video stage for the unified media viewer.
 *
 * The component deliberately stays close to the browser's default player:
 * there are no custom playback layers, no third-party runtime and no detached
 * player session. Closing the viewer always tears the media element down.
 */
export function LightboxVideoPlayer({
  src,
  poster,
  fileName,
  onRequestClose,
}: LightboxVideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const swipeSessionRef = useRef<SwipeDismissSession | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }

      if (!video) {
        return;
      }

      try {
        video.pause();
      } catch {
        // Ignore teardown issues from partially detached HTMLMediaElement.
      }
    };
  }, []);

  const clearResetTransition = useCallback(() => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const root = rootRef.current;
    if (root) {
      root.style.transition = "";
    }
  }, []);

  const resetSwipeVisual = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    if (shouldReduceMotion()) {
      root.style.transition = "";
      root.style.transform = "";
      return;
    }

    root.style.transition = `transform ${SWIPE_RESET_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    root.style.transform = "";
    resetTimerRef.current = window.setTimeout(() => {
      resetTimerRef.current = null;
      root.style.transition = "";
    }, SWIPE_RESET_TRANSITION_MS);
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "touch") {
        return;
      }

      clearResetTransition();
      const point = { x: event.clientX, y: event.clientY };
      swipeSessionRef.current = {
        pointerId: event.pointerId,
        startPoint: point,
        lastPoint: point,
        lastTimestamp: getEventTimestamp(event),
        offset: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        active: false,
      };
      safeSetPointerCapture(event.currentTarget, event.pointerId);
    },
    [clearResetTransition],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = swipeSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };
      const timestamp = getEventTimestamp(event);
      const metrics = buildSwipeDismissMetrics({
        startPoint: session.startPoint,
        currentPoint: point,
        previousPoint: session.lastPoint,
        elapsedMs: timestamp - session.lastTimestamp,
        viewportHeight: getViewportHeight(rootRef.current),
      });

      session.lastPoint = point;
      session.lastTimestamp = timestamp;
      session.offset = metrics.offset;
      session.velocity = metrics.velocity;

      if (!session.active && !hasVerticalSwipeIntent(metrics.offset)) {
        return;
      }

      session.active = true;
      if (event.cancelable) {
        event.preventDefault();
      }
      event.stopPropagation();

      const root = rootRef.current;
      if (root) {
        root.style.transform = `translate3d(${metrics.visualOffset.x}px, ${metrics.visualOffset.y}px, 0) scale(${metrics.scale})`;
      }
    },
    [],
  );

  const finishSwipe = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const session = swipeSessionRef.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      swipeSessionRef.current = null;
      safeReleasePointerCapture(event.currentTarget, event.pointerId);

      if (
        session.active &&
        shouldDismissBySwipe({
          offset: session.offset,
          velocity: session.velocity,
          viewportHeight: getViewportHeight(rootRef.current),
        })
      ) {
        onRequestClose?.();
        return;
      }

      resetSwipeVisual();
    },
    [onRequestClose, resetSwipeVisual],
  );

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-testid="lightbox-video-player-desktop"
      data-lightbox-video-player="true"
      data-media-file={fileName}
      onClick={(event) => event.stopPropagation()}
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={finishSwipe}
      onPointerCancelCapture={finishSwipe}
    >
      <div className={styles.playerHost} data-testid="lightbox-video-player">
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          poster={poster ?? undefined}
          preload="metadata"
          controls
          playsInline
          data-testid="lightbox-video-element"
        >
          <track kind="captions" />
        </video>
      </div>
    </div>
  );
}
