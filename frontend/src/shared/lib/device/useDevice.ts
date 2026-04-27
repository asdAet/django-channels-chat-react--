import { useContext } from "react";

import { DeviceContext } from "./device-context";
import { readDeviceSnapshot } from "./readDeviceSnapshot";
import type { DeviceSnapshot } from "./types";

/**
 * React-хук `useDevice`.
 *
 * @returns Возвращает результат `use device` в формате `DeviceSnapshot`.
 */
export function useDevice(): DeviceSnapshot {
  return (
    useContext(DeviceContext) ??
    readDeviceSnapshot(typeof window === "undefined" ? null : window)
  );
}
