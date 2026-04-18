import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGuardedModalState } from "./useGuardedModalState";

describe("useGuardedModalState", () => {
  it("accepts only the first open intent until the modal is cleared", () => {
    const { result } = renderHook(() => useGuardedModalState<number>());

    let firstAccepted = false;
    let secondAccepted = false;

    act(() => {
      firstAccepted = result.current.requestOpen(11);
      secondAccepted = result.current.requestOpen(22);
    });

    expect(firstAccepted).toBe(true);
    expect(secondAccepted).toBe(false);
    expect(result.current.activeValue).toBe(11);
  });

  it("allows the next open intent after the modal is closed", () => {
    const { result } = renderHook(() => useGuardedModalState<number>());

    act(() => {
      result.current.requestOpen(11);
    });
    expect(result.current.activeValue).toBe(11);

    act(() => {
      result.current.clear();
    });
    expect(result.current.activeValue).toBeNull();

    let accepted = false;
    act(() => {
      accepted = result.current.requestOpen(22);
    });

    expect(accepted).toBe(true);
    expect(result.current.activeValue).toBe(22);
  });

  it("relocks the guard when the active value is restored explicitly", () => {
    const { result } = renderHook(() => useGuardedModalState<number>());

    act(() => {
      result.current.setActiveValue(55);
    });
    expect(result.current.activeValue).toBe(55);

    let accepted = false;
    act(() => {
      accepted = result.current.requestOpen(66);
    });

    expect(accepted).toBe(false);
    expect(result.current.activeValue).toBe(55);
  });
});
