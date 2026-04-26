/**
 * Форматирует размер вложения в компактный человекочитаемый вид.
 * @param bytes Размер файла в байтах.
 * @returns Строка с размером файла и единицей измерения.
 */
export const formatAttachmentFileSize = (bytes: number): string => {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (safeBytes < 1024) return `${Math.round(safeBytes)} B`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  if (safeBytes < 1024 * 1024 * 1024) {
    return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(safeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/**
 * Форматирует дату отправки вложения для компактной карточки файла.
 * @param iso Дата отправки в ISO-формате.
 * @returns Локализованная короткая дата и время отправки.
 */
export const formatAttachmentSentAt = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
