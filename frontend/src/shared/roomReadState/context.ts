import { createContext } from "react";

import type { Message } from "../../entities/message/types";
import type { RoomReadState } from "./RoomReadStateProvider";

export type RoomReadStateMap = Record<string, RoomReadState>;

export type RoomReadSnapshotInput = {
  roomId: string | number | null | undefined;
  serverLastReadMessageId: number | null | undefined;
  pendingMarkReadMessageId?: number | null | undefined;
  messages: Message[];
  currentActorRef: string | null | undefined;
};

export type RoomReadLocalInput = {
  roomId: string | number | null | undefined;
  lastReadMessageId: number | null | undefined;
  messages: Message[];
  currentActorRef: string | null | undefined;
};

export type ServerUnreadSnapshotOptions = {
  roomIds?: Iterable<string | number | null | undefined>;
};

export type RoomReadStateContextValue = {
  rooms: RoomReadStateMap;
  unreadCounts: Record<string, number>;
  getRoomState: (
    roomId: string | number | null | undefined,
  ) => RoomReadState | null;
  getRoomUnreadCount: (
    roomId: string | number | null | undefined,
    fallback?: number | null | undefined,
  ) => number;
  initializeRoom: (input: RoomReadSnapshotInput) => void;
  refreshRoomMessages: (input: RoomReadSnapshotInput) => void;
  applyLocalRead: (input: RoomReadLocalInput) => void;
  applyServerUnreadSnapshot: (
    counts: Record<string, number>,
    options?: ServerUnreadSnapshotOptions,
  ) => void;
  setRoomDivider: (
    roomId: string | number | null | undefined,
    dividerMessageId: number | null,
  ) => void;
  setPendingMarkRead: (
    roomId: string | number | null | undefined,
    messageId: number | null,
  ) => void;
  acknowledgeServerRead: (
    roomId: string | number | null | undefined,
    messageId: number | null | undefined,
  ) => void;
  markRoomFullyRead: (roomId: string | number | null | undefined) => void;
  resetRooms: () => void;
};

const normalizeFallbackCount = (value: number | null | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const FALLBACK_ROOM_READ_STATE_CONTEXT: RoomReadStateContextValue = {
  rooms: {},
  unreadCounts: {},
  getRoomState: () => null,
  getRoomUnreadCount: (_roomId, fallback) => normalizeFallbackCount(fallback),
  initializeRoom: () => {},
  refreshRoomMessages: () => {},
  applyLocalRead: () => {},
  applyServerUnreadSnapshot: () => {},
  setRoomDivider: () => {},
  setPendingMarkRead: () => {},
  acknowledgeServerRead: () => {},
  markRoomFullyRead: () => {},
  resetRooms: () => {},
};

export const RoomReadStateContext =
  createContext<RoomReadStateContextValue>(FALLBACK_ROOM_READ_STATE_CONTEXT);
