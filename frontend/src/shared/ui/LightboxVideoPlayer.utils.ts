import type { SyntheticEvent } from "react";

import type { PlaybackRateOption } from "./LightboxVideoPlayer.types";

/**
 * Константа `PLAYBACK_RATE_OPTIONS`, используемая как playback rate options.
 */
export const PLAYBACK_RATE_OPTIONS: PlaybackRateOption[] = [
  { value: 0.5, label: "Медленно" },
  { value: 1, label: "По умолчанию" },
  { value: 1.2, label: "Ускоренно" },
  { value: 1.5, label: "Быстро" },
  { value: 1.7, label: "Очень быстро" },
  { value: 2, label: "Сверхбыстро" },
];

/**
 * Форматирует `format time`.
 *
 * @param value Параметр `value` в формате `number`.
 * @returns Возвращает результат `format time` в формате `string`.
 */
export const formatTime = (value: number): string => {
  const totalSeconds = Math.max(0, Math.floor(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/**
 * Ограничивает `clamp number`.
 *
 * @param value Параметр `value` в формате `number`.
 * @param min Параметр `min` в формате `number`.
 * @param max Параметр `max` в формате `number`.
 */
export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Функция `stopPropagation`.
 *
 * @param event Параметр `event` в формате `SyntheticEvent<HTMLElement>`.
 */
export const stopPropagation = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
};
