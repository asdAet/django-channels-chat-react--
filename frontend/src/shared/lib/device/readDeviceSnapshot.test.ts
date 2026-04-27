import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { areDeviceTraitsEqual, readDeviceSnapshot } from "./readDeviceSnapshot";
import type { DeviceSnapshot } from "./types";

const createDeviceSnapshot = (
  overrides: Partial<DeviceSnapshot> = {},
): DeviceSnapshot => ({
  viewportWidth: 1280,
  viewportHeight: 720,
  isMobileViewport: false,
  hasTouch: false,
  isTouchDesktop: false,
  canHover: true,
  primaryPointer: "fine",
  ...overrides,
});

const installDeviceEnvironment = ({
  viewportWidth,
  viewportHeight = 720,
  coarsePointer,
  canHover,
  maxTouchPoints,
}: {
  viewportWidth: number;
  viewportHeight?: number;
  coarsePointer: boolean;
  canHover: boolean;
  maxTouchPoints: number;
}) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: viewportWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: viewportHeight,
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
  if (maxTouchPoints > 0) {
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: vi.fn(),
    });
  } else {
    Reflect.deleteProperty(window, "ontouchstart");
  }

  const matchesMediaQuery = (query: string) => {
    if (query.includes("max-width")) {
      return viewportWidth <= 768;
    }

    if (
      query.includes("pointer: coarse") ||
      query.includes("any-pointer: coarse")
    ) {
      return coarsePointer;
    }

    return (
      (query.includes("pointer: fine") && !coarsePointer) ||
      ((query.includes("hover: hover") ||
        query.includes("any-hover: hover")) &&
        canHover)
    );
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matchesMediaQuery(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe("readDeviceSnapshot", () => {
  beforeEach(() => {
    installDeviceEnvironment({
      viewportWidth: 1280,
      coarsePointer: false,
      canHover: true,
      maxTouchPoints: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects a mobile phone viewport as mobile", () => {
    installDeviceEnvironment({
      viewportWidth: 390,
      coarsePointer: true,
      canHover: false,
      maxTouchPoints: 5,
    });

    expect(readDeviceSnapshot(window)).toMatchObject({
      viewportWidth: 390,
      isMobileViewport: true,
      hasTouch: true,
      isTouchDesktop: false,
      canHover: false,
      primaryPointer: "coarse",
    });
  });

  it("detects a desktop mouse environment as desktop", () => {
    installDeviceEnvironment({
      viewportWidth: 1440,
      coarsePointer: false,
      canHover: true,
      maxTouchPoints: 0,
    });

    expect(readDeviceSnapshot(window)).toMatchObject({
      viewportWidth: 1440,
      isMobileViewport: false,
      hasTouch: false,
      isTouchDesktop: false,
      canHover: true,
      primaryPointer: "fine",
    });
  });

  it("keeps a wide touch-enabled desktop in desktop layout", () => {
    installDeviceEnvironment({
      viewportWidth: 1440,
      coarsePointer: true,
      canHover: true,
      maxTouchPoints: 5,
    });

    expect(readDeviceSnapshot(window)).toMatchObject({
      viewportWidth: 1440,
      isMobileViewport: false,
      hasTouch: true,
      isTouchDesktop: true,
      canHover: true,
      primaryPointer: "coarse",
    });
  });
});

describe("areDeviceTraitsEqual", () => {
  it("ignores raw viewport size changes inside the same device mode", () => {
    const desktopSnapshot = createDeviceSnapshot({
      viewportWidth: 1440,
      viewportHeight: 900,
    });
    const resizedDesktopSnapshot = createDeviceSnapshot({
      viewportWidth: 1024,
      viewportHeight: 768,
    });

    expect(areDeviceTraitsEqual(desktopSnapshot, resizedDesktopSnapshot)).toBe(
      true,
    );
  });

  it("detects a semantic device mode change", () => {
    const desktopSnapshot = createDeviceSnapshot();
    const mobileSnapshot = createDeviceSnapshot({
      viewportWidth: 390,
      viewportHeight: 844,
      isMobileViewport: true,
      hasTouch: true,
      canHover: false,
      primaryPointer: "coarse",
    });

    expect(areDeviceTraitsEqual(desktopSnapshot, mobileSnapshot)).toBe(false);
  });
});
