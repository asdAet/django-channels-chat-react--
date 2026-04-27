import type {
  MessageReadersResult,
  SearchResultItem,
} from "../../domain/interfaces/IApiService";
import type { Message } from "../../entities/message/types";

/**
 * Setter состояния списка сообщений комнаты.
 */
export type SetMessages = (
  updater: Message[] | ((prev: Message[]) => Message[]),
) => void;

/**
 * Общий setter видимой ошибки страницы.
 */
export type SetRoomError = (message: string | null) => void;

/**
 * Переход к сообщению по его идентификатору.
 */
export type JumpToMessageById = (messageId: number) => Promise<boolean>;

/**
 * Прокрутка списка сообщений к последнему сообщению.
 */
export type ScrollToBottom = () => void;

/**
 * Setter явного якоря разделителя непрочитанных сообщений.
 */
export type UpdateUnreadDividerAnchor = (nextAnchorId: number | null) => void;

/**
 * Обработчик входящего чужого сообщения.
 */
export type HandleIncomingForeignMessage = (messageId: number) => void;

/**
 * Состояние меню прочтений для конкретного сообщения.
 */
export type ReadersMenuState = {
  /**
   * Сообщение, для которого открыто меню прочтений.
   */
  message: Message;
  /**
   * Горизонтальная координата якоря меню.
   */
  x: number;
  /**
   * Вертикальная координата якоря меню.
   */
  y: number;
  /**
   * Флаг загрузки списка прочитавших.
   */
  loading: boolean;
  /**
   * Текст ошибки загрузки списка прочтений.
   */
  error: string | null;
  /**
   * Последний успешный ответ API с данными о прочтениях.
   */
  result: MessageReadersResult | null;
};

/**
 * Снимок состояния поиска в заголовке комнаты.
 */
export type HeaderSearchState = {
  /**
   * Флаг открытого состояния панели поиска.
   */
  isOpen: boolean;
  /**
   * Текущий текст поискового запроса.
   */
  query: string;
  /**
   * Флаг активного поискового запроса.
   */
  loading: boolean;
  /**
   * Список найденных сообщений.
   */
  results: SearchResultItem[];
};
