type DeviceEnvironment = {
  viewportWidth: number;
  viewportHeight: number;
  coarsePointer: boolean;
  canHover: boolean;
  maxTouchPoints: number;
};

const DEFAULT_DEVICE_ENVIRONMENT: DeviceEnvironment = {
  viewportWidth: 1280,
  viewportHeight: 720,
  coarsePointer: false,
  canHover: true,
  maxTouchPoints: 0,
};

const originalVisualViewportDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "visualViewport",
);
const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "matchMedia",
);
const originalMaxTouchPointsDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  "maxTouchPoints",
);
const originalTouchStartDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "ontouchstart",
);

let currentEnvironment = { ...DEFAULT_DEVICE_ENVIRONMENT };
const mediaQueryListeners = new Map<
  string,
  Set<EventListenerOrEventListenerObject>
>();

const parseWidthQuery = (
  query: string,
  feature: "max-width" | "min-width",
): number | null => {
  const match = new RegExp(`${feature}\\s*:\\s*(\\d+)px`, "i").exec(query);
  return match ? Number(match[1]) : null;
};

const matchesMediaQuery = (query: string): boolean => {
  const maxWidth = parseWidthQuery(query, "max-width");
  if (maxWidth !== null && currentEnvironment.viewportWidth > maxWidth) {
    return false;
  }

  const minWidth = parseWidthQuery(query, "min-width");
  if (minWidth !== null && currentEnvironment.viewportWidth < minWidth) {
    return false;
  }

  if (
    query.includes("pointer: coarse") ||
    query.includes("any-pointer: coarse")
  ) {
    return currentEnvironment.coarsePointer;
  }

  if (query.includes("pointer: fine")) {
    return !currentEnvironment.coarsePointer;
  }

  if (query.includes("hover: hover") || query.includes("any-hover: hover")) {
    return currentEnvironment.canHover;
  }

  return true;
};

const notifyMediaQueryListener = (
  listener: EventListenerOrEventListenerObject,
  event: MediaQueryListEvent,
) => {
  if (typeof listener === "function") {
    listener(event);
    return;
  }

  listener.handleEvent(event);
};

const createMediaQueryList = (query: string): MediaQueryList =>
  ({
    media: query,
    matches: matchesMediaQuery(query),
    onchange: null,
    addEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject | null,
    ) => {
      if (eventName !== "change" || !listener) return;

      const listeners = mediaQueryListeners.get(query) ?? new Set();
      listeners.add(listener);
      mediaQueryListeners.set(query, listeners);
    },
    removeEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject | null,
    ) => {
      if (eventName !== "change" || !listener) return;

      mediaQueryListeners.get(query)?.delete(listener);
    },
    dispatchEvent: () => true,
  }) as unknown as MediaQueryList;

const applyDeviceEnvironment = () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: currentEnvironment.viewportWidth,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: currentEnvironment.viewportHeight,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: {
      width: currentEnvironment.viewportWidth,
      height: currentEnvironment.viewportHeight,
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
  Object.defineProperty(window.navigator, "maxTouchPoints", {
    configurable: true,
    value: currentEnvironment.maxTouchPoints,
  });

  if (currentEnvironment.maxTouchPoints > 0) {
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: () => {},
    });
  } else {
    Reflect.deleteProperty(window, "ontouchstart");
  }

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => createMediaQueryList(query),
  });
};

export const installDeviceEnvironment = (
  environment: Partial<DeviceEnvironment>,
) => {
  currentEnvironment = {
    ...DEFAULT_DEVICE_ENVIRONMENT,
    ...environment,
  };
  applyDeviceEnvironment();
};

export const updateDeviceEnvironment = (
  environment: Partial<DeviceEnvironment>,
) => {
  currentEnvironment = {
    ...currentEnvironment,
    ...environment,
  };
  applyDeviceEnvironment();
};

export const dispatchDeviceMediaChanges = () => {
  for (const [query, listeners] of mediaQueryListeners) {
    const event = {
      media: query,
      matches: matchesMediaQuery(query),
    } as MediaQueryListEvent;

    for (const listener of listeners) {
      notifyMediaQueryListener(listener, event);
    }
  }
};

export const resetDeviceEnvironment = () => {
  currentEnvironment = { ...DEFAULT_DEVICE_ENVIRONMENT };
  mediaQueryListeners.clear();

  if (originalVisualViewportDescriptor) {
    Object.defineProperty(
      window,
      "visualViewport",
      originalVisualViewportDescriptor,
    );
  } else {
    Reflect.deleteProperty(window, "visualViewport");
  }

  if (originalMatchMediaDescriptor) {
    Object.defineProperty(window, "matchMedia", originalMatchMediaDescriptor);
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }

  if (originalMaxTouchPointsDescriptor) {
    Object.defineProperty(
      window.navigator,
      "maxTouchPoints",
      originalMaxTouchPointsDescriptor,
    );
  } else {
    Reflect.deleteProperty(window.navigator, "maxTouchPoints");
  }

  if (originalTouchStartDescriptor) {
    Object.defineProperty(window, "ontouchstart", originalTouchStartDescriptor);
  } else {
    Reflect.deleteProperty(window, "ontouchstart");
  }
};
