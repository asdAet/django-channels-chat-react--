import { useCallback, useRef, useState } from "react";

import { chatController } from "../../controllers/ChatController";
import { groupController } from "../../controllers/GroupController";
import type { UploadProgress } from "../../domain/interfaces/IApiService";
import type { Message } from "../../entities/message/types";
import { debugLog } from "../../shared/lib/debug";
import { sanitizeText } from "../../shared/lib/sanitize";
import { useGuardedModalState } from "../../shared/ui/useGuardedModalState";
import { buildChatLightboxSession, type ChatLightboxSession } from "./mediaLightbox";
import type {
  UseChatRoomPageComposerOptions,
  UseChatRoomPageComposerResult,
} from "./useChatRoomPageComposer.types";
import { extractApiErrorMessage } from "./utils";

const getTotalFileBytes = (files: File[]): number =>
  files.reduce((total, file) => total + file.size, 0);

/**
 * Управляет состоянием composer и мутациями сообщений страницы комнаты.
 *
 * @param options Зависимости рантайма и колбэки побочных эффектов.
 * @returns Публичное состояние composer и набор обработчиков.
 */
export function useChatRoomPageComposer({
  roomIdForRequests,
  user,
  messages,
  maxMessageLength,
  maxAttachmentPerMessage,
  maxAttachmentSizeBytes,
  maxAttachmentSizeMb,
  isCurrentUserSuperuser,
  currentActorRef,
  isOnline,
  status,
  send,
  rateLimitActive,
  reload,
  refreshRoomPermissions,
  jumpToMessageById,
  updateUnreadDividerAnchor,
  scrollToBottom,
  setRoomError,
  setMessages,
}: UseChatRoomPageComposerOptions): UseChatRoomPageComposerResult {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Message | null>(null);
  const [readersMenu, setReadersMenu] = useState<
    UseChatRoomPageComposerResult["readersMenu"]
  >(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null,
  );
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const {
    activeValue: lightboxSession,
    requestOpen: requestOpenLightboxSession,
    setActiveValue: setLightboxSession,
  } = useGuardedModalState<ChatLightboxSession>();

  const uploadAbortRef = useRef<AbortController | null>(null);
  const readersRequestSeqRef = useRef(0);

  const sendMessage = useCallback(async () => {
    if (!user) {
      setRoomError("Авторизуйтесь, чтобы отправлять сообщения");
      return;
    }

    const raw = draft;
    const hasQueuedFiles = queuedFiles.length > 0;
    if (!raw.trim() && !hasQueuedFiles) {
      return;
    }

    if (rateLimitActive) {
      setRoomError(
        "Йоу, не так быстро, Вы отправляете сообщения слишком быстро!",
      );
      return;
    }
    if (raw.length > maxMessageLength) {
      setRoomError(
        `Сообщение слишком длинное (макс ${maxMessageLength} символов)`,
      );
      return;
    }
    if (!isOnline || status !== "online") {
      setRoomError("Нет соединения с сервером");
      return;
    }

    if (editingMessage) {
      if (hasQueuedFiles) {
        setRoomError("Уберите вложения для редактирования сообщения");
        return;
      }

      const originalContent = editingMessage.content;
      const originalEditedAt = editingMessage.editedAt;
      const editedContent = raw.trim();
      const editedId = editingMessage.id;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editedId
            ? {
                ...msg,
                content: editedContent,
                editedAt: new Date().toISOString(),
              }
            : msg,
        ),
      );
      setEditingMessage(null);
      setDraft("");

      void chatController
        .editMessage(roomIdForRequests, editedId, editedContent)
        .catch((err) => {
          debugLog("Edit failed", err);
          setRoomError("Не удалось отредактировать сообщение");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === editedId
                ? {
                    ...msg,
                    content: originalContent,
                    editedAt: originalEditedAt,
                  }
                : msg,
            ),
          );
        });
      return;
    }

    const cleaned = sanitizeText(raw, maxMessageLength);

    if (hasQueuedFiles) {
      const abortController = new AbortController();
      const totalBytes = getTotalFileBytes(queuedFiles);
      uploadAbortRef.current = abortController;
      setUploadProgress({
        phase: "uploading",
        percent: 0,
        uploadedBytes: 0,
        totalBytes,
      });
      try {
        await chatController.uploadAttachments(roomIdForRequests, queuedFiles, {
          messageContent: cleaned,
          replyTo: replyTo?.id ?? null,
          onProgress: (progress) => setUploadProgress(progress),
          signal: abortController.signal,
        });
        setDraft("");
        setReplyTo(null);
        setQueuedFiles([]);
        updateUnreadDividerAnchor(null);
        scrollToBottom();
      } catch (err) {
        if (!abortController.signal.aborted) {
          debugLog("Upload failed", err);
          setRoomError(
            extractApiErrorMessage(err, "Не удалось загрузить файлы"),
          );
        }
      } finally {
        uploadAbortRef.current = null;
        setUploadProgress(null);
      }
      return;
    }

    if (!cleaned) {
      return;
    }

    const payload: Record<string, unknown> = {
      message: cleaned,
      username: currentActorRef,
      profile_pic: user.profileImage,
      room: roomIdForRequests,
    };
    if (replyTo) {
      payload.replyTo = replyTo.id;
    }

    if (!send(JSON.stringify(payload))) {
      setRoomError("Не удалось отправить сообщение");
      return;
    }

    setDraft("");
    setReplyTo(null);
    updateUnreadDividerAnchor(null);
    scrollToBottom();
  }, [
    currentActorRef,
    draft,
    editingMessage,
    isOnline,
    maxMessageLength,
    queuedFiles,
    rateLimitActive,
    replyTo,
    roomIdForRequests,
    scrollToBottom,
    send,
    setMessages,
    setRoomError,
    status,
    updateUnreadDividerAnchor,
    user,
  ]);

  const handleReply = useCallback((message: Message) => {
    setReplyTo(message);
    setEditingMessage(null);
  }, []);

  const handleEdit = useCallback((message: Message) => {
    setEditingMessage(message);
    setDraft(message.content);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback((message: Message) => {
    setDeleteConfirm(message);
  }, []);

  const closeReadersMenu = useCallback(() => {
    readersRequestSeqRef.current += 1;
    setReadersMenu(null);
  }, []);

  const handleOpenReaders = useCallback(
    (message: Message, anchor: { x: number; y: number }) => {
      if (!user) {
        return;
      }

      const requestSeq = readersRequestSeqRef.current + 1;
      readersRequestSeqRef.current = requestSeq;
      setReadersMenu({
        message,
        x: anchor.x,
        y: anchor.y,
        loading: true,
        error: null,
        result: null,
      });

      void chatController
        .getMessageReaders(roomIdForRequests, message.id)
        .then((result) => {
          if (readersRequestSeqRef.current !== requestSeq) {
            return;
          }

          setReadersMenu((current) => {
            if (!current || current.message.id !== message.id) {
              return current;
            }

            return {
              ...current,
              loading: false,
              error: null,
              result,
            };
          });
        })
        .catch((err) => {
          if (readersRequestSeqRef.current !== requestSeq) {
            return;
          }

          setReadersMenu((current) => {
            if (!current || current.message.id !== message.id) {
              return current;
            }

            return {
              ...current,
              loading: false,
              error: extractApiErrorMessage(
                err,
                "Не удалось загрузить прочтения",
              ),
            };
          });
        });
    },
    [roomIdForRequests, user],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) {
      return;
    }

    const messageId = deleteConfirm.id;
    const originalMessage = deleteConfirm;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: "" } : msg,
      ),
    );
    setDeleteConfirm(null);

    void chatController
      .deleteMessage(roomIdForRequests, messageId)
      .catch((err) => {
        debugLog("Delete failed", err);
        setRoomError("Не удалось удалить сообщение");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isDeleted: false, content: originalMessage.content }
              : msg,
          ),
        );
      });
  }, [deleteConfirm, roomIdForRequests, setMessages, setRoomError]);

  const handleReact = useCallback(
    (messageId: number, emoji: string) => {
      const message = messages.find((item) => item.id === messageId);
      const existing = message?.reactions.find(
        (reaction) => reaction.emoji === emoji,
      );
      if (existing?.me) {
        void chatController
          .removeReaction(roomIdForRequests, messageId, emoji)
          .catch((err) => debugLog("Remove reaction failed", err));
      } else {
        void chatController
          .addReaction(roomIdForRequests, messageId, emoji)
          .catch((err) => debugLog("Add reaction failed", err));
      }
    },
    [messages, roomIdForRequests],
  );

  const handleAttach = useCallback(
    (files: File[]) => {
      if (!files.length) {
        return;
      }

      const accepted: File[] = [];
      const rejectedMessages: string[] = [];
      const effectiveAttachmentLimit = isCurrentUserSuperuser
        ? Number.MAX_SAFE_INTEGER
        : maxAttachmentPerMessage;
      const capacityLeft = Math.max(
        0,
        effectiveAttachmentLimit - queuedFiles.length,
      );

      if (capacityLeft <= 0) {
        setRoomError(
          `Можно прикрепить не более ${maxAttachmentPerMessage} файлов к сообщению.`,
        );
        return;
      }

      for (const file of files) {
        if (accepted.length >= capacityLeft) {
          rejectedMessages.push(
            `Превышен лимит вложений (${maxAttachmentPerMessage}).`,
          );
          break;
        }

        if (!isCurrentUserSuperuser && file.size > maxAttachmentSizeBytes) {
          rejectedMessages.push(
            `Файл "${file.name}" больше ${maxAttachmentSizeMb} МБ.`,
          );
          continue;
        }

        accepted.push(file);
      }

      if (accepted.length > 0) {
        setQueuedFiles((prev) => [...prev, ...accepted]);
      }
      if (rejectedMessages.length > 0) {
        setRoomError(rejectedMessages.join(" "));
        return;
      }
      setRoomError(null);
    },
    [
      isCurrentUserSuperuser,
      maxAttachmentPerMessage,
      maxAttachmentSizeBytes,
      maxAttachmentSizeMb,
      queuedFiles.length,
      setRoomError,
    ],
  );

  const handleRemoveQueuedFile = useCallback((index: number) => {
    setQueuedFiles((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }, []);

  const handleClearQueuedFiles = useCallback(() => {
    setQueuedFiles([]);
  }, []);

  const handleCancelUpload = useCallback(() => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    setUploadProgress(null);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
    setEditingMessage((prev) => {
      if (prev) {
        setDraft("");
      }
      return null;
    });
  }, []);

  const handleReplyQuoteClick = useCallback(
    (messageId: number) => {
      void jumpToMessageById(messageId).then((found) => {
        if (!found) {
          setRoomError("Не удалось найти сообщение в истории");
        }
      });
    },
    [jumpToMessageById, setRoomError],
  );

  const handleJoinGroup = useCallback(async () => {
    if (!user) {
      setRoomError("Авторизуйтесь, чтобы присоединиться к группе");
      return;
    }

    setJoinInProgress(true);
    setRoomError(null);
    try {
      await groupController.joinGroup(roomIdForRequests);
      reload();
      await refreshRoomPermissions();
    } catch (err) {
      setRoomError(
        extractApiErrorMessage(err, "Не удалось присоединиться к группе"),
      );
    } finally {
      setJoinInProgress(false);
    }
  }, [refreshRoomPermissions, reload, roomIdForRequests, setRoomError, user]);

  const handleOpenMediaAttachment = useCallback((attachmentId: number) => {
    const nextSession = buildChatLightboxSession(messages, attachmentId);
    if (!nextSession) {
      return;
    }

    requestOpenLightboxSession(nextSession);
  }, [messages, requestOpenLightboxSession]);

  return {
    draft,
    setDraft,
    replyTo,
    editingMessage,
    deleteConfirm,
    setDeleteConfirm,
    readersMenu,
    uploadProgress,
    queuedFiles,
    joinInProgress,
    lightboxSession,
    setLightboxSession,
    sendMessage,
    handleReply,
    handleEdit,
    handleDelete,
    closeReadersMenu,
    handleOpenReaders,
    confirmDelete,
    handleReact,
    handleAttach,
    handleRemoveQueuedFile,
    handleClearQueuedFiles,
    handleCancelUpload,
    handleCancelReply,
    handleReplyQuoteClick,
    handleJoinGroup,
    handleOpenMediaAttachment,
  };
}
