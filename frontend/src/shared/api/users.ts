export type AvatarCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OnlineUser = {
  publicRef: string;
  username: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
};
