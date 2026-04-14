import { formatPublicRef, isFallbackPublicId, isHandleRef, normalizePublicRef } from "./publicRef";

/**
 * Константа `PUBLIC_CHAT_TARGET`, используемая как public chat target.
 */
export const PUBLIC_CHAT_TARGET = "public";

const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "login",
  "register",
  "profile",
  "settings",
  "friends",
  "groups",
  "invite",
  "users",
  "direct",
  "rooms",
]);

const PRESERVED_SEGMENT_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
  [/%40/gi, "@"],
];

const isSinglePathSegment = (pathname: string): boolean => {
  if (!pathname.startsWith("/")) return false;
  const trimmed = pathname.replace(/^\/+|\/+$/g, "");
  if (!trimmed) return false;
  return !trimmed.includes("/");
};

/**
 * Нормализует `normalize chat target`.
 *
 * @param value Параметр `value` в формате `string | null | undefined`.
 * @returns Возвращает результат `normalize chat target` в формате `string`.
 */
export const normalizeChatTarget = (
  value: string | null | undefined,
): string => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return "";

  if (trimmed.toLowerCase() === PUBLIC_CHAT_TARGET) {
    return PUBLIC_CHAT_TARGET;
  }

  const normalizedRef = normalizePublicRef(trimmed);
  if (!normalizedRef) return "";

  if (isHandleRef(normalizedRef)) {
    return formatPublicRef(normalizedRef);
  }

  if (isFallbackPublicId(normalizedRef)) {
    return normalizedRef;
  }

  return trimmed;
};

/**
 * Проверяет `is reserved chat target`.
 *
 * @param value Параметр `value` в формате `string | null | undefined`.
 * @returns Возвращает результат `is reserved chat target` в формате `boolean`.
 */
export const isReservedChatTarget = (value: string | null | undefined): boolean => {
  const rawSegment = typeof value === "string" ? value.trim() : "";
  if (!rawSegment) return false;
  if (rawSegment.startsWith("@")) return false;
  return RESERVED_TOP_LEVEL_SEGMENTS.has(rawSegment.toLowerCase());
};

/**
 * Кодирует `encode chat target segment`.
 *
 * @param value Параметр `value` в формате `string`.
 * @returns Возвращает результат `encode chat target segment` в формате `string`.
 */
export const encodeChatTargetSegment = (value: string): string => {
  let encoded = encodeURIComponent(value);
  for (const [pattern, replacement] of PRESERVED_SEGMENT_REPLACEMENTS) {
    encoded = encoded.replace(pattern, replacement);
  }
  return encoded;
};

/**
 * Формирует `build chat target path`.
 *
 * @param value Параметр `value` в формате `string`.
 * @returns Возвращает результат `build chat target path` в формате `string`.
 */
export const buildChatTargetPath = (value: string): string => {
  const normalized = normalizeChatTarget(value);
  if (!normalized) return "/";
  return `/${encodeChatTargetSegment(normalized)}`;
};

/**
 * Формирует `build public chat path`.
 *
 * @returns Возвращает результат `build public chat path` в формате `string`.
 */
export const buildPublicChatPath = (): string =>
  buildChatTargetPath(PUBLIC_CHAT_TARGET);

/**
 * Формирует `build direct chat path`.
 *
 * @param value Параметр `value` в формате `string`.
 * @returns Возвращает результат `build direct chat path` в формате `string`.
 */
export const buildDirectChatPath = (value: string): string => {
  const normalized = normalizeChatTarget(value);
  if (!normalized) return "/friends";
  return buildChatTargetPath(normalized);
};

/**
 * Разбирает `parse chat target from pathname`.
 *
 * @param pathname Параметр `pathname` в формате `string`.
 * @returns Возвращает результат `parse chat target from pathname` в формате `string | null`.
 */
export const parseChatTargetFromPathname = (
  pathname: string,
): string | null => {
  if (!isSinglePathSegment(pathname)) return null;
  const rawSegment = pathname.replace(/^\/+|\/+$/g, "");
  if (!rawSegment) return null;

  let decoded = rawSegment;
  try {
    decoded = decodeURIComponent(rawSegment);
  } catch {
    decoded = rawSegment;
  }

  if (isReservedChatTarget(decoded)) return null;

  const normalized = normalizeChatTarget(decoded);
  if (!normalized) return null;
  return normalized;
};

/**
 * Проверяет `is prefixless chat path`.
 *
 * @param pathname Параметр `pathname` в формате `string`.
 * @returns Возвращает результат `is prefixless chat path` в формате `boolean`.
 */
export const isPrefixlessChatPath = (pathname: string): boolean =>
  parseChatTargetFromPathname(pathname) !== null;
