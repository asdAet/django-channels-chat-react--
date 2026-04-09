import { createContext } from "react";

import type { DirectChatListItem as DirectChatListItemDto } from "../../entities/room/types";
import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";

export type DirectInboxContextValue = {
  items: DirectChatListItemDto[];
  loading: boolean;
  error: string | null;
  status: WebSocketStatus;
  unreadRoomIds: string[];
  unreadCounts: Record<string, number>;
  unreadDialogsCount: number;
  setActiveRoom: (roomRef: string | number | null) => void;
  markRead: (roomRef: string | number) => void;
  refresh: () => Promise<void>;
};

const noop = () => {};
const noopAsync = async () => {};

/**
 * Константа `FALLBACK_DIRECT_INBOX`, используемая как fallback direct inbox.
 */
export const FALLBACK_DIRECT_INBOX: DirectInboxContextValue = {
  items: [],
  loading: false,
  error: null,
  status: "idle",
  unreadRoomIds: [],
  unreadCounts: {},
  unreadDialogsCount: 0,
  setActiveRoom: noop,
  markRead: noop,
  refresh: noopAsync,
};

/**
 * Константа `DirectInboxContext`, используемая как direct inbox context.
 *
 * @param FALLBACK_DIRECT_INBOX Контекст `FALLBACK_DIRECT_INBOX`.
 */
export const DirectInboxContext = createContext<DirectInboxContextValue>(
  FALLBACK_DIRECT_INBOX,
);
