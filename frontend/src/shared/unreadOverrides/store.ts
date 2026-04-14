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

const normalizeRoomId = (roomId: string): string => roomId.trim();

/**
 * Фиксирует локально вычисленный unread-count комнаты до прихода
 * авторитативного серверного снимка.
 *
 * Store хранит и положительные значения, и явный `0`. Это позволяет сразу
 * обновлять бейдж текущего чата после прочтения, не дожидаясь отдельного
 * refetch списка комнат.
 */
export const setUnreadOverride = ({ roomId, unreadCount }: UnreadOverride) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) return;

  const normalizedCount = normalizeUnreadCount(unreadCount);
  const prev = overrides.get(normalizedRoomId);
  if (prev === normalizedCount) return;

  overrides.set(normalizedRoomId, normalizedCount);
  rebuildSnapshot();
  emit();
};

/**
 * Удаляет локальный unread-override для комнаты и возвращает отображение к
 * backend-данным.
 */
export const clearUnreadOverride = (roomId: string) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) return;
  if (!overrides.delete(normalizedRoomId)) return;
  rebuildSnapshot();
  emit();
};

/**
 * Сбрасывает optimistic unread-overrides для комнат, по которым уже пришли
 * свежие серверные данные.
 *
 * После этого UI снова начинает опираться на backend/WebSocket-снимок, а
 * временный локальный override больше не влияет на бейдж.
 */
export const clearUnreadOverridesForRooms = (roomIds: Iterable<string>) => {
  let changed = false;

  for (const roomId of roomIds) {
    const normalizedRoomId = normalizeRoomId(roomId);
    if (!normalizedRoomId) continue;
    changed = overrides.delete(normalizedRoomId) || changed;
  }

  if (!changed) return;
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
 * Подписывает React-компонент на in-memory store локальных unread-overrides.
 *
 * `useSyncExternalStore` нужен, чтобы React видел консистентный снимок даже
 * при одновременных рендерах и внешних обновлениях store.
 */
export const useUnreadOverrides = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
