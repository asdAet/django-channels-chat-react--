import type { Message } from "../../entities/message/types";
import type { RoomDetails } from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import type { ImageLightboxMediaItem } from "../../shared/ui/ImageLightbox";
import type { ReadersMenuEntry } from "../../widgets/chat/ReadersMenu";
import type { ReadersMenuState } from "./types";
import type {
  ReadReceipt,
  TimelineItem,
  UnreadDividerRenderTarget,
} from "./utils";

/**
 * Запись присутствия пользователя в presence-потоке.
 */
export type ChatRoomPresenceOnlineEntry = {
  /**
   * Публичная actor-ссылка пользователя.
   */
  publicRef?: string | null;
};

/**
 * Зависимости, необходимые view-model хуку страницы комнаты.
 */
export type UseChatRoomPageViewModelOptions = {
  /**
   * Загруженные детали активной комнаты.
   */
  details: RoomDetails | null;
  /**
   * Стабильный идентификатор комнаты для fallback-значений.
   */
  roomIdForRequests: string;
  /**
   * Актуальный список сообщений комнаты.
   */
  messages: Message[];
  /**
   * Инструкция по отрисовке разделителя непрочитанных.
   */
  unreadDividerRenderTarget: UnreadDividerRenderTarget;
  /**
   * Карта печатающих пользователей по actorRef.
   */
  typingUsers: Map<string, number>;
  /**
   * Карта displayName для печатающих пользователей.
   */
  typingDisplayNames: Map<string, string>;
  /**
   * Карта read receipt по идентификатору пользователя.
   */
  readReceipts: Map<number, ReadReceipt>;
  /**
   * Нормализованная actor-ссылка текущего пользователя.
   */
  currentActorRef: string;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
  /**
   * Флаг загрузки прав комнаты.
   */
  permissionsLoading: boolean;
  /**
   * Флаг права на отправку сообщений в комнату.
   */
  canWriteToRoom: boolean;
  /**
   * Флаг возможности вступить в комнату.
   */
  canJoinRoom: boolean;
  /**
   * Список пользователей, находящихся онлайн по данным presence.
   */
  presenceOnline: ChatRoomPresenceOnlineEntry[];
  /**
   * Текущий статус presence-транспорта.
   */
  presenceStatus: string;
  /**
   * Идентификатор вложения, открытого в lightbox.
   */
  lightboxAttachmentId: number | null;
  /**
   * Состояние меню прочтений для текущего сообщения.
   */
  readersMenu: ReadersMenuState | null;
};

/**
 * Производные данные, подготовленные только для отображения.
 */
export type UseChatRoomPageViewModelResult = {
  /**
   * Набор actorRef пользователей, считающихся онлайн.
   */
  onlineUsernames: Set<string>;
  /**
   * Таймлайн сообщений с днями и разделителем непрочитанных.
   */
  timeline: TimelineItem[];
  /**
   * Список медиа-элементов для lightbox.
   */
  lightboxMediaItems: ImageLightboxMediaItem[];
  /**
   * Индекс активного элемента lightbox или `-1`, если он закрыт.
   */
  lightboxOpenIndex: number;
  /**
   * Человекочитаемые имена пользователей, которые сейчас печатают.
   */
  activeTypingUsers: string[];
  /**
   * Итоговый заголовок комнаты.
   */
  roomTitle: string;
  /**
   * Итоговый подзаголовок комнаты.
   */
  roomSubtitle: string;
  /**
   * Флаг, что текущий peer заблокировал пользователя.
   */
  isBlocked: boolean;
  /**
   * Флаг, что пользователь сам заблокировал peer.
   */
  isBlockedByMe: boolean;
  /**
   * Флаг показа CTA на вступление в группу.
   */
  showGroupJoinCta: boolean;
  /**
   * Флаг показа notice о read-only режиме группы.
   */
  showGroupReadOnlyNotice: boolean;
  /**
   * Флаг доступности composer для отправки сообщений.
   */
  canSendMessages: boolean;
  /**
   * Максимальный lastReadMessageId среди чужих read receipt.
   */
  maxReadMessageId: number;
  /**
   * Нормализованные записи для меню прочтений.
   */
  readersMenuEntries: ReadersMenuEntry[];
};
