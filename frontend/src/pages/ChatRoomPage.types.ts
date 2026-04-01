import type { RoomKind } from "../entities/room/types";
import type { UserProfile } from "../entities/user/types";

/**
 * Входные параметры контейнера страницы комнаты.
 */
export type ChatRoomPageProps = {
  /**
   * Идентификатор комнаты из маршрута.
   */
  roomId: string;
  /**
   * Тип комнаты, если он известен до загрузки деталей.
   */
  initialRoomKind?: RoomKind | null;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
  /**
   * Колбэк навигации, предоставленный оболочкой приложения.
   */
  onNavigate: (path: string) => void;
};
