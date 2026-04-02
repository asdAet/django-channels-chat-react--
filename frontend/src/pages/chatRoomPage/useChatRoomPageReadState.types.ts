import type { RefObject, UIEvent } from "react";

import type { Message } from "../../entities/message/types";
import type { RoomDetails } from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import type {
  HandleIncomingForeignMessage,
  UpdateUnreadDividerAnchor,
} from "./types";
import type { UnreadDividerRenderTarget } from "./utils";

/**
 * Зависимости, необходимые хуку чтения и прокрутки комнаты.
 */
export type UseChatRoomPageReadStateOptions = {
  /**
   * Идентификатор комнаты из маршрута, используемый как ключ сессии.
   */
  roomId: string;
  /**
   * Стабильный идентификатор комнаты для API-запросов.
   */
  roomIdForRequests: string;
  /**
   * Числовой идентификатор комнаты в строковом виде для read API.
   */
  roomApiRef: string | null;
  /**
   * Текущая строка query-параметров из location.
   */
  locationSearch: string;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
  /**
   * Загруженные детали активной комнаты.
   */
  details: RoomDetails | null;
  /**
   * Актуальный список сообщений комнаты.
   */
  messages: Message[];
  /**
   * Флаг первичной загрузки комнаты.
   */
  loading: boolean;
  /**
   * Флаг загрузки более ранней истории.
   */
  loadingMore: boolean;
  /**
   * Флаг наличия еще не загруженной истории.
   */
  hasMore: boolean;
  /**
   * Ошибка загрузки комнаты, если она есть.
   */
  error: string | null;
  /**
   * Колбэк загрузки старых сообщений.
   */
  loadMore: () => Promise<void> | void;
  /**
   * Нормализованная actor-ссылка текущего пользователя.
   */
  currentActorRef: string;
  /**
   * Числовой идентификатор комнаты для интеграции с inbox.
   */
  resolvedRoomId: number | null;
  /**
   * Setter активной direct-комнаты в inbox store.
   */
  setActiveRoom: (roomRef: string | number | null) => void;
  /**
   * Пометка direct-комнаты как прочитанной в inbox store.
   */
  markDirectRoomRead: (roomRef: string | number) => void;
};

/**
 * Публичное состояние прокрутки, read-state и навигации по сообщениям.
 */
export type UseChatRoomPageReadStateResult = {
  /**
   * Ref scroll-контейнера списка сообщений.
   */
  listRef: RefObject<HTMLDivElement | null>;
  /**
   * Идентификатор сообщения, временно подсвеченного после jump.
   */
  highlightedMessageId: number | null;
  /**
   * Флаг видимости плавающей кнопки прокрутки вниз.
   */
  showScrollFab: boolean;
  /**
   * Количество новых сообщений, пришедших вне нижней границы списка.
   */
  newMsgCount: number;
  /**
   * Явный якорь разделителя непрочитанных сообщений.
   */
  unreadDividerAnchorId: number | null;
  /**
   * Инструкция, где именно отрисовать разделитель непрочитанных.
   */
  unreadDividerRenderTarget: UnreadDividerRenderTarget;
  /**
   * Локально вычисленный идентификатор последнего прочитанного сообщения.
   */
  localLastReadMessageId: number;
  /**
   * Setter явного якоря разделителя непрочитанных.
   */
  updateUnreadDividerAnchor: UpdateUnreadDividerAnchor;
  /**
   * Обработчик входящего чужого сообщения.
   */
  handleIncomingForeignMessage: HandleIncomingForeignMessage;
  /**
   * Scroll-обработчик списка сообщений.
   */
  handleScroll: (event: UIEvent<HTMLDivElement>) => void;
  /**
   * Активация пользовательского режима пагинации перед скроллом кверху.
   */
  armPaginationInteraction: () => void;
  /**
   * Прокрутка списка к последнему сообщению.
   */
  scrollToBottom: () => void;
  /**
   * Гарантированный переход к сообщению по идентификатору.
   */
  jumpToMessageById: (messageId: number) => Promise<boolean>;
};
