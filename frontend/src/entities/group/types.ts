import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `Group`.
 */
export type Group = {
  roomId: number;
  slug: string;
  name: string;
  description: string;
  isPublic: boolean;
  username: string | null;
  memberCount: number;
  slowModeSeconds: number;
  joinApprovalRequired: boolean;
  createdBy: string | null;
  avatarUrl: string | null;
  avatarCrop?: AvatarCrop | null;
};

/**
 * Описывает структуру данных `GroupListItem`.
 */
export type GroupListItem = {
  roomId: number;
  slug: string;
  name: string;
  description: string;
  username: string | null;
  memberCount: number;
  avatarUrl?: string | null;
  avatarCrop?: AvatarCrop | null;
};

/**
 * Описывает структуру данных `GroupMember`.
 */
export type GroupMember = {
  userId: number;
  username: string;
  displayName?: string;
  publicRef?: string;
  nickname: string;
  profileImage?: string | null;
  avatarCrop?: AvatarCrop | null;
  roles: string[];
  joinedAt: string;
  isMuted: boolean;
  isSelf?: boolean;
};

/**
 * Описывает структуру данных `GroupInvite`.
 */
export type GroupInvite = {
  code: string;
  name: string;
  createdBy: string | null;
  expiresAt: string | null;
  maxUses: number;
  useCount: number;
  isRevoked: boolean;
  isExpired: boolean;
  createdAt: string;
};

/**
 * Описывает структуру данных `InvitePreview`.
 */
export type InvitePreview = {
  code: string;
  groupId: number;
  groupName: string;
  groupDescription: string;
  memberCount: number;
  isPublic: boolean;
};

/**
 * Описывает payload запроса `JoinRequest`.
 */
export type JoinRequest = {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  publicRef?: string;
  message: string;
  createdAt: string;
};

/**
 * Описывает структуру данных `PinnedMessage`.
 */
export type PinnedMessage = {
  messageId: number;
  content: string;
  author: string | null;
  pinnedBy: string | null;
  pinnedAt: string;
  createdAt: string;
};

/**
 * Описывает структуру данных `BannedMember`.
 */
export type BannedMember = {
  userId: number;
  username: string;
  displayName?: string;
  publicRef?: string;
  reason: string;
  bannedBy: string | null;
};
