import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
  TouchEvent as ReactTouchEvent,
  TransitionEvent as ReactTransitionEvent,
  WheelEvent as ReactWheelEvent,
} from "react";

import type { LightboxControlsLayout } from "./lightboxControls/types";

export type ImageLightboxMediaKind = "image" | "video";

export type ImageLightboxMetadata = {
  attachmentId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  sentAt: string;
  width: number | null;
  height: number | null;
};

export type ImageLightboxMediaItem = {
  src: string;
  previewSrc?: string | null;
  kind: ImageLightboxMediaKind;
  alt?: string;
  metadata: ImageLightboxMetadata;
};

export type SingleMediaProps = {
  src: string;
  previewSrc?: string | null;
  alt?: string;
  kind?: ImageLightboxMediaKind;
  metadata: ImageLightboxMetadata;
  mediaItems?: never;
  initialIndex?: never;
  onClose: () => void;
};

export type GalleryMediaProps = {
  mediaItems: ImageLightboxMediaItem[];
  initialIndex?: number;
  src?: never;
  alt?: never;
  kind?: never;
  metadata?: never;
  onClose: () => void;
};

export type ImageLightboxProps = SingleMediaProps | GalleryMediaProps;

export type ImageLightboxViewProps = {
  layout: LightboxControlsLayout;
  chrome: ReactNode;
  currentItem: ImageLightboxMediaItem;
  mediaItems: ImageLightboxMediaItem[];
  normalizedCurrentIndex: number;
  normalizedDisplayIndex: number;
  isClosing: boolean;
  dialogLabel: string;
  overlayStyle?: CSSProperties;
  resolvedFrameStyle?: CSSProperties;
  metadataLines: string[];
  hasNavigation: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  overlayRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<HTMLDivElement | null>;
  mobileTrackRef: RefObject<HTMLDivElement | null>;
  mobileTrackStyle: CSSProperties;
  onMobileTrackTransitionEnd: (
    event: ReactTransitionEvent<HTMLDivElement>,
  ) => void;
  onViewportWheel: (event: ReactWheelEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onEndPointerDrag: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onViewportBackgroundClick: (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
  onViewportDoubleClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onTouchStart: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: ReactTouchEvent<HTMLDivElement>) => void;
  onPreviousClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onNextClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  renderActiveMediaElement: (
    item: ImageLightboxMediaItem,
    extraTransformClassName?: string,
  ) => ReactNode;
  renderPreviewMediaElement: (
    item: ImageLightboxMediaItem,
    extraTransformClassName?: string,
  ) => ReactNode;
};
