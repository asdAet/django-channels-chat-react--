import { createContext } from "react";

import type { DirectChatListItem as DirectChatListItemDto } from "../../entities/room/types";
import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";

/**
 * Описывает значение контекста `DirectInbox`.
 */
export type DirectInboxContextValue = {
  items: DirectChatListItemDto[];
  loading: boolean;
  error: string | null;
  status: WebSocketStatus;
  unreadSlugs: string[];
  unreadCounts: Record<string, number>;
  unreadDialogsCount: number;
  setActiveRoom: (roomRef: string | number | null) => void;
  markRead: (roomRef: string | number) => void;
  refresh: () => Promise<void>;
};

/**
 * Обрабатывает noop.
 */


const noop = () => {};
/**
 * Обрабатывает noop async.
 */


const noopAsync = async () => {};

/**
 * Константа `FALLBACK_DIRECT_INBOX` описывает резервное значение для безопасного fallback.
 */

export const FALLBACK_DIRECT_INBOX: DirectInboxContextValue = {
  items: [],
  loading: false,
  error: null,
  status: "idle",
  unreadSlugs: [],
  unreadCounts: {},
  unreadDialogsCount: 0,
  setActiveRoom: noop,
  markRead: noop,
  refresh: noopAsync,
};

/**
 * Константа `DirectInboxContext` хранит используемое в модуле значение.
 */

export const DirectInboxContext = createContext<DirectInboxContextValue>(
  FALLBACK_DIRECT_INBOX,
);
