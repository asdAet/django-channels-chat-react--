export type DevicePrimaryPointer = "coarse" | "fine" | "none";

export type DeviceSnapshot = {
  viewportWidth: number;
  viewportHeight: number;
  isMobileViewport: boolean;
  hasTouch: boolean;
  isTouchDesktop: boolean;
  canHover: boolean;
  primaryPointer: DevicePrimaryPointer;
};
