import type { RoomKind } from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";
import type {
  HandleIncomingForeignMessage,
  SetMessages,
  SetRoomError,
} from "./types";
import type { ReadReceipt } from "./utils";

/**
 * Зависимости, необходимые хуку realtime-состояния комнаты.
 */
export type UseChatRoomPageRealtimeOptions = {
  /**
   * WebSocket URL активной комнаты или `null`, если realtime отключен.
   */
  wsUrl: string | null;
  /**
   * Стабильный идентификатор комнаты для инвалидации кэша.
   */
  roomIdForRequests: string;
  /**
   * Эффективный тип комнаты для direct/group побочных эффектов.
   */
  roomKind: RoomKind | null | undefined;
  /**
   * Максимально допустимая длина текстового сообщения.
   */
  maxMessageLength: number;
  /**
   * Нормализованная actor-ссылка текущего пользователя.
   */
  currentActorRef: string;
  /**
   * Флаг включенного read-state для текущей сессии.
   */
  readStateEnabled: boolean;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
  /**
   * Setter списка сообщений комнаты.
   */
  setMessages: SetMessages;
  /**
   * Общий setter видимой ошибки страницы.
   */
  setRoomError: SetRoomError;
  /**
   * Обработчик входящего чужого сообщения.
   */
  onIncomingForeignMessage: HandleIncomingForeignMessage;
};

/**
 * Публичное realtime-состояние комнаты.
 */
export type UseChatRoomPageRealtimeResult = {
  /**
   * Текущий статус жизненного цикла WebSocket-соединения.
   */
  status: WebSocketStatus;
  /**
   * Последний код низкоуровневой ошибки соединения.
   */
  lastError: string | null;
  /**
   * Низкоуровневый отправитель WebSocket-сообщений.
   */
  send: (data: string) => boolean;
  /**
   * Debounced-отправка события typing.
   */
  sendTyping: () => void;
  /**
   * Флаг активного серверного rate-limit.
   */
  rateLimitActive: boolean;
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
};
