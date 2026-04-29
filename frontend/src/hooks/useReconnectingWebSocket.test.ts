import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReconnectingWebSocket } from "./useReconnectingWebSocket";

/**
 * Реализует класс MockWebSocket.
 */
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public sent: string[] = [];

  public readonly url: string;
  public readonly protocols?: string | string[];

  /**
   * Инициализирует зависимости и внутреннее состояние экземпляра.
   * @param url Параметр url, используемый в логике функции.
   * @param protocols Параметр protocols, используемый в логике функции.
   */
  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }

  /**
   * Отправляет данные.
   *
   * @param data Данные запроса или полезная нагрузка операции.
   */
  send(data: string) {
    this.sent.push(data);
  }

  /**
   * Закрывает тестовое соединение и освобождает ресурсы.
   */
  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code: 1000 } as CloseEvent);
  }

  /**
   * Выполняет open.
   */
  triggerOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  /**
   * Выполняет сообщения.
   *
   * @param data Данные запроса или полезная нагрузка операции.
   */
  triggerMessage(data: unknown) {
    this.onmessage?.(
      new MessageEvent("message", { data: JSON.stringify(data) }),
    );
  }

  /**
   * Выполняет error.
   */
  triggerError() {
    this.onerror?.(new Event("error"));
  }

  /**
   * Выполняет close.
   *
   * @param code Код приглашения или операции.
   */
  triggerClose(code = 1006) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }
}

describe("useReconnectingWebSocket", () => {
  /**
   * Выполняет метод `beforeEach`.
   * @returns Результат выполнения операции.
   */

  beforeEach(() => {
    vi.useRealTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  /**
   * Выполняет метод `afterEach`.
   * @returns Результат выполнения операции.
   */

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("connects and allows send when socket is open", async () => {
    const { result } = renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
      }),
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
    });

    await waitFor(() => expect(result.current.status).toBe("online"));

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.send("ping")).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(MockWebSocket.instances[0].sent).toEqual(["ping"]);
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("reconnects after unexpected close with backoff", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { result } = renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 20,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(MockWebSocket.instances).toHaveLength(1);

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].triggerClose(1011);
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.status).toBe("closed");

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      vi.advanceTimersByTime(15);
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("publishes a restored notice after a reconnect and clears it", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { result } = renderHook(() =>
      useReconnectingWebSocket({
        url: "ws://localhost/ws",
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 20,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].triggerClose(1011);
    });

    expect(result.current.connectionNotice?.type).toBe("lost");

    act(() => {
      vi.advanceTimersByTime(10);
    });

    act(() => {
      MockWebSocket.instances[1].triggerOpen();
    });

    expect(result.current.status).toBe("online");
    expect(result.current.connectionNotice?.type).toBe("restored");
    expect(result.current.connectionNotice?.message).toBe(
      "Соединение восстановлено",
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(result.current.connectionNotice).toBeNull();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("goes offline immediately when browser is offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("offline"));
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(MockWebSocket.instances).toHaveLength(0);
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("marks error when retry limit is reached", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { result } = renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
        maxRetries: 0,
        baseDelayMs: 10,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      MockWebSocket.instances[0].triggerClose(1011);
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.status).toBe("error");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.lastError).toBe("reconnect_limit");
  });

  it("does not open a canceled startup connection under StrictMode", () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children);

    renderHook(
      () =>
        useReconnectingWebSocket({
          url: "ws://localhost/ws",
        }),
      { wrapper },
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("does not open a stale startup connection after url changes", () => {
    vi.useFakeTimers();

    const { rerender } = renderHook(
      ({ url }: { url: string }) =>
        useReconnectingWebSocket({
          url,
        }),
      {
        initialProps: { url: "ws://localhost/ws/old" },
      },
    );

    rerender({ url: "ws://localhost/ws/new" });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe("ws://localhost/ws/new");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("exposes connection error and send=false when not open", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
        onError,
      }),
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      MockWebSocket.instances[0].triggerError();
    });

    /**
     * Выполняет метод `expect`.
     * @param onError Обработчик ошибки.
     * @returns Результат выполнения операции.
     */

    expect(onError).toHaveBeenCalledTimes(1);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.status).toBe("error");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.lastError).toBe("connection_error");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(result.current.send("x")).toBe(false);
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("calls onMessage callback", async () => {
    const onMessage = vi.fn();

    /**
     * Выполняет метод `renderHook`.
     * @returns Результат выполнения операции.
     */

    renderHook(() =>
      /**
       * Выполняет метод `useReconnectingWebSocket`.
       * @param props Свойства компонента.
       * @returns Результат выполнения операции.
       */

      useReconnectingWebSocket({
        url: "ws://localhost/ws",
        onMessage,
      }),
    );

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].triggerMessage({ type: "event" });
    });

    /**
     * Выполняет метод `expect`.
     * @param onMessage Обработчик входящего сообщения.
     * @returns Результат выполнения операции.
     */

    expect(onMessage).toHaveBeenCalledTimes(1);
  });
});
