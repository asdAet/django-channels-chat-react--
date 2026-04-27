const TAGS = /<[^>]*>/g;

/**
 * Обрабатывает strip control chars.
 * @param value Входное значение для преобразования.
 */


const stripControlChars = (value: string) => {
  let cleaned = "";
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (
      (code >= 0 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      continue;
    }
    cleaned += value[i];
  }
  return cleaned;
};

/**
 * Очищает text.
 * @param input Входной объект с параметрами операции.
 * @param maxLen Максимальная длина значения.
 */


export const sanitizeText = (input: string, maxLen = 1000) => {
  if (!input) return "";
  const withoutTags = input.replace(TAGS, "");
  const withoutControls = stripControlChars(withoutTags);
  const trimmed = withoutControls.trim();
  if (trimmed.length > maxLen) {
    return trimmed.slice(0, maxLen);
  }
  return trimmed;
};
