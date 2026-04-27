import { createContext } from "react";

import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";

export type ChatRealtimeListener = {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
};

export type ChatRealtimeContextValue = {
  status: WebSocketStatus;
  lastError: string | null;
  send: (data: string) => boolean;
  registerListener: (listener: ChatRealtimeListener) => () => void;
  activateRoom: (ownerId: string, roomId: number | null) => void;
  releaseRoom: (ownerId: string) => void;
};

const noop = () => {};
const noopSend = () => false;

export const FALLBACK_CHAT_REALTIME: ChatRealtimeContextValue = {
  status: "idle",
  lastError: null,
  send: noopSend,
  registerListener: () => noop,
  activateRoom: noop,
  releaseRoom: noop,
};

export const ChatRealtimeContext = createContext<ChatRealtimeContextValue>(
  FALLBACK_CHAT_REALTIME,
);
