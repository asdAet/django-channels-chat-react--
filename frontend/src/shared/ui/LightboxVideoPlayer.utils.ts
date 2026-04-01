import type { SyntheticEvent } from "react";

import type { PlaybackRateOption } from "./LightboxVideoPlayer.types";

export const PLAYBACK_RATE_OPTIONS: PlaybackRateOption[] = [
  { value: 0.5, label: "\u041c\u0435\u0434\u043b\u0435\u043d\u043d\u043e" },
  { value: 1, label: "\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e" },
  { value: 1.2, label: "\u0423\u0441\u043a\u043e\u0440\u0435\u043d\u043d\u043e" },
  { value: 1.5, label: "\u0411\u044b\u0441\u0442\u0440\u043e" },
  { value: 1.7, label: "\u041e\u0447\u0435\u043d\u044c \u0431\u044b\u0441\u0442\u0440\u043e" },
  { value: 2, label: "\u0421\u0432\u0435\u0440\u0445\u0431\u044b\u0441\u0442\u0440\u043e" },
];

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

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const stopPropagation = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
};
