import type { RoomDetails } from "../../entities/room/types";

/**
 * Поддерживаемые цели панели информации на странице комнаты.
 */
export type ChatRoomInfoPanelKind = "profile" | "direct" | "group";

/**
 * Колбэк открытия панели информации.
 */
export type OpenInfoPanel = (
  panel: ChatRoomInfoPanelKind,
  value: string,
) => void;

/**
 * Зависимости, необходимые хуку UI-действий.
 */
export type UseChatRoomPageUiActionsOptions = {
  /**
   * Загруженные детали активной комнаты.
   */
  details: RoomDetails | null;
  /**
   * Стабильный идентификатор комнаты для открытия панелей.
   */
  roomIdForRequests: string;
  /**
   * Колбэк оболочки приложения для открытия конкретной панели.
   */
  openInfoPanel: OpenInfoPanel;
  /**
   * Колбэк оболочки приложения для открытия мобильного drawer.
   */
  openDrawer: () => void;
};

/**
 * Публичные UI-обработчики страницы комнаты.
 */
export type UseChatRoomPageUiActionsResult = {
  /**
   * Открытие профиля автора сообщения.
   */
  openUserProfile: (actorRef: string) => void;
  /**
   * Открытие панели direct-комнаты.
   */
  openDirectInfo: () => void;
  /**
   * Открытие панели групповой комнаты.
   */
  openGroupInfo: () => void;
  /**
   * Открытие мобильного drawer.
   */
  handleMobileOpenClick: () => void;
};
