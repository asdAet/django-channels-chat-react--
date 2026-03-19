import { useSyncExternalStore } from "react";

/**
 * Описывает структуру данных `UnreadOverride`.
 */
export type UnreadOverride = {
  roomSlug: string;
  unreadCount: number;
};

/**
 * Описывает структуру данных `Listener`.
 */
type Listener = () => void;

const overrides = new Map<string, number>();
const listeners = new Set<Listener>();
let snapshot: Record<string, number> = {};

/**
 * Обрабатывает emit.
 */
const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

/**
 * Обрабатывает rebuild snapshot.
 */
const rebuildSnapshot = () => {
  snapshot = Object.fromEntries(overrides.entries()) as Record<string, number>;
};

/**
 * Нормализует unread count.
 * @param value Входное значение для преобразования.
 */
const normalizeUnreadCount = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

/**
 * Устанавливает unread override.
 *
 * @returns Ничего не возвращает.
 */

export const setUnreadOverride = ({
  roomSlug,
  unreadCount,
}: UnreadOverride) => {
  const slug = roomSlug.trim();
  if (!slug) return;

  const normalizedCount = normalizeUnreadCount(unreadCount);
  const prev = overrides.get(slug) ?? 0;
  if (normalizedCount === 0) {
    if (!overrides.has(slug)) return;
    overrides.delete(slug);
    rebuildSnapshot();
    emit();
    return;
  }
  if (prev === normalizedCount) return;

  overrides.set(slug, normalizedCount);
  rebuildSnapshot();
  emit();
};

/**
 * Выполняет unread override.
 *
 * @param roomSlug Slug комнаты.
 *
 * @returns Ничего не возвращает.
 */

export const clearUnreadOverride = (roomSlug: string) => {
  const slug = roomSlug.trim();
  if (!slug) return;
  if (!overrides.delete(slug)) return;
  rebuildSnapshot();
  emit();
};

/**
 * Обрабатывает reset unread overrides.
 */

export const resetUnreadOverrides = () => {
  if (overrides.size === 0) return;
  overrides.clear();
  rebuildSnapshot();
  emit();
};

/**
 * Возвращает snapshot.
 */
const getSnapshot = () => snapshot;

/**
 * Обрабатывает subscribe.
 * @param listener Функция-подписчик на изменения.
 */
const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Хук useUnreadOverrides управляет состоянием и побочными эффектами текущего сценария.
 */

export const useUnreadOverrides = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
