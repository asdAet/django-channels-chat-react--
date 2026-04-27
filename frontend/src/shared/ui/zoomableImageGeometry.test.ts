import { describe, expect, it } from "vitest";

import {
  buildMobilePinchTransform,
  buildPanTransform,
  buildPinchTransform,
  buildSwipeDismissMetrics,
  buildZoomAtPointTransform,
  constrainTransform,
  DEFAULT_TRANSFORM,
  getTransformBounds,
  MAX_SCALE,
  MAX_SCALE_WITH_MOBILE_SPRING,
  settleTransform,
  shouldDismissBySwipe,
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

  it("allows moving zoomed media until any corner can reach the viewport center", () => {
    expect(getTransformBounds(geometry, 2)).toEqual({
      x: 390,
      y: 260,
    });
    expect(
      constrainTransform({ scale: 2, x: 500, y: 500 }, geometry),
    ).toEqual({
      scale: 2,
      x: 390,
      y: 260,
    });
  });

  it("rubber-bands active pan outside the final bounds without hard jumps", () => {
    const transform = constrainTransform(
      { scale: 2, x: 500, y: 500 },
      geometry,
      { behavior: "rubber" },
    );

    expect(transform.x).toBeGreaterThan(390);
    expect(transform.x).toBeLessThan(500);
    expect(transform.y).toBeGreaterThan(260);
    expect(transform.y).toBeLessThan(500);
  });

  it("keeps desktop zoom inside the production max scale", () => {
    expect(
      buildZoomAtPointTransform(DEFAULT_TRANSFORM, MAX_SCALE * 2, {
        x: 80,
        y: -40,
      }).scale,
    ).toBe(MAX_SCALE);
  });

  it("applies a mobile-only spring when pinch goes past max scale", () => {
    const transform = buildMobilePinchTransform({
      startCenter: { x: 0, y: 0 },
      currentCenter: { x: 12, y: 0 },
      startDistance: 100,
      currentDistance: MAX_SCALE * 150,
      startTransform: DEFAULT_TRANSFORM,
    });

    expect(transform.scale).toBeGreaterThan(MAX_SCALE);
    expect(transform.scale).toBeLessThan(MAX_SCALE_WITH_MOBILE_SPRING);
  });

  it("settles mobile overscale back to max scale after release", () => {
    expect(
      settleTransform(
        {
          scale: MAX_SCALE_WITH_MOBILE_SPRING,
          x: 99999,
          y: -99999,
        },
        geometry,
      ),
    ).toEqual({
      scale: MAX_SCALE,
      x: 6240,
      y: -4160,
    });
  });

  it("builds vertical swipe dismiss metrics and ignores horizontal swipes", () => {
    const metrics = buildSwipeDismissMetrics({
      startPoint: { x: 100, y: 100 },
      currentPoint: { x: 116, y: 250 },
      previousPoint: { x: 108, y: 205 },
      elapsedMs: 45,
      viewportHeight: 844,
    });

    expect(metrics.offset).toEqual({ x: 16, y: 150 });
    expect(metrics.visualOffset).toEqual({ x: 3.52, y: 150 });
    expect(shouldDismissBySwipe({ ...metrics, viewportHeight: 844 })).toBe(
      true,
    );
    expect(
      shouldDismissBySwipe({
        offset: { x: 160, y: 28 },
        velocity: { x: 1.2, y: 0.1 },
        viewportHeight: 844,
      }),
    ).toBe(false);
  });
});
