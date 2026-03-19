import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `RoomKind`.
 */
export type RoomKind = "public" | "private" | "direct" | "group";

/**
 * Описывает структуру данных `RoomPeer`.
 */
export type RoomPeer = {
  userId?: number;
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
  lastSeen?: string | null;
  bio?: string | null;
  blocked?: boolean;
};

/**
 * Описывает структуру данных `RoomDetails`.
 */
export type RoomDetails = {
  roomId?: number;
  slug: string;
  name: string;
  kind: RoomKind;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
  peer?: RoomPeer | null;
  created?: boolean;
  createdBy?: string | null;
  blocked?: boolean;
  blockedByMe?: boolean;
  lastReadMessageId?: number | null;
};

/**
 * Описывает структуру данных `DirectChatListItem`.
 */
export type DirectChatListItem = {
  slug: string;
  peer: RoomPeer;
  lastMessage: string;
  lastMessageAt: string;
};
