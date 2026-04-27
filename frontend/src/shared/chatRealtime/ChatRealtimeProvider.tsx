import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useReconnectingWebSocket } from "../../hooks/useReconnectingWebSocket";
import { appendWebSocketAuthToken, getWebSocketBase } from "../lib/ws";
import { useWsAuthToken } from "../wsAuth/useWsAuthToken";
import type { ChatRealtimeListener } from "./context";
import { ChatRealtimeContext } from "./context";

const CHAT_HEARTBEAT_MS = 15_000;

type ProviderProps = {
  ready?: boolean;
  children: ReactNode;
};

export function ChatRealtimeProvider({
  ready = true,
  children,
}: ProviderProps) {
  const authWsToken = useWsAuthToken();
  const listenersRef = useRef<Set<ChatRealtimeListener>>(new Set());
  const activeBindingRef = useRef<{ ownerId: string; roomId: number | null } | null>(
    null,
  );

  const dispatchListeners = useCallback(
    (key: keyof ChatRealtimeListener, ...args: unknown[]) => {
      listenersRef.current.forEach((listener) => {
        const handler = listener[key];
        if (handler) {
          (handler as (...innerArgs: unknown[]) => void)(...args);
        }
      });
    },
    [],
  );

  const wsUrl = useMemo(() => {
    if (!ready) return null;
    return appendWebSocketAuthToken(`${getWebSocketBase()}/ws/chat/`, authWsToken);
  }, [authWsToken, ready]);

  const sendSetActiveRoomRef = useRef<(roomId: number | null) => boolean>(() => false);

  const { status, lastError, send } = useReconnectingWebSocket({
    url: wsUrl,
    onMessage: (event) => dispatchListeners("onMessage", event),
    onOpen: () => {
      const activeBinding = activeBindingRef.current;
      if (activeBinding) {
        sendSetActiveRoomRef.current(activeBinding.roomId);
      }
      dispatchListeners("onOpen");
    },
    onClose: (event) => dispatchListeners("onClose", event),
    onError: (event) => dispatchListeners("onError", event),
  });

  const sendSetActiveRoom = useCallback(
    (roomId: number | null) =>
      send(JSON.stringify({ type: "set_active_room", roomId })),
    [send],
  );

  useEffect(() => {
    sendSetActiveRoomRef.current = sendSetActiveRoom;
  }, [sendSetActiveRoom]);

  useEffect(() => {
    if (status !== "online") {
      return;
    }

    const sendHeartbeat = () => {
      send(JSON.stringify({ type: "ping", ts: Date.now() }));
    };

    sendHeartbeat();
    const timerId = window.setInterval(sendHeartbeat, CHAT_HEARTBEAT_MS);
    return () => window.clearInterval(timerId);
  }, [send, status]);

  const registerListener = useCallback((listener: ChatRealtimeListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const activateRoom = useCallback(
    (ownerId: string, roomId: number | null) => {
      const current = activeBindingRef.current;
      if (current?.ownerId === ownerId && current.roomId === roomId) {
        return;
      }

      activeBindingRef.current = { ownerId, roomId };
      if (status === "online") {
        sendSetActiveRoom(roomId);
      }
    },
    [sendSetActiveRoom, status],
  );

  const releaseRoom = useCallback(
    (ownerId: string) => {
      const current = activeBindingRef.current;
      if (!current || current.ownerId !== ownerId) {
        return;
      }

      activeBindingRef.current = null;
      if (status === "online") {
        sendSetActiveRoom(null);
      }
    },
    [sendSetActiveRoom, status],
  );

  const value = useMemo(
    () => ({
      status,
      lastError,
      send,
      registerListener,
      activateRoom,
      releaseRoom,
    }),
    [activateRoom, lastError, registerListener, releaseRoom, send, status],
  );

  return (
    <ChatRealtimeContext.Provider value={value}>
      {children}
    </ChatRealtimeContext.Provider>
  );
}
