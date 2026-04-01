import variantStyles from "../../styles/ui/LightboxVideoPlayer.mobile.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import { LightboxVideoTimeline } from "./LightboxVideoPlayer.shared";
import type { LightboxVideoPlayerViewProps } from "./LightboxVideoPlayer.types";

export default function LightboxVideoPlayerMobileView({
  rootRef,
  mediaViewport,
  isReady,
  duration,
  currentTime,
  remainingLabel,
  progressStyle,
  onSeek,
  onControlsInteraction,
}: LightboxVideoPlayerViewProps) {
  return (
    <div
      ref={rootRef}
      className={[frameStyles.root, variantStyles.rootMobile]
        .filter(Boolean)
        .join(" ")}
      data-testid="lightbox-video-player-mobile"
    >
      {mediaViewport}

      <div
        className={[frameStyles.controls, variantStyles.controlsMobile]
          .filter(Boolean)
          .join(" ")}
        onClick={onControlsInteraction}
        onDoubleClick={onControlsInteraction}
        onPointerDown={onControlsInteraction}
        onPointerMove={onControlsInteraction}
        onPointerUp={onControlsInteraction}
        onTouchStart={onControlsInteraction}
        onTouchMove={onControlsInteraction}
        onTouchEnd={onControlsInteraction}
      >
        <LightboxVideoTimeline
          className={variantStyles.timelineMobile}
          currentTime={currentTime}
          remainingLabel={remainingLabel}
          isReady={isReady}
          duration={duration}
          progressStyle={progressStyle}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
}
