import controlsStyles from "../../styles/ui/LightboxVideoPlayer.controls.module.css";
import variantStyles from "../../styles/ui/LightboxVideoPlayer.desktop.module.css";
import frameStyles from "../../styles/ui/LightboxVideoPlayer.module.css";
import rangeStyles from "../../styles/ui/LightboxVideoPlayer.range.module.css";
import {
  LightboxVideoTimeline,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
  SettingsIcon,
  VolumeIcon,
} from "./LightboxVideoPlayer.shared";
import type { LightboxVideoPlayerViewProps } from "./LightboxVideoPlayer.types";
import { PLAYBACK_RATE_OPTIONS } from "./LightboxVideoPlayer.utils";




export default function LightboxVideoPlayerDesktopView({
  rootRef,
  mediaViewport,
  isReady,
  isPlaying,
  duration,
  currentTime,
  volume,
  isMuted,
  playbackRate,
  isRateMenuOpen,
  canUsePictureInPicture,
  isInPictureInPicture,
  progressStyle,
  volumeStyle,
  remainingLabel,
  onTogglePlayback,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSetPlaybackRate,
  onToggleRateMenu,
  onTogglePictureInPicture,
  onControlsInteraction,
}: LightboxVideoPlayerViewProps) {
  return (
    <div
      ref={rootRef}
      className={[frameStyles.root, variantStyles.rootDesktop]
        .filter(Boolean)
        .join(" ")}
      data-testid="lightbox-video-player-desktop"
    >
      {mediaViewport}

      <div
        className={[frameStyles.controls, variantStyles.controlsDesktop]
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
        <div className={controlsStyles.controlsTop}>
          <div className={controlsStyles.leadingControls}>
            <button
              type="button"
              className={controlsStyles.iconButton}
              aria-label={isMuted || volume === 0 ? "Включить звук" : "Выключить звук"}
              onClick={onToggleMute}
            >
              <VolumeIcon muted={isMuted || volume === 0} />
            </button>
            <input
              type="range"
              className={[rangeStyles.range, controlsStyles.volumeRange].join(" ")}
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              style={volumeStyle}
              aria-label="Громкость"
              onChange={(event) => {
                onVolumeChange(Number(event.currentTarget.value));
              }}
            />
          </div>

          <button
            type="button"
            className={controlsStyles.playPauseButton}
            aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            onClick={onTogglePlayback}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div className={controlsStyles.trailingControls}>
            {canUsePictureInPicture && (
              <button
                type="button"
                className={[
                  controlsStyles.iconButton,
                  isInPictureInPicture ? controlsStyles.iconButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label="Картинка в картинке"
                onClick={onTogglePictureInPicture}
              >
                <PictureInPictureIcon />
              </button>
            )}

            <div className={controlsStyles.settingsWrap}>
              <button
                type="button"
                className={[
                  controlsStyles.iconButton,
                  isRateMenuOpen ? controlsStyles.iconButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label="Скорость воспроизведения"
                onClick={onToggleRateMenu}
              >
                <SettingsIcon />
              </button>

              {isRateMenuOpen && (
                <div className={controlsStyles.rateMenu}>
                  <div className={controlsStyles.rateMenuHeader}>
                    <span className={controlsStyles.rateMenuValue}>
                      {playbackRate.toFixed(1)}x
                    </span>
                    <div className={controlsStyles.rateMenuMeter}>
                      <div
                        className={controlsStyles.rateMenuMeterFill}
                        style={{
                          width: `${((playbackRate - 0.5) / 1.5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className={controlsStyles.rateMenuList}>
                    {PLAYBACK_RATE_OPTIONS.map((option) => {
                      const isSelected = playbackRate === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={[
                            controlsStyles.rateOption,
                            isSelected ? controlsStyles.rateOptionSelected : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => {
                            onSetPlaybackRate(option.value);
                          }}
                        >
                          <span className={controlsStyles.rateOptionValue}>
                            {option.value.toFixed(1)}x
                          </span>
                          <span className={controlsStyles.rateOptionLabel}>
                            {option.label}
                          </span>
                          <span className={controlsStyles.rateOptionCheck}>
                            {isSelected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <LightboxVideoTimeline
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
