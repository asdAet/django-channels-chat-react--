import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

/**
 * Shared MSW server for frontend unit and integration tests.
 */
export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });

  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }

  const mediaPrototype = window.HTMLMediaElement?.prototype;
  if (mediaPrototype) {
    Object.defineProperty(mediaPrototype, "pause", {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
    Object.defineProperty(mediaPrototype, "load", {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  }
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

vi.stubGlobal("scrollTo", vi.fn());
