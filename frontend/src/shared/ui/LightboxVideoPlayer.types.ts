import type { CSSProperties, ReactNode, RefObject, SyntheticEvent } from "react";

export type LightboxVideoPlayerLayout = "desktop" | "mobile";

export type PlaybackRateOption = {
  value: number;
  label: string;
};

export type LightboxVideoPlayerViewProps = {
  rootRef: RefObject<HTMLDivElement | null>;
  mediaViewport: ReactNode;
  isReady: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isRateMenuOpen: boolean;
  canUsePictureInPicture: boolean;
  isInPictureInPicture: boolean;
  progressStyle: CSSProperties;
  volumeStyle: CSSProperties;
  remainingLabel: string;
  onTogglePlayback: () => void;
  onSeek: (nextValue: number) => void;
  onVolumeChange: (nextValue: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (nextRate: number) => void;
  onToggleRateMenu: () => void;
  onTogglePictureInPicture: () => void;
  onControlsInteraction: (event: SyntheticEvent<HTMLElement>) => void;
};
