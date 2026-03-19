import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Описывает структуру данных `WebSocketStatus`.
 */
export type WebSocketStatus =
  | "idle"
  | "connecting"
  | "online"
  | "offline"
  | "error"
  | "closed";

/**
 * Описывает настраиваемые опции `WebSocket`.
 */
type WebSocketOptions = {
  url: string | null;
  protocols?: string | string[];
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

/**
 * Хук useReconnectingWebSocket управляет состоянием и побочными эффектами текущего сценария.
 * @param options Опциональные параметры поведения.
 */


export const useReconnectingWebSocket = (options: WebSocketOptions) => {
  const {
    url,
    protocols,
    onMessage,
    onOpen,
    onClose,
    onError,
    maxRetries = 8,
    baseDelayMs = 600,
    maxDelayMs = 10_000,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<{ attempt: number; timeoutId: number | null }>({
    attempt: 0,
    timeoutId: null,
  });
  const connectRef = useRef<(() => void) | null>(null);
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError });
  const activeRef = useRef(true);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onClose, onError };
  }, [onMessage, onOpen, onClose, onError]);

  /**
   * Обрабатывает clear retry.
   */
  const clearRetry = () => {
    if (retryRef.current.timeoutId) {
      window.clearTimeout(retryRef.current.timeoutId);
      retryRef.current.timeoutId = null;
    }
  };

  const cleanup = useCallback(() => {
    /**
     * Вызывает `clearRetry` как шаг текущего сценария.

     */

    clearRetry();
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.onmessage = null;
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url) {
      /**
       * Вызывает `cleanup` как шаг текущего сценария.

       */

      cleanup();
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("idle");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      /**
       * Вызывает `cleanup` как шаг текущего сценария.

       */

      cleanup();
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("offline");
      return;
    }

    /**
     * Вызывает `cleanup` как шаг текущего сценария.

     */

    cleanup();
    /**
     * Вызывает `setStatus` как шаг текущего сценария.

     */

    setStatus("connecting");

    const socket = new WebSocket(url, protocols);
    socketRef.current = socket;

    socket.onopen = () => {
      retryRef.current.attempt = 0;
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("online");
      /**
       * Вызывает `setLastError` как шаг текущего сценария.
       * @param value Входное значение для обработки.

       */

      setLastError(null);
      handlersRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      handlersRef.current.onMessage?.(event);
    };

    socket.onerror = (event) => {
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("error");
      /**
       * Вызывает `setLastError` как шаг текущего сценария.

       */

      setLastError("connection_error");
      handlersRef.current.onError?.(event);
    };

    socket.onclose = (event) => {
      handlersRef.current.onClose?.(event);
      if (!activeRef.current) return;

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        /**
         * Вызывает `setStatus` как шаг текущего сценария.

         */

        setStatus("offline");
        return;
      }

      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("closed");

      if (retryRef.current.attempt >= maxRetries) {
        /**
         * Вызывает `setStatus` как шаг текущего сценария.

         */

        setStatus("error");
        /**
         * Вызывает `setLastError` как шаг текущего сценария.

         */

        setLastError("reconnect_limit");
        return;
      }

      const attempt = retryRef.current.attempt;
      retryRef.current.attempt += 1;
      const jitter = Math.floor(Math.random() * 200);
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) + jitter;
      retryRef.current.timeoutId = window.setTimeout(() => {
        connectRef.current?.();
      }, delay);
    };
  }, [baseDelayMs, cleanup, maxDelayMs, maxRetries, protocols, url]);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    activeRef.current = true;
    /**
     * Вызывает `queueMicrotask` как шаг текущего сценария.
     * @returns Ничего не возвращает.
     */

    queueMicrotask(() => connect());
    return () => {
      activeRef.current = false;
      /**
       * Вызывает `cleanup` как шаг текущего сценария.
       * @returns Ничего не возвращает.
       */

      cleanup();
    };
  }, [connect, cleanup]);

  /**
   * Вызывает `useEffect` как шаг текущего сценария.
   * @param props Свойства компонента.
   * @returns Ничего не возвращает.
   */

  useEffect(() => {
    /**
     * Обрабатывает handle online.
     */
    const handleOnline = () => {
      /**
       * Вызывает `setStatus` как шаг текущего сценария.
       * @returns Ничего не возвращает.
       */

      setStatus("connecting");
      /**
       * Вызывает `connect` как шаг текущего сценария.
       * @returns Ничего не возвращает.
       */

      connect();
    };
    /**
     * Обрабатывает handle offline.
     */
    const handleOffline = () => {
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("offline");
      /**
       * Вызывает `cleanup` как шаг текущего сценария.

       */

      cleanup();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [cleanup, connect]);

  const send = useCallback((data: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  return {
    status,
    lastError,
    send,
    reconnect: connect,
  };
};
