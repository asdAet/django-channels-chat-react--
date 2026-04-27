import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useModalHistoryGuard } from "./useModalHistoryGuard";

describe("useModalHistoryGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState({ route: "chat" }, "", "/public");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("pushes a same-url sentinel state on mount", () => {
    renderHook(() => useModalHistoryGuard(vi.fn()));

    expect(window.location.pathname).toBe("/public");
    expect(window.history.state).toMatchObject({
      route: "chat",
      __devilModalHistoryGuard: expect.any(String),
    });
  });

  it("closes once when browser back leaves the sentinel entry", () => {
    const onClose = vi.fn();
    renderHook(() => useModalHistoryGuard(onClose));

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { route: "chat" } }));
    });
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { route: "chat" } }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("programmatic close goes through history.back while sentinel is current", () => {
    const onClose = vi.fn();
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const { result } = renderHook(() => useModalHistoryGuard(onClose));

    act(() => {
      result.current();
    });

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(181);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("falls back to direct close when current state is no longer the sentinel", () => {
    const onClose = vi.fn();
    const backSpy = vi.spyOn(window.history, "back");
    const { result } = renderHook(() => useModalHistoryGuard(onClose));

    act(() => {
      window.history.replaceState({ route: "chat" }, "", "/public");
    });
    act(() => {
      result.current();
    });

    expect(backSpy).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
