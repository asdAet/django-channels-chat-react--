import { useRef } from "react";

import variantStyles from "../../styles/ui/LightboxVideoPlayer.mobile.module.css";
import mobileControlsStyles from "../../styles/ui/LightboxVideoPlayer.mobile-controls.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import sharedControlsStyles from "../../styles/ui/LightboxVideoPlayer.shared-controls.module.css";
import { LightboxDropdownMenu } from "./lightboxControls/LightboxDropdownMenu";
import { LightboxIconButton } from "./lightboxControls/LightboxIconButton";
import {
  FullscreenIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
} from "./lightboxControls/LightboxIcons";
import type { LightboxActionItem } from "./lightboxControls/types";
import { LightboxVideoTimeline } from "./LightboxVideoPlayer.shared";
import type { LightboxVideoPlayerViewProps } from "./LightboxVideoPlayer.types";
import { PLAYBACK_RATE_OPTIONS } from "./LightboxVideoPlayer.utils";

const formatRateLabel = (value: number) =>
  Number.isInteger(value) ? `${value.toFixed(0)}x` : `${value.toFixed(1)}x`;

export default function LightboxVideoPlayerMobileView({
  rootRef,
  mediaViewport,
  isReady,
  isPlaying,
  duration,
  displayTime,
  volume,
  isMuted,
  playbackRate,
  activeMenuId,
  progressStyle,
  remainingLabel,
  onTogglePlayback,
  onSeekPreview,
  onSeekCommit,
  onSeekInteractionStart,
  onSeekInteractionEnd,
  onToggleMute,
  onSetPlaybackRate,
  onToggleMenu,
  onCloseMenu,
  onRequestFullscreen,
  onControlsInteraction,
  onSurfaceInteraction,
}: LightboxVideoPlayerViewProps) {
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const isRateMenuOpen = activeMenuId === "speed";
  const speedMenuItems: LightboxActionItem[] = PLAYBACK_RATE_OPTIONS.map(
    (option) => ({
      key: `mobile-rate-${option.value}`,
      label: formatRateLabel(option.value),
      description: option.label,
      icon:
        playbackRate === option.value ? (
          <PauseIcon layout="mobile" />
        ) : (
          <PlayIcon layout="mobile" />
        ),
      active: playbackRate === option.value,
      onSelect: () => {
        onSetPlaybackRate(option.value);
      },
    }),
  );

  return (
    <div
      ref={rootRef}
      className={[frameStyles.root, variantStyles.rootMobile]
        .filter(Boolean)
        .join(" ")}
      data-testid="lightbox-video-player-mobile"
      onPointerMove={onSurfaceInteraction}
      onPointerDown={onSurfaceInteraction}
      onTouchStart={onSurfaceInteraction}
      onFocusCapture={onSurfaceInteraction}
    >
      {mediaViewport}

      {!isPlaying && isReady ? (
        <div className={sharedControlsStyles.centerPlayOverlay}>
          <LightboxIconButton
            layout="mobile"
            label="Воспроизвести"
            icon={<PlayIcon layout="mobile" />}
            className={sharedControlsStyles.centerPlayButton}
            onClick={onTogglePlayback}
          />
        </div>
      ) : null}

      <div
        className={[variantStyles.controlsMobile].filter(Boolean).join(" ")}
        onClick={onControlsInteraction}
        onDoubleClick={onControlsInteraction}
        onPointerDown={onControlsInteraction}
        onPointerMove={onControlsInteraction}
        onPointerUp={onControlsInteraction}
        onTouchStart={onControlsInteraction}
        onTouchMove={onControlsInteraction}
        onTouchEnd={onControlsInteraction}
      >
        <div className={mobileControlsStyles.mobileDock}>
          <LightboxVideoTimeline
            className={mobileControlsStyles.progressRow}
            displayTime={displayTime}
            remainingLabel={remainingLabel}
            isReady={isReady}
            duration={duration}
            progressStyle={progressStyle}
            onSeekPreview={onSeekPreview}
            onSeekCommit={onSeekCommit}
            onSeekInteractionStart={onSeekInteractionStart}
            onSeekInteractionEnd={onSeekInteractionEnd}
          />

          <div className={mobileControlsStyles.mobileActionRow}>
            <LightboxIconButton
              layout="mobile"
              label={isPlaying ? "Пауза" : "Воспроизвести"}
              icon={
                isPlaying ? (
                  <PauseIcon layout="mobile" />
                ) : (
                  <PlayIcon layout="mobile" />
                )
              }
              className={mobileControlsStyles.transportButton}
              onClick={onTogglePlayback}
            />
            <LightboxIconButton
              layout="mobile"
              label={
                isMuted || volume === 0
                  ? "Включить звук"
                  : "Выключить звук"
              }
              icon={
                <VolumeIcon muted={isMuted || volume === 0} layout="mobile" />
              }
              onClick={onToggleMute}
            />
            <div ref={menuWrapRef} className={mobileControlsStyles.menuWrap}>
              <button
                type="button"
                className={[
                  mobileControlsStyles.speedButton,
                  isRateMenuOpen ? mobileControlsStyles.speedButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label="Скорость воспроизведения"
                aria-expanded={isRateMenuOpen}
                onClick={() => {
                  onToggleMenu("speed");
                }}
              >
                {formatRateLabel(playbackRate)}
              </button>
              {isRateMenuOpen ? (
                <LightboxDropdownMenu
                  anchorRef={menuWrapRef}
                  layout="mobile"
                  items={speedMenuItems}
                  onClose={onCloseMenu}
                />
              ) : null}
            </div>
            <LightboxIconButton
              layout="mobile"
              label="Полный экран"
              icon={<FullscreenIcon layout="mobile" />}
              onClick={onRequestFullscreen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
