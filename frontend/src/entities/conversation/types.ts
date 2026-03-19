import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `ConversationType`.
 */
export type ConversationType = "direct" | "group" | "room";

/**
 * Описывает структуру данных `ConversationItem`.
 */
export type ConversationItem = {
  type: ConversationType;
  slug: string;
  name: string;
  directRef?: string;
  avatarUrl: string | null;
  avatarCrop: AvatarCrop | null;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
};
