export type ViewportCssMetricsSource = {
  innerHeight: number;
  innerWidth: number;
  visualViewport?:
    | Pick<VisualViewport, "height" | "offsetLeft" | "offsetTop" | "width">
    | null;
};

export type ViewportCssMetrics = {
  appHeight: number;
  appWidth: number;
  keyboardInsetBottom: number;
  viewportOffsetLeft: number;
  viewportOffsetTop: number;
  visualViewportHeight: number;
  visualViewportWidth: number;
};

const normalizeCssPixel = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
};

const clampCssPixel = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, normalizeCssPixel(value)));

/**
 * Reads viewport CSS metrics without double-shrinking the app during keyboard
 * open. The app keeps layout viewport dimensions; visualViewport only supplies
 * the bottom inset when a browser overlays the keyboard.
 */
export const readViewportCssMetrics = (
  targetWindow: ViewportCssMetricsSource,
): ViewportCssMetrics => {
  const appHeight = normalizeCssPixel(targetWindow.innerHeight);
  const appWidth = normalizeCssPixel(targetWindow.innerWidth);
  const visualViewport = targetWindow.visualViewport;
  const visualViewportHeight = normalizeCssPixel(
    visualViewport?.height ?? appHeight,
  );
  const visualViewportWidth = normalizeCssPixel(
    visualViewport?.width ?? appWidth,
  );
  const viewportOffsetTop = normalizeCssPixel(visualViewport?.offsetTop ?? 0);
  const viewportOffsetLeft = normalizeCssPixel(visualViewport?.offsetLeft ?? 0);
  const keyboardInsetBottom = clampCssPixel(
    appHeight - viewportOffsetTop - visualViewportHeight,
    0,
    appHeight,
  );

  return {
    appHeight,
    appWidth,
    keyboardInsetBottom,
    viewportOffsetLeft,
    viewportOffsetTop,
    visualViewportHeight,
    visualViewportWidth,
  };
};

export const areViewportCssMetricsEqual = (
  left: ViewportCssMetrics,
  right: ViewportCssMetrics,
): boolean =>
  left.appHeight === right.appHeight &&
  left.appWidth === right.appWidth &&
  left.keyboardInsetBottom === right.keyboardInsetBottom &&
  left.viewportOffsetLeft === right.viewportOffsetLeft &&
  left.viewportOffsetTop === right.viewportOffsetTop &&
  left.visualViewportHeight === right.visualViewportHeight &&
  left.visualViewportWidth === right.visualViewportWidth;

export const applyViewportCssMetrics = (
  root: HTMLElement,
  metrics: ViewportCssMetrics,
): void => {
  root.style.setProperty("--app-height", `${metrics.appHeight}px`);
  root.style.setProperty("--app-width", `${metrics.appWidth}px`);
  root.style.setProperty(
    "--visual-viewport-height",
    `${metrics.visualViewportHeight}px`,
  );
  root.style.setProperty(
    "--visual-viewport-width",
    `${metrics.visualViewportWidth}px`,
  );
  root.style.setProperty(
    "--keyboard-inset-bottom",
    `${metrics.keyboardInsetBottom}px`,
  );
  root.style.setProperty(
    "--viewport-offset-top",
    `${metrics.viewportOffsetTop}px`,
  );
  root.style.setProperty(
    "--viewport-offset-left",
    `${metrics.viewportOffsetLeft}px`,
  );
};
