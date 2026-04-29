import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Message } from "../../entities/message/types";
import { setUnreadOverride } from "../unreadOverrides/store";
import {
  type RoomReadLocalInput,
  type RoomReadSnapshotInput,
  RoomReadStateContext,
  type RoomReadStateContextValue,
  type RoomReadStateMap,
  type ServerUnreadSnapshotOptions,
} from "./context";

export type RoomReadState = {
  initialized: boolean;
  syncing: boolean;
  serverLastReadMessageId: number;
  localLastReadMessageId: number;
  firstUnreadMessageId: number | null;
  unreadCount: number;
  loadedUnreadCount: number;
  dividerMessageId: number | null;
  pendingMarkReadMessageId: number | null;
  lastAuthoritativeVersion: number;
  authoritativeUnreadCount: number | null;
};

const EMPTY_ROOM_READ_STATE: RoomReadState = {
  initialized: false,
  syncing: false,
  serverLastReadMessageId: 0,
  localLastReadMessageId: 0,
  firstUnreadMessageId: null,
  unreadCount: 0,
  loadedUnreadCount: 0,
  dividerMessageId: null,
  pendingMarkReadMessageId: null,
  lastAuthoritativeVersion: 0,
  authoritativeUnreadCount: null,
};

const normalizeRoomKey = (
  roomId: string | number | null | undefined,
): string | null => {
  if (typeof roomId === "number") {
    if (!Number.isFinite(roomId) || roomId <= 0) return null;
    return String(Math.trunc(roomId));
  }

  if (typeof roomId !== "string") return null;
  const normalized = roomId.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(Math.trunc(parsed));
};

const normalizeCursor = (value: number | null | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

const normalizeCount = (value: number | null | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const normalizeActorRef = (value: string | null | undefined): string => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("@") ? normalized.slice(1) : normalized;
};

const isForeignMessage = (
  message: Message,
  currentActorRef: string | null | undefined,
) => {
  const actorRef = normalizeActorRef(currentActorRef);
  if (!actorRef) return true;
  return normalizeActorRef(message.publicRef) !== actorRef;
};

const normalizeUnreadCounts = (counts: Record<string, number>) => {
  const normalized: Record<string, number> = {};
  for (const [roomId, unreadCount] of Object.entries(counts)) {
    const roomKey = normalizeRoomKey(roomId);
    if (!roomKey) continue;
    const count = normalizeCount(unreadCount);
    if (count > 0) {
      normalized[roomKey] = count;
    }
  }
  return normalized;
};

const countReadForeignMessagesAfterBaseline = ({
  messages,
  currentActorRef,
  serverLastReadMessageId,
  localLastReadMessageId,
}: {
  messages: Message[];
  currentActorRef: string | null | undefined;
  serverLastReadMessageId: number;
  localLastReadMessageId: number;
}) => {
  if (localLastReadMessageId <= serverLastReadMessageId) {
    return 0;
  }

  let count = 0;
  for (const message of messages) {
    if (message.id <= serverLastReadMessageId) continue;
    if (message.id > localLastReadMessageId) continue;
    if (!isForeignMessage(message, currentActorRef)) continue;
    count += 1;
  }
  return count;
};

const collectLoadedForeignUnreadMessages = ({
  messages,
  currentActorRef,
  localLastReadMessageId,
}: {
  messages: Message[];
  currentActorRef: string | null | undefined;
  localLastReadMessageId: number;
}) =>
  messages.filter(
    (message) =>
      message.id > localLastReadMessageId &&
      isForeignMessage(message, currentActorRef),
  );

const projectUnreadState = ({
  messages,
  currentActorRef,
  serverLastReadMessageId,
  localLastReadMessageId,
  authoritativeUnreadCount,
}: {
  messages: Message[];
  currentActorRef: string | null | undefined;
  serverLastReadMessageId: number;
  localLastReadMessageId: number;
  authoritativeUnreadCount: number | null;
}) => {
  const loadedUnreadMessages = collectLoadedForeignUnreadMessages({
    messages,
    currentActorRef,
    localLastReadMessageId,
  });
  const loadedUnreadCount = loadedUnreadMessages.length;

  if (authoritativeUnreadCount === null) {
    return {
      unreadCount: loadedUnreadCount,
      loadedUnreadCount,
      firstUnreadMessageId: loadedUnreadMessages[0]?.id ?? null,
    };
  }

  const readAfterBaseline = countReadForeignMessagesAfterBaseline({
    messages,
    currentActorRef,
    serverLastReadMessageId,
    localLastReadMessageId,
  });
  const unreadCount = Math.max(0, authoritativeUnreadCount - readAfterBaseline);
  if (unreadCount < 1) {
    return {
      unreadCount: 0,
      loadedUnreadCount,
      firstUnreadMessageId: null,
    };
  }

  if (loadedUnreadMessages.length === 0) {
    return {
      unreadCount,
      loadedUnreadCount,
      firstUnreadMessageId: null,
    };
  }

  const loadedStartIndex =
    unreadCount <= loadedUnreadMessages.length
      ? loadedUnreadMessages.length - unreadCount
      : 0;

  return {
    unreadCount,
    loadedUnreadCount,
    firstUnreadMessageId: loadedUnreadMessages[loadedStartIndex]?.id ?? null,
  };
};

const applyProjection = (
  entry: RoomReadState,
  input: RoomReadSnapshotInput,
) => {
  const serverLastReadMessageId = Math.max(
    entry.serverLastReadMessageId,
    normalizeCursor(input.serverLastReadMessageId),
  );
  const pendingMarkReadMessageId = Math.max(
    normalizeCursor(input.pendingMarkReadMessageId),
    normalizeCursor(entry.pendingMarkReadMessageId),
  );
  const localLastReadMessageId = Math.max(
    serverLastReadMessageId,
    entry.localLastReadMessageId,
    pendingMarkReadMessageId,
  );
  const projection = projectUnreadState({
    messages: input.messages,
    currentActorRef: input.currentActorRef,
    serverLastReadMessageId,
    localLastReadMessageId,
    authoritativeUnreadCount: entry.authoritativeUnreadCount,
  });

  return {
    ...entry,
    initialized: true,
    syncing: false,
    serverLastReadMessageId,
    localLastReadMessageId,
    pendingMarkReadMessageId:
      pendingMarkReadMessageId > 0 ? pendingMarkReadMessageId : null,
    firstUnreadMessageId: projection.firstUnreadMessageId,
    unreadCount: projection.unreadCount,
    loadedUnreadCount: projection.loadedUnreadCount,
    dividerMessageId:
      projection.unreadCount > 0
        ? (entry.dividerMessageId ?? projection.firstUnreadMessageId)
        : null,
  };
};

export function RoomReadStateProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<RoomReadStateMap>({});
  const authoritativeVersionRef = useRef(0);
  const publishedOverrideCountsRef = useRef<Record<string, number>>({});

  const getRoomState = useCallback(
    (roomId: string | number | null | undefined) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return null;
      return rooms[roomKey] ?? null;
    },
    [rooms],
  );

  const getRoomUnreadCount = useCallback(
    (
      roomId: string | number | null | undefined,
      fallback?: number | null | undefined,
    ) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return normalizeCount(fallback);
      const room = rooms[roomKey];
      if (!room) return normalizeCount(fallback);
      if (room.initialized) return room.unreadCount;
      if (room.authoritativeUnreadCount !== null) {
        return room.authoritativeUnreadCount;
      }
      return normalizeCount(fallback);
    },
    [rooms],
  );

  const initializeRoom = useCallback((input: RoomReadSnapshotInput) => {
    const roomKey = normalizeRoomKey(input.roomId);
    if (!roomKey) return;

    setRooms((prev) => {
      const entry = prev[roomKey] ?? EMPTY_ROOM_READ_STATE;
      const nextEntry = applyProjection(entry, input);
      if (
        prev[roomKey] &&
        prev[roomKey].initialized === nextEntry.initialized &&
        prev[roomKey].unreadCount === nextEntry.unreadCount &&
        prev[roomKey].loadedUnreadCount === nextEntry.loadedUnreadCount &&
        prev[roomKey].firstUnreadMessageId === nextEntry.firstUnreadMessageId &&
        prev[roomKey].localLastReadMessageId ===
          nextEntry.localLastReadMessageId &&
        prev[roomKey].serverLastReadMessageId ===
          nextEntry.serverLastReadMessageId &&
        prev[roomKey].pendingMarkReadMessageId ===
          nextEntry.pendingMarkReadMessageId
      ) {
        return prev;
      }
      return { ...prev, [roomKey]: nextEntry };
    });
  }, []);

  const applyLocalRead = useCallback((input: RoomReadLocalInput) => {
    const roomKey = normalizeRoomKey(input.roomId);
    if (!roomKey) return;
    const lastReadMessageId = normalizeCursor(input.lastReadMessageId);
    if (lastReadMessageId < 1) return;

    setRooms((prev) => {
      const entry = prev[roomKey] ?? EMPTY_ROOM_READ_STATE;
      const localLastReadMessageId = Math.max(
        entry.localLastReadMessageId,
        lastReadMessageId,
      );
      if (localLastReadMessageId === entry.localLastReadMessageId) {
        return prev;
      }

      const projection = projectUnreadState({
        messages: input.messages,
        currentActorRef: input.currentActorRef,
        serverLastReadMessageId: entry.serverLastReadMessageId,
        localLastReadMessageId,
        authoritativeUnreadCount: entry.authoritativeUnreadCount,
      });
      return {
        ...prev,
        [roomKey]: {
          ...entry,
          initialized: true,
          localLastReadMessageId,
          firstUnreadMessageId: projection.firstUnreadMessageId,
          unreadCount: projection.unreadCount,
          loadedUnreadCount: projection.loadedUnreadCount,
          dividerMessageId:
            projection.unreadCount > 0 ? entry.dividerMessageId : null,
        },
      };
    });
  }, []);

  const applyServerUnreadSnapshot = useCallback(
    (
      counts: Record<string, number>,
      options: ServerUnreadSnapshotOptions = {},
    ) => {
      const normalizedCounts = normalizeUnreadCounts(counts);
      const scopedRoomIds = options.roomIds
        ? Array.from(options.roomIds)
            .map(normalizeRoomKey)
            .filter((roomKey): roomKey is string => Boolean(roomKey))
        : null;
      authoritativeVersionRef.current += 1;
      const version = authoritativeVersionRef.current;

      setRooms((prev) => {
        const roomKeys = new Set<string>(
          scopedRoomIds ?? [
            ...Object.keys(prev),
            ...Object.keys(normalizedCounts),
          ],
        );
        for (const roomKey of Object.keys(normalizedCounts)) {
          roomKeys.add(roomKey);
        }

        if (roomKeys.size === 0) {
          return prev;
        }

        let changed = false;
        const next = { ...prev };
        for (const roomKey of roomKeys) {
          const entry = next[roomKey] ?? EMPTY_ROOM_READ_STATE;
          const authoritativeUnreadCount = normalizedCounts[roomKey] ?? 0;
          const shouldKeepLocalUnread =
            entry.initialized &&
            entry.localLastReadMessageId > entry.serverLastReadMessageId &&
            authoritativeUnreadCount > entry.unreadCount;
          const unreadCount = shouldKeepLocalUnread
            ? entry.unreadCount
            : authoritativeUnreadCount;
          const nextEntry: RoomReadState = {
            ...entry,
            authoritativeUnreadCount,
            lastAuthoritativeVersion: version,
            unreadCount: entry.initialized ? unreadCount : entry.unreadCount,
            firstUnreadMessageId:
              entry.initialized && unreadCount < 1
                ? null
                : entry.firstUnreadMessageId,
            dividerMessageId:
              entry.initialized && unreadCount < 1
                ? null
                : entry.dividerMessageId,
          };

          if (
            entry.authoritativeUnreadCount !==
              nextEntry.authoritativeUnreadCount ||
            entry.lastAuthoritativeVersion !==
              nextEntry.lastAuthoritativeVersion ||
            entry.unreadCount !== nextEntry.unreadCount ||
            entry.firstUnreadMessageId !== nextEntry.firstUnreadMessageId ||
            entry.dividerMessageId !== nextEntry.dividerMessageId
          ) {
            changed = true;
            next[roomKey] = nextEntry;
          }
        }

        return changed ? next : prev;
      });
    },
    [],
  );

  const setRoomDivider = useCallback(
    (
      roomId: string | number | null | undefined,
      dividerMessageId: number | null,
    ) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return;

      setRooms((prev) => {
        const entry = prev[roomKey];
        if (!entry || entry.dividerMessageId === dividerMessageId) {
          return prev;
        }
        return {
          ...prev,
          [roomKey]: {
            ...entry,
            dividerMessageId,
          },
        };
      });
    },
    [],
  );

  const setPendingMarkRead = useCallback(
    (roomId: string | number | null | undefined, messageId: number | null) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return;
      const normalizedMessageId = normalizeCursor(messageId);

      setRooms((prev) => {
        const entry = prev[roomKey] ?? EMPTY_ROOM_READ_STATE;
        const nextPending =
          normalizedMessageId > 0 ? normalizedMessageId : null;
        if (entry.pendingMarkReadMessageId === nextPending) {
          return prev;
        }
        return {
          ...prev,
          [roomKey]: {
            ...entry,
            pendingMarkReadMessageId: nextPending,
          },
        };
      });
    },
    [],
  );

  const acknowledgeServerRead = useCallback(
    (
      roomId: string | number | null | undefined,
      messageId: number | null | undefined,
    ) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return;
      const normalizedMessageId = normalizeCursor(messageId);
      if (normalizedMessageId < 1) return;

      setRooms((prev) => {
        const entry = prev[roomKey];
        if (!entry) return prev;
        const serverLastReadMessageId = Math.max(
          entry.serverLastReadMessageId,
          normalizedMessageId,
        );
        const localLastReadMessageId = Math.max(
          entry.localLastReadMessageId,
          serverLastReadMessageId,
        );
        if (
          serverLastReadMessageId === entry.serverLastReadMessageId &&
          localLastReadMessageId === entry.localLastReadMessageId &&
          entry.pendingMarkReadMessageId === null
        ) {
          return prev;
        }

        return {
          ...prev,
          [roomKey]: {
            ...entry,
            serverLastReadMessageId,
            localLastReadMessageId,
            pendingMarkReadMessageId: null,
          },
        };
      });
    },
    [],
  );

  const markRoomFullyRead = useCallback(
    (roomId: string | number | null | undefined) => {
      const roomKey = normalizeRoomKey(roomId);
      if (!roomKey) return;

      setRooms((prev) => {
        const entry = prev[roomKey] ?? EMPTY_ROOM_READ_STATE;
        return {
          ...prev,
          [roomKey]: {
            ...entry,
            initialized: entry.initialized,
            authoritativeUnreadCount: 0,
            unreadCount: 0,
            loadedUnreadCount: 0,
            firstUnreadMessageId: null,
            dividerMessageId: null,
            pendingMarkReadMessageId: null,
          },
        };
      });
    },
    [],
  );

  const resetRooms = useCallback(() => {
    setRooms({});
    publishedOverrideCountsRef.current = {};
  }, []);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [roomKey, room] of Object.entries(rooms)) {
      const count = room.initialized
        ? room.unreadCount
        : (room.authoritativeUnreadCount ?? 0);
      if (count > 0) {
        counts[roomKey] = count;
      }
    }
    return counts;
  }, [rooms]);

  useEffect(() => {
    const previous = publishedOverrideCountsRef.current;
    const next: Record<string, number> = {};

    for (const [roomKey, room] of Object.entries(rooms)) {
      if (!room.initialized) continue;
      next[roomKey] = room.unreadCount;
      if (previous[roomKey] === room.unreadCount) continue;
      setUnreadOverride({ roomId: roomKey, unreadCount: room.unreadCount });
    }

    publishedOverrideCountsRef.current = next;
  }, [rooms]);

  const value = useMemo<RoomReadStateContextValue>(
    () => ({
      rooms,
      unreadCounts,
      getRoomState,
      getRoomUnreadCount,
      initializeRoom,
      refreshRoomMessages: initializeRoom,
      applyLocalRead,
      applyServerUnreadSnapshot,
      setRoomDivider,
      setPendingMarkRead,
      acknowledgeServerRead,
      markRoomFullyRead,
      resetRooms,
    }),
    [
      applyLocalRead,
      applyServerUnreadSnapshot,
      acknowledgeServerRead,
      getRoomState,
      getRoomUnreadCount,
      initializeRoom,
      markRoomFullyRead,
      resetRooms,
      rooms,
      setPendingMarkRead,
      setRoomDivider,
      unreadCounts,
    ],
  );

  return (
    <RoomReadStateContext.Provider value={value}>
      {children}
    </RoomReadStateContext.Provider>
  );
}
