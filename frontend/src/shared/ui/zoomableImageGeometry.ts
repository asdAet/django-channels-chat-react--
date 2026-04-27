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

export type SwipeDismissMetrics = {
  offset: Point;
  velocity: Point;
  visualOffset: Point;
  scale: number;
  progress: number;
};

export const MIN_SCALE = 1;
export const MAX_SCALE = 32;
export const MOBILE_MAX_SCALE_OVERSHOOT_RATIO = 0.18;
export const MAX_SCALE_WITH_MOBILE_SPRING =
  MAX_SCALE * (1 + MOBILE_MAX_SCALE_OVERSHOOT_RATIO);
export const DEFAULT_TRANSFORM: TransformState = {
  scale: MIN_SCALE,
  x: 0,
  y: 0,
};

export type ConstrainTransformOptions = {
  maxScale?: number;
  behavior?: "strict" | "rubber";
};

const RESET_EPSILON = 0.001;
const TRANSFORM_CLOSE_EPSILON = 0.01;
const RUBBER_BAND_VIEWPORT_RATIO = 0.32;
const RUBBER_BAND_MIN_LIMIT_PX = 80;
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
  const content = normalizeSize(geometry.content);

  return {
    x: Math.max(0, (content.width * scale) / 2),
    y: Math.max(0, (content.height * scale) / 2),
  };
};

const rubberBandOverflow = (overflow: number, limit: number): number => {
  if (overflow <= 0 || limit <= 0) {
    return 0;
  }

  return limit * (1 - 1 / (overflow / limit + 1));
};

const rubberBandClamp = (
  value: number,
  min: number,
  max: number,
  limit: number,
): number => {
  if (value < min) {
    return min - rubberBandOverflow(min - value, limit);
  }

  if (value > max) {
    return max + rubberBandOverflow(value - max, limit);
  }

  return value;
};

/**
 * Сравнивает два transform с допуском для дробных значений после анимации.
 *
 * @param first Первое состояние transform.
 * @param second Второе состояние transform.
 * @returns `true`, если визуальная разница между состояниями несущественна.
 */
export const areTransformsClose = (
  first: TransformState,
  second: TransformState,
): boolean =>
  Math.abs(first.scale - second.scale) <= TRANSFORM_CLOSE_EPSILON &&
  Math.abs(first.x - second.x) <= TRANSFORM_CLOSE_EPSILON &&
  Math.abs(first.y - second.y) <= TRANSFORM_CLOSE_EPSILON;

/**
 * Ограничивает transform допустимой областью просмотра.
 *
 * @param transform Текущее визуальное смещение и масштаб.
 * @param geometry Размер viewport и уже вписанного медиа.
 * @param options Дополнительные границы, например mobile spring overscale.
 * @returns Transform, который можно безопасно применить к медиа.
 */
export const constrainTransform = (
  transform: TransformState,
  geometry: TransformGeometry | null,
  options: ConstrainTransformOptions = {},
): TransformState => {
  const maxScale = options.maxScale ?? MAX_SCALE;
  const scale = clamp(transform.scale, MIN_SCALE, maxScale);
  if (scale <= MIN_SCALE + RESET_EPSILON) {
    return DEFAULT_TRANSFORM;
  }

  if (!geometry) {
    return { ...transform, scale };
  }

  const bounds = getTransformBounds(geometry, scale);
  const minX = -bounds.x;
  const maxX = bounds.x;
  const minY = -bounds.y;
  const maxY = bounds.y;

  if (options.behavior === "rubber") {
    const xLimit = Math.max(
      RUBBER_BAND_MIN_LIMIT_PX,
      geometry.viewport.width * RUBBER_BAND_VIEWPORT_RATIO,
    );
    const yLimit = Math.max(
      RUBBER_BAND_MIN_LIMIT_PX,
      geometry.viewport.height * RUBBER_BAND_VIEWPORT_RATIO,
    );

    return {
      scale,
      x: rubberBandClamp(transform.x, minX, maxX, xLimit),
      y: rubberBandClamp(transform.y, minY, maxY, yLimit),
    };
  }

  return {
    scale,
    x: clamp(transform.x, minX, maxX),
    y: clamp(transform.y, minY, maxY),
  };
};

/**
 * Применяет mobile-only пружину к масштабу, который вышел за максимум.
 *
 * @param scale Сырой масштаб pinch-жеста.
 * @returns Визуальный масштаб с затухающим overscale.
 */
export const resolveMobileSpringScale = (scale: number): number => {
  if (scale <= MIN_SCALE) {
    return MIN_SCALE;
  }

  if (scale <= MAX_SCALE) {
    return scale;
  }

  const overshootLimit = MAX_SCALE * MOBILE_MAX_SCALE_OVERSHOOT_RATIO;
  return MAX_SCALE + rubberBandOverflow(scale - MAX_SCALE, overshootLimit);
};

/**
 * Возвращает transform после отпускания жеста, когда spring должен вернуться
 * к реальному максимуму масштаба.
 *
 * @param transform Текущий transform, возможно с mobile overscale.
 * @param geometry Размеры области просмотра и медиа.
 * @returns Transform с обычными production-границами.
 */
export const settleTransform = (
  transform: TransformState,
  geometry: TransformGeometry | null,
): TransformState =>
  constrainTransform(
    {
      ...transform,
      scale: clamp(transform.scale, MIN_SCALE, MAX_SCALE),
    },
    geometry,
  );

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

export const buildMobilePinchTransform = ({
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
  const rawScale = startTransform.scale * (currentDistance / safeStartDistance);
  const scale = resolveMobileSpringScale(rawScale);

  if (scale <= MIN_SCALE + RESET_EPSILON) {
    return DEFAULT_TRANSFORM;
  }

  return buildPinchTransformAtScale({
    startCenter,
    currentCenter,
    scale,
    safeStartScale,
    startTransform,
  });
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
