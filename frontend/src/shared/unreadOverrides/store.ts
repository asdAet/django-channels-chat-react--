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

/**
 * Устанавливает локальный override unread-count для конкретной комнаты.
 *
 * Используется, когда UI уже знает новое число непрочитанных сообщений раньше,
 * чем его подтвердит backend или WebSocket-ack.
 */
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

/**
 * Удаляет локальный unread-override для комнаты и возвращает отображение к backend-данным.
 */
export const clearUnreadOverride = (roomId: string) => {
  const normalizedRoomId = roomId.trim();
  if (!normalizedRoomId) return;
  if (!overrides.delete(normalizedRoomId)) return;
  rebuildSnapshot();
  emit();
};

/**
 * Полностью очищает все локальные unread-overrides.
 */
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

/**
 * Подписывает компонент на снапшот локальных unread-overrides.
 *
 * Хук построен на `useSyncExternalStore`, чтобы React корректно синхронизировал
 * состояние unread badge с внешним in-memory store.
 */
export const useUnreadOverrides = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
