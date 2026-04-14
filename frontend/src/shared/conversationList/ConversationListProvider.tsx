/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { chatController } from "../../controllers/ChatController";
import { groupController } from "../../controllers/GroupController";
import type { GlobalSearchResult } from "../../domain/interfaces/IApiService";
import type { ConversationItem } from "../../entities/conversation/types";
import type { GroupListItem } from "../../entities/group/types";
import type { UserProfile } from "../../entities/user/types";
import { useDirectInbox } from "../directInbox";
import {
  buildChatTargetPath,
  buildPublicChatPath,
  PUBLIC_CHAT_TARGET,
} from "../lib/chatTarget";
import { debugLog } from "../lib/debug";
import { normalizePublicRef } from "../lib/publicRef";
import { resolveIdentityLabel } from "../lib/userIdentity";
import { usePresence } from "../presence";
import {
  clearUnreadOverridesForRooms,
  useUnreadOverrides,
} from "../unreadOverrides/store";
import { CONVERSATION_LIST_REFRESH_EVENT } from "./events";

type FilterTab = "all" | "personal" | "groups";

type ServerRailItem = {
  key: string;
  roomId: number | null;
  roomTarget: string;
  name: string;
  path: string;
  avatarUrl: string | null;
  avatarCrop: GroupListItem["avatarCrop"] | null;
  unreadCount: number;
  isPublic: boolean;
};

type ConversationListState = {
  items: ConversationItem[];
  serverItems: ServerRailItem[];
  loading: boolean;
  error: string | null;
  filter: FilterTab;
  searchQuery: string;
  globalResults: GlobalSearchResult;
  globalLoading: boolean;
  isGlobalMode: boolean;
  setFilter: (tab: FilterTab) => void;
  setSearchQuery: (q: string) => void;
  refresh: () => void;
};

const EMPTY_GLOBAL_RESULTS: GlobalSearchResult = {
  users: [],
  groups: [],
  messages: [],
};

const fallback: ConversationListState = {
  items: [],
  serverItems: [],
  loading: false,
  error: null,
  filter: "all",
  searchQuery: "",
  globalResults: EMPTY_GLOBAL_RESULTS,
  globalLoading: false,
  isGlobalMode: false,
  setFilter: () => {},
  setSearchQuery: () => {},
  refresh: () => {},
};

const ConversationListCtx = createContext<ConversationListState>(fallback);

type Props = {
  user: UserProfile | null;
  ready: boolean;
  children: ReactNode;
};

const canRunGlobalSearchQuery = (query: string) => {
  const normalized = query.trim();
  if (normalized.length < 2) return false;
  if (!normalized.startsWith("@")) return true;
  return normalized.slice(1).trim().length >= 2;
};

const normalizeActorRef = (value: string): string =>
  normalizePublicRef(value).toLowerCase();

const toRoomKey = (roomId: number | null | undefined): string =>
  typeof roomId === "number" && Number.isFinite(roomId) && roomId > 0
    ? String(Math.trunc(roomId))
    : "";

const SERVER_UNREAD_POLL_MS = 12_000;

/**
 * Собирает и хранит состояние бокового списка диалогов и серверов.
 *
 * Провайдер объединяет данные из direct inbox, групп, публичной комнаты,
 * presence и глобального поиска, чтобы sidebar и связанные виджеты работали
 * с единым согласованным снимком состояния.
 */
export function ConversationListProvider({ user, ready, children }: Props) {
  const { items: directItems, unreadCounts } = useDirectInbox();
  const unreadOverrides = useUnreadOverrides();
  const { online: presenceOnline, status: presenceStatus } = usePresence();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomUnreads, setRoomUnreads] = useState<Record<string, number>>({});
  const [groupItems, setGroupItems] = useState<GroupListItem[]>([]);
  const [publicRoomId, setPublicRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalResults, setGlobalResults] =
    useState<GlobalSearchResult>(EMPTY_GLOBAL_RESULTS);
  const [globalLoading, setGlobalLoading] = useState(false);
  const mountedRef = useRef(true);
  const knownServerRoomIds = useMemo(() => {
    const roomIds: string[] = [];
    const publicRoomKey = toRoomKey(publicRoomId);
    if (publicRoomKey) {
      roomIds.push(publicRoomKey);
    }

    for (const group of groupItems) {
      const groupRoomKey = toRoomKey(group.roomId);
      if (groupRoomKey) {
        roomIds.push(groupRoomKey);
      }
    }

    return roomIds;
  }, [groupItems, publicRoomId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onlineUsernames = useMemo(
    () =>
      new Set(
        presenceStatus === "online"
          ? presenceOnline.map((entry) =>
              normalizeActorRef(entry.publicRef || ""),
            )
          : [],
      ),
    [presenceOnline, presenceStatus],
  );

  const applyRoomUnreadSnapshot = useCallback(
    (
      counts: Array<{ roomId: number; unreadCount: number }>,
      authoritativeRoomIds: Iterable<string>,
    ) => {
      const map: Record<string, number> = {};
      for (const item of counts) {
        map[String(item.roomId)] = item.unreadCount;
      }

      setRoomUnreads(map);
      clearUnreadOverridesForRooms(authoritativeRoomIds);
    },
    [],
  );

  const refreshUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      const counts = await chatController.getUnreadCounts();
      if (!mountedRef.current) return;
      applyRoomUnreadSnapshot(counts, knownServerRoomIds);
    } catch (err) {
      debugLog("Failed to refresh unread counts", err);
    }
  }, [applyRoomUnreadSnapshot, knownServerRoomIds, user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [counts, groups, publicRoom] = await Promise.all([
        chatController.getUnreadCounts(),
        groupController
          .getMyGroups()
          .catch(() => ({ items: [] as GroupListItem[], total: 0 })),
        chatController.resolveChatTarget(PUBLIC_CHAT_TARGET).catch(() => null),
      ]);
      if (!mountedRef.current) return;
      const nextAuthoritativeRoomIds: string[] = [];
      const publicRoomKey = toRoomKey(publicRoom?.roomId ?? null);
      if (publicRoomKey) {
        nextAuthoritativeRoomIds.push(publicRoomKey);
      }
      for (const group of groups.items) {
        const groupRoomKey = toRoomKey(group.roomId);
        if (groupRoomKey) {
          nextAuthoritativeRoomIds.push(groupRoomKey);
        }
      }

      applyRoomUnreadSnapshot(counts, nextAuthoritativeRoomIds);
      setGroupItems(groups.items);
      setPublicRoomId(publicRoom?.roomId ?? null);
      setError(null);
    } catch (err) {
      debugLog("Failed to fetch conversation data", err);
      if (mountedRef.current) setError("Не удалось загрузить список чатов.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [applyRoomUnreadSnapshot, user]);

  useEffect(() => {
    if (ready && user) {
      void fetchData();
    }
  }, [ready, user, fetchData]);

  useEffect(() => {
    if (!ready || !user) return;
    const onRefresh = () => {
      void fetchData();
    };
    window.addEventListener(CONVERSATION_LIST_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener(CONVERSATION_LIST_REFRESH_EVENT, onRefresh);
    };
  }, [fetchData, ready, user]);

  useEffect(() => {
    if (!ready || !user) return;

    const intervalId = window.setInterval(() => {
      void refreshUnreadCounts();
    }, SERVER_UNREAD_POLL_MS);

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refreshUnreadCounts();
    };

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [ready, refreshUnreadCounts, user]);

  const isGlobalMode = searchQuery.trim().length >= 2;
  const canRunGlobalSearch = canRunGlobalSearchQuery(searchQuery);

  const resolveUnreadCount = useCallback(
    (roomId: number | null, wsUnreadCount?: number) => {
      const roomKey = toRoomKey(roomId);
      if (!roomKey) {
        return typeof wsUnreadCount === "number" ? wsUnreadCount : 0;
      }
      const overrideUnread = unreadOverrides[roomKey];
      if (typeof overrideUnread === "number") return overrideUnread;
      if (typeof wsUnreadCount === "number") return wsUnreadCount;
      return roomUnreads[roomKey] ?? 0;
    },
    [roomUnreads, unreadOverrides],
  );

  useEffect(() => {
    if (!user || !isGlobalMode || !canRunGlobalSearch) {
      setGlobalLoading(false);
      setGlobalResults(EMPTY_GLOBAL_RESULTS);
      return;
    }

    let canceled = false;
    const timerId = window.setTimeout(() => {
      setGlobalLoading(true);
      chatController
        .globalSearch(searchQuery.trim())
        .then((result) => {
          if (!canceled) {
            setGlobalResults(result);
          }
        })
        .catch((err) => {
          debugLog("Global search failed", err);
          if (!canceled) {
            setGlobalResults(EMPTY_GLOBAL_RESULTS);
          }
        })
        .finally(() => {
          if (!canceled) {
            setGlobalLoading(false);
          }
        });
    }, 260);

    return () => {
      canceled = true;
      window.clearTimeout(timerId);
    };
  }, [canRunGlobalSearch, isGlobalMode, searchQuery, user]);

  const items = useMemo<ConversationItem[]>(() => {
    const conversations: ConversationItem[] = [];

    if (filter === "all") {
      conversations.push({
        type: "room",
        roomId: publicRoomId,
        roomTarget: PUBLIC_CHAT_TARGET,
        name: "Публичный чат",
        avatarUrl: null,
        avatarCrop: null,
        lastMessage: "Чат для всех участников",
        lastMessageAt: null,
        unreadCount: resolveUnreadCount(publicRoomId),
        isOnline: false,
        isMuted: false,
        isPinned: true,
      });
    }

    if (filter !== "groups") {
      for (const dm of directItems) {
        const dmUnread = resolveUnreadCount(dm.roomId, unreadCounts[String(dm.roomId)]);
        const peerRef = dm.peer.publicRef;
        conversations.push({
          type: "direct",
          roomId: dm.roomId,
          roomTarget: peerRef,
          name: resolveIdentityLabel(dm.peer),
          directRef: peerRef,
          avatarUrl: dm.peer.profileImage ?? null,
          avatarCrop: dm.peer.avatarCrop ?? null,
          lastMessage: dm.lastMessage,
          lastMessageAt: dm.lastMessageAt,
          unreadCount: dmUnread,
          isOnline: onlineUsernames.has(normalizeActorRef(peerRef)),
          isMuted: false,
        });
      }
    }

    if (filter !== "personal") {
      for (const group of groupItems) {
        if (conversations.some((item) => item.roomId === group.roomId)) continue;
        conversations.push({
          type: "group",
          roomId: group.roomId,
          roomTarget: group.roomTarget,
          name: group.name,
          avatarUrl: group.avatarUrl ?? null,
          avatarCrop: group.avatarCrop ?? null,
          lastMessage: group.description || "",
          lastMessageAt: null,
          unreadCount: resolveUnreadCount(group.roomId),
          isOnline: false,
          isMuted: false,
        });
      }
    }

    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (b.isPinned && !a.isPinned) return 1;
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });

    if (!searchQuery.trim() || isGlobalMode) {
      return conversations;
    }

    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((item) => item.name.toLowerCase().includes(q));
  }, [
    directItems,
    filter,
    groupItems,
    isGlobalMode,
    onlineUsernames,
    publicRoomId,
    resolveUnreadCount,
    searchQuery,
    unreadCounts,
  ]);

  const serverItems = useMemo<ServerRailItem[]>(() => {
    const next: ServerRailItem[] = [
      {
        key: "public",
        roomId: publicRoomId,
        roomTarget: PUBLIC_CHAT_TARGET,
        name: "Публичный чат",
        path: buildPublicChatPath(),
        avatarUrl: null,
        avatarCrop: null,
        unreadCount: resolveUnreadCount(publicRoomId),
        isPublic: true,
      },
    ];

    for (const group of groupItems) {
      next.push({
        key: `group-${group.roomId}`,
        roomId: group.roomId,
        roomTarget: group.roomTarget,
        name: group.name,
        path: buildChatTargetPath(group.roomTarget),
        avatarUrl: group.avatarUrl ?? null,
        avatarCrop: group.avatarCrop ?? null,
        unreadCount: resolveUnreadCount(group.roomId),
        isPublic: false,
      });
    }

    return next;
  }, [groupItems, publicRoomId, resolveUnreadCount]);

  const value: ConversationListState = {
    items,
    serverItems,
    loading,
    error,
    filter,
    searchQuery,
    globalResults,
    globalLoading,
    isGlobalMode,
    setFilter,
    setSearchQuery,
    refresh: fetchData,
  };

  return (
    <ConversationListCtx.Provider value={value}>
      {children}
    </ConversationListCtx.Provider>
  );
}

/**
 * React-хук `useConversationList`.
 */
export function useConversationList() {
  return useContext(ConversationListCtx);
}

export type { FilterTab, ServerRailItem };
