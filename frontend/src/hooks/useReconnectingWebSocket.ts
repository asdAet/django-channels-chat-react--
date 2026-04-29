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

export type WebSocketConnectionNotice = {
  id: number;
  type: "lost" | "restored" | "failed";
  message: string;
} | null;

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
  const [connectionNotice, setConnectionNotice] =
    useState<WebSocketConnectionNotice>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<{ attempt: number; timeoutId: number | null }>({
    attempt: 0,
    timeoutId: null,
  });
  const connectRef = useRef<(() => void) | null>(null);
  const handlersRef = useRef({ onMessage, onOpen, onClose, onError });
  const activeRef = useRef(true);
  const hasOpenedRef = useRef(false);
  const reconnectingAfterOpenRef = useRef(false);
  const connectionNoticeTypeRef = useRef<
    NonNullable<WebSocketConnectionNotice>["type"] | null
  >(null);
  const connectionNoticeIdRef = useRef(0);
  const connectionNoticeTimerRef = useRef<number | null>(null);

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

  const clearConnectionNoticeTimer = useCallback(() => {
    if (connectionNoticeTimerRef.current === null) {
      return;
    }
    window.clearTimeout(connectionNoticeTimerRef.current);
    connectionNoticeTimerRef.current = null;
  }, []);

  const publishConnectionNotice = useCallback(
    (
      type: NonNullable<WebSocketConnectionNotice>["type"],
      message: string,
      autoClearMs?: number,
    ) => {
      if (connectionNoticeTypeRef.current === type && type === "lost") {
        return;
      }

      clearConnectionNoticeTimer();
      connectionNoticeTypeRef.current = type;
      const id = connectionNoticeIdRef.current + 1;
      connectionNoticeIdRef.current = id;
      setConnectionNotice({ id, type, message });

      if (autoClearMs && autoClearMs > 0) {
        connectionNoticeTimerRef.current = window.setTimeout(() => {
          connectionNoticeTimerRef.current = null;
          connectionNoticeTypeRef.current = null;
          setConnectionNotice((current) =>
            current?.id === id ? null : current,
          );
        }, autoClearMs);
      }
    },
    [clearConnectionNoticeTimer],
  );

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
      setLastError(null);
      setConnectionNotice(null);
      connectionNoticeTypeRef.current = null;
      hasOpenedRef.current = false;
      reconnectingAfterOpenRef.current = false;
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      /**
       * Вызывает `cleanup` как шаг текущего сценария.

       */

      cleanup();
      if (hasOpenedRef.current) {
        reconnectingAfterOpenRef.current = true;
        publishConnectionNotice(
          "lost",
          "Соединение потеряно. Пытаемся восстановить...",
        );
      }
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
      const wasReconnecting = reconnectingAfterOpenRef.current;
      retryRef.current.attempt = 0;
      hasOpenedRef.current = true;
      reconnectingAfterOpenRef.current = false;
      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("online");
      /**
       * Вызывает `setLastError` как шаг текущего сценария.
       * @param value Входное значение для обработки.

       */

      setLastError(null);
      if (wasReconnecting) {
        publishConnectionNotice("restored", "Соединение восстановлено", 2500);
      } else {
        clearConnectionNoticeTimer();
        connectionNoticeTypeRef.current = null;
        setConnectionNotice(null);
      }
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
      if (hasOpenedRef.current) {
        reconnectingAfterOpenRef.current = true;
        publishConnectionNotice(
          "lost",
          "Соединение потеряно. Пытаемся восстановить...",
        );
      }
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
        if (hasOpenedRef.current) {
          reconnectingAfterOpenRef.current = true;
          publishConnectionNotice(
            "lost",
            "Соединение потеряно. Пытаемся восстановить...",
          );
        }
        return;
      }

      /**
       * Вызывает `setStatus` как шаг текущего сценария.

       */

      setStatus("closed");
      if (hasOpenedRef.current) {
        reconnectingAfterOpenRef.current = true;
        publishConnectionNotice(
          "lost",
          "Соединение потеряно. Пытаемся восстановить...",
        );
      }

      if (retryRef.current.attempt >= maxRetries) {
        /**
         * Вызывает `setStatus` как шаг текущего сценария.

         */

        setStatus("error");
        /**
         * Вызывает `setLastError` как шаг текущего сценария.

         */

        setLastError("reconnect_limit");
        publishConnectionNotice(
          "failed",
          "Не удалось восстановить соединение.",
        );
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
  }, [
    baseDelayMs,
    cleanup,
    maxDelayMs,
    maxRetries,
    protocols,
    publishConnectionNotice,
    clearConnectionNoticeTimer,
    url,
  ]);

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
    const startupTimeoutId = window.setTimeout(() => {
      if (!activeRef.current) return;
      connect();
    }, 0);
    return () => {
      window.clearTimeout(startupTimeoutId);
      activeRef.current = false;
      /**
       * Вызывает `cleanup` как шаг текущего сценария.
       * @returns Ничего не возвращает.
       */

      cleanup();
      clearConnectionNoticeTimer();
    };
  }, [clearConnectionNoticeTimer, connect, cleanup]);

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
      if (hasOpenedRef.current) {
        reconnectingAfterOpenRef.current = true;
        publishConnectionNotice(
          "lost",
          "Соединение потеряно. Пытаемся восстановить...",
        );
      }
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
  }, [cleanup, connect, publishConnectionNotice]);

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
    connectionNotice,
    send,
    reconnect: connect,
  };
};
