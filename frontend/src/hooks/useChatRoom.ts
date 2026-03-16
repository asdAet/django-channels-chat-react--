import { useCallback, useEffect, useRef, useState } from "react";

import type { RoomMessagesDto } from "../dto";
import type { Message } from "../entities/message/types";
import type { RoomDetails as RoomDetailsDto } from "../entities/room/types";
import type { UserProfile as UserProfileDto } from "../entities/user/types";
import { chatController } from "../controllers/ChatController";
import { useChatMessageMaxLength } from "../shared/config/limits";
import { debugLog } from "../shared/lib/debug";
import { sanitizeText } from "../shared/lib/sanitize";

const PAGE_SIZE = 50;

const sanitizeMessage = (
  message: Message,
  maxMessageLength: number,
): Message => ({
  ...message,
  content: sanitizeText(message.content, maxMessageLength),
});

const messageKey = (message: Message) => `${message.id}-${message.createdAt}`;

const dedupeMessages = (messages: Message[]) => {
  const seen = new Set<string>();
  const unique: Message[] = [];
  for (const message of messages) {
    const key = messageKey(message);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(message);
  }
  return unique;
};

const resolveHasMore = (payload: RoomMessagesDto, fetched: Message[]) => {
  if (typeof payload.pagination?.hasMore === "boolean") {
    return payload.pagination.hasMore;
  }
  return fetched.length >= PAGE_SIZE;
};

const resolveNextBefore = (payload: RoomMessagesDto, fetched: Message[]) => {
  const nextBefore = payload.pagination?.nextBefore;
  if (typeof nextBefore === "number") return nextBefore;
  if (nextBefore === null) return null;
  return fetched.length > 0 ? fetched[0].id : null;
};

export type ChatRoomState = {
  roomSlug: string;
  details: RoomDetailsDto | null;
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  nextBefore: number | null;
  error: string | null;
};

const createInitialRoomState = (roomSlug: string): ChatRoomState => ({
  roomSlug,
  details: null,
  messages: [],
  loading: true,
  loadingMore: false,
  hasMore: true,
  nextBefore: null,
  error: null,
});

/**
 * Управляет состоянием страницы комнаты: загрузка, пагинация и дедуп сообщений.
 */
export const useChatRoom = (slug: string, user: UserProfileDto | null) => {
  const messageMaxLength = useChatMessageMaxLength();
  const isPublicRoom = slug === "public";
  const canView = Boolean(user) || isPublicRoom;

  const [state, setState] = useState<ChatRoomState>(() =>
    createInitialRoomState(slug),
  );
  const stateRef = useRef<ChatRoomState>(state);

  const requestIdRef = useRef(0);

  const setStateSynced = useCallback(
    (updater: ChatRoomState | ((prev: ChatRoomState) => ChatRoomState)) => {
      setState((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: ChatRoomState) => ChatRoomState)(prev)
            : updater;
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const loadInitial = useCallback(() => {
    if (!canView) return;

    const requestId = ++requestIdRef.current;
    setStateSynced(createInitialRoomState(slug));

    Promise.all([
      chatController.getRoomDetails(slug),
      chatController.getRoomMessages(slug, { limit: PAGE_SIZE }),
    ])
      .then(([info, payload]) => {
        if (requestId !== requestIdRef.current) return;
        const sanitized = payload.messages.map((message) =>
          sanitizeMessage(message, messageMaxLength),
        );
        const unique = dedupeMessages(sanitized);
        setStateSynced({
          roomSlug: slug,
          details: info,
          messages: unique,
          loading: false,
          loadingMore: false,
          hasMore: resolveHasMore(payload, unique),
          nextBefore: resolveNextBefore(payload, unique),
          error: null,
        });
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        debugLog("Room load failed", err);
        setStateSynced((prev) => ({
          ...prev,
          roomSlug: slug,
          loading: false,
          error: "load_failed",
        }));
      });
  }, [canView, messageMaxLength, setStateSynced, slug]);

  useEffect(() => {
    const taskId = window.setTimeout(() => {
      loadInitial();
    }, 0);
    return () => {
      window.clearTimeout(taskId);
    };
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    const current = stateRef.current;
    if (!canView || current.loadingMore || !current.hasMore) return;

    const cursor = current.nextBefore;
    if (!cursor) {
      setStateSynced((prev) => ({ ...prev, hasMore: false, nextBefore: null }));
      return;
    }

    const requestId = ++requestIdRef.current;
    setStateSynced((prev) => ({ ...prev, loadingMore: true }));

    try {
      const payload = await chatController.getRoomMessages(slug, {
        limit: PAGE_SIZE,
        beforeId: cursor,
      });

      if (requestId !== requestIdRef.current) return;

      const sanitized = payload.messages.map((message) =>
        sanitizeMessage(message, messageMaxLength),
      );
      setStateSynced((prev) => ({
        ...prev,
        roomSlug: slug,
        messages: dedupeMessages([...sanitized, ...prev.messages]),
        loadingMore: false,
        hasMore: resolveHasMore(payload, sanitized),
        nextBefore: resolveNextBefore(payload, sanitized),
      }));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      debugLog("Room load more failed", err);
      setStateSynced((prev) => ({
        ...prev,
        roomSlug: slug,
        loadingMore: false,
      }));
    }
  }, [canView, messageMaxLength, setStateSynced, slug]);

  const setMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setStateSynced((prev) => {
        const nextMessages =
          typeof updater === "function" ? updater(prev.messages) : updater;
        const sanitized = nextMessages.map((message) =>
          sanitizeMessage(message, messageMaxLength),
        );
        return { ...prev, messages: dedupeMessages(sanitized) };
      });
    },
    [messageMaxLength, setStateSynced],
  );

  const setError = useCallback((error: string | null) => {
    setStateSynced((prev) => ({ ...prev, error }));
  }, [setStateSynced]);

  const visibleState =
    state.roomSlug === slug ? state : createInitialRoomState(slug);

  return {
    details: visibleState.details,
    messages: visibleState.messages,
    loading: visibleState.loading,
    loadingMore: visibleState.loadingMore,
    hasMore: visibleState.hasMore,
    error: visibleState.error,
    loadMore,
    reload: loadInitial,
    setMessages,
    setError,
  };
};
