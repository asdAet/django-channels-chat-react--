import { type ReactNode, useEffect, useRef, useState } from "react";

import { MOBILE_VIEWPORT_MEDIA_QUERY } from "./constants";
import { DeviceContext } from "./device-context";
import { areDeviceTraitsEqual, readDeviceSnapshot } from "./readDeviceSnapshot";
import type { DeviceSnapshot } from "./types";

const DEVICE_MEDIA_QUERIES = [
  MOBILE_VIEWPORT_MEDIA_QUERY,
  "(pointer: coarse)",
  "(pointer: fine)",
  "(hover: hover)",
  "(any-pointer: coarse)",
  "(any-hover: hover)",
] as const;

const bindMediaQuery = (
  query: string,
  onChange: () => void,
): (() => void) | null => {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  const mediaQuery = window.matchMedia(query);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }

  return null;
};

/**
 * Публикует в контекст актуальный снимок устройства.
 *
 * Провайдер слушает media query changes, а затем
 * обновляет `DeviceContext` только тогда, когда меняется поведение устройства,
 * а не каждый пиксель viewport. Сырые размеры viewport остаются в CSS vars.
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DeviceSnapshot>(() =>
    readDeviceSnapshot(typeof window === "undefined" ? null : window),
  );
  const publishedSnapshotRef = useRef(snapshot);

  useEffect(() => {
    const syncSnapshot = () => {
      const nextSnapshot = readDeviceSnapshot(window);
      const previousSnapshot = publishedSnapshotRef.current;

      if (areDeviceTraitsEqual(previousSnapshot, nextSnapshot)) {
        return;
      }

      publishedSnapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
    };

    const mediaQueryCleanups = DEVICE_MEDIA_QUERIES.map((query) =>
      bindMediaQuery(query, syncSnapshot),
    ).filter(Boolean) as Array<() => void>;

    syncSnapshot();

    return () => {
      mediaQueryCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <DeviceContext.Provider value={snapshot}>{children}</DeviceContext.Provider>
  );
}
