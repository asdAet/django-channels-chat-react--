import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wsMock = vi.hoisted(() => ({
  status: "online" as const,
  lastError: null as string | null,
  send: vi.fn<(payload: string) => boolean>(),
  options: null as {
    url: string | null;
    onMessage?: (event: MessageEvent) => void;
    onOpen?: () => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
  } | null,
}));

vi.mock("../../hooks/useReconnectingWebSocket", () => ({
  useReconnectingWebSocket: (options: unknown) => {
    wsMock.options = options as {
      url: string | null;
      onMessage?: (event: MessageEvent) => void;
      onOpen?: () => void;
      onClose?: (event: CloseEvent) => void;
      onError?: (event: Event) => void;
    };
    return {
      status: wsMock.status,
      lastError: wsMock.lastError,
      send: wsMock.send,
      reconnect: vi.fn(),
    };
  },
}));

import { WsAuthProvider } from "../wsAuth";
import { ChatRealtimeProvider } from "./ChatRealtimeProvider";
import { useChatRealtimeRoom } from "./useChatRealtimeRoom";

function Probe({ roomId }: { roomId: number | null }) {
  const realtime = useChatRealtimeRoom({ roomId });
  return <p data-testid="status">{realtime.status}</p>;
}

const getSentPayloads = () =>
  wsMock.send.mock.calls.map(([payload]) => JSON.parse(payload));

describe("ChatRealtimeProvider", () => {
  beforeEach(() => {
    vi.useRealTimers();
    wsMock.status = "online";
    wsMock.lastError = null;
    wsMock.options = null;
    wsMock.send.mockReset().mockReturnValue(true);
  });

  it("connects through a single app-level websocket url with auth token", async () => {
    render(
      <WsAuthProvider token="auth-token">
        <ChatRealtimeProvider>
          <Probe roomId={1} />
        </ChatRealtimeProvider>
      </WsAuthProvider>,
    );

    await waitFor(() => expect(wsMock.options?.url).toContain("/ws/chat/"));
    expect(wsMock.options?.url).toContain("wst=auth-token");
    expect(wsMock.options?.url).not.toContain("/ws/chat/1/");
    expect(screen.getByTestId("status").textContent).toBe("online");
  });

  it("keeps the websocket alive while switching rooms and resubscribes by command", async () => {
    const { rerender } = render(
      <ChatRealtimeProvider>
        <Probe roomId={1} />
      </ChatRealtimeProvider>,
    );

    await waitFor(() => {
      expect(getSentPayloads()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "set_active_room", roomId: 1 }),
          expect.objectContaining({ type: "ping" }),
        ]),
      );
    });

    rerender(
      <ChatRealtimeProvider>
        <Probe roomId={7} />
      </ChatRealtimeProvider>,
    );

    await waitFor(() => {
      expect(getSentPayloads()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "set_active_room", roomId: 7 }),
        ]),
      );
    });

    expect(wsMock.options?.url).toContain("/ws/chat/");
    expect(wsMock.options?.url).not.toContain("/ws/chat/7/");
  });

  it("sends heartbeat immediately and by interval while online", async () => {
    vi.useFakeTimers();

    render(
      <ChatRealtimeProvider>
        <Probe roomId={1} />
      </ChatRealtimeProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getSentPayloads()).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "ping" })]),
    );

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(
      getSentPayloads().filter((payload) => payload.type === "ping"),
    ).toHaveLength(2);
  });

  it("clears the active room without disconnecting the transport", async () => {
    const { rerender } = render(
      <ChatRealtimeProvider>
        <Probe roomId={1} />
      </ChatRealtimeProvider>,
    );

    await waitFor(() => {
      expect(getSentPayloads()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "set_active_room", roomId: 1 }),
        ]),
      );
    });

    rerender(
      <ChatRealtimeProvider>
        <Probe roomId={null} />
      </ChatRealtimeProvider>,
    );

    await waitFor(() => {
      expect(getSentPayloads()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "set_active_room", roomId: null }),
        ]),
      );
    });

    expect(screen.getByTestId("status").textContent).toBe("idle");
  });
});
