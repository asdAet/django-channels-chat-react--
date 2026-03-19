import { useEffect, useState } from "react";

import { authController } from "../controllers/AuthController";
import { debugLog } from "../shared/lib/debug";

/**
 * Хук usePasswordRules управляет состоянием и побочными эффектами текущего сценария.
 * @param enabled Флаг включения поведения.
 */


export const usePasswordRules = (enabled: boolean) => {
  const [rules, setRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    /**
     * Вызывает `queueMicrotask` как шаг текущего сценария.
     * @returns Ничего не возвращает.
     */

    queueMicrotask(() => setLoading(true));
    authController
      .getPasswordRules()
      .then((data) => {
        if (!active) return;
        /**
         * Вызывает `setRules` как шаг текущего сценария.

         */

        setRules(Array.isArray(data.rules) ? data.rules : []);
      })
      .catch((err) => {
        /**
         * Вызывает `debugLog` как шаг текущего сценария.
         * @param err Ошибка, полученная в процессе выполнения.

         */

        debugLog("Password rules fetch failed", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { rules, loading };
};
