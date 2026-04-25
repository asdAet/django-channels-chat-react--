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

export const MIN_SCALE = 1;
export const MAX_SCALE = 6;
export const DEFAULT_TRANSFORM: TransformState = {
  scale: MIN_SCALE,
  x: 0,
  y: 0,
};

const RESET_EPSILON = 0.001;

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
  const ratio = scale / safeStartScale;

  return {
    scale,
    x: currentCenter.x - (startCenter.x - startTransform.x) * ratio,
    y: currentCenter.y - (startCenter.y - startTransform.y) * ratio,
  };
};

export const isZoomedTransform = (transform: TransformState): boolean =>
  transform.scale > MIN_SCALE + RESET_EPSILON;
