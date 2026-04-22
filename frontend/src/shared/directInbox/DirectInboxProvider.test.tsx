import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wsMock = vi.hoisted(() => ({
  status: "online" as
    | "online"
    | "offline"
    | "error"
    | "connecting"
    | "idle"
    | "closed",
  lastError: null as string | null,
  send: vi.fn<(payload: string) => boolean>(),
  options: null as {
    url: string | null;
    onMessage?: (event: MessageEvent) => void;
  } | null,
}));

const chatMock = vi.hoisted(() => ({
  getDirectChats:
    vi.fn<
      () => Promise<{
        items: Array<{
          roomId: number;
          peer: {
            publicRef: string;
            username: string;
            profileImage: string | null;
          };
          lastMessage: string;
          lastMessageAt: string;
        }>;
      }>
    >(),
}));

vi.mock("../../controllers/ChatController", () => ({
  chatController: chatMock,
}));

vi.mock("../../hooks/useReconnectingWebSocket", () => ({
  useReconnectingWebSocket: (options: unknown) => {
    wsMock.options = options as {
      url: string | null;
      onMessage?: (event: MessageEvent) => void;
    };
    return {
      status: wsMock.status,
      lastError: wsMock.lastError,
      send: wsMock.send,
      reconnect: vi.fn(),
    };
  },
}));

import {
  resetUnreadOverrides,
  setUnreadOverride,
} from "../unreadOverrides/store";
import { WsAuthProvider } from "../wsAuth";
import { DirectInboxProvider } from "./DirectInboxProvider";
import { useDirectInbox } from "./useDirectInbox";

const user = {
  publicRef: "demo",
  username: "demo",
  email: "demo@example.com",
  profileImage: null,
  bio: "",
  lastSeen: null,
  registeredAt: null,
};

/**
 * Проверяет состояние провайдера в тестовом окружении.
 */
function Probe() {
  const inbox = useDirectInbox();

  return (
    <div>
      <p data-testid="loading">{String(inbox.loading)}</p>
      <p data-testid="unread-count">{inbox.unreadDialogsCount}</p>
      <p data-testid="unread-counts">{JSON.stringify(inbox.unreadCounts)}</p>
      <p data-testid="room-unread-counts">
        {JSON.stringify(inbox.roomUnreadCounts)}
      </p>
      <p data-testid="items-order">
        {inbox.items.map((item) => item.roomId).join(",")}
      </p>
      <button onClick={() => inbox.setActiveRoom("1")}>set-active</button>
      <button onClick={() => inbox.markRead("1")}>mark-read</button>
    </div>
  );
}

/**
 * Выполняет функцию `sentPayloads`.
 * @returns Результат выполнения операции.
 */

/**
 * Возвращает отправленные payload для последующих проверок.
 */
const sentPayloads = () =>
  wsMock.send.mock.calls.map(([raw]) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

describe("DirectInboxProvider", () => {
  /**
   * Выполняет метод `beforeEach`.
   * @returns Результат выполнения операции.
   */

  beforeEach(() => {
    wsMock.status = "online";
    wsMock.lastError = null;
    wsMock.send.mockReset().mockReturnValue(true);
    wsMock.options = null;
    chatMock.getDirectChats.mockReset().mockResolvedValue({ items: [] });
    resetUnreadOverrides();
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("loads initial chats and applies unread events", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения операции.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения операции.
       */

      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 2 } },
          }),
        }),
      );
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":2}');

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_mark_read_ack",
            unread: { dialogs: 0, roomIds: [], counts: {} },
          }),
        }),
      );
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("0");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
  });

  it("stores authoritative room unread counts from inbox websocket", async () => {
    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "room_unread_state",
            unread: { dialogs: 2, roomIds: [1, 5], counts: { "1": 3, "5": 1 } },
          }),
        }),
      );
    });

    expect(screen.getByTestId("room-unread-counts").textContent).toBe(
      '{"1":3,"5":1}',
    );
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("reorders chats when realtime item arrives", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "old",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
        {
          roomId: 2,
          peer: { publicRef: "bob", username: "bob", profileImage: null },
          lastMessage: "new",
          lastMessageAt: "2026-02-13T11:00:00Z",
        },
      ],
    });

    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения операции.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения операции.
       */

      expect(screen.getByTestId("items-order").textContent).toBe(
        "1,2",
      );
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_inbox_item",
            item: {
              roomId: 1,
              peer: {
                publicRef: "alice",
                username: "alice",
                profileImage: null,
              },
              lastMessage: "latest",
              lastMessageAt: "2026-02-13T12:00:00Z",
            },
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 3 } },
          }),
        }),
      );
    });

    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("items-order").textContent).toBe("1,2");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe(
      '{"1":3}',
    );
    expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("sends mark_read and set_active_room commands", async () => {
    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения операции.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения операции.
       */

      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения операции.
     */

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 1 } },
          }),
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "mark-read" }));
    fireEvent.click(screen.getByRole("button", { name: "set-active" }));

    const payloads = sentPayloads();
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "mark_read" && payload?.roomId === 1,
      ),
    ).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "set_active_room" && payload?.roomId === 1,
      ),
    ).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("0");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения операции.
   */

  it("re-sends active room after reconnect", async () => {
    wsMock.status = "offline";

    const { rerender } = render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения операции.
       */

      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "set-active" }));
    wsMock.send.mockClear();

    wsMock.status = "online";
    /**
     * Выполняет метод `rerender`.
     * @returns Результат выполнения операции.
     */

    rerender(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    const payloads = sentPayloads();
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(payloads.some((payload) => payload?.type === "ping")).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения операции.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "set_active_room" && payload?.roomId === 1,
      ),
    ).toBe(true);
  });

  it("appends ws auth token to inbox websocket url", async () => {
    render(
      <WsAuthProvider token="auth-token">
        <DirectInboxProvider user={user}>
          <Probe />
        </DirectInboxProvider>
      </WsAuthProvider>,
    );

    await waitFor(() => {
      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    expect(wsMock.options?.url).toContain("/ws/inbox/");
    expect(wsMock.options?.url).toContain("wst=auth-token");
  });

  it("applies local unread override for active direct chat to counts and dialogs", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 0, roomIds: [], counts: {} },
          }),
        }),
      );
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 4 });
    });

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":4}');
  });

  it("applies local unread override on top of existing direct inbox count", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 7 } },
          }),
        }),
      );
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 3 });
    });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count").textContent).toBe("1");
      expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":3}');
    });
  });

  it("keeps local lower unread override while websocket snapshot is stale", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 6 } },
          }),
        }),
      );
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 2 });
    });

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 5 } },
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count").textContent).toBe("1");
      expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":2}');
    });
  });

  it("drops local override after websocket catches up to the same unread count", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 2 });
    });

    expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":2}');

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 2 } },
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count").textContent).toBe("1");
      expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":2}');
    });
  });

  it("keeps local zero override while websocket still reports stale unread", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 0 });
    });

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 1, roomIds: [1], counts: { "1": 2 } },
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count").textContent).toBe("0");
      expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
    });
  });

  it("drops local zero override after websocket confirms full read", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          roomId: 1,
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    act(() => {
      setUnreadOverride({ roomId: "1", unreadCount: 0 });
    });

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");

    act(() => {
      wsMock.options?.onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({
            type: "direct_unread_state",
            unread: { dialogs: 0, roomIds: [], counts: {} },
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count").textContent).toBe("0");
      expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
    });
  });
});
