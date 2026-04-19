import { useLayoutEffect, useRef } from "react";

import variantStyles from "../../styles/ui/LightboxVideoPlayer.desktop.module.css";
import desktopControlsStyles from "../../styles/ui/LightboxVideoPlayer.desktop-controls.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import rangeStyles from "../../styles/ui/LightboxVideoPlayer.range.module.css";
import sharedControlsStyles from "../../styles/ui/LightboxVideoPlayer.shared-controls.module.css";
import { LightboxDropdownMenu } from "./lightboxControls/LightboxDropdownMenu";
import { LightboxIconButton } from "./lightboxControls/LightboxIconButton";
import {
  FullscreenIcon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  VolumeIcon,
} from "./lightboxControls/LightboxIcons";
import type { LightboxActionItem } from "./lightboxControls/types";
import { LightboxVideoTimeline } from "./LightboxVideoPlayer.shared";
import type { LightboxVideoPlayerViewProps } from "./LightboxVideoPlayer.types";
import { PLAYBACK_RATE_OPTIONS } from "./LightboxVideoPlayer.utils";

const formatRateLabel = (value: number) =>
  Number.isInteger(value) ? `${value.toFixed(0)}x` : `${value.toFixed(1)}x`;

/**
 * Функция `LightboxVideoPlayerDesktopView`.
 */
export default function LightboxVideoPlayerDesktopView({
  rootRef,
  mediaViewport,
  isReady,
  isPlaying,
  isControlsVisible,
  duration,
  displayTime,
  volume,
  isMuted,
  playbackRate,
  activeMenuId,
  canUsePictureInPicture,
  isInPictureInPicture,
  progressStyle,
  volumeStyle,
  remainingLabel,
  onTogglePlayback,
  onSeekPreview,
  onSeekCommit,
  onSeekInteractionStart,
  onSeekInteractionEnd,
  onVolumeChange,
  onToggleMute,
  onSetPlaybackRate,
  onToggleMenu,
  onCloseMenu,
  onTogglePictureInPicture,
  onRequestFullscreen,
  onControlsInteraction,
  onSurfaceInteraction,
  onViewReady,
}: LightboxVideoPlayerViewProps) {
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const isRateMenuOpen = activeMenuId === "speed";
  const speedMenuItems: LightboxActionItem[] = PLAYBACK_RATE_OPTIONS.map(
    (option) => ({
      key: `rate-${option.value}`,
      label: formatRateLabel(option.value),
      description: option.label,
      icon:
        playbackRate === option.value ? (
          <PauseIcon />
        ) : (
          <PlayIcon layout="desktop" />
        ),
      active: playbackRate === option.value,
      onSelect: () => {
        onSetPlaybackRate(option.value);
      },
      }),
  );

  useLayoutEffect(() => {
    onViewReady();
  }, [onViewReady]);

  return (
    <div
      ref={rootRef}
      className={[frameStyles.root, variantStyles.rootDesktop]
        .filter(Boolean)
        .join(" ")}
      data-testid="lightbox-video-player-desktop"
      onPointerMove={onSurfaceInteraction}
      onPointerDown={onSurfaceInteraction}
      onTouchStart={onSurfaceInteraction}
      onFocusCapture={onSurfaceInteraction}
    >
      {mediaViewport}

      {!isPlaying && isReady ? (
        <div className={sharedControlsStyles.centerPlayOverlay}>
          <LightboxIconButton
            layout="desktop"
            label="Воспроизвести"
            suppressAriaLabel
            icon={<PlayIcon />}
            className={sharedControlsStyles.centerPlayButton}
            onClick={onTogglePlayback}
          />
        </div>
      ) : null}

      <div
        className={[
          variantStyles.controlsDesktop,
          isControlsVisible ? "" : variantStyles.controlsDesktopHidden,
        ]
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
        <div className={desktopControlsStyles.desktopDock}>
          <LightboxVideoTimeline
            className={desktopControlsStyles.progressRow}
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

          <div className={desktopControlsStyles.controlsRow}>
            <div className={desktopControlsStyles.volumeGroup}>
              <LightboxIconButton
                layout="desktop"
                label={
                  isMuted || volume === 0
                    ? "Включить звук"
                    : "Выключить звук"
                }
                icon={<VolumeIcon muted={isMuted || volume === 0} />}
                onClick={onToggleMute}
              />
              <input
                type="range"
                className={[rangeStyles.range, desktopControlsStyles.volumeRange].join(
                  " ",
                )}
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                style={volumeStyle}
                aria-label="Громкость"
                onInput={(event) => {
                  onVolumeChange(Number(event.currentTarget.value));
                }}
                onChange={(event) => {
                  onVolumeChange(Number(event.currentTarget.value));
                }}
              />
            </div>

            <div className={desktopControlsStyles.transportSlot}>
              <LightboxIconButton
                layout="desktop"
                label={isPlaying ? "Пауза" : "Воспроизвести"}
                suppressAriaLabel
                icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                className={desktopControlsStyles.transportButton}
                onClick={onTogglePlayback}
              />
            </div>

            <div className={desktopControlsStyles.actionsGroup}>
              {canUsePictureInPicture ? (
                <LightboxIconButton
                  layout="desktop"
                  label="Картинка в картинке"
                  icon={<PictureInPictureIcon />}
                  active={isInPictureInPicture}
                  onClick={onTogglePictureInPicture}
                />
              ) : null}

              <div ref={menuWrapRef} className={desktopControlsStyles.menuWrap}>
                <button
                  type="button"
                  className={[
                    desktopControlsStyles.speedButton,
                    isRateMenuOpen ? desktopControlsStyles.speedButtonActive : "",
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
                    layout="desktop"
                    items={speedMenuItems}
                    onClose={onCloseMenu}
                  />
                ) : null}
              </div>

              <LightboxIconButton
                layout="desktop"
                label="Полный экран"
                icon={<FullscreenIcon />}
                onClick={onRequestFullscreen}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
