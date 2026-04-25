import {
  MOBILE_VIEWPORT_MAX_PX,
  MOBILE_VIEWPORT_MEDIA_QUERY,
} from "./constants";
import type { DevicePrimaryPointer, DeviceSnapshot } from "./types";

const DEFAULT_VIEWPORT_WIDTH = 0;
const DEFAULT_VIEWPORT_HEIGHT = 0;

const readViewportWidth = (targetWindow: Window): number =>
  Math.max(
    0,
    Math.round(
      targetWindow.visualViewport?.width ?? targetWindow.innerWidth ?? 0,
    ),
  );

const readViewportHeight = (targetWindow: Window): number =>
  Math.max(
    0,
    Math.round(
      targetWindow.visualViewport?.height ?? targetWindow.innerHeight ?? 0,
    ),
  );

const readMediaMatch = (targetWindow: Window, query: string): boolean => {
  if (typeof targetWindow.matchMedia !== "function") {
    return false;
  }

  return targetWindow.matchMedia(query).matches;
};

const readPrimaryPointer = (targetWindow: Window): DevicePrimaryPointer => {
  if (readMediaMatch(targetWindow, "(pointer: coarse)")) {
    return "coarse";
  }
  if (readMediaMatch(targetWindow, "(pointer: fine)")) {
    return "fine";
  }
  return "none";
};

const readIsMobileViewport = (
  targetWindow: Window,
  viewportWidth: number,
): boolean => {
  if (typeof targetWindow.matchMedia === "function") {
    return readMediaMatch(targetWindow, MOBILE_VIEWPORT_MEDIA_QUERY);
  }

  return viewportWidth <= MOBILE_VIEWPORT_MAX_PX;
};

/**
 * Константа `DEFAULT_DEVICE_SNAPSHOT`, используемая как default device snapshot.
 */
export const DEFAULT_DEVICE_SNAPSHOT: DeviceSnapshot = {
  viewportWidth: DEFAULT_VIEWPORT_WIDTH,
  viewportHeight: DEFAULT_VIEWPORT_HEIGHT,
  isMobileViewport: false,
  hasTouch: false,
  isTouchDesktop: false,
  canHover: false,
  primaryPointer: "none",
};

/**
 * Проверяет `are device snapshots equal`.
 *
 * @param left Параметр `left` в формате `DeviceSnapshot`.
 * @param right Параметр `right` в формате `DeviceSnapshot`.
 * @returns Возвращает результат `are device snapshots equal` в формате `boolean`.
 */
export const areDeviceSnapshotsEqual = (
  left: DeviceSnapshot,
  right: DeviceSnapshot,
): boolean =>
  left.viewportWidth === right.viewportWidth &&
  left.viewportHeight === right.viewportHeight &&
  left.isMobileViewport === right.isMobileViewport &&
  left.hasTouch === right.hasTouch &&
  left.isTouchDesktop === right.isTouchDesktop &&
  left.canHover === right.canHover &&
  left.primaryPointer === right.primaryPointer;

/**
 * Проверяет, изменились ли только сырые размеры viewport или семантика
 * устройства тоже поменялась. Context обновляется только по семантике.
 */
export const areDeviceTraitsEqual = (
  left: DeviceSnapshot,
  right: DeviceSnapshot,
): boolean =>
  left.isMobileViewport === right.isMobileViewport &&
  left.hasTouch === right.hasTouch &&
  left.isTouchDesktop === right.isTouchDesktop &&
  left.canHover === right.canHover &&
  left.primaryPointer === right.primaryPointer;

/**
 * Считывает `read device snapshot`.
 *
 * @param targetWindow Параметр `targetWindow` в формате `Window | null`.
 * @returns Возвращает результат `read device snapshot` в формате `DeviceSnapshot`.
 */
export const readDeviceSnapshot = (
  targetWindow?: Window | null,
): DeviceSnapshot => {
  if (!targetWindow) {
    return DEFAULT_DEVICE_SNAPSHOT;
  }

  const viewportWidth = readViewportWidth(targetWindow);
  const viewportHeight = readViewportHeight(targetWindow);
  const isMobileViewport = readIsMobileViewport(targetWindow, viewportWidth);
  const hasTouch =
    "ontouchstart" in targetWindow ||
    targetWindow.navigator.maxTouchPoints > 0 ||
    readMediaMatch(targetWindow, "(any-pointer: coarse)");
  const canHover =
    readMediaMatch(targetWindow, "(hover: hover)") ||
    readMediaMatch(targetWindow, "(any-hover: hover)");
  const primaryPointer = readPrimaryPointer(targetWindow);

  return {
    viewportWidth,
    viewportHeight,
    isMobileViewport,
    hasTouch,
    isTouchDesktop: !isMobileViewport && hasTouch,
    canHover,
    primaryPointer,
  };
};
