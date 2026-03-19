import { z } from "zod";

import { normalizePublicRef } from "../../shared/lib/publicRef";

/**
 * Декодирует room ref param.
 * @param value Входное значение для преобразования.
 * @returns Строковое значение результата.
 */
export const decodeRoomRefParam = (value: unknown): string | null => {
  if (value === "public") return "public";
  const parsed = z.string().regex(/^\d+$/).safeParse(value);
  if (!parsed.success) return null;
  const numeric = Number(parsed.data);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return String(Math.trunc(numeric));
};

/**
 * Декодирует public ref param.
 * @param value Входное значение для преобразования.
 * @returns Строковое значение результата.
 */
export const decodePublicRefParam = (value: unknown): string | null => {
  const parsed = z.string().safeParse(value);
  if (!parsed.success) return null;
  const normalized = normalizePublicRef(parsed.data);
  return normalized.length > 0 ? normalized : null;
};
