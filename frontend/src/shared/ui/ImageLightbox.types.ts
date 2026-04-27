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
  downloadUrl?: string | null;
  kind: ImageLightboxMediaKind;
  alt?: string;
  metadata: ImageLightboxMetadata;
};

export type SingleMediaProps = {
  src: string;
  previewSrc?: string | null;
  downloadUrl?: string | null;
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
