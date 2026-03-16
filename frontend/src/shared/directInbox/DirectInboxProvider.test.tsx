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
          slug: string;
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

import { DirectInboxProvider } from "./DirectInboxProvider";
import { useDirectInbox } from "./useDirectInbox";
import {
  resetUnreadOverrides,
  setUnreadOverride,
} from "../unreadOverrides/store";

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
 * Рендерит компонент `Probe` и связанную разметку.
 * @returns Результат выполнения `Probe`.
 */

function Probe() {
  const inbox = useDirectInbox();

  return (
    <div>
      <p data-testid="loading">{String(inbox.loading)}</p>
      <p data-testid="unread-count">{inbox.unreadDialogsCount}</p>
      <p data-testid="unread-counts">{JSON.stringify(inbox.unreadCounts)}</p>
      <p data-testid="items-order">
        {inbox.items.map((item) => item.slug).join(",")}
      </p>
      <button onClick={() => inbox.setActiveRoom("1")}>set-active</button>
      <button onClick={() => inbox.markRead("1")}>mark-read</button>
    </div>
  );
}

/**
 * Выполняет функцию `sentPayloads`.
 * @returns Результат выполнения `sentPayloads`.
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
   * @returns Результат выполнения `beforeEach`.
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
   * @returns Результат выполнения `it`.
   */

  it("loads initial chats and applies unread events", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          slug: "1",
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "hello",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
      ],
    });

    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения `render`.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения `expect`.
       */

      expect(screen.getByTestId("items-order").textContent).toBe("1");
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения `act`.
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
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":2}');

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения `act`.
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
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("0");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения `it`.
   */

  it("reorders chats when realtime item arrives", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          slug: "1",
          peer: { publicRef: "alice", username: "alice", profileImage: null },
          lastMessage: "old",
          lastMessageAt: "2026-02-13T10:00:00Z",
        },
        {
          slug: "2",
          peer: { publicRef: "bob", username: "bob", profileImage: null },
          lastMessage: "new",
          lastMessageAt: "2026-02-13T11:00:00Z",
        },
      ],
    });

    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения `render`.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения `expect`.
       */

      expect(screen.getByTestId("items-order").textContent).toBe(
        "1,2",
      );
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения `act`.
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
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("items-order").textContent).toBe("1,2");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe(
      '{"1":3}',
    );
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения `it`.
   */

  it("sends mark_read and set_active_room commands", async () => {
    /**
     * Выполняет метод `render`.
     * @returns Результат выполнения `render`.
     */

    render(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    await waitFor(() => {
      /**
       * Выполняет метод `expect`.
       * @returns Результат выполнения `expect`.
       */

      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    /**
     * Выполняет метод `act`.
     * @returns Результат выполнения `act`.
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
     * @returns Результат выполнения `expect`.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "mark_read" && payload?.roomId === 1,
      ),
    ).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "set_active_room" && payload?.roomId === 1,
      ),
    ).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-count").textContent).toBe("0");
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(screen.getByTestId("unread-counts").textContent).toBe("{}");
  });

  /**
   * Выполняет метод `it`.
   * @returns Результат выполнения `it`.
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
       * @returns Результат выполнения `expect`.
       */

      expect(chatMock.getDirectChats).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "set-active" }));
    wsMock.send.mockClear();

    wsMock.status = "online";
    /**
     * Выполняет метод `rerender`.
     * @returns Результат выполнения `rerender`.
     */

    rerender(
      <DirectInboxProvider user={user}>
        <Probe />
      </DirectInboxProvider>,
    );

    const payloads = sentPayloads();
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(payloads.some((payload) => payload?.type === "ping")).toBe(true);
    /**
     * Выполняет метод `expect`.
     * @returns Результат выполнения `expect`.
     */

    expect(
      payloads.some(
        (payload) =>
          payload?.type === "set_active_room" && payload?.roomId === 1,
      ),
    ).toBe(true);
  });

  it("applies local unread override for active direct chat to counts and dialogs", async () => {
    chatMock.getDirectChats.mockResolvedValue({
      items: [
        {
          slug: "1",
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
      setUnreadOverride({ roomSlug: "1", unreadCount: 4 });
    });

    expect(screen.getByTestId("unread-count").textContent).toBe("1");
    expect(screen.getByTestId("unread-counts").textContent).toBe('{"1":4}');
  });
});
