import { useEffect, useState } from "react";

/**
 * Хук useOnlineStatus управляет состоянием и побочными эффектами текущего сценария.
 */


export const useOnlineStatus = () => {
  const [online, setOnline] = useState(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    /**
     * Обрабатывает handle online.
     */
    const handleOnline = () => setOnline(true);
    /**
     * Обрабатывает handle offline.
     */
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
};
