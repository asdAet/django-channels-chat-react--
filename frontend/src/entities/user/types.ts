import type { AvatarCrop } from "../../shared/api/users";

export type UserProfile = {
  name?: string;
  username: string;
  handle?: string | null;
  publicRef?: string;
  publicId?: string | null;
  isSuperuser?: boolean;
  email: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
  bio: string;
  lastSeen: string | null;
  registeredAt: string | null;
};
