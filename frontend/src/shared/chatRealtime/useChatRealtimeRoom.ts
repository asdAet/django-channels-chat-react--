import { useContext, useEffect, useId, useMemo, useRef } from "react";

import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";
import type { ChatRealtimeListener } from "./context";
import { ChatRealtimeContext } from "./context";

type UseChatRealtimeRoomOptions = ChatRealtimeListener & {
  roomId: number | null;
  enabled?: boolean;
};

type UseChatRealtimeRoomResult = {
  status: WebSocketStatus;
  lastError: string | null;
  send: (data: string) => boolean;
};

export function useChatRealtimeRoom({
  roomId,
  enabled = true,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseChatRealtimeRoomOptions): UseChatRealtimeRoomResult {
  const realtime = useContext(ChatRealtimeContext);
  const {
    status,
    lastError,
    send,
    registerListener,
    activateRoom,
    releaseRoom,
  } = realtime;
  const ownerId = useId();
  const handlersRef = useRef<ChatRealtimeListener>({
    onMessage,
    onOpen,
    onClose,
    onError,
  });
  const listener = useMemo<ChatRealtimeListener>(
    () => ({
      onMessage: (event) => handlersRef.current.onMessage?.(event),
      onOpen: () => handlersRef.current.onOpen?.(),
      onClose: (event) => handlersRef.current.onClose?.(event),
      onError: (event) => handlersRef.current.onError?.(event),
    }),
    [],
  );

  useEffect(() => {
    handlersRef.current = { onMessage, onOpen, onClose, onError };
  }, [onClose, onError, onMessage, onOpen]);

  useEffect(() => registerListener(listener), [listener, registerListener]);

  useEffect(() => {
    if (!enabled || roomId === null) {
      releaseRoom(ownerId);
      return;
    }

    activateRoom(ownerId, roomId);
    return () => {
      releaseRoom(ownerId);
    };
  }, [activateRoom, enabled, ownerId, releaseRoom, roomId]);

  return {
    status: enabled && roomId !== null ? status : "idle",
    lastError: enabled && roomId !== null ? lastError : null,
    send: enabled && roomId !== null ? send : () => false,
  };
}
