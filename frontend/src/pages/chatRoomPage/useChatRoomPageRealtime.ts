import { useCallback, useEffect, useMemo, useState } from "react";

import { decodeChatWsEvent } from "../../dto";
import { useTypingIndicator } from "../../hooks/useTypingIndicator";
import {
  invalidateDirectChats,
  invalidateRoomMessages,
} from "../../shared/cache/cacheManager";
import { useChatRealtimeRoom } from "../../shared/chatRealtime";
import { debugLog } from "../../shared/lib/debug";
import { sanitizeText } from "../../shared/lib/sanitize";
import type {
  UseChatRoomPageRealtimeOptions,
  UseChatRoomPageRealtimeResult,
} from "./useChatRoomPageRealtime.types";
import { normalizeActorRef, sameAvatarCrop, TYPING_TIMEOUT_MS } from "./utils";

/**
 * Управляет realtime-событиями комнаты через WebSocket.
 *
 * @param options Зависимости транспорта и обработчиков событий комнаты.
 * @returns Состояние транспорта, typing-индикаторы и read receipts.
 */
export function useChatRoomPageRealtime({
  roomRealtimeId,
  roomIdForRequests,
  roomKind,
  maxMessageLength,
  currentActorRef,
  readStateEnabled,
  user,
  setMessages,
  setRoomError,
  onIncomingForeignMessage,
}: UseChatRoomPageRealtimeOptions): UseChatRoomPageRealtimeResult {
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(
    new Map(),
  );
  const [typingDisplayNames, setTypingDisplayNames] = useState<
    Map<string, string>
  >(new Map());
  const [readReceipts, setReadReceipts] = useState<
    UseChatRoomPageRealtimeResult["readReceipts"]
  >(new Map());
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const applyRateLimit = useCallback((cooldownMs: number) => {
    const until = Date.now() + cooldownMs;
    setRateLimitUntil((prev) => (prev && prev > until ? prev : until));
    setNow(Date.now());
  }, []);

  const matchesRoomId = useCallback(
    (eventRoomId: number | null | undefined) => {
      if (roomRealtimeId === null) {
        return false;
      }
      if (typeof eventRoomId !== "number") {
        return true;
      }
      return eventRoomId === roomRealtimeId;
    },
    [roomRealtimeId],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const decoded = decodeChatWsEvent(event.data);

      switch (decoded.type) {
        case "rate_limited": {
          const retryAfterSeconds = Math.max(
            1,
            Number(decoded.retryAfterSeconds ?? 1),
          );
          applyRateLimit(retryAfterSeconds * 1000);
          break;
        }
        case "message_too_long":
          setRoomError(
            `Сообщение слишком длинное (макс ${maxMessageLength} символов)`,
          );
          break;
        case "forbidden":
          setRoomError("Недостаточно прав для отправки сообщения");
          break;
        case "chat_message": {
          if (!matchesRoomId(decoded.message.roomId)) {
            break;
          }
          const content = sanitizeText(
            decoded.message.content,
            maxMessageLength,
          );
          const hasAttachments = (decoded.message.attachments ?? []).length > 0;
          if (!content && !hasAttachments) {
            return;
          }

          if (typeof decoded.message.id !== "number") {
            debugLog("WS chat_message without server id", decoded.message);
            return;
          }

          const messageId = decoded.message.id;
          invalidateRoomMessages(roomIdForRequests);
          if (roomKind === "direct") {
            invalidateDirectChats();
          }

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === messageId)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: messageId,
                publicRef: decoded.message.publicRef || "",
                username: decoded.message.username,
                displayName:
                  decoded.message.displayName ?? decoded.message.username,
                content,
                profilePic: decoded.message.profilePic || null,
                avatarCrop: decoded.message.avatarCrop ?? null,
                createdAt:
                  decoded.message.createdAt ?? new Date().toISOString(),
                editedAt: null,
                isDeleted: false,
                replyTo: decoded.message.replyTo ?? null,
                attachments: decoded.message.attachments ?? [],
                reactions: [],
              },
            ];
          });

          const messageActorRef = normalizeActorRef(
            decoded.message.publicRef || "",
          );
          const isOwnIncomingMessage =
            Boolean(messageActorRef) && messageActorRef === currentActorRef;
          if (!isOwnIncomingMessage) {
            onIncomingForeignMessage(messageId);
          }

          if (!messageActorRef) {
            break;
          }

          setTypingUsers((prev) => {
            if (!prev.has(messageActorRef)) {
              return prev;
            }

            const next = new Map(prev);
            next.delete(messageActorRef);
            return next;
          });

          setTypingDisplayNames((prev) => {
            if (!prev.has(messageActorRef)) {
              return prev;
            }

            const next = new Map(prev);
            next.delete(messageActorRef);
            return next;
          });
          break;
        }
        case "typing":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          if (normalizeActorRef(decoded.publicRef || "") !== currentActorRef) {
            const typingActorRef = normalizeActorRef(decoded.publicRef);
            if (!typingActorRef) {
              break;
            }

            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.set(typingActorRef, Date.now());
              return next;
            });

            setTypingDisplayNames((prev) => {
              const next = new Map(prev);
              next.set(typingActorRef, decoded.displayName);
              return next;
            });
          }
          break;
        case "message_edit":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === decoded.messageId
                ? {
                    ...msg,
                    content: decoded.content,
                    editedAt: decoded.editedAt,
                  }
                : msg,
            ),
          );
          break;
        case "message_delete":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== decoded.messageId),
          );
          break;
        case "reaction_add":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== decoded.messageId) {
                return msg;
              }

              const existing = msg.reactions.find(
                (reaction) => reaction.emoji === decoded.emoji,
              );
              const isMe =
                normalizeActorRef(decoded.publicRef || "") === currentActorRef;
              if (existing) {
                return {
                  ...msg,
                  reactions: msg.reactions.map((reaction) =>
                    reaction.emoji === decoded.emoji
                      ? {
                          ...reaction,
                          count: reaction.count + 1,
                          me: reaction.me || isMe,
                        }
                      : reaction,
                  ),
                };
              }

              return {
                ...msg,
                reactions: [
                  ...msg.reactions,
                  { emoji: decoded.emoji, count: 1, me: isMe },
                ],
              };
            }),
          );
          break;
        case "reaction_remove":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== decoded.messageId) {
                return msg;
              }

              const isMe =
                normalizeActorRef(decoded.publicRef || "") === currentActorRef;
              return {
                ...msg,
                reactions: msg.reactions
                  .map((reaction) =>
                    reaction.emoji === decoded.emoji
                      ? {
                          ...reaction,
                          count: reaction.count - 1,
                          me: isMe ? false : reaction.me,
                        }
                      : reaction,
                  )
                  .filter((reaction) => reaction.count > 0),
              };
            }),
          );
          break;
        case "read_receipt":
          if (!matchesRoomId(decoded.roomId)) {
            break;
          }
          setReadReceipts((prev) => {
            const next = new Map(prev);
            next.set(decoded.userId, {
              userId: decoded.userId,
              publicRef: decoded.publicRef || "",
              username: decoded.username,
              displayName: decoded.displayName,
              lastReadMessageId: decoded.lastReadMessageId,
              lastReadAt: decoded.lastReadAt,
            });
            return next;
          });
          break;
        default:
          debugLog("WS payload parse failed", event.data);
      }
    },
    [
      applyRateLimit,
      currentActorRef,
      maxMessageLength,
      matchesRoomId,
      onIncomingForeignMessage,
      roomIdForRequests,
      roomKind,
      setMessages,
      setRoomError,
    ],
  );

  const { status, lastError, send } = useChatRealtimeRoom({
    roomId: roomRealtimeId,
    onMessage: handleMessage,
    onOpen: () => setRoomError(null),
    onClose: (event) => {
      if (event.code !== 1000 && event.code !== 1001 && event.code !== 4001) {
        setRoomError("Соединение потеряно. Пытаемся восстановить...");
      }
    },
    onError: () => setRoomError("Ошибка соединения"),
  });

  const { sendTyping } = useTypingIndicator(send);

  useEffect(() => {
    if (!typingUsers.size) {
      return;
    }

    const id = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TIMEOUT_MS;
      setTypingUsers((prev) => {
        const next = new Map<string, number>();
        for (const [actorRef, ts] of prev) {
          if (ts > cutoff) {
            next.set(actorRef, ts);
          }
        }
        return next.size === prev.size ? prev : next;
      });

      setTypingDisplayNames((prev) => {
        if (!prev.size) {
          return prev;
        }

        const next = new Map<string, string>();
        for (const [actorRef, label] of prev) {
          const ts = typingUsers.get(actorRef);
          if (typeof ts === "number" && ts > cutoff) {
            next.set(actorRef, label);
          }
        }

        return next.size === prev.size ? prev : next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [typingUsers, typingUsers.size]);

  useEffect(() => {
    if (!rateLimitUntil) {
      return;
    }

    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= rateLimitUntil) {
        window.clearInterval(id);
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [rateLimitUntil]);

  useEffect(() => {
    if (!user || !currentActorRef) {
      return;
    }

    const nextProfile = user.profileImage || null;
    const nextAvatarCrop = user.avatarCrop ?? null;
    const nextDisplayName = (user.name || "").trim() || currentActorRef;
    setMessages((prev) => {
      let changed = false;
      const updated = prev.map((msg) => {
        if (normalizeActorRef(msg.publicRef) !== currentActorRef) {
          return msg;
        }

        if (
          msg.profilePic === nextProfile &&
          sameAvatarCrop(msg.avatarCrop, nextAvatarCrop) &&
          (msg.displayName ?? msg.username) === nextDisplayName
        ) {
          return msg;
        }

        changed = true;
        return {
          ...msg,
          profilePic: nextProfile,
          avatarCrop: nextAvatarCrop,
          displayName: nextDisplayName,
        };
      });

      return changed ? updated : prev;
    });
  }, [currentActorRef, setMessages, user]);

  const rateLimitActive = useMemo(
    () => (rateLimitUntil ? Math.max(0, rateLimitUntil - now) > 0 : false),
    [now, rateLimitUntil],
  );

  const visibleReadReceipts = useMemo<
    UseChatRoomPageRealtimeResult["readReceipts"]
  >(
    () => (readStateEnabled ? readReceipts : new Map()),
    [readReceipts, readStateEnabled],
  );

  return {
    status,
    lastError,
    send,
    sendTyping,
    rateLimitActive,
    typingUsers,
    typingDisplayNames,
    readReceipts: visibleReadReceipts,
  };
}
