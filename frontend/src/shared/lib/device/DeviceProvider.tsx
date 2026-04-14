import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import { DeviceContext } from "./device-context";
import {
  areDeviceSnapshotsEqual,
  readDeviceSnapshot,
} from "./readDeviceSnapshot";
import type { DeviceSnapshot } from "./types";

const bindMediaQuery = (
  query: string,
  onChange: () => void,
): (() => void) | null => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  const mediaQuery = window.matchMedia(query);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }

  mediaQuery.addListener?.(onChange);
  return () => mediaQuery.removeListener?.(onChange);
};

/**
 * Публикует в контекст актуальный снимок устройства и viewport.
 *
 * Провайдер слушает media query, resize и orientation changes, а затем
 * обновляет `DeviceContext` только тогда, когда snapshot реально изменился.
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot>(() =>
    readDeviceSnapshot(typeof window === "undefined" ? null : window),
  );

  useEffect(() => {
    const syncSnapshot = () => {
      setSnapshot((previousSnapshot) => {
        const nextSnapshot = readDeviceSnapshot(window);
        return areDeviceSnapshotsEqual(previousSnapshot, nextSnapshot)
          ? previousSnapshot
          : nextSnapshot;
      });
    };

    const mediaQueryCleanups = [
      bindMediaQuery("(pointer: coarse)", syncSnapshot),
      bindMediaQuery("(pointer: fine)", syncSnapshot),
      bindMediaQuery("(hover: hover)", syncSnapshot),
      bindMediaQuery("(any-pointer: coarse)", syncSnapshot),
      bindMediaQuery("(any-hover: hover)", syncSnapshot),
    ].filter(Boolean) as Array<() => void>;

    syncSnapshot();
    window.addEventListener("resize", syncSnapshot, { passive: true });
    window.addEventListener("orientationchange", syncSnapshot, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", syncSnapshot);

    return () => {
      window.removeEventListener("resize", syncSnapshot);
      window.removeEventListener("orientationchange", syncSnapshot);
      window.visualViewport?.removeEventListener("resize", syncSnapshot);
      mediaQueryCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <DeviceContext.Provider value={snapshot}>{children}</DeviceContext.Provider>
  );
}
