import {
  type ClipboardEvent as ReactClipboardEvent,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Message,
  ReactionSummary,
  ReplyTo,
} from "../../entities/message/types";
import { useChatAttachmentMaxPerMessage } from "../../shared/config/limits";
import {
  type CustomEmoji,
  CustomEmojiNode,
  getSelectedCustomEmojiNodeIndexes,
  getSingleCustomEmojiOnly,
  parseCustomEmojiText,
  serializeCustomEmojiSelection,
  writeCustomEmojiClipboardContent,
  writeCustomEmojiClipboardData,
} from "../../shared/customEmoji";
import {
  formatAttachmentFileSize,
  formatAttachmentSentAt,
} from "../../shared/lib/attachmentDisplay";
import {
  isVideoAttachment,
  resolveResponsiveImageSource,
} from "../../shared/lib/attachmentMedia";
import { resolveAttachmentTypeLabel } from "../../shared/lib/attachmentTypeLabel";
import { formatTimestamp } from "../../shared/lib/format";
import { normalizePublicRef } from "../../shared/lib/publicRef";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import type { ContextMenuItem } from "../../shared/ui";
import {
  AudioAttachmentPlayer,
  Avatar,
  ContextMenu,
  FileAttachmentCard,
  ImageLightbox,
} from "../../shared/ui";
import styles from "../../styles/chat/MessageBubble.module.css";
import {
  buildAttachmentRenderItems,
  buildMediaTileLayout,
  splitAttachmentRenderItems,
} from "./lib/attachmentLayout";
import { TelegramEmojiPicker } from "./TelegramEmojiPicker";
import { VideoAttachmentPreview } from "./VideoAttachmentPreview";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showHeader?: boolean;
  grouped?: boolean;
  canModerate?: boolean;
  canViewReaders?: boolean;
  isRead?: boolean;
  highlighted?: boolean;
  onlineUsernames: Set<string>;
  onReply?: (msg: Message) => void;
  onEdit?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onReact?: (msgId: number, emoji: string) => void;
  onViewReaders?: (msg: Message, anchor: { x: number; y: number }) => void;
  onReplyQuoteClick?: (replyToId: number) => void;
  onAvatarClick?: (actorRef: string) => void;
  onOpenMediaAttachment?: (attachmentId: number) => void;
};

/**
 * Определяет тип медиа, которое открывается в модальном просмотрщике.
 */
type LightboxMediaKind = "image" | "video";

/**
 * Хранит метаданные вложения для подписи в модальном просмотрщике.
 */
type LightboxMediaMetadata = {
  attachmentId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  sentAt: string;
  width: number | null;
  height: number | null;
};

/**
 * Описывает состояние активного предпросмотра вложения.
 */
type LightboxMediaItem = {
  src: string;
  previewSrc?: string | null;
  downloadUrl?: string | null;
  kind: LightboxMediaKind;
  alt?: string;
  metadata: LightboxMediaMetadata;
};

/**
 * Форматирует размер файла для отображения рядом с вложением.
 * @param bytes Размер файла в байтах.
 * @returns Строка в отформатированном виде.
 */

const IconEmoji = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

/**
 * Проверяет, относится ли MIME-тип к видео.
 * @param contentType MIME-тип вложения.
 * @param fileName Имя файла, используется как дополнительная эвристика.
 * @returns Логический флаг результата проверки.
 */

const isVideoType = (contentType: string, fileName: string) =>
  isVideoAttachment(contentType, fileName);
/**
 * Проверяет, относится ли MIME-тип к аудио.
 * @param ct MIME-тип вложения.
 * @returns Логический флаг результата проверки.
 */

const isAudioType = (ct: string) => ct.startsWith("audio/");
/**
 * Нормализует публичный идентификатор пользователя для сравнения online-статуса.
 * @param value Входное значение для преобразования.
 */

const normalizeActorRef = (value: string) =>
  normalizePublicRef(value).toLowerCase();

const MOBILE_MENU_IGNORE_SELECTOR =
  'a,button,input,textarea,select,video,audio,img,[role="button"],[data-message-menu-ignore="true"]';
const MOBILE_LONG_PRESS_MENU_MS = 520;
const MOBILE_LONG_PRESS_MOVE_TOLERANCE_PX = 10;

type MobileLongPressState = {
  pointerId: number | null;
  target: HTMLElement;
  startX: number;
  startY: number;
  x: number;
  y: number;
  timerId: number;
  opened: boolean;
};

/**
 * Проверяет, что тап был по интерактивному элементу и меню открывать не нужно.
 * @param target DOM-элемент, по которому пришло событие.
 * @returns Логический флаг, нужно ли выполнять действие.
 */

const shouldIgnoreMobileMenuGesture = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(MOBILE_MENU_IGNORE_SELECTOR));
};

const areSetsEqual = (first: Set<number>, second: Set<number>) => {
  if (first.size !== second.size) {
    return false;
  }

  for (const value of first) {
    if (!second.has(value)) {
      return false;
    }
  }

  return true;
};

function MessageContent({ content }: { content: string }) {
  const contentRef = useRef<HTMLParagraphElement>(null);
  const parts = parseCustomEmojiText(content);
  const singleEmoji = getSingleCustomEmojiOnly(content);
  const [selectedEmojiIndexes, setSelectedEmojiIndexes] = useState<Set<number>>(
    () => new Set(),
  );

  const updateSelectedEmojiIndexes = useCallback(() => {
    const root = contentRef.current;
    const nextIndexes = root
      ? getSelectedCustomEmojiNodeIndexes(root)
      : new Set<number>();

    setSelectedEmojiIndexes((currentIndexes) =>
      areSetsEqual(currentIndexes, nextIndexes) ? currentIndexes : nextIndexes,
    );
  }, []);

  useEffect(() => {
    const ownerDocument = contentRef.current?.ownerDocument ?? document;

    ownerDocument.addEventListener(
      "selectionchange",
      updateSelectedEmojiIndexes,
    );
    return () => {
      ownerDocument.removeEventListener(
        "selectionchange",
        updateSelectedEmojiIndexes,
      );
    };
  }, [updateSelectedEmojiIndexes]);

  const handleCopy = useCallback(
    (event: ReactClipboardEvent<HTMLParagraphElement>) => {
      const selectedContent = serializeCustomEmojiSelection(
        event.currentTarget,
      );
      if (!selectedContent) {
        return;
      }

      event.preventDefault();
      writeCustomEmojiClipboardData(event.clipboardData, selectedContent);
    },
    [],
  );

  const emojiIndexByPartIndex = new Map(
    parts
      .map((part, index) => ({ index, part }))
      .filter(({ part }) => part.type === "emoji")
      .map(({ index }, emojiIndex) => [index, emojiIndex] as const),
  );

  return (
    <p
      ref={contentRef}
      className={[
        styles.content,
        singleEmoji ? styles.customEmojiOnlyContent : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onCopy={handleCopy}
    >
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={`text-${index}`}>{part.value}</span>;
        }

        const emojiIndex = emojiIndexByPartIndex.get(index) ?? -1;
        const emojiSelected = selectedEmojiIndexes.has(emojiIndex);

        return (
          <CustomEmojiNode
            key={`${part.value.id}-${index}`}
            emoji={part.value}
            size={singleEmoji ? 72 : 26}
            className={[
              singleEmoji ? styles.customEmojiLarge : styles.customEmojiInline,
              emojiSelected ? styles.customEmojiSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}
    </p>
  );
}
/**
 * Компонент ReplyQuote рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 */
function ReplyQuote({
  replyTo,
  onClick,
}: {
  replyTo: ReplyTo;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        className={[styles.replyQuote, styles.replyQuoteClickable].join(" ")}
        onClick={onClick}
      >
        <span className={styles.replyUser}>
          {resolveIdentityLabel(replyTo, "?")}
        </span>
        <span className={styles.replyText}>{replyTo.content}</span>
      </button>
    );
  }
  return (
    <div className={styles.replyQuote}>
      <span className={styles.replyUser}>
        {resolveIdentityLabel(replyTo, "?")}
      </span>
      <span className={styles.replyText}>{replyTo.content}</span>
    </div>
  );
}
/**
 * Компонент ReactionChip рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 */
function ReactionChip({
  reaction,
  onToggle,
}: {
  reaction: ReactionSummary;
  onToggle: () => void;
}) {
  const customEmoji = getSingleCustomEmojiOnly(reaction.emoji);
  const reactionLabel = customEmoji?.label ?? reaction.emoji;

  return (
    <button
      type="button"
      className={[styles.reaction, reaction.me ? styles.reactionMine : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      aria-label={`${reactionLabel} ${reaction.count}`}
    >
      <span className={styles.reactionGlyph}>
        {customEmoji ? (
          <CustomEmojiNode
            emoji={customEmoji}
            size={22}
            className={styles.reactionCustomEmoji}
          />
        ) : (
          reaction.emoji
        )}
      </span>
      <span className={styles.reactionCount}>{reaction.count}</span>
    </button>
  );
}
/**
 * React-компонент CheckMark отвечает за отрисовку и обработку UI-сценария.
 */
function CheckMark({ isRead }: { isRead: boolean }) {
  return (
    <span
      data-testid="message-read-marker"
      data-read={isRead ? "true" : "false"}
      className={[styles.checkMark, isRead ? styles.checkRead : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label={isRead ? "Прочитано" : "Отправлено"}
    >
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path
          d="M1 5.5L4.5 9L11 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 5.5L9 9L15.5 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isRead ? 1 : 0.35}
        />
      </svg>
    </span>
  );
}
/**
 * Компонент MessageBubble рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 */
export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showHeader = true,
  grouped = false,
  canModerate = false,
  canViewReaders = false,
  isRead = false,
  highlighted = false,
  onlineUsernames,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onViewReaders,
  onReplyQuoteClick,
  onAvatarClick,
  onOpenMediaAttachment,
}: Props) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [lightboxOpenIndex, setLightboxOpenIndex] = useState<number | null>(
    null,
  );
  const lastRightMouseDownTsRef = useRef<number>(0);
  const mobileLongPressRef = useRef<MobileLongPressState | null>(null);

  const openContextMenuAt = useCallback((x: number, y: number) => {
    setContextMenu({ x, y });
  }, []);

  const resolveMenuPosition = useCallback(
    (
      target: HTMLElement,
      fallbackX: number,
      fallbackY: number,
    ): { x: number; y: number } => {
      if (fallbackX > 0 && fallbackY > 0) {
        return { x: fallbackX, y: fallbackY };
      }
      const rect = target.getBoundingClientRect();
      return {
        x: Math.min(rect.right - 12, window.innerWidth - 12),
        y: Math.max(rect.top + 12, 12),
      };
    },
    [],
  );

  const handleReact = useCallback(
    (emoji: string) => onReact?.(message.id, emoji),
    [message.id, onReact],
  );
  const handleCustomReactionSelect = useCallback(
    (emoji: CustomEmoji) => handleReact(emoji.token),
    [handleReact],
  );

  /**
   * Собирает метаданные вложения для отображения в просмотрщике.
   *
   * @param attachment Вложение из сообщения.
   * @returns Метаданные для подписи под медиа.
   */
  const buildLightboxMetadata = useCallback(
    (attachment: Message["attachments"][number]): LightboxMediaMetadata => ({
      attachmentId: attachment.id,
      fileName: attachment.originalFilename,
      contentType: attachment.contentType,
      fileSize: attachment.fileSize,
      sentAt: message.createdAt,
      width: attachment.width,
      height: attachment.height,
    }),
    [message.createdAt],
  );

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (message.isDeleted) return;
      e.preventDefault();
      if (e.timeStamp - lastRightMouseDownTsRef.current < 250) return;
      openContextMenuAt(e.clientX, e.clientY);
    },
    [message.isDeleted, openContextMenuAt],
  );

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (message.isDeleted || event.button !== 2) return;
      lastRightMouseDownTsRef.current = event.timeStamp;
      const position = resolveMenuPosition(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      openContextMenuAt(position.x, position.y);
      event.preventDefault();
    },
    [message.isDeleted, openContextMenuAt, resolveMenuPosition],
  );

  const clearMobileLongPress = useCallback(() => {
    const state = mobileLongPressRef.current;
    if (!state) return false;

    window.clearTimeout(state.timerId);
    mobileLongPressRef.current = null;
    return state.opened;
  }, []);

  const finishMobileLongPress = useCallback((pointerId: number | null) => {
    const state = mobileLongPressRef.current;
    if (!state || state.pointerId !== pointerId) return false;

    window.clearTimeout(state.timerId);
    mobileLongPressRef.current = null;
    return state.opened;
  }, []);

  const startMobileLongPress = useCallback(
    (
      target: HTMLElement,
      pointerId: number | null,
      x: number,
      y: number,
    ) => {
      clearMobileLongPress();

      const state: MobileLongPressState = {
        pointerId,
        target,
        startX: x,
        startY: y,
        x,
        y,
        timerId: 0,
        opened: false,
      };

      state.timerId = window.setTimeout(() => {
        const current = mobileLongPressRef.current;
        if (current !== state || message.isDeleted) return;

        current.opened = true;
        const position = resolveMenuPosition(
          current.target,
          current.x,
          current.y,
        );
        openContextMenuAt(position.x, position.y);
      }, MOBILE_LONG_PRESS_MENU_MS);

      mobileLongPressRef.current = state;
    },
    [
      clearMobileLongPress,
      message.isDeleted,
      openContextMenuAt,
      resolveMenuPosition,
    ],
  );

  const cancelMobileLongPressOnMove = useCallback(
    (pointerId: number | null, x: number, y: number) => {
      const state = mobileLongPressRef.current;
      if (!state || state.pointerId !== pointerId || state.opened) return;

      const movedDistance = Math.hypot(x - state.startX, y - state.startY);
      if (movedDistance > MOBILE_LONG_PRESS_MOVE_TOLERANCE_PX) {
        clearMobileLongPress();
      }
    },
    [clearMobileLongPress],
  );

  const handleMobilePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (message.isDeleted) return;
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }
      if (shouldIgnoreMobileMenuGesture(event.target)) return;

      startMobileLongPress(
        event.currentTarget,
        event.pointerId,
        event.clientX,
        event.clientY,
      );
    },
    [message.isDeleted, startMobileLongPress],
  );

  const handleMobilePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      cancelMobileLongPressOnMove(
        event.pointerId,
        event.clientX,
        event.clientY,
      );
    },
    [cancelMobileLongPressOnMove],
  );

  const handleMobilePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }
      if (finishMobileLongPress(event.pointerId)) {
        event.preventDefault();
      }
    },
    [finishMobileLongPress],
  );

  const handleMobilePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }
      clearMobileLongPress();
    },
    [clearMobileLongPress],
  );

  const handleMobileTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      if (message.isDeleted) return;
      if (shouldIgnoreMobileMenuGesture(event.target)) return;

      const touch = event.touches.item(0);
      if (!touch) return;

      startMobileLongPress(
        event.currentTarget,
        null,
        touch.clientX,
        touch.clientY,
      );
    },
    [message.isDeleted, startMobileLongPress],
  );

  const handleMobileTouchMove = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;

      const touch = event.touches.item(0);
      if (!touch) return;

      cancelMobileLongPressOnMove(null, touch.clientX, touch.clientY);
    },
    [cancelMobileLongPressOnMove],
  );

  const handleMobileTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;

      if (finishMobileLongPress(null)) {
        event.preventDefault();
      }
    },
    [finishMobileLongPress],
  );

  const handleMobileTouchCancel = useCallback(() => {
    if (typeof window !== "undefined" && "PointerEvent" in window) return;
    clearMobileLongPress();
  }, [clearMobileLongPress]);

  useEffect(
    () => () => {
      clearMobileLongPress();
    },
    [clearMobileLongPress],
  );

  const contextMenuItems: ContextMenuItem[] = [];
  if (!message.isDeleted) {
    const canManageMessage = isOwn || canModerate;
    const messageText = message.content.trim();

    contextMenuItems.push({
      label: "Ответить",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="9 17 4 12 9 7" />
          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
      ),
      disabled: !onReply,
      onClick: () => onReply?.(message),
    });

    if (messageText.length > 0) {
      contextMenuItems.push({
        label: "Копировать текст",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        ),
        onClick: () => void writeCustomEmojiClipboardContent(messageText),
      });
    }

    contextMenuItems.push({
      label: "Реакция",
      icon: <IconEmoji />,
      disabled: !onReact,
      onClick: () => {
        if (!onReact) return;
        setEmojiPickerOpen(true);
      },
    });

    if (canViewReaders) {
      contextMenuItems.push({
        label: "Кто прочитал",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ),
        disabled: !onViewReaders,
        onClick: () =>
          onViewReaders?.(message, contextMenu ?? { x: 12, y: 12 }),
      });
    }

    if (!isOwn) {
      contextMenuItems.push({
        label: "Профиль",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
        disabled: !onAvatarClick,
        onClick: () => onAvatarClick?.(message.publicRef),
      });
    }

    if (canManageMessage) {
      contextMenuItems.push({
        label: "Редактировать",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
        disabled: !onEdit,
        onClick: () => onEdit?.(message),
      });

      contextMenuItems.push({
        label: "Удалить",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        ),
        danger: true,
        disabled: !onDelete,
        onClick: () => onDelete?.(message),
      });
    }
  }
  const maxVisibleImageAttachments = useChatAttachmentMaxPerMessage();
  if (message.isDeleted) {
    return null;
  }

  const authorLabel = resolveIdentityLabel(message);
  const isCustomEmojiOnlyMessage =
    Boolean(getSingleCustomEmojiOnly(message.content)) &&
    message.attachments.length === 0 &&
    !message.replyTo;
  const isAttachmentOnlyMessage =
    message.attachments.length > 0 &&
    message.content.trim().length === 0 &&
    !message.replyTo;
  const attachmentItems = buildAttachmentRenderItems(message.attachments);
  const attachmentBuckets = splitAttachmentRenderItems(
    attachmentItems,
    maxVisibleImageAttachments,
  );
  const lightboxMediaItems: LightboxMediaItem[] = attachmentItems.flatMap(
    (item) => {
      const { attachment } = item;
      if (!attachment.url) {
        return [];
      }
      const isVideo = isVideoType(
        attachment.contentType,
        attachment.originalFilename,
      );
      if (!isVideo && !item.isImage) {
        return [];
      }
      return [
        {
          src: attachment.url,
          previewSrc: attachment.thumbnailUrl,
          downloadUrl: attachment.url,
          kind: isVideo ? "video" : "image",
          alt: attachment.originalFilename,
          metadata: buildLightboxMetadata(attachment),
        },
      ];
    },
  );

  const openLightboxByAttachmentId = (attachmentId: number) => {
    if (onOpenMediaAttachment) {
      onOpenMediaAttachment(attachmentId);
      return;
    }

    const targetIndex = lightboxMediaItems.findIndex(
      (item) => item.metadata.attachmentId === attachmentId,
    );
    if (targetIndex < 0) return;
    setLightboxOpenIndex(targetIndex);
  };

  return (
    <>
      <article
        className={[
          styles.message,
          isOwn ? styles.messageOwn : "",
          grouped ? styles.messageGrouped : "",
          highlighted ? styles.highlighted : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-message-id={message.id}
        data-own-message={isOwn ? "true" : "false"}
        data-message-grouped={grouped ? "true" : "false"}
        data-message-avatar={showAvatar ? "true" : "false"}
        data-message-header={showHeader ? "true" : "false"}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onPointerDown={handleMobilePointerDown}
        onPointerMove={handleMobilePointerMove}
        onPointerUp={handleMobilePointerUp}
        onPointerCancel={handleMobilePointerCancel}
        onPointerLeave={handleMobilePointerCancel}
        onTouchStart={handleMobileTouchStart}
        onTouchMove={handleMobileTouchMove}
        onTouchEnd={handleMobileTouchEnd}
        onTouchCancel={handleMobileTouchCancel}
      >
        {showAvatar && (
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => onAvatarClick?.(message.publicRef)}
            aria-label={`Профиль ${authorLabel}`}
          >
            <Avatar
              username={authorLabel}
              profileImage={message.profilePic}
              avatarCrop={message.avatarCrop}
              size="small"
              online={onlineUsernames.has(
                normalizeActorRef(message.publicRef || ""),
              )}
            />
          </button>
        )}

        <div className={styles.body}>
          {message.replyTo && (
            <ReplyQuote
              replyTo={message.replyTo}
              onClick={
                onReplyQuoteClick
                  ? () => onReplyQuoteClick(message.replyTo!.id)
                  : undefined
              }
            />
          )}

          <div
            className={[
              styles.bubble,
              isCustomEmojiOnlyMessage ? styles.customEmojiOnlyBubble : "",
              isAttachmentOnlyMessage ? styles.attachmentOnlyBubble : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {showHeader && (
              <div className={styles.meta}>
                <span className={styles.username}>{authorLabel}</span>
              </div>
            )}

            {message.content && <MessageContent content={message.content} />}

            {message.attachments.length > 0 && (
              <div className={styles.attachments}>
                {attachmentBuckets.imageGroups.map((imageGroup, groupIndex) => {
                  const mediaLayout = buildMediaTileLayout(imageGroup);
                  const isSingleTile = imageGroup.length === 1;

                  return (
                    <div
                      key={`media-group-${message.id}-${groupIndex}`}
                      className={styles.mediaCollage}
                      data-testid="message-media-grid"
                      data-count={imageGroup.length}
                      style={
                        {
                          aspectRatio:
                            mediaLayout.containerAspectRatio.toFixed(4),
                        } satisfies CSSProperties
                      }
                    >
                      {mediaLayout.items.map((item) => {
                        const tileImageSource = resolveResponsiveImageSource({
                          url: item.attachment.url,
                          thumbnailUrl: item.attachment.thumbnailUrl,
                          contentType: item.attachment.contentType,
                          fileName: item.attachment.originalFilename,
                          expectedWidthPx: (420 * item.widthPercent) / 100,
                        });

                        return (
                          <button
                            key={item.attachment.id}
                            type="button"
                            className={[
                              styles.mediaTile,
                              styles.mediaTileAbsolute,
                              isSingleTile
                                ? styles.mediaTileSingle
                                : styles.mediaTileGrouped,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            data-message-menu-ignore="true"
                            style={
                              {
                                left: `${item.leftPercent.toFixed(4)}%`,
                                top: `${item.topPercent.toFixed(4)}%`,
                                width: `${item.widthPercent.toFixed(4)}%`,
                                height: `${item.heightPercent.toFixed(4)}%`,
                              } satisfies CSSProperties
                            }
                            onClick={() =>
                              openLightboxByAttachmentId(item.attachment.id)
                            }
                            aria-label={`Открыть изображение ${item.attachment.originalFilename}`}
                          >
                            <img
                              src={tileImageSource.src ?? item.imageSrc}
                              srcSet={tileImageSource.srcSet}
                              sizes={tileImageSource.sizes}
                              alt={item.attachment.originalFilename}
                              width={item.attachment.width ?? undefined}
                              height={item.attachment.height ?? undefined}
                              className={[
                                styles.attachImage,
                                isSingleTile
                                  ? styles.attachImageSingle
                                  : styles.attachImageGrouped,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                            />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {attachmentBuckets.others.length > 0 && (
                  <div className={styles.fileAttachments}>
                    {attachmentBuckets.others.map(({ attachment: att }) => {
                      const fileSizeLabel = formatAttachmentFileSize(
                        att.fileSize,
                      );
                      const fileTypeLabel = resolveAttachmentTypeLabel(
                        att.contentType,
                        att.originalFilename,
                      );
                      const sentAtLabel = formatAttachmentSentAt(
                        message.createdAt,
                      );

                      if (
                        isVideoType(att.contentType, att.originalFilename) &&
                        att.url
                      ) {
                        return (
                          <VideoAttachmentPreview
                            key={att.id}
                            attachment={att}
                            onOpen={() => openLightboxByAttachmentId(att.id)}
                          />
                        );
                      }
                      if (isAudioType(att.contentType) && att.url) {
                        return (
                          <AudioAttachmentPlayer
                            key={att.id}
                            src={att.url}
                            title={att.originalFilename}
                            fileSizeLabel={fileSizeLabel}
                            fileTypeLabel={fileTypeLabel}
                            sentAtLabel={sentAtLabel}
                            sentAtIso={message.createdAt}
                            downloadName={att.originalFilename}
                            compact
                          />
                        );
                      }
                      return (
                        <FileAttachmentCard
                          key={att.id}
                          fileName={att.originalFilename}
                          fileTypeLabel={fileTypeLabel}
                          fileSizeLabel={fileSizeLabel}
                          sentAtLabel={sentAtLabel}
                          sentAtIso={message.createdAt}
                          href={att.url}
                          downloadName={att.originalFilename}
                          compact
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className={styles.footerInfo}>
              {message.editedAt && (
                <span className={styles.editedTag}>ред.</span>
              )}
              <span className={styles.time}>
                {formatTimestamp(message.createdAt)}
              </span>
              {isOwn && <CheckMark isRead={isRead} />}
            </div>
          </div>

          {message.reactions.length > 0 && (
            <div className={styles.reactions}>
              {message.reactions.map((r) => (
                <ReactionChip
                  key={r.emoji}
                  reaction={r}
                  onToggle={() => handleReact(r.emoji)}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          items={contextMenuItems}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
      {emojiPickerOpen && (
        <TelegramEmojiPicker
          placement="overlay"
          onSelect={handleCustomReactionSelect}
          onClose={() => setEmojiPickerOpen(false)}
        />
      )}
      {!onOpenMediaAttachment &&
        lightboxOpenIndex !== null &&
        lightboxMediaItems.length > 0 && (
          <ImageLightbox
            mediaItems={lightboxMediaItems}
            initialIndex={lightboxOpenIndex}
            onClose={() => setLightboxOpenIndex(null)}
          />
        )}
    </>
  );
}
