import { useCallback, useRef, useState } from "react";

/**
 * Описывает API guard-состояния для modal-like интерфейсов.
 *
 * @template T Тип значения, которое открывает конкретный экземпляр модального UI.
 */
type GuardedModalState<T> = {
  /**
   * Текущее активное значение модального состояния.
   */
  activeValue: T | null;
  /**
   * Пытается открыть модальный UI новым значением.
   *
   * Возвращает `false`, если другой open-intent уже принят и React еще не
   * успел закоммитить или закрыть текущий экземпляр.
   */
  requestOpen: (nextValue: T) => boolean;
  /**
   * Синхронно заменяет текущее активное значение или очищает его.
   *
   * Используется для штатного закрытия, когда модальный UI сам завершает свой
   * lifecycle и должен освободить guard.
   */
  setActiveValue: (nextValue: T | null) => void;
  /**
   * Явно снимает guard и очищает активное значение.
   */
  clear: () => void;
};

/**
 * Защищает modal-like состояние от повторных open-intent, пришедших раньше,
 * чем React успеет закоммитить первый mount.
 *
 * Такой guard нужен для быстрых повторных кликов, тачей и event replay после
 * reload, когда UI должен открыть только один экземпляр модального слоя.
 *
 * @template T Тип значения, идентифицирующего активный modal intent.
 * @returns Guard с синхронным lock-before-render и безопасным освобождением.
 */
export function useGuardedModalState<T>(): GuardedModalState<T> {
  const [activeValue, setActiveValueState] = useState<T | null>(null);
  const openLockRef = useRef(false);

  const setActiveValue = useCallback((nextValue: T | null) => {
    openLockRef.current = nextValue !== null;
    setActiveValueState(nextValue);
  }, []);

  const clear = useCallback(() => {
    openLockRef.current = false;
    setActiveValueState(null);
  }, []);

  const requestOpen = useCallback((nextValue: T) => {
    if (openLockRef.current) {
      return false;
    }

    openLockRef.current = true;
    setActiveValueState(nextValue);
    return true;
  }, []);

  return {
    activeValue,
    requestOpen,
    setActiveValue,
    clear,
  };
}
