import { useSyncExternalStore } from "react";

export type UnreadOverride = {
  roomId: string;
  unreadCount: number;
};

type Listener = () => void;

const overrides = new Map<string, number>();
const listeners = new Set<Listener>();
let snapshot: Record<string, number> = {};

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const rebuildSnapshot = () => {
  snapshot = Object.fromEntries(overrides.entries()) as Record<string, number>;
};

const normalizeUnreadCount = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

export const setUnreadOverride = ({ roomId, unreadCount }: UnreadOverride) => {
  const normalizedRoomId = roomId.trim();
  if (!normalizedRoomId) return;

  const normalizedCount = normalizeUnreadCount(unreadCount);
  const prev = overrides.get(normalizedRoomId) ?? 0;
  if (normalizedCount === 0) {
    if (!overrides.has(normalizedRoomId)) return;
    overrides.delete(normalizedRoomId);
    rebuildSnapshot();
    emit();
    return;
  }
  if (prev === normalizedCount) return;

  overrides.set(normalizedRoomId, normalizedCount);
  rebuildSnapshot();
  emit();
};

export const clearUnreadOverride = (roomId: string) => {
  const normalizedRoomId = roomId.trim();
  if (!normalizedRoomId) return;
  if (!overrides.delete(normalizedRoomId)) return;
  rebuildSnapshot();
  emit();
};

export const resetUnreadOverrides = () => {
  if (overrides.size === 0) return;
  overrides.clear();
  rebuildSnapshot();
  emit();
};

const getSnapshot = () => snapshot;

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useUnreadOverrides = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
