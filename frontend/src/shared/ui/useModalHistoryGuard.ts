import { useCallback, useEffect, useRef } from "react";

const MODAL_HISTORY_GUARD_KEY = "__devilModalHistoryGuard";
const CLOSE_FALLBACK_TIMEOUT_MS = 180;

let guardSequence = 0;

type GuardedHistoryState = Record<string, unknown> & {
  [MODAL_HISTORY_GUARD_KEY]?: string;
};

const canUseHistoryGuard = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.history?.pushState === "function" &&
  typeof window.history?.back === "function";

const readHistoryState = (): GuardedHistoryState | null => {
  const state = window.history.state;
  return state && typeof state === "object"
    ? (state as GuardedHistoryState)
    : null;
};

const isCurrentGuardState = (guardId: string): boolean =>
  readHistoryState()?.[MODAL_HISTORY_GUARD_KEY] === guardId;

const buildGuardState = (guardId: string): GuardedHistoryState => ({
  ...(readHistoryState() ?? {}),
  [MODAL_HISTORY_GUARD_KEY]: guardId,
});

const stripGuardState = (guardId: string): void => {
  const state = readHistoryState();
  if (state?.[MODAL_HISTORY_GUARD_KEY] !== guardId) {
    return;
  }

  const { [MODAL_HISTORY_GUARD_KEY]: _guard, ...nextState } = state;
  window.history.replaceState(nextState, "", window.location.href);
};

/**
 * Adds one same-URL history entry while a modal is mounted, so browser Back
 * closes the modal before the app route can change.
 */
export function useModalHistoryGuard(onClose: () => void): () => void {
  const guardIdRef = useRef<string | null>(null);
  const activeRef = useRef(false);
  const closedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current === null) {
      return;
    }

    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }, []);

  const closeOnce = useCallback(() => {
    if (closedRef.current) {
      return;
    }

    closedRef.current = true;
    activeRef.current = false;
    clearFallbackTimer();
    onCloseRef.current();
  }, [clearFallbackTimer]);

  useEffect(() => {
    if (!canUseHistoryGuard()) {
      return undefined;
    }

    const guardId = `modal-${Date.now()}-${++guardSequence}`;
    guardIdRef.current = guardId;

    try {
      window.history.pushState(buildGuardState(guardId), "", window.location.href);
      activeRef.current = true;
    } catch {
      activeRef.current = false;
      return undefined;
    }

    const handlePopState = () => {
      if (!activeRef.current) {
        return;
      }

      closeOnce();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearFallbackTimer();

      if (activeRef.current && guardIdRef.current) {
        stripGuardState(guardIdRef.current);
      }

      activeRef.current = false;
    };
  }, [clearFallbackTimer, closeOnce]);

  return useCallback(() => {
    const guardId = guardIdRef.current;
    if (!activeRef.current || !guardId || !canUseHistoryGuard()) {
      closeOnce();
      return;
    }

    if (!isCurrentGuardState(guardId)) {
      closeOnce();
      return;
    }

    try {
      window.history.back();
    } catch {
      closeOnce();
      return;
    }

    clearFallbackTimer();
    fallbackTimerRef.current = window.setTimeout(() => {
      stripGuardState(guardId);
      closeOnce();
    }, CLOSE_FALLBACK_TIMEOUT_MS);
  }, [clearFallbackTimer, closeOnce]);
}
