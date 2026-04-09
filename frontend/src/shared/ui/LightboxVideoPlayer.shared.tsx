import type { CSSProperties } from "react";

import rangeStyles from "../../styles/ui/LightboxVideoPlayer.range.module.css";
import timelineStyles from "../../styles/ui/LightboxVideoPlayer.timeline.module.css";
import { formatTime } from "./LightboxVideoPlayer.utils";

/**
 * Свойства таймлайна, через который пользователь перематывает видео.
 *
 * @property displayTime Текущее время воспроизведения, показываемое слева.
 * @property remainingLabel Уже подготовленная строка оставшегося времени без минуса.
 * @property isReady Признак, что видео готово и таймлайн можно активировать.
 * @property duration Полная длительность видео в секундах.
 * @property progressStyle Инлайн-стили для визуализации заполнения range.
 * @property onSeekPreview Вызывается при перемещении ползунка до фиксации новой позиции.
 * @property onSeekCommit Вызывается после подтверждения новой позиции.
 * @property onSeekInteractionStart Сообщает родителю о начале перемотки.
 * @property onSeekInteractionEnd Сообщает родителю о завершении перемотки.
 * @property className Дополнительный CSS-класс для встраивания таймлайна в разные layouts.
 */
type LightboxVideoTimelineProps = {
  displayTime: number;
  remainingLabel: string;
  isReady: boolean;
  duration: number;
  progressStyle: CSSProperties;
  onSeekPreview: (nextValue: number) => void;
  onSeekCommit: (nextValue: number) => void;
  onSeekInteractionStart: () => void;
  onSeekInteractionEnd: () => void;
  className?: string;
};

/**
 * Отрисовывает таймлайн видеоплеера с текущим временем и range-контролом.
 *
 * Компонент сам не хранит состояние перемотки: он только отображает переданные
 * значения и прокидывает наружу события preview/commit для синхронизации
 * с родительским контроллером плеера.
 */
export function LightboxVideoTimeline({
  displayTime,
  remainingLabel,
  isReady,
  duration,
  progressStyle,
  onSeekPreview,
  onSeekCommit,
  onSeekInteractionStart,
  onSeekInteractionEnd,
  className,
}: LightboxVideoTimelineProps) {
  return (
    <div
      className={[timelineStyles.timeline, className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={timelineStyles.timeLabel}>{formatTime(displayTime)}</span>
      <input
        type="range"
        className={[rangeStyles.range, timelineStyles.progressRange].join(" ")}
        min={0}
        max={duration > 0 ? duration : 0}
        step={0.1}
        value={duration > 0 ? Math.min(displayTime, duration) : 0}
        style={progressStyle}
        aria-label="Позиция видео"
        disabled={!isReady || duration <= 0}
        onFocus={onSeekInteractionStart}
        onBlur={onSeekInteractionEnd}
        onPointerDown={onSeekInteractionStart}
        onPointerUp={onSeekInteractionEnd}
        onPointerCancel={onSeekInteractionEnd}
        onInput={(event) => {
          onSeekPreview(Number(event.currentTarget.value));
        }}
        onChange={(event) => {
          onSeekCommit(Number(event.currentTarget.value));
        }}
      />
      <span className={timelineStyles.timeLabel}>-{remainingLabel}</span>
    </div>
  );
}
