import { formatPublicRef, isFallbackPublicId, isHandleRef, normalizePublicRef } from "./publicRef";

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

export const isReservedChatTarget = (value: string | null | undefined): boolean => {
  const rawSegment = typeof value === "string" ? value.trim() : "";
  if (!rawSegment) return false;
  if (rawSegment.startsWith("@")) return false;
  return RESERVED_TOP_LEVEL_SEGMENTS.has(rawSegment.toLowerCase());
};

export const encodeChatTargetSegment = (value: string): string => {
  let encoded = encodeURIComponent(value);
  for (const [pattern, replacement] of PRESERVED_SEGMENT_REPLACEMENTS) {
    encoded = encoded.replace(pattern, replacement);
  }
  return encoded;
};

export const buildChatTargetPath = (value: string): string => {
  const normalized = normalizeChatTarget(value);
  if (!normalized) return "/";
  return `/${encodeChatTargetSegment(normalized)}`;
};

export const buildPublicChatPath = (): string =>
  buildChatTargetPath(PUBLIC_CHAT_TARGET);

export const buildDirectChatPath = (value: string): string => {
  const normalized = normalizeChatTarget(value);
  if (!normalized) return "/friends";
  return buildChatTargetPath(normalized);
};

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

export const isPrefixlessChatPath = (pathname: string): boolean =>
  parseChatTargetFromPathname(pathname) !== null;
