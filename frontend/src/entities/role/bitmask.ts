/**
 * Обрабатывает as big int.
 * @param value Входное значение для преобразования.
 * @returns Логический флаг наличия условия.
 */
const asBigInt = (value: number): bigint => {
  if (!Number.isFinite(value)) return 0n;
  return BigInt(Math.trunc(value));
};

/**
 * Проверяет наличие permission flag.
 *
 * @param mask Битовая маска разрешений.
 * @param flag Флаг разрешения.
 *
 * @returns Логический флаг наличия условия.
 */

export const hasPermissionFlag = (mask: number, flag: number): boolean => {
  const maskBig = asBigInt(mask);
  const flagBig = asBigInt(flag);
  if (flagBig <= 0n) return false;
  return (maskBig & flagBig) === flagBig;
};

/**
 * Выполняет permission flags.
 *
 * @param flags Набор флагов разрешений.
 *

 */

export const combinePermissionFlags = (flags: Iterable<number>): number => {
  let next = 0n;
  for (const flag of flags) {
    const flagBig = asBigInt(flag);
    if (flagBig > 0n) {
      next |= flagBig;
    }
  }
  return Number(next);
};

/**
 * Обрабатывает flags from mask.
 * @param mask Битовая маска разрешений.
 * @param flags Набор флагов разрешений.
 * @returns Числовое значение результата.
 */

export const flagsFromMask = (
  mask: number,
  flags: readonly number[],
): number[] => flags.filter((flag) => hasPermissionFlag(mask, flag));
