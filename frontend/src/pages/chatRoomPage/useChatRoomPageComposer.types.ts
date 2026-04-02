import type { Message } from "../../entities/message/types";
import type { UserProfile } from "../../entities/user/types";
import type { UploadProgress } from "../../domain/interfaces/IApiService";
import type {
  JumpToMessageById,
  ReadersMenuState,
  ScrollToBottom,
  SetMessages,
  SetRoomError,
  UpdateUnreadDividerAnchor,
} from "./types";

/**
 * Координаты якоря для контекстного меню.
 */
export type ChatRoomPageMenuAnchor = {
  /**
   * Горизонтальная координата во viewport.
   */
  x: number;
  /**
   * Вертикальная координата во viewport.
   */
  y: number;
};

/**
 * Зависимости, необходимые хуку composer.
 */
export type UseChatRoomPageComposerOptions = {
  /**
   * Стабильный идентификатор комнаты для API-запросов.
   */
  roomIdForRequests: string;
  /**
   * Текущий авторизованный пользователь или `null` для гостя.
   */
  user: UserProfile | null;
  /**
   * Актуальный список сообщений комнаты.
   */
  messages: Message[];
  /**
   * Максимально допустимая длина текстового сообщения.
   */
  maxMessageLength: number;
  /**
   * Лимит вложений на одно сообщение для обычного пользователя.
   */
  maxAttachmentPerMessage: number;
  /**
   * Максимальный размер вложения в байтах.
   */
  maxAttachmentSizeBytes: number;
  /**
   * Максимальный размер вложения в мегабайтах для текста ошибок.
   */
  maxAttachmentSizeMb: number;
  /**
   * Флаг, разрешающий обход обычных лимитов вложений.
   */
  isCurrentUserSuperuser: boolean;
  /**
   * Нормализованная actor-ссылка текущего пользователя.
   */
  currentActorRef: string;
  /**
   * Текущее состояние сетевого подключения браузера.
   */
  isOnline: boolean;
  /**
   * Текущий статус WebSocket-соединения комнаты.
   */
  status: "idle" | "connecting" | "online" | "offline" | "error" | "closed";
  /**
   * Низкоуровневый отправитель WebSocket-сообщений.
   */
  send: (data: string) => boolean;
  /**
   * Флаг активного rate-limit ограничения.
   */
  rateLimitActive: boolean;
  /**
   * Колбэк перезагрузки комнаты после мутаций membership.
   */
  reload: () => void;
  /**
   * Колбэк обновления прав комнаты.
   */
  refreshRoomPermissions: () => void | Promise<void>;
  /**
   * Переход к сообщению по идентификатору.
   */
  jumpToMessageById: JumpToMessageById;
  /**
   * Setter явного якоря разделителя непрочитанных.
   */
  updateUnreadDividerAnchor: UpdateUnreadDividerAnchor;
  /**
   * Прокрутка списка сообщений к последнему сообщению.
   */
  scrollToBottom: ScrollToBottom;
  /**
   * Общий setter видимой ошибки страницы.
   */
  setRoomError: SetRoomError;
  /**
   * Setter списка сообщений комнаты.
   */
  setMessages: SetMessages;
};

/**
 * Публичное состояние и действия, которые возвращает composer.
 */
export type UseChatRoomPageComposerResult = {
  /**
   * Текущее текстовое значение поля ввода.
   */
  draft: string;
  /**
   * Setter текста в composer.
   */
  setDraft: (value: string) => void;
  /**
   * Сообщение, на которое пользователь сейчас отвечает.
   */
  replyTo: Message | null;
  /**
   * Сообщение, которое сейчас редактируется.
   */
  editingMessage: Message | null;
  /**
   * Сообщение, ожидающее подтверждения удаления.
   */
  deleteConfirm: Message | null;
  /**
   * Setter состояния модалки удаления.
   */
  setDeleteConfirm: (message: Message | null) => void;
  /**
   * Состояние меню прочтений для текущего сообщения.
   */
  readersMenu: ReadersMenuState | null;
  /**
   * Прогресс загрузки вложений в процентах.
   */
  uploadProgress: UploadProgress | null;
  /**
   * Очередь файлов, подготовленных к отправке.
   */
  queuedFiles: File[];
  /**
   * Флаг активного запроса на вступление в группу.
   */
  joinInProgress: boolean;
  /**
   * Идентификатор вложения, открытого в lightbox.
   */
  lightboxAttachmentId: number | null;
  /**
   * Setter активного вложения для lightbox.
   */
  setLightboxAttachmentId: (attachmentId: number | null) => void;
  /**
   * Отправка текущего текста или вложений.
   */
  sendMessage: () => Promise<void>;
  /**
   * Вход в режим ответа на сообщение.
   */
  handleReply: (message: Message) => void;
  /**
   * Вход в режим редактирования сообщения.
   */
  handleEdit: (message: Message) => void;
  /**
   * Открытие подтверждения удаления сообщения.
   */
  handleDelete: (message: Message) => void;
  /**
   * Закрытие меню прочтений и отмена устаревших запросов.
   */
  closeReadersMenu: () => void;
  /**
   * Открытие меню прочтений для конкретного сообщения.
   */
  handleOpenReaders: (message: Message, anchor: ChatRoomPageMenuAnchor) => void;
  /**
   * Подтверждение удаления выбранного сообщения.
   */
  confirmDelete: () => void;
  /**
   * Переключение реакции у сообщения.
   */
  handleReact: (messageId: number, emoji: string) => void;
  /**
   * Добавление файлов в очередь composer после валидации.
   */
  handleAttach: (files: File[]) => void;
  /**
   * Удаление одного файла из очереди по индексу.
   */
  handleRemoveQueuedFile: (index: number) => void;
  /**
   * Полная очистка очереди вложений.
   */
  handleClearQueuedFiles: () => void;
  /**
   * Отмена текущей загрузки вложений.
   */
  handleCancelUpload: () => void;
  /**
   * Выход из режима ответа или редактирования.
   */
  handleCancelReply: () => void;
  /**
   * Переход к сообщению, процитированному в reply.
   */
  handleReplyQuoteClick: (messageId: number) => void;
  /**
   * Отправка запроса на вступление в групповую комнату.
   */
  handleJoinGroup: () => Promise<void>;
  /**
   * Открытие медиа-вложения в lightbox.
   */
  handleOpenMediaAttachment: (attachmentId: number) => void;
};
