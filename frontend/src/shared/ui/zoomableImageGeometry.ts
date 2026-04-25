export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type TransformState = {
  scale: number;
  x: number;
  y: number;
};

export type TransformGeometry = {
  viewport: Size;
  content: Size;
};

export type PinchScaleLimit = "min" | "max";

export type PinchLimitState = {
  limit: PinchScaleLimit;
  transform: TransformState;
};

export type PinchTransformResult = {
  transform: TransformState;
  limit: PinchLimitState | null;
};

export type SwipeDismissMetrics = {
  offset: Point;
  velocity: Point;
  visualOffset: Point;
  scale: number;
  progress: number;
};

export const MIN_SCALE = 1;
export const MAX_SCALE = 6;
export const DEFAULT_TRANSFORM: TransformState = {
  scale: MIN_SCALE,
  x: 0,
  y: 0,
};

const RESET_EPSILON = 0.001;
const SWIPE_DISMISS_MIN_THRESHOLD_PX = 120;
const SWIPE_DISMISS_MAX_THRESHOLD_PX = 220;
const SWIPE_DISMISS_THRESHOLD_VIEWPORT_RATIO = 0.18;
const SWIPE_DISMISS_VELOCITY_PX_PER_MS = 0.65;
const SWIPE_DISMISS_MIN_VELOCITY_DISTANCE_PX = 42;
const SWIPE_DISMISS_HORIZONTAL_DAMPING = 0.22;
const SWIPE_DISMISS_MAX_SCALE_REDUCTION = 0.16;
const SWIPE_DISMISS_VERTICAL_INTENT_PX = 10;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const getDistance = (first: Point, second: Point): number =>
  Math.hypot(first.x - second.x, first.y - second.y);

export const getCenter = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

const normalizeSize = (size: Size): Size => ({
  width: Math.max(0, size.width),
  height: Math.max(0, size.height),
});

export const getTransformBounds = (
  geometry: TransformGeometry,
  scale: number,
): Point => {
  const viewport = normalizeSize(geometry.viewport);
  const content = normalizeSize(geometry.content);

  return {
    x: Math.max(0, (content.width * scale - viewport.width) / 2),
    y: Math.max(0, (content.height * scale - viewport.height) / 2),
  };
};

export const constrainTransform = (
  transform: TransformState,
  geometry: TransformGeometry | null,
): TransformState => {
  const scale = clamp(transform.scale, MIN_SCALE, MAX_SCALE);
  if (scale <= MIN_SCALE + RESET_EPSILON) {
    return DEFAULT_TRANSFORM;
  }

  if (!geometry) {
    return { ...transform, scale };
  }

  const bounds = getTransformBounds(geometry, scale);

  return {
    scale,
    x: clamp(transform.x, -bounds.x, bounds.x),
    y: clamp(transform.y, -bounds.y, bounds.y),
  };
};

export const buildZoomAtPointTransform = (
  current: TransformState,
  nextScale: number,
  point: Point,
): TransformState => {
  const previousScale = current.scale <= 0 ? MIN_SCALE : current.scale;
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const ratio = scale / previousScale;

  return {
    scale,
    x: point.x - (point.x - current.x) * ratio,
    y: point.y - (point.y - current.y) * ratio,
  };
};

export const buildPanTransform = (
  startTransform: TransformState,
  startPoint: Point,
  currentPoint: Point,
): TransformState => ({
  scale: startTransform.scale,
  x: startTransform.x + currentPoint.x - startPoint.x,
  y: startTransform.y + currentPoint.y - startPoint.y,
});

export const buildPinchTransform = ({
  startCenter,
  currentCenter,
  startDistance,
  currentDistance,
  startTransform,
}: {
  startCenter: Point;
  currentCenter: Point;
  startDistance: number;
  currentDistance: number;
  startTransform: TransformState;
}): TransformState => {
  const safeStartDistance = Math.max(1, startDistance);
  const safeStartScale = Math.max(MIN_SCALE, startTransform.scale);
  const scale = startTransform.scale * (currentDistance / safeStartDistance);
  return buildPinchTransformAtScale({
    startCenter,
    currentCenter,
    scale,
    safeStartScale,
    startTransform,
  });
};

const buildPinchTransformAtScale = ({
  startCenter,
  currentCenter,
  scale,
  safeStartScale,
  startTransform,
}: {
  startCenter: Point;
  currentCenter: Point;
  scale: number;
  safeStartScale: number;
  startTransform: TransformState;
}): TransformState => {
  const ratio = scale / safeStartScale;

  return {
    scale,
    x: currentCenter.x - (startCenter.x - startTransform.x) * ratio,
    y: currentCenter.y - (startCenter.y - startTransform.y) * ratio,
  };
};

export const buildLimitedPinchTransform = ({
  startCenter,
  currentCenter,
  startDistance,
  currentDistance,
  startTransform,
  previousLimit,
}: {
  startCenter: Point;
  currentCenter: Point;
  startDistance: number;
  currentDistance: number;
  startTransform: TransformState;
  previousLimit: PinchLimitState | null;
}): PinchTransformResult => {
  const safeStartDistance = Math.max(1, startDistance);
  const safeStartScale = Math.max(MIN_SCALE, startTransform.scale);
  const rawScale = startTransform.scale * (currentDistance / safeStartDistance);

  if (previousLimit?.limit === "max" && rawScale >= MAX_SCALE) {
    return {
      transform: previousLimit.transform,
      limit: previousLimit,
    };
  }

  if (previousLimit?.limit === "min" && rawScale <= MIN_SCALE) {
    return {
      transform: previousLimit.transform,
      limit: previousLimit,
    };
  }

  if (rawScale >= MAX_SCALE) {
    const transform =
      startTransform.scale >= MAX_SCALE - RESET_EPSILON
        ? startTransform
        : buildPinchTransformAtScale({
            startCenter,
            currentCenter,
            scale: MAX_SCALE,
            safeStartScale,
            startTransform,
          });

    return {
      transform,
      limit: {
        limit: "max",
        transform,
      },
    };
  }

  if (rawScale <= MIN_SCALE) {
    return {
      transform: DEFAULT_TRANSFORM,
      limit: {
        limit: "min",
        transform: DEFAULT_TRANSFORM,
      },
    };
  }

  return {
    transform: buildPinchTransformAtScale({
      startCenter,
      currentCenter,
      scale: rawScale,
      safeStartScale,
      startTransform,
    }),
    limit: null,
  };
};

export const isZoomedTransform = (transform: TransformState): boolean =>
  transform.scale > MIN_SCALE + RESET_EPSILON;

export const getSwipeDismissThreshold = (viewportHeight: number): number =>
  clamp(
    viewportHeight * SWIPE_DISMISS_THRESHOLD_VIEWPORT_RATIO,
    SWIPE_DISMISS_MIN_THRESHOLD_PX,
    SWIPE_DISMISS_MAX_THRESHOLD_PX,
  );

export const hasVerticalSwipeIntent = (offset: Point): boolean =>
  Math.abs(offset.y) >= SWIPE_DISMISS_VERTICAL_INTENT_PX &&
  Math.abs(offset.y) > Math.abs(offset.x) * 1.15;

export const buildSwipeDismissMetrics = ({
  startPoint,
  currentPoint,
  previousPoint,
  elapsedMs,
  viewportHeight,
}: {
  startPoint: Point;
  currentPoint: Point;
  previousPoint: Point;
  elapsedMs: number;
  viewportHeight: number;
}): SwipeDismissMetrics => {
  const safeElapsedMs = Math.max(1, elapsedMs);
  const offset = {
    x: currentPoint.x - startPoint.x,
    y: currentPoint.y - startPoint.y,
  };
  const threshold = getSwipeDismissThreshold(viewportHeight);
  const progress = clamp(Math.abs(offset.y) / threshold, 0, 1);

  return {
    offset,
    velocity: {
      x: (currentPoint.x - previousPoint.x) / safeElapsedMs,
      y: (currentPoint.y - previousPoint.y) / safeElapsedMs,
    },
    visualOffset: {
      x: offset.x * SWIPE_DISMISS_HORIZONTAL_DAMPING,
      y: offset.y,
    },
    scale: 1 - progress * SWIPE_DISMISS_MAX_SCALE_REDUCTION,
    progress,
  };
};

export const shouldDismissBySwipe = ({
  offset,
  velocity,
  viewportHeight,
}: {
  offset: Point;
  velocity: Point;
  viewportHeight: number;
}): boolean => {
  if (!hasVerticalSwipeIntent(offset)) {
    return false;
  }

  return (
    Math.abs(offset.y) >= getSwipeDismissThreshold(viewportHeight) ||
    (Math.abs(offset.y) >= SWIPE_DISMISS_MIN_VELOCITY_DISTANCE_PX &&
      Math.abs(velocity.y) >= SWIPE_DISMISS_VELOCITY_PX_PER_MS)
  );
};
