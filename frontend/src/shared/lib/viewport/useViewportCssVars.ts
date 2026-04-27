import { useEffect } from "react";

import {
  applyViewportCssMetrics,
  areViewportCssMetricsEqual,
  readViewportCssMetrics,
  type ViewportCssMetrics,
} from "./viewportCssVars";

export const useViewportCssVars = (): void => {
  useEffect(() => {
    const root = document.documentElement;
    const visualViewport = window.visualViewport;
    let animationFrameId = 0;
    let lastMetrics: ViewportCssMetrics | null = null;

    const syncViewportVars = () => {
      animationFrameId = 0;

      const nextMetrics = readViewportCssMetrics(window);
      if (
        lastMetrics &&
        areViewportCssMetricsEqual(lastMetrics, nextMetrics)
      ) {
        return;
      }

      lastMetrics = nextMetrics;
      applyViewportCssMetrics(root, nextMetrics);
    };

    const scheduleViewportVars = () => {
      if (animationFrameId !== 0) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(syncViewportVars);
    };

    syncViewportVars();
    window.addEventListener("resize", scheduleViewportVars, { passive: true });
    window.addEventListener("orientationchange", scheduleViewportVars, {
      passive: true,
    });
    visualViewport?.addEventListener("resize", scheduleViewportVars, {
      passive: true,
    });
    visualViewport?.addEventListener("scroll", scheduleViewportVars, {
      passive: true,
    });

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", scheduleViewportVars);
      window.removeEventListener("orientationchange", scheduleViewportVars);
      visualViewport?.removeEventListener("resize", scheduleViewportVars);
      visualViewport?.removeEventListener("scroll", scheduleViewportVars);
    };
  }, []);
};
