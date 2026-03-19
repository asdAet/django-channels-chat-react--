/**
 * Описывает структуру данных `AvatarCrop`.
 */
export type AvatarCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Описывает структуру данных `OnlineUser`.
 */
export type OnlineUser = {
  publicRef: string;
  username: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
};
