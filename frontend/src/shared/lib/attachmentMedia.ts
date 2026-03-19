const SVG_EXTENSION_PATTERN = /\.svgz?$/i;

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
