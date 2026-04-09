import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

/**
 * Константа `server`, используемая как server.
 */
export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  /**
   * Вызывает `cleanup` как шаг текущего сценария.
   * @returns Результат выполнения `cleanup`.
   */

  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

vi.stubGlobal("scrollTo", vi.fn());
