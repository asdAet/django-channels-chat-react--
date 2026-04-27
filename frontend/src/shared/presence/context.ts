import { createContext } from "react";

import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";
import type { OnlineUser } from "../api/users";

/**
 * Описывает значение контекста `Presence`.
 */
export type PresenceContextValue = {
  online: OnlineUser[];
  guests: number;
  status: WebSocketStatus;
  lastError: string | null;
};

/**
 * Константа `FALLBACK_PRESENCE` описывает резервное значение для безопасного fallback.
 */

export const FALLBACK_PRESENCE: PresenceContextValue = {
  online: [],
  guests: 0,
  status: "idle",
  lastError: null,
};

/**
 * Константа `PresenceContext` хранит используемое в модуле значение.
 */

export const PresenceContext =
  createContext<PresenceContextValue>(FALLBACK_PRESENCE);
