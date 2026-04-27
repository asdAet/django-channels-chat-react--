/**
 * Реализует функцию `formatTimestamp`.
 * @param iso Дата в ISO-формате.
 * @returns Строка в отформатированном виде.
 */


export const formatTimestamp = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/**
 * Реализует функцию `formatDayLabel`.
 * @param date Дата для форматирования.
 * @param now Текущая дата для вычислений.
 * @returns Строка в отформатированном виде.
 */


export const formatDayLabel = (date: Date, now: Date = new Date()) => {
  if (Number.isNaN(date.getTime())) return "";
  const includeYear = date.getFullYear() !== now.getFullYear();
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  if (includeYear) {
    options.year = "numeric";
  }
  return new Intl.DateTimeFormat("ru-RU", options).format(date);
};

/**
 * Обрабатывает avatar fallback.
 * @param username Имя пользователя.
 */


export const avatarFallback = (username: string) => {
  const normalized = username.trim().replace(/^@+/, "");
  return normalized ? normalized[0]!.toUpperCase() : "?";
};

/**
 * Форматирует full name.
 *
 * @returns Строка в отформатированном виде.
 */

export const formatFullName = (
  name: string | null | undefined,
  lastName?: string | null | undefined,
) => {
  const safeName = (name ?? "").trim();
  const safeLastName = (lastName ?? "").trim();
  if (!safeName) return "";
  return safeLastName ? `${safeName} ${safeLastName}` : safeName;
};

/**
 * Реализует функцию `formatRegistrationDate`.
 * @param iso Дата в ISO-формате.
 * @returns Строка в отформатированном виде.
 */


export const formatRegistrationDate = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

/**
 * Реализует функцию `formatLastSeen`.
 * @param iso Дата в ISO-формате.
 * @returns Строка в отформатированном виде.
 */


export const formatLastSeen = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs >= 0 && diffMs < 2 * 60 * 1000) {
    return "в сети недавно";
  }

  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `сегодня в ${time}`;
  }

  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "long" };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }
  const datePart = new Intl.DateTimeFormat("ru-RU", options).format(date);
  return `${datePart} в ${time}`;
};
