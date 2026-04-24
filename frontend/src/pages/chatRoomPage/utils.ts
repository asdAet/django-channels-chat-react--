import type { Message } from "../../entities/message/types";
import type { UserProfile } from "../../entities/user/types";
import { normalizeAvatarCrop } from "../../shared/lib/avatarCrop";
import { formatDayLabel } from "../../shared/lib/format";

/**
 * Описывает структуру данных `InitialPositioningPhase`.
 */
export type InitialPositioningPhase = "pending" | "positioning" | "settled";
/**
 * Описывает структуру данных `InitialPositioningTarget`.
 */
export type InitialPositioningTarget = "unread" | "bottom";

/**
 * Описывает структуру данных `ReadReceipt`.
 */
export type ReadReceipt = {
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
  lastReadMessageId: number;
  lastReadAt?: string | null;
};

/**
 * Описывает структуру данных `UnreadDividerRenderTarget`.
 */
export type UnreadDividerRenderTarget = {
  messageId: number | null;
  insertAtTop: boolean;
};

/**
 * Описывает структуру данных `TimelineItem`.
 */
export type TimelineItem =
  | { type: "day"; key: string; label: string }
  | { type: "message"; message: Message }
  | { type: "unread" };

const PENDING_READ_STORAGE_PREFIX = "chat.pendingRead.";
const CSRF_SESSION_STORAGE_KEY = "csrfToken";

/**
 * Константа `TYPING_TIMEOUT_MS` хранит используемое в модуле значение.
 */

export const TYPING_TIMEOUT_MS = 5_000;
/**
 * Константа `MAX_HISTORY_JUMP_ATTEMPTS` задает верхнюю границу для соответствующего лимита.
 */

export const MAX_HISTORY_JUMP_ATTEMPTS = 60;
/**
 * Константа `MAX_HISTORY_NO_PROGRESS_ATTEMPTS` задает верхнюю границу для соответствующего лимита.
 */

export const MAX_HISTORY_NO_PROGRESS_ATTEMPTS = 2;
/**
 * Константа `MARK_READ_DEBOUNCE_MS` хранит используемое в модуле значение.
 */

export const MARK_READ_DEBOUNCE_MS = 180;

/**
 * Нормализует actor ref.
 * @param value Входное значение для преобразования.
 * @returns Нормализованное значение после обработки входа.
 */

export const normalizeActorRef = (value: string | null | undefined): string => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("@") ? normalized.slice(1) : normalized;
};

/**
 * Определяет current actor ref.
 *
 * @param user Пользователь текущего контекста.
 *
 * @returns Разрешенное значение с учетом fallback-логики.
 */

export const resolveCurrentActorRef = (user: UserProfile | null): string => {
  if (!user) return "";
  return (
    normalizeActorRef(user.publicRef) ||
    normalizeActorRef(user.username) ||
    normalizeActorRef(user.publicId) ||
    ""
  );
};

/**
 * Определяет message actor ref.
 *
 * @returns Разрешенное значение с учетом fallback-логики.
 */

export const resolveMessageActorRef = (
  message: Pick<Message, "publicRef">,
): string => normalizeActorRef(message.publicRef);

/**
 * Проверяет own message.
 *
 * @param message Текст сообщения.
 * @param currentActorRef Публичный идентификатор текущего пользователя.
 *
 * @returns Логический флаг результата проверки.
 */

export const isOwnMessage = (message: Message, currentActorRef: string) =>
  Boolean(
    currentActorRef && resolveMessageActorRef(message) === currentActorRef,
  );

/**
 * Нормализует read message id.
 * @param value Входное значение для преобразования.
 * @returns Нормализованное значение после обработки входа.
 */

export const normalizeReadMessageId = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value))
    return Math.max(0, Math.trunc(value));
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.trunc(parsed));
  }
  return 0;
};

/**
 * Разбирает room id ref.
 * @param value Входное значение для преобразования.
 * @returns Числовое значение результата.
 */

export const parseRoomIdRef = (value: unknown): number | null => {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.trunc(value);
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
};

/**
 * Проверяет условие is file drag payload.
 * @param dataTransfer Объект DataTransfer из drag-and-drop события.
 * @returns Булев результат проверки условия.
 */

export const isFileDragPayload = (
  dataTransfer: DataTransfer | null | undefined,
): boolean => {
  if (!dataTransfer) return false;
  if (dataTransfer.files && dataTransfer.files.length > 0) return true;

  const transferTypes = dataTransfer.types;
  if (!transferTypes) return false;

  if (
    "contains" in transferTypes &&
    typeof transferTypes.contains === "function"
  ) {
    return transferTypes.contains("Files");
  }

  return Array.from(transferTypes).includes("Files");
};

/**
 * Обрабатывает pending read storage key.
 * @param roomId Идентификатор комнаты чата.
 */
const pendingReadStorageKey = (roomId: string) =>
  `${PENDING_READ_STORAGE_PREFIX}${roomId}`;

/**
 * Выполняет pending read from storage.
 *
 * @param roomId Идентификатор комнаты.
 *
 * @returns Прочитанные данные из источника.
 */

export const readPendingReadFromStorage = (roomId: string): number => {
  if (typeof window === "undefined") return 0;
  try {
    return normalizeReadMessageId(
      window.sessionStorage.getItem(pendingReadStorageKey(roomId)),
    );
  } catch {
    return 0;
  }
};

/**
 * Выполняет pending read to storage.
 *
 * @returns Ничего не возвращает.
 */

export const writePendingReadToStorage = (
  roomId: string,
  lastReadMessageId: number,
): void => {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeReadMessageId(lastReadMessageId);
    if (normalized < 1) {
      window.sessionStorage.removeItem(pendingReadStorageKey(roomId));
      return;
    }
    window.sessionStorage.setItem(
      pendingReadStorageKey(roomId),
      String(normalized),
    );
  } catch {
    // Storage can be unavailable in private mode or restricted contexts.
  }
};

/**
 * Выполняет pending read from storage.
 *
 * @param roomId Идентификатор комнаты.
 *
 * @returns Ничего не возвращает.
 */

export const clearPendingReadFromStorage = (roomId: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(pendingReadStorageKey(roomId));
  } catch {
    // noop
  }
};

/**
 * Обрабатывает read cookie value.
 * @param cookie Строка cookie, из которой извлекается значение.
 * @param name Имя параметра или ключа, который используется в операции.
 * @returns Строковое значение результата.
 */
const readCookieValue = (cookie: string, name: string): string | null => {
  const chunks = cookie.split(";").map((entry) => entry.trim());
  const match = chunks.find((entry) => entry.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1).trim();
  return value || null;
};

/**
 * Определяет csrf token.
 * @returns Строковое значение результата.
 */

export const resolveCsrfToken = (): string | null => {
  if (
    typeof document !== "undefined" &&
    typeof document.cookie === "string" &&
    document.cookie.length > 0
  ) {
    const fromCookie = readCookieValue(document.cookie, "csrftoken");
    if (fromCookie) return fromCookie;
  }

  if (typeof window !== "undefined") {
    try {
      const fromStorage = window.sessionStorage.getItem(
        CSRF_SESSION_STORAGE_KEY,
      );
      if (fromStorage && fromStorage.trim()) return fromStorage.trim();
    } catch {
      // noop
    }
  }

  return null;
};

/**
 * Извлекает наиболее полезное сообщение из ошибки API загрузки или отправки вложений.
 * Функция знает коды ошибок backend и превращает их в человекочитаемый текст для интерфейса.
 *
 * @param error Ошибка, полученная из HTTP-клиента или runtime-слоя.
 * @param fallback Сообщение по умолчанию, если распознать структуру ошибки не удалось.
 * @returns Текст, который можно безопасно показать пользователю.
 */

export const extractApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!error || typeof error !== "object") return fallback;
  const candidate = error as {
    message?: string;
    data?: {
      error?: string;
      detail?: string;
      code?: string;
      details?: {
        maxPerMessage?: number;
        maxSize?: number;
        allowedTypes?: string[];
      };
    };
  };
  const code = candidate.data?.code;
  const details = candidate.data?.details;
  if (code === "no_files") {
    return "Файлы не переданы. Выберите вложение и повторите отправку.";
  }
  if (code === "too_many_files") {
    const maxPerMessage = details?.maxPerMessage;
    return typeof maxPerMessage === "number"
      ? `Слишком много файлов. Максимум ${maxPerMessage} на сообщение.`
      : "Слишком много файлов в одном сообщении.";
  }
  if (code === "file_too_large") {
    const maxSize = details?.maxSize;
    if (typeof maxSize === "number" && maxSize > 0) {
      const maxMb = Math.ceil(maxSize / (1024 * 1024));
      return `Файл превышает лимит размера (${maxMb} МБ).`;
    }
    return "Файл превышает максимально допустимый размер.";
  }
  if (code === "unsupported_type") {
    if (
      Array.isArray(details?.allowedTypes) &&
      details.allowedTypes.length > 0
    ) {
      return `Тип файла не поддерживается. Разрешены: ${details.allowedTypes.join(", ")}.`;
    }
    return "Тип файла не поддерживается.";
  }
  if (code === "invalid_reply_to") {
    return "Сообщение для ответа недоступно. Обновите чат и попробуйте снова.";
  }
  if (candidate.data?.error) return candidate.data.error;
  if (candidate.data?.detail) return candidate.data.detail;
  if (candidate.message && !candidate.message.includes("status code"))
    return candidate.message;
  return fallback;
};

/**
 * Сравнивает два набора параметров кропа аватара после нормализации.
 * Это позволяет понять, нужно ли перерисовывать аватар или отправлять обновление на backend.
 *
 * @param left Первый вариант параметров кропа.
 * @param right Второй вариант параметров кропа.
 * @returns `true`, если оба варианта описывают один и тот же crop.
 */

export const sameAvatarCrop = (
  left: Message["avatarCrop"],
  right: Message["avatarCrop"],
): boolean => {
  const normalizedLeft = normalizeAvatarCrop(left ?? null);
  const normalizedRight = normalizeAvatarCrop(right ?? null);
  if (!normalizedLeft && !normalizedRight) return true;
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft.x === normalizedRight.x &&
    normalizedLeft.y === normalizedRight.y &&
    normalizedLeft.width === normalizedRight.width &&
    normalizedLeft.height === normalizedRight.height
  );
};

/**
 * Форматирует group typing label.
 * @param kind Аргумент `kind` текущего вызова.
 * @param activeTypingUsers Список `activeTypingUsers`, который обрабатывается функцией.
 * @returns Строковое значение результата.
 */

export const formatGroupTypingLabel = (
  kind: string | null | undefined,
  activeTypingUsers: string[],
): string | null => {
  if (kind !== "group" || activeTypingUsers.length === 0) return null;
  if (activeTypingUsers.length === 1)
    return `${activeTypingUsers[0]} печатает...`;
  if (activeTypingUsers.length === 2)
    return `${activeTypingUsers[0]} и ${activeTypingUsers[1]} печатают...`;
  return `${activeTypingUsers[0]} и ещё ${activeTypingUsers.length - 1} печатают...`;
};

/**
 * Формирует timeline.
 * @param messages Список сообщений для дальнейшей обработки.
 * @param unreadDividerRenderTarget Аргумент `unreadDividerRenderTarget` текущего вызова.
 * @returns Сформированное значение для дальнейшего использования.
 */

export const buildTimeline = (
  messages: Message[],
  unreadDividerRenderTarget: UnreadDividerRenderTarget,
): TimelineItem[] => {
  const items: TimelineItem[] = [];
  const nowDate = new Date();
  let lastKey: string | null = null;
  let unreadInserted = false;
  const unreadDividerId = unreadDividerRenderTarget.messageId;

  if (unreadDividerRenderTarget.insertAtTop) {
    items.push({ type: "unread" });
    unreadInserted = true;
  }

  for (const msg of messages) {
    const isUnreadDividerTarget =
      !unreadInserted && unreadDividerId && msg.id === unreadDividerId;

    if (msg.isDeleted) {
      if (isUnreadDividerTarget) {
        items.push({ type: "unread" });
        unreadInserted = true;
      }
      continue;
    }

    if (isUnreadDividerTarget) {
      items.push({ type: "unread" });
      unreadInserted = true;
    }
    const date = new Date(msg.createdAt);
    if (!Number.isNaN(date.getTime())) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (key !== lastKey) {
        const label = formatDayLabel(date, nowDate);
        if (label) {
          items.push({ type: "day", key, label });
          lastKey = key;
        }
      }
    }
    items.push({ type: "message", message: msg });
  }

  return items;
};
