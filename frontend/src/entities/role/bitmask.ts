/**
 * Приводит числовое значение permission-маски к `bigint`, чтобы безопасно выполнять
 * побитовые операции без потери точности.
 *
 * @param value Исходное числовое значение маски или отдельного флага.
 * @returns Нормализованное значение в формате `bigint`.
 */
const asBigInt = (value: number): bigint => {
  if (!Number.isFinite(value)) return 0n;
  return BigInt(Math.trunc(value));
};

/**
 * Проверяет, присутствует ли конкретный permission-флаг в битовой маске.
 *
 * @param mask Битовая маска разрешений.
 * @param flag Флаг разрешения, наличие которого нужно проверить.
 * @returns `true`, если указанный флаг полностью содержится в маске.
 */
export const hasPermissionFlag = (mask: number, flag: number): boolean => {
  const maskBig = asBigInt(mask);
  const flagBig = asBigInt(flag);
  if (flagBig <= 0n) return false;
  return (maskBig & flagBig) === flagBig;
};

/**
 * Объединяет набор флагов прав доступа в одну битовую маску для передачи в API и хранения
 * в локальном состоянии.
 *
 * @param flags Набор числовых флагов прав доступа.
 * @returns Итоговая битовая маска, в которой выставлены все переданные флаги.
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
 * Возвращает только те флаги, которые реально присутствуют в переданной битовой маске.
 *
 * @param mask Битовая маска разрешений.
 * @param flags Список флагов, которые нужно проверить на наличие в маске.
 * @returns Подмножество исходных флагов, найденных в `mask`.
 */
export const flagsFromMask = (
  mask: number,
  flags: readonly number[],
): number[] => flags.filter((flag) => hasPermissionFlag(mask, flag));
