import type { CSSProperties, ReactNode, RefObject, SyntheticEvent } from "react";

import type { LightboxDropdownMenuId } from "./lightboxControls/types";

export type LightboxVideoPlayerLayout = "desktop" | "mobile";

export type LightboxVideoPlayerHandle = {
  togglePlayback: () => void;
};

export type PlaybackRateOption = {
  value: number;
  label: string;
};

export type LightboxVideoPlayerViewProps = {
  rootRef: RefObject<HTMLDivElement | null>;
  mediaViewport: ReactNode;
  isReady: boolean;
  isPlaying: boolean;
  isControlsVisible: boolean;
  duration: number;
  displayTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  activeMenuId: LightboxDropdownMenuId | null;
  canUsePictureInPicture: boolean;
  isInPictureInPicture: boolean;
  progressStyle: CSSProperties;
  volumeStyle: CSSProperties;
  remainingLabel: string;
  onTogglePlayback: () => void;
  onSeekPreview: (nextValue: number) => void;
  onSeekCommit: (nextValue: number) => void;
  onSeekInteractionStart: () => void;
  onSeekInteractionEnd: () => void;
  onVolumeChange: (nextValue: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (nextRate: number) => void;
  onToggleMenu: (menuId: LightboxDropdownMenuId) => void;
  onCloseMenu: () => void;
  onTogglePictureInPicture: () => void;
  onRequestFullscreen: () => void;
  onControlsInteraction: (event: SyntheticEvent<HTMLElement>) => void;
  onSurfaceInteraction: () => void;
};
