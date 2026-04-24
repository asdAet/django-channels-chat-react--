import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeviceContext } from "../lib/device/device-context";
import type { DeviceSnapshot } from "../lib/device/types";
import { SiteVisitTelemetry } from "./SiteVisitTelemetry";

const snapshot: DeviceSnapshot = {
  viewportWidth: 393,
  viewportHeight: 852,
  isMobileViewport: true,
  hasTouch: true,
  isTouchDesktop: false,
  canHover: false,
  primaryPointer: "coarse",
};

describe("SiteVisitTelemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    document.title = "Visitors";
    window.history.replaceState({}, "", "/groups?tab=public");
    vi.unstubAllGlobals();
  });

  it("sends one visit event with persistent visitor id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);

    const { rerender } = render(
      <DeviceContext.Provider value={snapshot}>
        <SiteVisitTelemetry />
      </DeviceContext.Provider>,
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchSpy.mock.calls[0] as [
      string,
      RequestInit & { body?: string },
    ];
    expect(url).toBe("/api/meta/visit/");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.credentials).toBe("include");

    const payload = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(payload.pagePath).toBe("/groups?tab=public");
    expect(payload.isMobileViewport).toBe(true);
    expect(payload.hasTouch).toBe(true);
    expect(payload.primaryPointer).toBe("coarse");

    const storedVisitorId = localStorage.getItem("devils-resting.visitor-id");
    expect(payload.visitorId).toBe(storedVisitorId);
    expect(typeof storedVisitorId).toBe("string");
    expect((storedVisitorId || "").length).toBeGreaterThan(8);

    rerender(
      <DeviceContext.Provider value={snapshot}>
        <SiteVisitTelemetry />
      </DeviceContext.Provider>,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
