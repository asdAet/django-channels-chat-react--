import type { UserProfile } from "../../entities/user/types";
import type { ChatRoomPageController } from "./useChatRoomPageController.types";

/**
 * Параметры презентационного компонента страницы комнаты.
 */
export type ChatRoomPageViewProps = {
  /**
   * Подготовленный контроллер со всеми данными и обработчиками страницы.
   */
  controller: ChatRoomPageController;
  /**
   * Колбэк навигации, используемый действиями интерфейса.
   */
  onNavigate: (path: string) => void;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
};
