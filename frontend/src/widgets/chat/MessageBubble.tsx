import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import type {
  Message,
  ReactionSummary,
  ReplyTo,
} from "../../entities/message/types";
import {
  isImageAttachment,
  resolveImagePreviewUrl,
} from "../../shared/lib/attachmentMedia";
import { formatTimestamp } from "../../shared/lib/format";
import { normalizePublicRef } from "../../shared/lib/publicRef";
import type { ContextMenuItem } from "../../shared/ui";
import {
  AudioAttachmentPlayer,
  Avatar,
  ContextMenu,
  ImageLightbox,
} from "../../shared/ui";
import styles from "../../styles/chat/MessageBubble.module.css";

type Props = {
  message: Message;
  isOwn: boolean;
  canModerate?: boolean;
  isRead?: boolean;
  highlighted?: boolean;
  onlineUsernames: Set<string>;
  onReply?: (msg: Message) => void;
  onEdit?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onReact?: (msgId: number, emoji: string) => void;
  onReplyQuoteClick?: (replyToId: number) => void;
  onAvatarClick?: (actorRef: string) => void;
};

const QUICK_REACTIONS = [
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F44E}",
  "\u{1F525}",
  "\u{1F389}",
  "\u{1F622}",
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isVideoType = (ct: string) => ct.startsWith("video/");
const isAudioType = (ct: string) => ct.startsWith("audio/");
const normalizeActorRef = (value: string) =>
  normalizePublicRef(value).toLowerCase();

const MOBILE_MENU_IGNORE_SELECTOR =
  'a,button,input,textarea,select,video,audio,img,[role="button"],[data-message-menu-ignore="true"]';

const isTouchLikeDevice = () => {
  if (typeof window === "undefined") return false;
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return true;
  if (window.matchMedia?.("(pointer: coarse)").matches) return true;
  if (window.matchMedia?.("(hover: none)").matches) return true;
  return window.innerWidth <= 768;
};

const shouldIgnoreMobileMenuTap = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(MOBILE_MENU_IGNORE_SELECTOR));
};

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
          {replyTo.displayName ?? replyTo.username ?? "?"}
        </span>
        <span className={styles.replyText}>{replyTo.content}</span>
      </button>
    );
  }
  return (
    <div className={styles.replyQuote}>
      <span className={styles.replyUser}>
        {replyTo.displayName ?? replyTo.username ?? "?"}
      </span>
      <span className={styles.replyText}>{replyTo.content}</span>
    </div>
  );
}

function ReactionChip({
  reaction,
  onToggle,
}: {
  reaction: ReactionSummary;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={[styles.reaction, reaction.me ? styles.reactionMine : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      aria-label={`${reaction.emoji} ${reaction.count}`}
    >
      <span>{reaction.emoji}</span>
      <span className={styles.reactionCount}>{reaction.count}</span>
    </button>
  );
}

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

function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={styles.emojiBackdrop}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div className={styles.emojiPicker} onClick={(e) => e.stopPropagation()}>
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={styles.emojiBtn}
            onClick={() => {
              onPick(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

export function MessageBubble({
  message,
  isOwn,
  canModerate = false,
  isRead = false,
  highlighted = false,
  onlineUsernames,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onReplyQuoteClick,
  onAvatarClick,
}: Props) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const lastTouchTapTsRef = useRef<number>(0);
  const lastRightMouseDownTsRef = useRef<number>(0);

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

  const handleMobileTap = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      if (message.isDeleted || !isTouchLikeDevice()) return;
      if (event.timeStamp - lastTouchTapTsRef.current < 500) return;
      if (shouldIgnoreMobileMenuTap(event.target)) return;
      const position = resolveMenuPosition(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      openContextMenuAt(position.x, position.y);
    },
    [message.isDeleted, openContextMenuAt, resolveMenuPosition],
  );

  const handleMobilePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (message.isDeleted) return;
      if (event.pointerType !== "touch" && event.pointerType !== "pen") {
        return;
      }
      if (shouldIgnoreMobileMenuTap(event.target)) return;
      lastTouchTapTsRef.current = event.timeStamp;
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

  const handleMobileTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      if (typeof window !== "undefined" && "PointerEvent" in window) return;
      if (message.isDeleted) return;
      if (shouldIgnoreMobileMenuTap(event.target)) return;
      const touch = event.changedTouches.item(0);
      lastTouchTapTsRef.current = event.timeStamp;
      const position = resolveMenuPosition(
        event.currentTarget,
        touch?.clientX ?? 0,
        touch?.clientY ?? 0,
      );
      openContextMenuAt(position.x, position.y);
      event.preventDefault();
    },
    [message.isDeleted, openContextMenuAt, resolveMenuPosition],
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
        onClick: () => void navigator.clipboard.writeText(messageText),
      });
    }

    contextMenuItems.push({
      label: "Реакция",
      icon: <span style={{ fontSize: 14 }}>{"\u{1F44D}"}</span>,
      disabled: !onReact,
      onClick: () => {
        if (!onReact) return;
        setEmojiPickerOpen(true);
      },
    });

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
  const isDeleted = message.isDeleted;

  return (
    <>
      <article
        className={[
          styles.message,
          isOwn ? styles.messageOwn : "",
          isDeleted ? styles.deleted : "",
          highlighted ? styles.highlighted : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-message-id={message.id}
        data-own-message={isOwn ? "true" : "false"}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onClick={handleMobileTap}
        onPointerUp={handleMobilePointerUp}
        onTouchEnd={handleMobileTouchEnd}
      >
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => onAvatarClick?.(message.publicRef)}
          aria-label={`Профиль ${message.displayName ?? message.username}`}
        >
          <Avatar
            username={message.displayName ?? message.username}
            profileImage={message.profilePic}
            avatarCrop={message.avatarCrop}
            size="small"
            online={onlineUsernames.has(
              normalizeActorRef(message.publicRef || ""),
            )}
          />
        </button>

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

          <div className={styles.bubble}>
            <div className={styles.meta}>
              <span className={styles.username}>
                {message.displayName ?? message.username}
              </span>
            </div>

            {isDeleted ? (
              <p className={styles.deletedContent}>Сообщение удалено</p>
            ) : (
              <>
                {message.content && (
                  <p className={styles.content}>{message.content}</p>
                )}
              </>
            )}

            {!isDeleted && message.attachments.length > 0 && (
              <div className={styles.attachments}>
                {message.attachments.map((att) => {
                  const imageSrc = resolveImagePreviewUrl({
                    url: att.url,
                    thumbnailUrl: att.thumbnailUrl,
                    contentType: att.contentType,
                    fileName: att.originalFilename,
                  });
                  if (
                    isImageAttachment(att.contentType, att.originalFilename) &&
                    imageSrc
                  ) {
                    return (
                      <img
                        key={att.id}
                        src={imageSrc}
                        alt={att.originalFilename}
                        className={styles.attachImage}
                        loading="lazy"
                        onClick={() => setLightboxSrc(att.url!)}
                      />
                    );
                  }
                  if (isVideoType(att.contentType) && att.url) {
                    return (
                      <video
                        key={att.id}
                        src={att.url}
                        controls
                        preload="metadata"
                        className={styles.attachVideo}
                      >
                        <track kind="captions" />
                      </video>
                    );
                  }
                  if (isAudioType(att.contentType) && att.url) {
                    return (
                      <AudioAttachmentPlayer
                        key={att.id}
                        src={att.url}
                        title={att.originalFilename}
                        subtitle={formatFileSize(att.fileSize)}
                        downloadName={att.originalFilename}
                        compact
                      />
                    );
                  }
                  const contentTypeLabel =
                    att.contentType &&
                    att.contentType !== "application/octet-stream"
                      ? att.contentType
                      : "неизвестный тип";
                  const fileMeta = `${formatFileSize(att.fileSize)} • ${contentTypeLabel}`;

                  if (att.url) {
                    return (
                      <a
                        key={att.id}
                        href={att.url}
                        className={styles.attachFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.originalFilename}
                      >
                        <span className={styles.attachFileIcon}>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </span>
                        <span className={styles.attachFileInfo}>
                          <span className={styles.attachFileName}>
                            {att.originalFilename}
                          </span>
                          <span className={styles.attachFileSize}>
                            {fileMeta}
                          </span>
                        </span>
                      </a>
                    );
                  }

                  return (
                    <div
                      key={att.id}
                      className={styles.attachFile}
                      data-message-menu-ignore="true"
                    >
                      <span className={styles.attachFileIcon}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </span>
                      <span className={styles.attachFileInfo}>
                        <span className={styles.attachFileName}>
                          {att.originalFilename}
                        </span>
                        <span className={styles.attachFileSize}>
                          {fileMeta}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {!isDeleted && (
              <div className={styles.footerInfo}>
                {message.editedAt && (
                  <span className={styles.editedTag}>ред.</span>
                )}
                <span className={styles.time}>
                  {formatTimestamp(message.createdAt)}
                </span>
                {isOwn && <CheckMark isRead={isRead} />}
              </div>
            )}
          </div>

          {!isDeleted && message.reactions.length > 0 && (
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
        <EmojiPicker
          onPick={handleReact}
          onClose={() => setEmojiPickerOpen(false)}
        />
      )}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </>
  );
}
