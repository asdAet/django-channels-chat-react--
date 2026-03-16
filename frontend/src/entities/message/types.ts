import type { AvatarCrop } from "../../shared/api/users";

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

export type ReactionSummary = {
  emoji: string;
  count: number;
  me: boolean;
};

export type ReplyTo = {
  id: number;
  publicRef: string | null;
  username: string | null;
  displayName?: string | null;
  content: string;
};

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
