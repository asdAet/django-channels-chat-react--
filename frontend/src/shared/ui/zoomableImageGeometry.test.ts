import { describe, expect, it } from "vitest";

import {
  buildPanTransform,
  buildPinchTransform,
  buildZoomAtPointTransform,
  constrainTransform,
  DEFAULT_TRANSFORM,
  getTransformBounds,
  type TransformGeometry,
} from "./zoomableImageGeometry";

const geometry: TransformGeometry = {
  viewport: { width: 390, height: 844 },
  content: { width: 390, height: 260 },
};

describe("zoomableImageGeometry", () => {
  it("keeps the selected viewport point stable when zooming", () => {
    expect(
      buildZoomAtPointTransform(DEFAULT_TRANSFORM, 2, { x: 80, y: -40 }),
    ).toEqual({
      scale: 2,
      x: -80,
      y: 40,
    });
  });

  it("tracks a two-finger pinch around the moving gesture center", () => {
    const transform = buildPinchTransform({
      startCenter: { x: 0, y: 0 },
      currentCenter: { x: 24, y: -12 },
      startDistance: 100,
      currentDistance: 200,
      startTransform: DEFAULT_TRANSFORM,
    });

    expect(transform).toEqual({
      scale: 2,
      x: 24,
      y: -12,
    });
  });

  it("continues one-finger pan from the current transformed position", () => {
    expect(
      buildPanTransform(
        { scale: 2, x: 0, y: -10 },
        { x: 95, y: 422 },
        { x: 145, y: 430 },
      ),
    ).toEqual({
      scale: 2,
      x: 50,
      y: -2,
    });
  });

  it("clamps transformed media inside the visible viewport", () => {
    expect(getTransformBounds(geometry, 2)).toEqual({
      x: 195,
      y: 0,
    });
    expect(
      constrainTransform({ scale: 2, x: 500, y: 100 }, geometry),
    ).toEqual({
      scale: 2,
      x: 195,
      y: 0,
    });
  });
});
