import { useEffect, useState } from "react";

type Options = {
  priority?: boolean;
  root?: Element | null;
  rootMargin?: string;
};

const isScrollable = (value: string): boolean =>
  /(auto|scroll|overlay)/i.test(value);

const resolveNearestScrollRoot = (node: Element | null): Element | null => {
  let current = node?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    const hasScrollableOverflow =
      isScrollable(style.overflow) ||
      isScrollable(style.overflowY) ||
      isScrollable(style.overflowX);
    const canScroll =
      current.scrollHeight > current.clientHeight ||
      current.scrollWidth > current.clientWidth;

    if (hasScrollableOverflow && canScroll) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
};

export const useVisibilityGate = <T extends Element>(
  targetNode: T | null,
  {
    priority = false,
    root,
    rootMargin = "0px",
}: Options = {},
): {
  isVisible: boolean;
  shouldLoad: boolean;
} => {
  const eager = priority || typeof IntersectionObserver === "undefined";
  const [visibilityState, setVisibilityState] = useState({
    isVisible: false,
    shouldLoad: false,
  });

  useEffect(() => {
    if (eager || !targetNode) {
      return;
    }

    const resolvedRoot =
      root !== undefined ? root : resolveNearestScrollRoot(targetNode);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        const nextVisible = entry.isIntersecting || entry.intersectionRatio > 0;
        setVisibilityState((currentState) => {
          const nextShouldLoad = currentState.shouldLoad || nextVisible;
          if (
            currentState.isVisible === nextVisible &&
            currentState.shouldLoad === nextShouldLoad
          ) {
            return currentState;
          }

          return {
            isVisible: nextVisible,
            shouldLoad: nextShouldLoad,
          };
        });
      },
      {
        root: resolvedRoot,
        rootMargin,
      },
    );

    observer.observe(targetNode);
    return () => observer.disconnect();
  }, [eager, root, rootMargin, targetNode]);

  return {
    isVisible: eager || visibilityState.isVisible,
    shouldLoad: eager || visibilityState.shouldLoad,
  };
};
