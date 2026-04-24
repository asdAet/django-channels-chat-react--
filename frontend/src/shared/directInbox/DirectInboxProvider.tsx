import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { chatController } from "../../controllers/ChatController";
import { decodeDirectInboxWsEvent } from "../../dto";
import type { DirectChatListItem as DirectChatListItemDto } from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import { useReconnectingWebSocket } from "../../hooks/useReconnectingWebSocket";
import { invalidateDirectChats } from "../cache/cacheManager";
import { debugLog } from "../lib/debug";
import { appendWebSocketAuthToken, getWebSocketBase } from "../lib/ws";
import {
  clearUnreadOverride,
  clearUnreadOverridesForRooms,
  collectSettledUnreadOverrideRoomIds,
  useUnreadOverrides,
} from "../unreadOverrides/store";
import { useWsAuthToken } from "../wsAuth/useWsAuthToken";
import { DirectInboxContext } from "./context";

const DIRECT_INBOX_PING_MS = 15_000;

type ProviderProps = {
  user: UserProfile | null;
  ready?: boolean;
  children: ReactNode;
};

const mergeItem = (
  prev: DirectChatListItemDto[],
  incoming: DirectChatListItemDto,
) => {
  const filtered = prev.filter((item) => item.roomId !== incoming.roomId);
  const next = [incoming, ...filtered];

  next.sort((a, b) => {
    const aTs = new Date(a.lastMessageAt).getTime();
    const bTs = new Date(b.lastMessageAt).getTime();
    if (!Number.isFinite(aTs) && !Number.isFinite(bTs)) return 0;
    if (!Number.isFinite(aTs)) return 1;
    if (!Number.isFinite(bTs)) return -1;
    return bTs - aTs;
  });

  return next;
};

const parseRoomIdRef = (
  value: string | number | null | undefined,
): number | null => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.trunc(value);
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
};

/**
 * Поддерживает список личных чатов и их unread-состояние в реальном времени.
 *
 * Провайдер загружает начальный inbox по HTTP, затем синхронизирует его через
 * `ws/inbox`, применяя ack/unread update события и локальные unread overrides.
 */
export function DirectInboxProvider({
  user,
  ready = true,
  children,
}: ProviderProps) {
  const authWsToken = useWsAuthToken();
  const [items, setItems] = useState<DirectChatListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setUnreadRoomIds] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [roomUnreadCounts, setRoomUnreadCounts] = useState<
    Record<string, number>
  >({});
  const unreadOverrides = useUnreadOverrides();

  const activeRoomRef = useRef<string | number | null>(null);
  const knownDirectRoomIds = useMemo(
    () => items.map((item) => String(item.roomId)),
    [items],
  );

  const wsUrl = useMemo(() => {
    if (!ready || !user) return null;
    return appendWebSocketAuthToken(
      `${getWebSocketBase()}/ws/inbox/`,
      authWsToken,
    );
  }, [authWsToken, ready, user]);

  const applyUnreadState = useCallback(
    (next: {
      dialogs: number;
      roomIds: string[];
      counts: Record<string, number>;
    }) => {
      const settledOverrideRoomIds = collectSettledUnreadOverrideRoomIds({
        authoritativeRoomIds: new Set([
          ...knownDirectRoomIds,
          ...Object.keys(next.counts),
        ]),
        authoritativeCounts: next.counts,
      });

      setUnreadRoomIds(next.roomIds);
      setUnreadCounts(next.counts);
      clearUnreadOverridesForRooms(settledOverrideRoomIds);
    },
    [knownDirectRoomIds],
  );

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatController.getDirectChats();
      setItems(response.items || []);
    } catch (err) {
      debugLog("Direct inbox initial load failed", err);
      setError("Не удалось загрузить список чатов.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const decoded = decodeDirectInboxWsEvent(event.data);

      switch (decoded.type) {
        case "direct_unread_state":
          applyUnreadState(decoded.unread);
          break;
        case "direct_inbox_item": {
          const incomingItem = decoded.item;
          if (incomingItem) {
            setItems((prev) => mergeItem(prev, incomingItem));
          }
          invalidateDirectChats();
          if (decoded.unread) {
            applyUnreadState(decoded.unread);
          }
          break;
        }
        case "direct_mark_read_ack":
          applyUnreadState(decoded.unread);
          break;
        case "room_unread_state":
          setRoomUnreadCounts(decoded.unread.counts);
          break;
        case "error":
          if (decoded.code === "forbidden") {
            setError("Недостаточно прав для этой комнаты.");
          }
          break;
        default:
          break;
      }
    },
    [applyUnreadState],
  );

  const { status, lastError, send } = useReconnectingWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onOpen: () => setError(null),
    onError: (err) => debugLog("Direct inbox WS error", err),
  });

  const setActiveRoom = useCallback(
    (roomRef: string | number | null) => {
      activeRoomRef.current = roomRef;
      if (status !== "online") return;
      const roomId = parseRoomIdRef(roomRef);
      send(JSON.stringify({ type: "set_active_room", roomId }));
    },
    [send, status],
  );

  const markRead = useCallback(
    (roomRef: string | number) => {
      const roomId = parseRoomIdRef(roomRef);
      if (!roomId) return;
      const roomKey = String(roomId);
      clearUnreadOverride(roomKey);

      setUnreadRoomIds((prev) => prev.filter((item) => item !== roomKey));
      setUnreadCounts((prev) => {
        if (!(roomKey in prev)) return prev;
        const next = { ...prev };
        delete next[roomKey];
        return next;
      });

      if (status !== "online") return;
      send(JSON.stringify({ type: "mark_read", roomId }));
    },
    [send, status],
  );

  const unreadCountsWithOverrides = useMemo(() => {
    const knownDirectRoomIds = new Set(items.map((item) => String(item.roomId)));
    const nextCounts = { ...unreadCounts };

    for (const [roomId, overrideCount] of Object.entries(unreadOverrides)) {
      if (!knownDirectRoomIds.has(roomId)) continue;
      if (overrideCount > 0) {
        nextCounts[roomId] = overrideCount;
      } else {
        delete nextCounts[roomId];
      }
    }

    return nextCounts;
  }, [items, unreadCounts, unreadOverrides]);

  const unreadRoomIdsWithOverrides = useMemo(
    () =>
      Object.keys(unreadCountsWithOverrides).filter(
        (roomId) => unreadCountsWithOverrides[roomId] > 0,
      ),
    [unreadCountsWithOverrides],
  );

  const unreadDialogsCountWithOverrides = unreadRoomIdsWithOverrides.length;

  useEffect(() => {
    let active = true;

    if (!ready || !user) {
      queueMicrotask(() => {
        if (!active) return;
        setItems([]);
        setUnreadRoomIds([]);
        setUnreadCounts({});
        setRoomUnreadCounts({});
        setLoading(false);
        setError(null);
      });
      return () => {
        active = false;
      };
    }

    void refresh();

    return () => {
      active = false;
    };
  }, [ready, user, refresh]);

  useEffect(() => {
    if (status !== "online") return;

    send(JSON.stringify({ type: "ping", ts: Date.now() }));
    send(
      JSON.stringify({
        type: "set_active_room",
        roomId: parseRoomIdRef(activeRoomRef.current),
      }),
    );

    const id = window.setInterval(() => {
      send(JSON.stringify({ type: "ping", ts: Date.now() }));
    }, DIRECT_INBOX_PING_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [send, status]);

  useEffect(() => {
    if (!lastError || status !== "error") return;
    queueMicrotask(() => setError("Ошибка подключения списка чатов."));
  }, [lastError, status]);

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      status,
      unreadRoomIds: unreadRoomIdsWithOverrides,
      unreadCounts: unreadCountsWithOverrides,
      unreadDialogsCount: unreadDialogsCountWithOverrides,
      roomUnreadCounts,
      setActiveRoom,
      markRead,
      refresh,
    }),
    [
      error,
      items,
      loading,
      markRead,
      refresh,
      setActiveRoom,
      status,
      unreadCountsWithOverrides,
      unreadDialogsCountWithOverrides,
      unreadRoomIdsWithOverrides,
      roomUnreadCounts,
    ],
  );

  return (
    <DirectInboxContext.Provider value={value}>
      {children}
    </DirectInboxContext.Provider>
  );
}
