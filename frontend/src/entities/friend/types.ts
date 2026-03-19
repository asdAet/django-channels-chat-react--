import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `Friend`.
 */
export type Friend = {
  id: number;
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
  lastSeen: string | null;
};

/**
 * Описывает payload запроса `FriendRequest`.
 */
export type FriendRequest = {
  id: number;
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage?: string | null;
  avatarCrop?: AvatarCrop | null;
  createdAt: string;
};

/**
 * Описывает структуру данных `BlockedUser`.
 */
export type BlockedUser = {
  id: number;
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage?: string | null;
  avatarCrop?: AvatarCrop | null;
};
