const SVG_EXTENSION_PATTERN = /\.svgz?$/i;
const VIDEO_EXTENSION_PATTERN =
  /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|3gp|mpeg|mpg|ogv|ts|m2ts|m3u8|gifv)$/i;

const normalizeContentType = (contentType: string | null | undefined): string =>
  (contentType ?? "").trim().toLowerCase();

const hasSvgExtension = (fileName: string | null | undefined): boolean =>
  SVG_EXTENSION_PATTERN.test((fileName ?? "").trim());

/**
 * Returns `true` when the attachment should be treated as SVG media.
 */
export const isSvgAttachment = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): boolean => {
  const normalized = normalizeContentType(contentType);
  return normalized.includes("svg") || hasSvgExtension(fileName);
};

/**
 * Returns `true` when the attachment should be rendered as an image.
 */
export const isImageAttachment = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): boolean => {
  const normalized = normalizeContentType(contentType);
  if (normalized.startsWith("image/")) {
    return true;
  }

  return hasSvgExtension(fileName);
};

/**
 * Returns `true` when the attachment should be rendered as a video.
 *
 * The viewer intentionally does not second-guess the browser here. If the file
 * is identified as video by MIME type or file extension, the modal opens a
 * plain native `<video>` and leaves playback support to the browser runtime.
 */
export const isVideoAttachment = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): boolean => {
  const normalized = normalizeContentType(contentType);
  if (normalized.startsWith("video/")) {
    return true;
  }

  return VIDEO_EXTENSION_PATTERN.test((fileName ?? "").trim());
};

/**
 * Resolves the preview source for image tiles.
 */
export const resolveImagePreviewUrl = ({
  url,
  thumbnailUrl,
  contentType,
  fileName,
}: {
  url: string | null;
  thumbnailUrl: string | null;
  contentType: string | null | undefined;
  fileName: string | null | undefined;
}): string | null => {
  if (!url) {
    return null;
  }

  if (isSvgAttachment(contentType, fileName)) {
    return url;
  }

  return thumbnailUrl ?? url;
};

/**
 * Describes responsive image attributes for grouped media tiles.
 */
export type ResponsiveImageSource = {
  src: string | null;
  srcSet?: string;
  sizes?: string;
};

/**
 * Picks the best source for an image tile in the chat grid.
 */
export const resolveResponsiveImageSource = ({
  url,
  thumbnailUrl,
  contentType,
  fileName,
  expectedWidthPx,
}: {
  url: string | null;
  thumbnailUrl: string | null;
  contentType: string | null | undefined;
  fileName: string | null | undefined;
  expectedWidthPx: number;
}): ResponsiveImageSource => {
  if (!url) {
    return { src: null };
  }

  if (isSvgAttachment(contentType, fileName)) {
    return { src: url };
  }

  if (!thumbnailUrl || thumbnailUrl === url) {
    return { src: url };
  }

  const safeExpectedWidthPx = Math.max(96, Math.round(expectedWidthPx));

  if (safeExpectedWidthPx >= 160) {
    return {
      src: url,
      sizes: `${safeExpectedWidthPx}px`,
    };
  }

  return {
    src: thumbnailUrl,
    srcSet: `${thumbnailUrl} 1x, ${url} 2x`,
    sizes: `${safeExpectedWidthPx}px`,
  };
};
