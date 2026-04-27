import { formatPublicRef, normalizePublicRef } from "./publicRef";

type IdentityLike = {
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  publicRef?: string | null;
  userId?: number | string | null;
};

const pickFirstNonEmpty = (
  ...values: Array<string | number | null | undefined>
): string | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
};

// Prefer a human label first, then fall back to a stable public ref or numeric id.
/**
 * Разрешает `resolve identity label`.
 *
 * @param identity Параметр `identity` в формате `IdentityLike`.
 * @param fallback Контекст `fallback`.
 * @returns Возвращает результат `resolve identity label` в формате `string`.
 */
export const resolveIdentityLabel = (
  identity: IdentityLike,
  fallback = "user",
): string =>
  pickFirstNonEmpty(
    identity.displayName,
    identity.name,
    identity.username,
    normalizePublicRef(identity.publicRef),
    identity.userId,
  ) ?? fallback;

/**
 * Разрешает `resolve identity handle`.
 *
 * @param identity Параметр `identity` в формате `IdentityLike`.
 * @returns Возвращает результат `resolve identity handle` в формате `string | null`.
 */
export const resolveIdentityHandle = (
  identity: IdentityLike,
): string | null => {
  const publicRef = normalizePublicRef(identity.publicRef);
  if (publicRef) return formatPublicRef(publicRef);

  const username = pickFirstNonEmpty(identity.username);
  if (username) return formatPublicRef(username);

  return pickFirstNonEmpty(identity.userId);
};
