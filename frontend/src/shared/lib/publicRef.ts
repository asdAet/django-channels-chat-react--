const HANDLE_RE = /^[a-z][a-z0-9_]{2,29}$/;
const USER_PUBLIC_ID_RE = /^[1-9]\d{9}$/;
const GROUP_PUBLIC_ID_RE = /^-[1-9]\d{9}$/;

export const normalizePublicRef = (
  value: string | null | undefined,
): string => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) return trimmed.slice(1).trim();
  return trimmed;
};

export const isHandleRef = (value: string): boolean =>
  HANDLE_RE.test(normalizePublicRef(value).toLowerCase());

export const isFallbackPublicId = (value: string): boolean => {
  const normalized = normalizePublicRef(value);
  return USER_PUBLIC_ID_RE.test(normalized) || GROUP_PUBLIC_ID_RE.test(normalized);
};

export const formatPublicRef = (value: string): string => {
  const normalized = normalizePublicRef(value);
  if (!normalized) return "";
  if (isHandleRef(normalized)) return `@${normalized.toLowerCase()}`;
  return normalized;
};

export const buildDirectPath = (value: string): string => {
  const normalized = normalizePublicRef(value);
  if (!normalized) return "/direct";
  return `/direct/${encodeURIComponent(normalized)}`;
};

export const buildUserProfilePath = (value: string): string => {
  const normalized = normalizePublicRef(value);
  if (!normalized) return "/profile";
  return `/users/${encodeURIComponent(normalized)}`;
};
