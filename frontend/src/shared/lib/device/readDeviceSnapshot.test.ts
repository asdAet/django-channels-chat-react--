import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readDeviceSnapshot } from "./readDeviceSnapshot";

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
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        (query.includes("pointer: coarse") ||
          query.includes("any-pointer: coarse")) &&
        coarsePointer
          ? true
          : (query.includes("pointer: fine") && !coarsePointer) ||
              ((query.includes("hover: hover") ||
                query.includes("any-hover: hover")) &&
                canHover),
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
