import { act, render, screen, waitFor } from "@testing-library/react";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVisibilityGate } from "./useVisibilityGate";

class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[] = [];
  readonly observedTargets = new Set<Element>();

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "0px";
    mockIntersectionObservers.push(this);
  }

  disconnect = vi.fn(() => {
    this.observedTargets.clear();
  });

  observe = vi.fn((target: Element) => {
    this.observedTargets.add(target);
  });

  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  unobserve = vi.fn((target: Element) => {
    this.observedTargets.delete(target);
  });

  trigger(isIntersecting: boolean) {
    const target = [...this.observedTargets][0];
    if (!target) {
      return;
    }

    this.callback(
      [
        {
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting,
          rootBounds: null,
          target,
          time: performance.now(),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

const mockIntersectionObservers: MockIntersectionObserver[] = [];
const originalIntersectionObserver = globalThis.IntersectionObserver;

function VisibilityGateHarness({ showTarget }: { showTarget: boolean }) {
  const [targetNode, setTargetNode] = useState<HTMLSpanElement | null>(null);
  const bindTargetNode = useCallback((node: HTMLSpanElement | null) => {
    setTargetNode(node);
  }, []);
  const { isVisible, shouldLoad } = useVisibilityGate(targetNode);

  return (
    <div
      data-testid="gate-state"
      data-visible={String(isVisible)}
      data-should-load={String(shouldLoad)}
    >
      {showTarget ? <span data-testid="target" ref={bindTargetNode} /> : null}
    </div>
  );
}

describe("useVisibilityGate", () => {
  beforeEach(() => {
    mockIntersectionObservers.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.stubGlobal("IntersectionObserver", originalIntersectionObserver);
  });

  it("observes a target that appears after the initial render", async () => {
    const { rerender } = render(<VisibilityGateHarness showTarget={false} />);

    expect(screen.getByTestId("gate-state")).toHaveAttribute(
      "data-visible",
      "false",
    );

    rerender(<VisibilityGateHarness showTarget />);

    await screen.findByTestId("target");
    await waitFor(() => expect(mockIntersectionObservers).toHaveLength(1));

    act(() => {
      mockIntersectionObservers[0]?.trigger(true);
    });

    expect(screen.getByTestId("gate-state")).toHaveAttribute(
      "data-visible",
      "true",
    );
    expect(screen.getByTestId("gate-state")).toHaveAttribute(
      "data-should-load",
      "true",
    );
  });
});
