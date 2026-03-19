import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `Attachment`.
 */
export type Attachment = {
  id: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  url: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Описывает структуру данных `ReactionSummary`.
 */
export type ReactionSummary = {
  emoji: string;
  count: number;
  me: boolean;
};

/**
 * Описывает структуру данных `ReplyTo`.
 */
export type ReplyTo = {
  id: number;
  publicRef: string | null;
  username: string | null;
  displayName?: string | null;
  content: string;
};

/**
 * Описывает структуру данных `Message`.
 */
export type Message = {
  id: number;
  publicRef: string;
  username: string;
  displayName?: string;
  content: string;
  profilePic: string | null;
  avatarCrop?: AvatarCrop | null;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
  replyTo: ReplyTo | null;
  attachments: Attachment[];
  reactions: ReactionSummary[];
};
