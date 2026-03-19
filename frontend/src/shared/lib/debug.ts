/**
 * Реализует функцию `debugLog`.
 * @param args Список аргументов для логирования или проксирования.

 */


export const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV && import.meta.env.MODE !== "test") {
    console.error("[Debug]", ...args);
  }
};
