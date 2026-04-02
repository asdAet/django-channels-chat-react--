import type { DragEvent } from "react";

import type { Message } from "../../entities/message/types";
import type { RoomDetails, RoomKind } from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import type { WebSocketStatus } from "../../hooks/useReconnectingWebSocket";
import type { UseChatRoomPageComposerResult } from "./useChatRoomPageComposer.types";
import type { UseChatRoomPageHeaderSearchResult } from "./useChatRoomPageHeaderSearch.types";
import type { UseChatRoomPageReadStateResult } from "./useChatRoomPageReadState.types";
import type { UseChatRoomPageUiActionsResult } from "./useChatRoomPageUiActions.types";
import type { UseChatRoomPageViewModelResult } from "./useChatRoomPageViewModel.types";

/**
 * Входные параметры контроллера страницы комнаты.
 */
export type UseChatRoomPageControllerOptions = {
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
};

/**
 * Основное состояние комнаты, доступное презентационному слою.
 */
export type ChatRoomPageRoomState = {
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
   * Флаг загрузки старой истории.
   */
  loadingMore: boolean;
  /**
   * Флаг наличия еще не загруженной истории.
   */
  hasMore: boolean;
  /**
   * Флаг публичной доступности комнаты.
   */
  isPublicRoom: boolean;
  /**
   * Флаг текущего online-состояния браузера.
   */
  isOnline: boolean;
  /**
   * Флаг права на управление сообщениями в комнате.
   */
  canManageMessagesToRoom: boolean;
  /**
   * Флаг загрузки матрицы прав комнаты.
   */
  permissionsLoading: boolean;
  /**
   * Флаг бана текущего пользователя в комнате.
   */
  isBannedInRoom: boolean;
  /**
   * Человекочитаемая ошибка, видимая на странице.
   */
  visibleError: string | null;
  /**
   * Текущий статус WebSocket комнаты.
   */
  status: WebSocketStatus;
  /**
   * Последняя низкоуровневая ошибка соединения.
   */
  lastError: string | null;
  /**
   * Нормализованная actor-ссылка текущего пользователя.
   */
  currentActorRef: string;
};

/**
 * Slice поиска по сообщениям, который получает view.
 */
export type ChatRoomPageHeaderSearchState = UseChatRoomPageHeaderSearchResult;

/**
 * Slice прокрутки и unread-state, который получает view.
 */
export type ChatRoomPageScrollState = Pick<
  UseChatRoomPageReadStateResult,
  | "listRef"
  | "highlightedMessageId"
  | "showScrollFab"
  | "newMsgCount"
  | "unreadDividerAnchorId"
  | "handleScroll"
  | "armPaginationInteraction"
  | "scrollToBottom"
>;

/**
 * Slice composer, расширенный transport-обработчиками.
 */
export type ChatRoomPageComposerState = UseChatRoomPageComposerResult & {
  /**
   * Debounced-отправка события typing.
   */
  sendTyping: () => void;
  /**
   * Флаг активного server-side rate-limit.
   */
  rateLimitActive: boolean;
};

/**
 * DOM-обработчики drag-and-drop для корня страницы.
 */
export type ChatRoomPageFileDropBindings = {
  /**
   * Обработчик входа drag-элемента в корень страницы.
   */
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  /**
   * Обработчик drag-over над корнем страницы.
   */
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  /**
   * Обработчик выхода drag-элемента из корня страницы.
   */
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  /**
   * Обработчик drop события в корне страницы.
   */
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

/**
 * Slice drag-and-drop состояния страницы.
 */
export type ChatRoomPageFileDropState = {
  /**
   * Флаг активного drop-overlay.
   */
  isDropTargetActive: boolean;
  /**
   * Набор DOM-обработчиков для drag-and-drop.
   */
  fileDropBindings: ChatRoomPageFileDropBindings;
};

/**
 * Полный контракт контроллера, который использует presentation-layer.
 */
export type ChatRoomPageController = {
  /**
   * Основные данные комнаты, состояния загрузки и соединения.
   */
  room: ChatRoomPageRoomState;
  /**
   * Состояние и обработчики поиска по сообщениям.
   */
  headerSearch: ChatRoomPageHeaderSearchState;
  /**
   * Состояние списка, unread-маркеров и прокрутки.
   */
  scroll: ChatRoomPageScrollState;
  /**
   * Состояние composer и обработчики мутаций сообщений.
   */
  composer: ChatRoomPageComposerState;
  /**
   * UI-only обработчики открытия панелей и мобильного drawer.
   */
  actions: UseChatRoomPageUiActionsResult;
  /**
   * Производные данные, подготовленные только для отображения.
   */
  view: UseChatRoomPageViewModelResult;
  /**
   * Состояние и bindings drag-and-drop для вложений.
   */
  fileDrop: ChatRoomPageFileDropState;
};
