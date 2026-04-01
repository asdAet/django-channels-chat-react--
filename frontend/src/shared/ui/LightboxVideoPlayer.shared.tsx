import type { CSSProperties } from "react";

import rangeStyles from "../../styles/ui/LightboxVideoPlayer.range.module.css";
import timelineStyles from "../../styles/ui/LightboxVideoPlayer.timeline.module.css";
import { formatTime } from "./LightboxVideoPlayer.utils";

type LightboxVideoTimelineProps = {
  currentTime: number;
  remainingLabel: string;
  isReady: boolean;
  duration: number;
  progressStyle: CSSProperties;
  onSeek: (nextValue: number) => void;
  className?: string;
};

export function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5zM18 9l-4 6M14 9l4 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 9h4l5-4v14l-5-4H5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M17 9.5a4.5 4.5 0 0 1 0 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M19.5 7a8 8 0 0 1 0 10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5l9 6.5-9 6.5z" fill="currentColor" />
    </svg>
  );
}

export function PictureInPictureIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4"
        y="5"
        width="16"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="12.5" y="10" width="5.5" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 1 0 12 8.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19 12l1.6-1.2-1.5-2.6-2 .4a7 7 0 0 0-1.2-.7L15.4 5h-3l-.5 1.9a7 7 0 0 0-1.2.7l-2-.4-1.5 2.6L8 12l-1.6 1.2 1.5 2.6 2-.4c.4.3.8.5 1.2.7l.5 1.9h3l.5-1.9c.4-.2.8-.4 1.2-.7l2 .4 1.5-2.6z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function LightboxVideoTimeline({
  currentTime,
  remainingLabel,
  isReady,
  duration,
  progressStyle,
  onSeek,
  className,
}: LightboxVideoTimelineProps) {
  return (
    <div className={[timelineStyles.timeline, className ?? ""].filter(Boolean).join(" ")}>
      <span className={timelineStyles.timeLabel}>{formatTime(currentTime)}</span>
      <input
        type="range"
        className={[rangeStyles.range, timelineStyles.progressRange].join(" ")}
        min={0}
        max={duration > 0 ? duration : 0}
        step={0.1}
        value={duration > 0 ? Math.min(currentTime, duration) : 0}
        style={progressStyle}
        aria-label="\u041f\u043e\u0437\u0438\u0446\u0438\u044f \u0432\u0438\u0434\u0435\u043e"
        disabled={!isReady || duration <= 0}
        onChange={(event) => {
          onSeek(Number(event.currentTarget.value));
        }}
      />
      <span className={timelineStyles.timeLabel}>-{remainingLabel}</span>
    </div>
  );
}
