const SVG_EXTENSION_PATTERN = /\.svgz?$/i;

const normalizeContentType = (contentType: string | null | undefined): string =>
  (contentType ?? "").trim().toLowerCase();

const hasSvgExtension = (fileName: string | null | undefined): boolean =>
  SVG_EXTENSION_PATTERN.test((fileName ?? "").trim());

export const isSvgAttachment = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): boolean => {
  const normalized = normalizeContentType(contentType);
  return normalized.includes("svg") || hasSvgExtension(fileName);
};

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
