import { describe, expect, it } from "vitest";

import {
  applyViewportCssMetrics,
  readViewportCssMetrics,
  type ViewportCssMetricsSource,
} from "./viewportCssVars";

const readMetrics = (source: ViewportCssMetricsSource) =>
  readViewportCssMetrics(source);

describe("viewportCssVars", () => {
  it("uses layout viewport dimensions when visualViewport is unavailable", () => {
    expect(readMetrics({ innerHeight: 720, innerWidth: 360 })).toEqual({
      appHeight: 720,
      appWidth: 360,
      keyboardInsetBottom: 0,
      viewportOffsetLeft: 0,
      viewportOffsetTop: 0,
      visualViewportHeight: 720,
      visualViewportWidth: 360,
    });
  });

  it("detects an overlaid keyboard as a bottom inset", () => {
    expect(
      readMetrics({
        innerHeight: 800,
        innerWidth: 390,
        visualViewport: {
          height: 510,
          offsetLeft: 0,
          offsetTop: 0,
          width: 390,
        },
      }).keyboardInsetBottom,
    ).toBe(290);
  });

  it("does not double-compensate when the layout viewport already resized", () => {
    expect(
      readMetrics({
        innerHeight: 510,
        innerWidth: 390,
        visualViewport: {
          height: 510,
          offsetLeft: 0,
          offsetTop: 0,
          width: 390,
        },
      }).keyboardInsetBottom,
    ).toBe(0);
  });

  it("accounts for visual viewport offset when the browser pans the page", () => {
    expect(
      readMetrics({
        innerHeight: 800,
        innerWidth: 390,
        visualViewport: {
          height: 510,
          offsetLeft: 0,
          offsetTop: 120,
          width: 390,
        },
      }).keyboardInsetBottom,
    ).toBe(170);
  });

  it("writes stable CSS custom properties to the root element", () => {
    const root = document.createElement("div");

    applyViewportCssMetrics(root, {
      appHeight: 800,
      appWidth: 390,
      keyboardInsetBottom: 290,
      viewportOffsetLeft: 0,
      viewportOffsetTop: 0,
      visualViewportHeight: 510,
      visualViewportWidth: 390,
    });

    expect(root.style.getPropertyValue("--app-height")).toBe("800px");
    expect(root.style.getPropertyValue("--keyboard-inset-bottom")).toBe(
      "290px",
    );
    expect(root.style.getPropertyValue("--visual-viewport-height")).toBe(
      "510px",
    );
  });
});
