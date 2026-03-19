const SVG_EXTENSION_PATTERN = /\.svgz?$/i;
const VIDEO_EXTENSION_PATTERN =
  /\.(mp4|m4v|mov|webm|mkv|avi|wmv|flv|3gp|mpeg|mpg|ogv|ts|m2ts|m3u8|gifv)$/i;

/**
 * Нормализует content type.
 * @param contentType MIME-тип файла.
 * @returns Нормализованное значение после обработки входа.
 */
const normalizeContentType = (contentType: string | null | undefined): string =>
  (contentType ?? "").trim().toLowerCase();

/**
 * Проверяет условие has svg extension.
 * @param fileName Имя файла вместе с расширением.
 * @returns Булев результат проверки условия.
 */
const hasSvgExtension = (fileName: string | null | undefined): boolean =>
  SVG_EXTENSION_PATTERN.test((fileName ?? "").trim());

/**
 * Проверяет условие is svg attachment.
 * @param contentType MIME-тип файла.
 * @param fileName Имя файла вместе с расширением.
 * @returns Булев результат проверки условия.
 */

export const isSvgAttachment = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): boolean => {
  const normalized = normalizeContentType(contentType);
  return normalized.includes("svg") || hasSvgExtension(fileName);
};

/**
 * Проверяет условие is image attachment.
 * @param contentType MIME-тип файла.
 * @param fileName Имя файла вместе с расширением.
 * @returns Булев результат проверки условия.
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
 * Проверяет, относится ли файл к видео по MIME-типу или расширению.
 *
 * @param contentType MIME-тип файла.
 * @param fileName Имя файла вместе с расширением.
 * @returns `true`, если файл должен отображаться как видео.
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
 * Определяет image preview url.
 *
 * @returns Разрешенное значение с учетом fallback-логики.
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
