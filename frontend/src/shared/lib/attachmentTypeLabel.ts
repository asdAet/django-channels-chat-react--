const MIME_TYPE_LABEL_ALIASES: Record<string, string> = {
  "application/x-zip-compressed": "zip",
  "application/zip": "zip",
  "application/x-rar-compressed": "rar",
  "application/vnd.rar": "rar",
  "application/x-7z-compressed": "7z",
  "application/java-archive": "jar",
};


/**
 * Извлекает extension.
 * @param fileName Имя файла вместе с расширением.
 * @returns Извлеченное значение из входных данных.
 */
const extractExtension = (fileName: string | null | undefined): string => {
  const normalized = (fileName ?? "").trim().toLowerCase();
  if (!normalized) return "";

  const cleanName = normalized.split(/[?#]/, 1)[0];
  const baseName = cleanName.slice(cleanName.lastIndexOf("/") + 1);
  const dotIndex = baseName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex >= baseName.length - 1) return "";

  return baseName.slice(dotIndex + 1).replace(/[^a-z0-9+-]/g, "");
};


/**
 * Нормализует mime subtype.
 * @param subtype DOM-событие, вызвавшее обработчик.
 * @returns Нормализованное значение после обработки входа.
 */
const normalizeMimeSubtype = (subtype: string): string => {
  const lowered = subtype.trim().toLowerCase();
  if (!lowered) return "";

  if (lowered.includes("zip")) return "zip";
  if (lowered.includes("rar")) return "rar";
  if (lowered.includes("7z")) return "7z";
  if (lowered.includes("java-archive")) return "jar";

  const cleaned = lowered
    .replace(/^x-/, "")
    .replace(/^vnd\./, "")
    .replace(/-compressed$/, "")
    .replace(/\+xml$/, "")
    .replace(/[^a-z0-9.+-]/g, "");
  if (!cleaned) return "";

  const segments = cleaned.split(".");
  return segments[segments.length - 1] || cleaned;
};


/**
 * Определяет attachment type label.
 * @param contentType MIME-тип файла.
 * @param fileName Имя файла вместе с расширением.
 * @returns Разрешенное значение с учетом fallback-логики.
 */
export const resolveAttachmentTypeLabel = (
  contentType: string | null | undefined,
  fileName: string | null | undefined,
): string => {
  const extension = extractExtension(fileName);
  if (extension) return extension;

  const normalizedContentType = (contentType ?? "").trim().toLowerCase();
  if (!normalizedContentType) return "bin";

  const aliased = MIME_TYPE_LABEL_ALIASES[normalizedContentType];
  if (aliased) return aliased;

  const slashIndex = normalizedContentType.indexOf("/");
  const subtype =
    slashIndex >= 0
      ? normalizedContentType.slice(slashIndex + 1)
      : normalizedContentType;
  const normalizedSubtype = normalizeMimeSubtype(subtype);
  return normalizedSubtype || "bin";
};