import {
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { chatController } from "../controllers/ChatController";
import { friendsController } from "../controllers/FriendsController";
import { groupController } from "../controllers/GroupController";
import type {
  MessageReadersResult,
  SearchResultItem,
} from "../domain/interfaces/IApiService";
import { decodeChatWsEvent } from "../dto";
import type { Message } from "../entities/message/types";
import type { UserProfile } from "../entities/user/types";
import { useChatRoom } from "../hooks/useChatRoom";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useReconnectingWebSocket } from "../hooks/useReconnectingWebSocket";
import { useRoomPermissions } from "../hooks/useRoomPermissions";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import {
  invalidateDirectChats,
  invalidateRoomMessages,
} from "../shared/cache/cacheManager";
import { useReadTracker } from "../shared/chat/readTracker";
import {
  useChatAttachmentMaxPerMessage,
  useChatAttachmentMaxSizeMb,
  useChatMessageMaxLength,
} from "../shared/config/limits";
import { useDirectInbox } from "../shared/directInbox";
import { useInfoPanel } from "../shared/layout/useInfoPanel";
import { useMobileShell } from "../shared/layout/useMobileShell";
import { debugLog } from "../shared/lib/debug";
import { formatLastSeen, formatTimestamp } from "../shared/lib/format";
import { sanitizeText } from "../shared/lib/sanitize";
import {
  resolveIdentityLabel,
} from "../shared/lib/userIdentity";
import { getWebSocketBase } from "../shared/lib/ws";
import { usePresence } from "../shared/presence";
import type { ImageLightboxMediaItem } from "../shared/ui/ImageLightbox";
import { Avatar, Button, ImageLightbox, Modal, Panel, Toast } from "../shared/ui";
import {
  clearUnreadOverride,
  setUnreadOverride,
} from "../shared/unreadOverrides/store";
import styles from "../styles/pages/ChatRoomPage.module.css";
import { MessageBubble } from "../widgets/chat/MessageBubble";
import { MessageInput } from "../widgets/chat/MessageInput";
import {
  ReadersMenu,
  type ReadersMenuEntry,
} from "../widgets/chat/ReadersMenu";
import { TypingIndicator } from "../widgets/chat/TypingIndicator";
import { useFileDropZone } from "./chatRoomPage/useFileDropZone";
import {
  buildChatLightboxMediaItems,
  findLightboxMediaIndex,
} from "./chatRoomPage/mediaLightbox";
import type {
  InitialPositioningPhase,
  InitialPositioningTarget,
  ReadReceipt,
} from "./chatRoomPage/utils";
import {
  buildTimeline,
  clearPendingReadFromStorage,
  extractApiErrorMessage,
  formatGroupTypingLabel,
  isOwnMessage,
  MARK_READ_DEBOUNCE_MS,
  MAX_HISTORY_JUMP_ATTEMPTS,
  MAX_HISTORY_NO_PROGRESS_ATTEMPTS,
  normalizeActorRef,
  normalizeReadMessageId,
  parseRoomIdRef,
  readPendingReadFromStorage,
  resolveCsrfToken,
  resolveCurrentActorRef,
  resolveMessageActorRef,
  sameAvatarCrop,
  TYPING_TIMEOUT_MS,
  writePendingReadToStorage,
} from "./chatRoomPage/utils";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  roomId: string;
  initialRoomKind?: "public" | "private" | "direct" | "group" | null;
  user: UserProfile | null;
  onNavigate: (path: string) => void;
};

type ReadersMenuState = {
  message: Message;
  x: number;
  y: number;
  loading: boolean;
  error: string | null;
  result: MessageReadersResult | null;
};

/**
 * React-компонент ChatRoomPage отвечает за отрисовку и обработку UI-сценария.
 */
export function ChatRoomPage({ roomId, initialRoomKind = null, user, onNavigate }: Props) {
  const {
    details,
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload,
    setMessages,
  } = useChatRoom(roomId, user, initialRoomKind);
  const location = useLocation();
  const resolvedRoomKind = details?.kind ?? initialRoomKind ?? null;
  const isPublicRoom = resolvedRoomKind === "public";
  const parsedInitialRoomId = useMemo(() => parseRoomIdRef(roomId), [roomId]);
  const resolvedRoomId = useMemo(() => {
    const fromDetails = parseRoomIdRef(details?.roomId);
    return fromDetails ?? parsedInitialRoomId;
  }, [details?.roomId, parsedInitialRoomId]);
  const roomApiRef = useMemo(() => {
    return resolvedRoomId === null ? null : String(resolvedRoomId);
  }, [resolvedRoomId]);
  const roomIdForRequests = roomApiRef ?? roomId;
  const isOnline = useOnlineStatus();
  const { open: openInfoPanel } = useInfoPanel();
  const { openDrawer } = useMobileShell();
  const { setActiveRoom, markRead: markDirectRoomRead } = useDirectInbox();
  const { online: presenceOnline, status: presenceStatus } = usePresence();
  const maxMessageLength = useChatMessageMaxLength();
  const maxAttachmentSizeMb = useChatAttachmentMaxSizeMb();
  const maxAttachmentPerMessage = useChatAttachmentMaxPerMessage();
  const isCurrentUserSuperuser = Boolean(user?.isSuperuser);
  const roomPermissions = useRoomPermissions(user ? roomIdForRequests : null);
  const {
    loading: permissionsLoading,
    canWrite: canWriteToRoom,
    canManageMessages: canManageMessagesToRoom,
    canJoin: canJoinRoom,
    isBanned: isBannedInRoom,
    refresh: refreshRoomPermissions,
  } = roomPermissions;

  const onlineUsernames = useMemo(
    () =>
      new Set(
        presenceStatus === "online"
          ? presenceOnline.map((entry) =>
              normalizeActorRef(entry.publicRef || ""),
            )
          : [],
      ),
    [presenceOnline, presenceStatus],
  );

  const [draft, setDraft] = useState("");
  const [roomError, setRoomError] = useState<string | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(
    new Map(),
  );
  const [typingDisplayNames, setTypingDisplayNames] = useState<
    Map<string, string>
  >(new Map());
  const currentActorRef = useMemo(() => resolveCurrentActorRef(user), [user]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [readReceipts, setReadReceipts] = useState<Map<number, ReadReceipt>>(
    new Map(),
  );
  const [deleteConfirm, setDeleteConfirm] = useState<Message | null>(null);
  const [readersMenu, setReadersMenu] = useState<ReadersMenuState | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [joinInProgress, setJoinInProgress] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    number | null
  >(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [isHeaderSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [headerSearchLoading, setHeaderSearchLoading] = useState(false);
  const [headerSearchResults, setHeaderSearchResults] = useState<
    SearchResultItem[]
  >([]);
  const [lightboxAttachmentId, setLightboxAttachmentId] = useState<number | null>(
    null,
  );

  const maxAttachmentSizeBytes = useMemo(
    () => maxAttachmentSizeMb * 1024 * 1024,
    [maxAttachmentSizeMb],
  );

  const listRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const headerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const headerSearchTimerRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const prependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const messagesRef = useRef(messages);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  const deepLinkedMessageRef = useRef<number | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const lastReadSentRef = useRef(0);
  const markReadTimerRef = useRef<number | null>(null);
  const viewportReadRafRef = useRef<number | null>(null);
  const programmaticScrollTimerRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const initialPositioningPhaseRef = useRef<InitialPositioningPhase>("pending");
  const initialPositioningTargetRef = useRef<InitialPositioningTarget | null>(
    null,
  );
  const paginationInteractionRef = useRef(false);
  const pendingReadFlushRef = useRef<number>(readPendingReadFromStorage(roomId));
  const readersRequestSeqRef = useRef(0);
  const [initialPositioningPhase, setInitialPositioningPhase] =
    useState<InitialPositioningPhase>("pending");
  const unreadDividerAnchorRef = useRef<number | null>(null);
  const [unreadDividerAnchorId, setUnreadDividerAnchorId] = useState<
    number | null
  >(null);
  const lastMessageSnapshotRef = useRef<{
    count: number;
    lastId: number | null;
  }>({
    count: messages.length,
    lastId:
      messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null,
  });

  const updateInitialPositioningPhase = useCallback(
    (next: InitialPositioningPhase) => {
      if (initialPositioningPhaseRef.current === next) return;
      initialPositioningPhaseRef.current = next;
      setInitialPositioningPhase(next);
    },
    [],
  );

  const beginProgrammaticScroll = useCallback(() => {
    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current !== null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }, []);

  const endProgrammaticScroll = useCallback(
    (onDone?: () => void, delayMs = 140) => {
      if (programmaticScrollTimerRef.current !== null) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }
      programmaticScrollTimerRef.current = window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
        programmaticScrollTimerRef.current = null;
        onDone?.();
      }, delayMs);
    },
    [],
  );

  const updateUnreadDividerAnchor = useCallback(
    (nextAnchorId: number | null) => {
      unreadDividerAnchorRef.current = nextAnchorId;
      setUnreadDividerAnchorId((prev) =>
        prev === nextAnchorId ? prev : nextAnchorId,
      );
    },
    [],
  );

  const persistPendingRead = useCallback(
    (lastReadMessageId: number | null | undefined) => {
      const normalized = normalizeReadMessageId(lastReadMessageId);
      if (normalized < 1) return;
      if (normalized <= pendingReadFlushRef.current) return;
      pendingReadFlushRef.current = normalized;
      writePendingReadToStorage(roomId, normalized);
    },
    [roomId],
  );

  const clearPendingRead = useCallback(
    (upTo: number | null | undefined) => {
      const normalized = normalizeReadMessageId(upTo);
      if (normalized < pendingReadFlushRef.current) return;
      pendingReadFlushRef.current = 0;
      clearPendingReadFromStorage(roomId);
    },
    [roomId],
  );

  const effectiveServerLastReadMessageId = Math.max(
    normalizeReadMessageId(details?.lastReadMessageId),
    pendingReadFlushRef.current,
  );

  // Read tracking stays enabled for every authenticated room, including public.
  const readStateEnabled = Boolean(user);

  const {
    localLastReadMessageId: trackedLocalLastReadMessageId,
    firstUnreadMessageId: trackedFirstUnreadMessageId,
    localUnreadCount: trackedLocalUnreadCount,
    applyViewportRead,
  } = useReadTracker({
    messages,
    currentActorRef,
    serverLastReadMessageId: effectiveServerLastReadMessageId,
    enabled: Boolean(readStateEnabled && initialPositioningPhase === "settled"),
    resetKey: roomId,
  });
  const localLastReadMessageId = readStateEnabled
    ? trackedLocalLastReadMessageId
    : 0;
  const firstUnreadMessageId = readStateEnabled
    ? trackedFirstUnreadMessageId
    : null;
  const localUnreadCount = readStateEnabled ? trackedLocalUnreadCount : 0;
  const roomDataReady =
    !loading &&
    ((details?.roomId !== undefined && String(details.roomId) === roomIdForRequests) ||
      Boolean(error));

  const unreadDividerRenderTarget = useMemo(() => {
    if (!roomDataReady && unreadDividerAnchorId === null) {
      return { messageId: null as number | null, insertAtTop: false };
    }

    if (
      unreadDividerAnchorId !== null &&
      messages.some((msg) => msg.id === unreadDividerAnchorId)
    ) {
      return { messageId: unreadDividerAnchorId, insertAtTop: false };
    }

    const fallbackAllowed =
      initialPositioningPhase !== "settled" || showScrollFab;

    if (unreadDividerAnchorId !== null) {
      return {
        messageId: null as number | null,
        insertAtTop: messages.length > 0,
      };
    }

    if (localUnreadCount < 1) {
      return { messageId: null as number | null, insertAtTop: false };
    }

    if (
      fallbackAllowed &&
      firstUnreadMessageId &&
      messages.some((msg) => msg.id === firstUnreadMessageId)
    ) {
      return { messageId: firstUnreadMessageId, insertAtTop: false };
    }

    return {
      messageId: null as number | null,
      insertAtTop: fallbackAllowed && messages.length > 0,
    };
  }, [
    firstUnreadMessageId,
    initialPositioningPhase,
    localUnreadCount,
    messages,
    roomDataReady,
    showScrollFab,
    unreadDividerAnchorId,
  ]);

  const lightboxMediaItems = useMemo<ImageLightboxMediaItem[]>(
    () => buildChatLightboxMediaItems(messages),
    [messages],
  );
  const lightboxOpenIndex = useMemo(
    () => findLightboxMediaIndex(lightboxMediaItems, lightboxAttachmentId),
    [lightboxAttachmentId, lightboxMediaItems],
  );

  const wsUrl = useMemo(() => {
    if (!user && !isPublicRoom) return null;
    if (!roomApiRef) return null;
    return `${getWebSocketBase()}/ws/chat/${encodeURIComponent(roomApiRef)}/`;
  }, [isPublicRoom, roomApiRef, user]);

  const applyRateLimit = useCallback((cooldownMs: number) => {
    const until = Date.now() + cooldownMs;
    setRateLimitUntil((prev) => (prev && prev > until ? prev : until));
    setNow(Date.now());
  }, []);

  const scrollMessageIntoView = useCallback((messageId: number) => {
    const list = listRef.current;
    if (!list) return false;
    const el = list.querySelector<HTMLElement>(
      `article[data-message-id="${messageId}"]`,
    );
    if (!el) return false;

    if (typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      list.scrollTop = Math.max(0, el.offsetTop - list.clientHeight / 2);
    }
    setHighlightedMessageId(messageId);
    window.setTimeout(() => {
      setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
    }, 1800);
    return true;
  }, []);

  const ensureMessageLoaded = useCallback(
    async (messageId: number) => {
      let attempts = 0;
      let noProgressAttempts = 0;
      let previousOldestId = messagesRef.current[0]?.id ?? null;
      while (
        !messagesRef.current.some((msg) => msg.id === messageId) &&
        hasMoreRef.current &&
        attempts < MAX_HISTORY_JUMP_ATTEMPTS
      ) {
        if (!loadingMoreRef.current) {
          await loadMore();
        }
        attempts += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 70));

        const currentOldestId = messagesRef.current[0]?.id ?? null;
        if (currentOldestId === previousOldestId) {
          noProgressAttempts += 1;
          if (noProgressAttempts >= MAX_HISTORY_NO_PROGRESS_ATTEMPTS) {
            break;
          }
        } else {
          previousOldestId = currentOldestId;
          noProgressAttempts = 0;
        }
      }
      return messagesRef.current.some((msg) => msg.id === messageId);
    },
    [loadMore],
  );

  const jumpToMessageById = useCallback(
    async (messageId: number) => {
      if (scrollMessageIntoView(messageId)) return true;
      const loaded = await ensureMessageLoaded(messageId);
      if (!loaded) return false;
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      return scrollMessageIntoView(messageId);
    },
    [ensureMessageLoaded, scrollMessageIntoView],
  );

  useEffect(() => {
    messagesRef.current = messages;
    hasMoreRef.current = hasMore;
    loadingMoreRef.current = loadingMore;
  }, [hasMore, loadingMore, messages]);

  useEffect(() => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    lastReadSentRef.current = 0;
    pendingReadFlushRef.current = readPendingReadFromStorage(roomId);
    readersRequestSeqRef.current += 1;
    if (markReadTimerRef.current !== null) {
      window.clearTimeout(markReadTimerRef.current);
      markReadTimerRef.current = null;
    }
    if (viewportReadRafRef.current !== null) {
      window.cancelAnimationFrame(viewportReadRafRef.current);
      viewportReadRafRef.current = null;
    }
    if (programmaticScrollTimerRef.current !== null) {
      window.clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
    isProgrammaticScrollRef.current = false;
    initialPositioningTargetRef.current = null;
    paginationInteractionRef.current = false;
    setReadReceipts(new Map());
    setDeleteConfirm(null);
    setReadersMenu(null);
    setShowScrollFab(false);
    setNewMsgCount(0);
    setLightboxAttachmentId(null);
    setQueuedFiles([]);
    setUploadProgress(null);
    updateUnreadDividerAnchor(null);
    updateInitialPositioningPhase("pending");
    lastMessageSnapshotRef.current = { count: 0, lastId: null };
    clearUnreadOverride(roomIdForRequests);
  }, [roomId, roomIdForRequests, updateInitialPositioningPhase, updateUnreadDividerAnchor]);

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort();
      if (markReadTimerRef.current !== null) {
        window.clearTimeout(markReadTimerRef.current);
      }
      if (viewportReadRafRef.current !== null) {
        window.cancelAnimationFrame(viewportReadRafRef.current);
      }
      if (programmaticScrollTimerRef.current !== null) {
        window.clearTimeout(programmaticScrollTimerRef.current);
      }
      isProgrammaticScrollRef.current = false;
      clearUnreadOverride(roomIdForRequests);
    };
  }, [roomIdForRequests]);

  useEffect(() => {
    if (headerSearchTimerRef.current !== null) {
      window.clearTimeout(headerSearchTimerRef.current);
      headerSearchTimerRef.current = null;
    }
  }, [roomIdForRequests]);

  useEffect(() => {
    return () => {
      if (headerSearchTimerRef.current !== null) {
        window.clearTimeout(headerSearchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isHeaderSearchOpen) return;
    /**
     * Обрабатывает on key down.
     * @param event Событие браузера.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setHeaderSearchOpen(false);
      setHeaderSearchQuery("");
      setHeaderSearchResults([]);
    };
    /**
     * Обрабатывает on mouse down.
     * @param event Событие браузера.
     */
    const onMouseDown = (event: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (searchWrapRef.current.contains(event.target as Node)) return;
      setHeaderSearchOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isHeaderSearchOpen]);

  useEffect(() => {
    if (!isHeaderSearchOpen) {
      setHeaderSearchLoading(false);
      return;
    }
    const query = headerSearchQuery.trim();
    if (headerSearchTimerRef.current !== null) {
      window.clearTimeout(headerSearchTimerRef.current);
      headerSearchTimerRef.current = null;
    }
    if (query.length < 2) {
      setHeaderSearchResults([]);
      setHeaderSearchLoading(false);
      return;
    }
    headerSearchTimerRef.current = window.setTimeout(() => {
      setHeaderSearchLoading(true);
      void chatController
        .searchMessages(roomIdForRequests, query)
        .then((result) => {
          setHeaderSearchResults(result.results);
        })
        .catch(() => {
          setHeaderSearchResults([]);
        })
        .finally(() => {
          setHeaderSearchLoading(false);
        });
    }, 260);
  }, [headerSearchQuery, isHeaderSearchOpen, roomIdForRequests]);

  useEffect(() => {
    if (!typingUsers.size) return;
    const id = window.setInterval(() => {
      const cutoff = Date.now() - TYPING_TIMEOUT_MS;
      setTypingUsers((prev) => {
        const next = new Map<string, number>();
        for (const [actorRef, ts] of prev) {
          if (ts > cutoff) next.set(actorRef, ts);
        }
        return next.size === prev.size ? prev : next;
      });
      setTypingDisplayNames((prev) => {
        if (!prev.size) return prev;
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

  const sendMarkReadIfNeeded = useCallback(
    (lastReadMessageId: number | null | undefined) => {
      if (
        !readStateEnabled ||
        !lastReadMessageId ||
        lastReadMessageId < 1 ||
        !roomApiRef
      ) {
        return;
      }
      persistPendingRead(lastReadMessageId);
      if (lastReadMessageId <= lastReadSentRef.current) return;
      lastReadSentRef.current = lastReadMessageId;
      void chatController
        .markRead(roomApiRef, lastReadMessageId)
        .then(() => {
          clearPendingRead(lastReadMessageId);
        })
        .catch(() => {
          if (lastReadSentRef.current === lastReadMessageId) {
            lastReadSentRef.current = Math.max(0, lastReadMessageId - 1);
          }
        });
    },
    [clearPendingRead, persistPendingRead, readStateEnabled, roomApiRef],
  );

  const scheduleMarkRead = useCallback(
    (lastReadMessageId: number | null | undefined) => {
      if (!readStateEnabled) return;
      if (!lastReadMessageId || lastReadMessageId < 1) return;
      persistPendingRead(lastReadMessageId);
      if (markReadTimerRef.current !== null) {
        window.clearTimeout(markReadTimerRef.current);
      }

      markReadTimerRef.current = window.setTimeout(() => {
        markReadTimerRef.current = null;
        sendMarkReadIfNeeded(lastReadMessageId);
        if (user && details?.kind === "direct" && resolvedRoomId !== null) {
          markDirectRoomRead(resolvedRoomId);
        }
      }, MARK_READ_DEBOUNCE_MS);
    },
    [
      details?.kind,
      markDirectRoomRead,
      persistPendingRead,
      readStateEnabled,
      resolvedRoomId,
      sendMarkReadIfNeeded,
      user,
    ],
  );

  const flushPendingRead = useCallback(() => {
    if (!readStateEnabled) return;
    const baseline = normalizeReadMessageId(details?.lastReadMessageId);
    const candidate = Math.max(
      pendingReadFlushRef.current,
      normalizeReadMessageId(localLastReadMessageId),
    );
    if (candidate < 1 || candidate <= baseline) return;
    if (!roomApiRef) return;

    persistPendingRead(candidate);
    const encodedRoomId = encodeURIComponent(roomApiRef);
    const url = `/api/chat/${encodedRoomId}/read/`;
    const csrfToken = resolveCsrfToken();
    let beaconSent = false;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const formData = new FormData();
      formData.append("lastReadMessageId", String(candidate));
      if (csrfToken) {
        formData.append("csrfmiddlewaretoken", csrfToken);
      }
      beaconSent = navigator.sendBeacon(url, formData);
    }

    if (beaconSent || typeof fetch !== "function") return;

    const headers = new Headers({ "Content-Type": "application/json" });
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }

    void fetch(url, {
      method: "POST",
      body: JSON.stringify({ lastReadMessageId: candidate }),
      headers,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {
      // Keep pending read marker in storage; it will be retried on next session.
    });
  }, [
    details?.lastReadMessageId,
    localLastReadMessageId,
    persistPendingRead,
    roomApiRef,
    readStateEnabled,
  ]);

  const scheduleViewportReadSync = useCallback(() => {
    if (!readStateEnabled) return;
    if (initialPositioningPhaseRef.current !== "settled") return;
    if (isProgrammaticScrollRef.current) return;
    if (viewportReadRafRef.current !== null) return;
    viewportReadRafRef.current = window.requestAnimationFrame(() => {
      viewportReadRafRef.current = null;
      const nextLastRead = applyViewportRead(listRef.current);
      persistPendingRead(nextLastRead);
      const latestVisibleMessageId =
        messagesRef.current.length > 0
          ? (messagesRef.current[messagesRef.current.length - 1]?.id ?? 0)
          : 0;
      if (nextLastRead > 0 && nextLastRead <= latestVisibleMessageId) {
        sendMarkReadIfNeeded(nextLastRead);
      }
    });
  }, [
    applyViewportRead,
    persistPendingRead,
    readStateEnabled,
    sendMarkReadIfNeeded,
  ]);

  useEffect(() => {
    if (!readStateEnabled) return;

    /**
     * Обрабатывает on visibility change.
     */
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingRead();
      }
    };
    /**
     * Обрабатывает on page hide.
     */
    const onPageHide = () => {
      flushPendingRead();
    };
    /**
     * Обрабатывает on before unload.
     */
    const onBeforeUnload = () => {
      flushPendingRead();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flushPendingRead, readStateEnabled]);

  useEffect(() => {
    return () => {
      if (!readStateEnabled) return;
      const baseline = normalizeReadMessageId(details?.lastReadMessageId);
      const pending = pendingReadFlushRef.current;
      if (pending <= baseline) return;
      sendMarkReadIfNeeded(pending);
    };
  }, [details?.lastReadMessageId, readStateEnabled, sendMarkReadIfNeeded]);

  useEffect(() => {
    if (!user || details?.kind !== "direct" || resolvedRoomId === null) return;
    setActiveRoom(resolvedRoomId);
    return () => {
      setActiveRoom(null);
    };
  }, [details?.kind, resolvedRoomId, setActiveRoom, user]);

  useEffect(() => {
    setUnreadOverride({ roomId: roomIdForRequests, unreadCount: localUnreadCount });
  }, [localUnreadCount, roomIdForRequests]);

  useEffect(() => {
    if (!roomDataReady) return;
    if (initialPositioningPhaseRef.current !== "pending") return;
    if (initialPositioningTargetRef.current !== null) return;
    if (localUnreadCount > 0 && firstUnreadMessageId) {
      initialPositioningTargetRef.current = "unread";
      if (unreadDividerAnchorRef.current === null) {
        updateUnreadDividerAnchor(firstUnreadMessageId);
      }
      return;
    }
    initialPositioningTargetRef.current = "bottom";
  }, [
    firstUnreadMessageId,
    localUnreadCount,
    roomDataReady,
    updateUnreadDividerAnchor,
  ]);

  useEffect(() => {
    if (!roomDataReady) return;
    if (initialPositioningPhaseRef.current !== "pending") return;
    const initialTarget = initialPositioningTargetRef.current;
    if (!initialTarget) return;

    updateInitialPositioningPhase("positioning");

    const list = listRef.current;
    if (!list) {
      const latestMessages = messagesRef.current;
      lastMessageSnapshotRef.current = {
        count: latestMessages.length,
        lastId:
          latestMessages.length > 0
            ? (latestMessages[latestMessages.length - 1]?.id ?? null)
            : null,
      };
      updateInitialPositioningPhase("settled");
      scheduleViewportReadSync();
      return;
    }

    beginProgrammaticScroll();
    window.requestAnimationFrame(() => {
      const unreadAnchorId = unreadDividerAnchorRef.current;
      const unreadTarget =
        initialTarget === "unread" && unreadAnchorId !== null
          ? list.querySelector<HTMLElement>(
              `article[data-message-id="${unreadAnchorId}"]`,
            )
          : null;

      if (unreadTarget) {
        if (typeof unreadTarget.scrollIntoView === "function") {
          unreadTarget.scrollIntoView({ block: "center" });
        } else {
          list.scrollTop = Math.max(
            0,
            unreadTarget.offsetTop - list.clientHeight / 2,
          );
        }
      } else {
        list.scrollTop = list.scrollHeight;
      }

      const atBottom =
        list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      isAtBottomRef.current = atBottom;
      setShowScrollFab(!atBottom);
      if (atBottom) {
        setNewMsgCount(0);
      }

      endProgrammaticScroll(() => {
        const latestMessages = messagesRef.current;
        lastMessageSnapshotRef.current = {
          count: latestMessages.length,
          lastId:
            latestMessages.length > 0
              ? (latestMessages[latestMessages.length - 1]?.id ?? null)
              : null,
        };
        updateInitialPositioningPhase("settled");
        scheduleViewportReadSync();
      });
    });
  }, [
    beginProgrammaticScroll,
    endProgrammaticScroll,
    roomDataReady,
    scheduleViewportReadSync,
    updateInitialPositioningPhase,
  ]);

  useEffect(() => {
    if (unreadDividerAnchorRef.current !== null) return;
    if (!roomDataReady) return;
    if (initialPositioningPhase !== "settled") return;
    if (localUnreadCount < 1 || !firstUnreadMessageId) return;
    if (isAtBottomRef.current) return;
    updateUnreadDividerAnchor(firstUnreadMessageId);
  }, [
    firstUnreadMessageId,
    initialPositioningPhase,
    localUnreadCount,
    roomDataReady,
    updateUnreadDividerAnchor,
  ]);

  useEffect(() => {
    if (
      initialPositioningPhase !== "settled" ||
      !user ||
      localLastReadMessageId < 1
    )
      return;
    scheduleMarkRead(localLastReadMessageId);
  }, [initialPositioningPhase, localLastReadMessageId, scheduleMarkRead, user]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const raw = searchParams.get("message");
    if (!raw) {
      deepLinkedMessageRef.current = null;
      return;
    }
    const targetId = Number(raw);
    if (!Number.isFinite(targetId) || targetId < 1) return;
    if (deepLinkedMessageRef.current === targetId) return;
    deepLinkedMessageRef.current = targetId;
    void jumpToMessageById(targetId);
  }, [jumpToMessageById, location.search]);

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
          const content = sanitizeText(
            decoded.message.content,
            maxMessageLength,
          );
          const hasAttachments = (decoded.message.attachments ?? []).length > 0;
          if (!content && !hasAttachments) return;
          if (typeof decoded.message.id !== "number") {
            debugLog("WS chat_message without server id", decoded.message);
            return;
          }
          const messageId = decoded.message.id;
          invalidateRoomMessages(roomIdForRequests);
          if (details?.kind === "direct") invalidateDirectChats();

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === messageId)) return prev;
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

          if (
            !isAtBottomRef.current &&
            normalizeActorRef(decoded.message.publicRef || "") !==
              currentActorRef
          ) {
            setNewMsgCount((count) => count + 1);
            if (readStateEnabled && unreadDividerAnchorRef.current === null) {
              updateUnreadDividerAnchor(messageId);
            }
          }

          const messageActorRef = normalizeActorRef(
            decoded.message.publicRef || "",
          );
          if (!messageActorRef) break;
          setTypingUsers((prev) => {
            if (!prev.has(messageActorRef)) return prev;
            const next = new Map(prev);
            next.delete(messageActorRef);
            return next;
          });
          setTypingDisplayNames((prev) => {
            if (!prev.has(messageActorRef)) return prev;
            const next = new Map(prev);
            next.delete(messageActorRef);
            return next;
          });
          break;
        }
        case "typing":
          if (normalizeActorRef(decoded.publicRef || "") !== currentActorRef) {
            const typingActorRef = normalizeActorRef(decoded.publicRef);
            if (!typingActorRef) break;
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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === decoded.messageId
                ? { ...msg, isDeleted: true, content: "" }
                : msg,
            ),
          );
          break;
        case "reaction_add":
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== decoded.messageId) return msg;
              const existing = msg.reactions.find(
                (r) => r.emoji === decoded.emoji,
              );
              const isMe =
                normalizeActorRef(decoded.publicRef || "") === currentActorRef;
              if (existing) {
                return {
                  ...msg,
                  reactions: msg.reactions.map((r) =>
                    r.emoji === decoded.emoji
                      ? { ...r, count: r.count + 1, me: r.me || isMe }
                      : r,
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
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== decoded.messageId) return msg;
              const isMe =
                normalizeActorRef(decoded.publicRef || "") === currentActorRef;
              return {
                ...msg,
                reactions: msg.reactions
                  .map((r) =>
                    r.emoji === decoded.emoji
                      ? { ...r, count: r.count - 1, me: isMe ? false : r.me }
                      : r,
                  )
                  .filter((r) => r.count > 0),
              };
            }),
          );
          break;
        case "read_receipt":
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
      details?.kind,
      maxMessageLength,
      readStateEnabled,
      setMessages,
      roomIdForRequests,
      updateUnreadDividerAnchor,
      currentActorRef,
    ],
  );

  const { status, lastError, send } = useReconnectingWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onOpen: () => setRoomError(null),
    onClose: (event) => {
      if (event.code !== 1000 && event.code !== 1001) {
        setRoomError("Соединение потеряно. Пытаемся восстановить...");
      }
    },
    onError: () => setRoomError("Ошибка соединения"),
  });

  const { sendTyping } = useTypingIndicator(send);

  useEffect(() => {
    if (!rateLimitUntil) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= rateLimitUntil) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [rateLimitUntil]);

  useEffect(() => {
    if (!user || !currentActorRef) return;
    const nextProfile = user.profileImage || null;
    const nextAvatarCrop = user.avatarCrop ?? null;
    const nextDisplayName = (user.name || "").trim() || currentActorRef;
    setMessages((prev) => {
      let changed = false;
      const updated = prev.map((msg) => {
        if (resolveMessageActorRef(msg) !== currentActorRef) return msg;
        if (
          msg.profilePic === nextProfile &&
          sameAvatarCrop(msg.avatarCrop, nextAvatarCrop) &&
          (msg.displayName ?? msg.username) === nextDisplayName
        )
          return msg;
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

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const list = listRef.current;
      if (!list) return;
      if (initialPositioningPhaseRef.current !== "settled") return;
      if (isProgrammaticScrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = list;
      const atBottom = scrollHeight - scrollTop - clientHeight < 80;
      isAtBottomRef.current = atBottom;
      setShowScrollFab(!atBottom);
      if (atBottom) {
        setNewMsgCount(0);
      }
      scheduleViewportReadSync();

      const isUserInitiatedScroll = Boolean(
        (event.nativeEvent as Event | undefined)?.isTrusted,
      );
      if (
        isUserInitiatedScroll &&
        paginationInteractionRef.current &&
        scrollTop < 120 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        prependingRef.current = true;
        prevScrollHeightRef.current = scrollHeight;
        void loadMore();
      }
    },
    [hasMore, loadMore, loading, loadingMore, scheduleViewportReadSync],
  );

  const armPaginationInteraction = useCallback(() => {
    if (initialPositioningPhaseRef.current !== "settled") return;
    paginationInteractionRef.current = true;
  }, []);

  const scrollToBottom = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const snapToBottom = () => {
      const nextList = listRef.current;
      if (!nextList) return;
      nextList.scrollTop = nextList.scrollHeight;
    };

    beginProgrammaticScroll();
    if (typeof list.scrollTo === "function") {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    } else {
      list.scrollTop = list.scrollHeight;
    }
    isAtBottomRef.current = true;
    setShowScrollFab(false);
    setNewMsgCount(0);

    requestAnimationFrame(() => {
      snapToBottom();
      requestAnimationFrame(() => {
        snapToBottom();
        endProgrammaticScroll(() => {
          scheduleViewportReadSync();
        }, 120);
      });
    });
  }, [beginProgrammaticScroll, endProgrammaticScroll, scheduleViewportReadSync]);

  useEffect(() => {
    const previousSnapshot = lastMessageSnapshotRef.current;
    const currentSnapshot = {
      count: messages.length,
      lastId:
        messages.length > 0
          ? (messages[messages.length - 1]?.id ?? null)
          : null,
    };
    lastMessageSnapshotRef.current = currentSnapshot;

    if (initialPositioningPhase !== "settled") return;
    const list = listRef.current;
    if (!list) return;

    if (prependingRef.current) {
      const delta = list.scrollHeight - prevScrollHeightRef.current;
      list.scrollTop += delta;
      prependingRef.current = false;
      return;
    }

    const appendedNewMessage =
      currentSnapshot.count > previousSnapshot.count &&
      currentSnapshot.lastId !== null &&
      currentSnapshot.lastId !== previousSnapshot.lastId;
    if (!appendedNewMessage) return;
    // После initial open удерживаем низ только для новых append-сообщений,
    // когда пользователь и так уже стоял у нижней границы.
    if (!isAtBottomRef.current) return;

    beginProgrammaticScroll();
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
      endProgrammaticScroll(() => {
        scheduleViewportReadSync();
      }, 80);
    });
  }, [
    beginProgrammaticScroll,
    endProgrammaticScroll,
    initialPositioningPhase,
    messages,
    scheduleViewportReadSync,
  ]);

  const rateLimitRemainingMs = rateLimitUntil
    ? Math.max(0, rateLimitUntil - now)
    : 0;
  const rateLimitActive = rateLimitRemainingMs > 0;

  const sendMessage = useCallback(async () => {
    if (!user) {
      setRoomError("Авторизуйтесь, чтобы отправлять сообщения");
      return;
    }

    const raw = draft;
    const hasQueuedFiles = queuedFiles.length > 0;
    if (!raw.trim() && !hasQueuedFiles) return;

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
      uploadAbortRef.current = abortController;
      setUploadProgress(0);
      try {
        await chatController.uploadAttachments(roomIdForRequests, queuedFiles, {
          messageContent: cleaned,
          replyTo: replyTo?.id ?? null,
          onProgress: (pct) => setUploadProgress(pct),
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

    if (!cleaned) return;

    const payload: Record<string, unknown> = {
      message: cleaned,
      username: currentActorRef,
      profile_pic: user.profileImage,
      room: roomIdForRequests,
    };
    if (replyTo) payload.replyTo = replyTo.id;

    if (!send(JSON.stringify(payload))) {
      setRoomError("Не удалось отправить сообщение");
      return;
    }

    setDraft("");
    setReplyTo(null);
    updateUnreadDividerAnchor(null);
    scrollToBottom();
  }, [
    draft,
    editingMessage,
    isOnline,
    maxMessageLength,
    queuedFiles,
    rateLimitActive,
    replyTo,
    roomIdForRequests,
    send,
    setMessages,
    scrollToBottom,
    status,
    updateUnreadDividerAnchor,
    currentActorRef,
    user,
  ]);

  const handleReply = useCallback((msg: Message) => {
    setReplyTo(msg);
    setEditingMessage(null);
  }, []);

  const handleEdit = useCallback((msg: Message) => {
    setEditingMessage(msg);
    setDraft(msg.content);
    setReplyTo(null);
  }, []);

  const handleDelete = useCallback((msg: Message) => {
    setDeleteConfirm(msg);
  }, []);

  const closeReadersMenu = useCallback(() => {
    readersRequestSeqRef.current += 1;
    setReadersMenu(null);
  }, []);

  const handleOpenReaders = useCallback(
    (msg: Message, anchor: { x: number; y: number }) => {
      if (!user) return;

      const requestSeq = readersRequestSeqRef.current + 1;
      readersRequestSeqRef.current = requestSeq;
      setReadersMenu({
        message: msg,
        x: anchor.x,
        y: anchor.y,
        loading: true,
        error: null,
        result: null,
      });

      void chatController
        .getMessageReaders(roomIdForRequests, msg.id)
        .then((result) => {
          if (readersRequestSeqRef.current !== requestSeq) return;
          setReadersMenu((current) => {
            if (!current || current.message.id !== msg.id) return current;
            return {
              ...current,
              loading: false,
              error: null,
              result,
            };
          });
        })
        .catch((err) => {
          if (readersRequestSeqRef.current !== requestSeq) return;
          setReadersMenu((current) => {
            if (!current || current.message.id !== msg.id) return current;
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
    if (!deleteConfirm) return;
    const msgId = deleteConfirm.id;
    const originalMsg = deleteConfirm;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, isDeleted: true, content: "" } : msg,
      ),
    );
    setDeleteConfirm(null);

    void chatController.deleteMessage(roomIdForRequests, msgId).catch((err) => {
      debugLog("Delete failed", err);
      setRoomError("Не удалось удалить сообщение");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId
            ? { ...msg, isDeleted: false, content: originalMsg.content }
            : msg,
        ),
      );
    });
  }, [deleteConfirm, roomIdForRequests, setMessages]);

  const handleReact = useCallback(
    (msgId: number, emoji: string) => {
      const msg = messages.find((m) => m.id === msgId);
      const existing = msg?.reactions.find((r) => r.emoji === emoji);
      if (existing?.me) {
        void chatController
          .removeReaction(roomIdForRequests, msgId, emoji)
          .catch((err) => debugLog("Remove reaction failed", err));
      } else {
        void chatController
          .addReaction(roomIdForRequests, msgId, emoji)
          .catch((err) => debugLog("Add reaction failed", err));
      }
    },
    [messages, roomIdForRequests],
  );

  const handleAttach = useCallback(
    (files: File[]) => {
      if (!files.length) return;

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
      maxAttachmentPerMessage,
      maxAttachmentSizeBytes,
      maxAttachmentSizeMb,
      isCurrentUserSuperuser,
      queuedFiles.length,
    ],
  );

  const handleRemoveQueuedFile = useCallback((index: number) => {
    setQueuedFiles((prev) => prev.filter((_, i) => i !== index));
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
      if (prev) setDraft("");
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
    [jumpToMessageById],
  );

  const openUserProfile = useCallback(
    (actorRef: string) => {
      if (!actorRef) return;
      openInfoPanel("profile", actorRef);
    },
    [openInfoPanel],
  );

  const openDirectInfo = useCallback(() => {
    if (!details?.peer?.publicRef && !details?.peer?.username) return;
    openInfoPanel("direct", roomIdForRequests);
  }, [details?.peer?.publicRef, details?.peer?.username, openInfoPanel, roomIdForRequests]);

  const openGroupInfo = useCallback(() => {
    if (details?.kind !== "group") return;
    openInfoPanel("group", roomIdForRequests);
  }, [details?.kind, openInfoPanel, roomIdForRequests]);

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
  }, [refreshRoomPermissions, reload, roomIdForRequests, user]);

  const handleMobileOpenClick = useCallback(() => {
    openDrawer();
  }, [openDrawer]);

  const handleOpenMediaAttachment = useCallback((attachmentId: number) => {
    setLightboxAttachmentId(attachmentId);
  }, []);

  const openRoomSearch = useCallback(() => {
    setHeaderSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        setHeaderSearchQuery("");
        setHeaderSearchResults([]);
      } else {
        window.setTimeout(() => headerSearchInputRef.current?.focus(), 0);
      }
      return next;
    });
  }, []);

  const onHeaderSearchResultClick = useCallback(
    (messageId: number) => {
      setHeaderSearchOpen(false);
      setHeaderSearchQuery("");
      setHeaderSearchResults([]);
      void jumpToMessageById(messageId).then((found) => {
        if (!found) {
          setRoomError("Не удалось найти сообщение в истории");
        }
      });
    },
    [jumpToMessageById],
  );

  const loadError = error ? "Не удалось загрузить комнату" : null;
  const visibleError = roomError || loadError;

  const timeline = useMemo(
    () => buildTimeline(messages, unreadDividerRenderTarget),
    [messages, unreadDividerRenderTarget],
  );

  const activeTypingUsers = useMemo(
    () =>
      Array.from(typingUsers.keys()).map(
        (username) => typingDisplayNames.get(username) ?? username,
      ),
    [typingDisplayNames, typingUsers],
  );

  const directPeerIsTyping = Boolean(
    details?.kind === "direct" &&
    details.peer?.publicRef &&
    typingUsers.has(normalizeActorRef(details.peer?.publicRef || "")),
  );

  const roomTitle =
    details?.kind === "direct"
      ? resolveIdentityLabel(details.peer ?? { name: details.name }, details.name)
      : (details?.name ?? roomIdForRequests);

  const groupTypingLabel = useMemo(
    () => formatGroupTypingLabel(details?.kind, activeTypingUsers),
    [activeTypingUsers, details?.kind],
  );

  const isBlocked = Boolean(details?.blocked);
  const isBlockedByMe = Boolean(details?.blockedByMe);
  const isGroupRoom = details?.kind === "group";
  const isGroupReadOnly = Boolean(
    user && isGroupRoom && !permissionsLoading && !canWriteToRoom,
  );
  const showGroupJoinCta = isGroupReadOnly && canJoinRoom;
  const showGroupReadOnlyNotice = isGroupReadOnly && !canJoinRoom;
  const canSendMessages = Boolean(
    user && !isBlocked && (!isGroupRoom || canWriteToRoom),
  );
  const {
    active: isDropTargetActive,
    bindings: fileDropBindings,
    reset: resetFileDropZone,
  } = useFileDropZone({
    enabled: canSendMessages,
    onFilesDrop: handleAttach,
  });

  useEffect(() => {
    if (canSendMessages) return;
    if (!isDropTargetActive) return;
    resetFileDropZone();
  }, [canSendMessages, isDropTargetActive, resetFileDropZone]);

  const roomSubtitle =
    details?.kind === "direct"
      ? isBlocked
        ? "Был(а) в сети давно"
        : directPeerIsTyping
          ? "Печатает..."
          : details.peer?.publicRef &&
              onlineUsernames.has(
                normalizeActorRef(details.peer?.publicRef || ""),
              )
            ? "В сети"
            : `Был(а) в сети: ${formatLastSeen(details.peer?.lastSeen ?? null) || "—"}`
      : details?.kind === "group"
        ? (groupTypingLabel ?? "Групповой чат")
        : details?.createdBy
          ? `Создатель: ${details.createdBy}`
          : "Чат";

  const maxReadMessageId = useMemo(() => {
    let maxId = 0;
    for (const receipt of readReceipts.values()) {
      if (
        normalizeActorRef(receipt.publicRef) !== currentActorRef &&
        receipt.lastReadMessageId > maxId
      ) {
        maxId = receipt.lastReadMessageId;
      }
    }
    return maxId;
  }, [currentActorRef, readReceipts]);
  const readersMenuEntries = useMemo<ReadersMenuEntry[]>(() => {
    if (!readersMenu?.result) return [];

    if (readersMenu.result.roomKind === "direct") {
      // Direct readers API returns only the read timestamp, so identity comes from room peer details.
      if (!readersMenu.result.readAt || !details?.peer) return [];
      return [
        {
          key: `direct-${details.peer.publicRef || details.peer.username}`,
          publicRef: details.peer.publicRef || null,
          username: details.peer.username,
          displayName: details.peer.displayName,
          profileImage: details.peer.profileImage,
          avatarCrop: details.peer.avatarCrop ?? null,
          readAt: readersMenu.result.readAt,
        },
      ];
    }

    return readersMenu.result.readers.map((reader) => ({
      key: `${reader.userId}-${reader.readAt}`,
      publicRef: reader.publicRef,
      username: reader.username,
      displayName: reader.displayName,
      profileImage: reader.profileImage,
      avatarCrop: reader.avatarCrop ?? null,
      readAt: reader.readAt,
    }));
  }, [details?.peer, readersMenu]);

  if (!user && !isPublicRoom) {
    return (
      <Panel>
        <p>Чтобы войти в комнату, авторизуйтесь.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => onNavigate("/login")}>
            Войти
          </Button>
          <Button variant="ghost" onClick={() => onNavigate("/register")}>
            Регистрация
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <div
      className={[styles.chat, isDropTargetActive ? styles.chatDragActive : ""]
        .filter(Boolean)
        .join(" ")}
      data-testid="chat-page-root"
      {...fileDropBindings}
    >
      {isDropTargetActive && (
        <div
          className={styles.dropOverlay}
          role="status"
          aria-live="polite"
          data-testid="chat-drop-overlay"
        >
          <div className={styles.dropOverlayContent}>
            <strong>Отпустите файл, чтобы прикрепить</strong>
            <span>Можно перетащить сразу несколько файлов</span>
          </div>
        </div>
      )}

      {!isOnline && (
        <Toast variant="warning" role="status">
          Нет подключения к интернету. Мы восстановим соединение автоматически.
        </Toast>
      )}

      {lastError && status === "error" && (
        <Toast variant="danger" role="alert">
          Проблемы с соединением. Проверьте сеть и попробуйте еще раз.
        </Toast>
      )}

      <div className={styles.chatHeader}>
        <div className={styles.directHeader}>
          <div className={styles.mobileHeaderButtons}>
            <button
              type="button"
              className={styles.mobileBackBtn}
              onClick={handleMobileOpenClick}
              aria-label="Открыть меню"
              data-testid="chat-mobile-open-button"
            >
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
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          {details?.kind === "direct" && details.peer ? (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={openDirectInfo}
              aria-label={`Профиль ${resolveIdentityLabel(details.peer)}`}
            >
              <Avatar
                username={resolveIdentityLabel(details.peer)}
                profileImage={details.peer.profileImage}
                avatarCrop={details.peer.avatarCrop}
                online={onlineUsernames.has(
                  normalizeActorRef(details.peer.publicRef),
                )}
                size="small"
              />
            </button>
          ) : (
            <button
              type="button"
              className={styles.directHeaderAvatar}
              onClick={details?.kind === "group" ? openGroupInfo : undefined}
              disabled={details?.kind !== "group"}
              aria-label={
                details?.kind === "group"
                  ? "Информация о группе"
                  : "Информация о чате"
              }
            >
              <Avatar
                username={roomTitle}
                profileImage={
                  details?.kind === "group" ? (details.avatarUrl ?? null) : null
                }
                avatarCrop={
                  details?.kind === "group"
                    ? (details.avatarCrop ?? undefined)
                    : undefined
                }
                size="small"
              />
            </button>
          )}

          <div className={styles.directHeaderMeta}>
            <strong className={styles.directHeaderName}>{roomTitle}</strong>
            <p className={styles.muted}>{roomSubtitle}</p>
          </div>

          <div ref={searchWrapRef} className={styles.directHeaderActions}>
            <button
              type="button"
              className={[
                styles.headerIconBtn,
                isHeaderSearchOpen ? styles.headerIconBtnActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={openRoomSearch}
              aria-label="Поиск по чату"
              title="Поиск по чату"
              aria-expanded={isHeaderSearchOpen}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {details?.kind === "group" && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openGroupInfo}
                aria-label="Информация о группе"
                title="Информация о группе"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            )}

            {details?.kind === "direct" && (
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={openDirectInfo}
                aria-label="Информация о пользователе"
                title="Информация о пользователе"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}

            <div
              className={[
                styles.headerSearch,
                isHeaderSearchOpen ? styles.headerSearchOpen : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-hidden={!isHeaderSearchOpen}
            >
              <div className={styles.headerSearchInputRow}>
                <input
                  ref={headerSearchInputRef}
                  type="text"
                  className={styles.headerSearchInput}
                  value={headerSearchQuery}
                  onChange={(event) => setHeaderSearchQuery(event.target.value)}
                  placeholder="Поиск в этом чате"
                />
                <button
                  type="button"
                  className={styles.headerSearchClose}
                  onClick={() => {
                    setHeaderSearchOpen(false);
                    setHeaderSearchQuery("");
                    setHeaderSearchResults([]);
                  }}
                  aria-label="Закрыть поиск"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className={styles.headerSearchResults}>
                {headerSearchLoading && (
                  <div className={styles.headerSearchState}>РС‰РµРј...</div>
                )}
                {!headerSearchLoading &&
                  headerSearchQuery.trim().length >= 2 &&
                  headerSearchResults.length === 0 && (
                    <div className={styles.headerSearchState}>
                      Ничего не найдено
                    </div>
                  )}
                {!headerSearchLoading &&
                  headerSearchResults.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={styles.headerSearchResult}
                      onClick={() => onHeaderSearchResultClick(item.id)}
                    >
                      <span className={styles.headerSearchResultTop}>
                        <strong>{resolveIdentityLabel(item)}</strong>
                        <time>{formatTimestamp(item.createdAt)}</time>
                      </span>
                      <span className={styles.headerSearchResultText}>
                        {item.content || "Вложение"}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {visibleError && <Toast variant="danger">{visibleError}</Toast>}

      {loading ? (
        <Panel muted busy>
          Загружаем историю...
        </Panel>
      ) : (
        <div className={styles.chatBox}>
          <div
            className={styles.chatLog}
            ref={listRef}
            aria-live="polite"
            onScroll={handleScroll}
            onWheel={armPaginationInteraction}
            onTouchStart={armPaginationInteraction}
            onPointerDown={armPaginationInteraction}
          >
            {loadingMore && (
              <Panel muted busy>
                Загружаем ранние сообщения...
              </Panel>
            )}
            {/* {!hasMore && <Panel muted>Это начало истории.</Panel>} */}

            {timeline.map((item, index) =>
              item.type === "day" ? (
                <div
                  className={styles.daySeparator}
                  role="separator"
                  aria-label={item.label}
                  key={`day-${item.key}`}
                >
                  <span>{item.label}</span>
                </div>
              ) : item.type === "unread" ? (
                <div
                  className={styles.unreadDivider}
                  role="separator"
                  key="unread-divider"
                  data-unread-divider
                  data-unread-anchor-id={unreadDividerAnchorId ?? ""}
                >
                  <span>Новые сообщения</span>
                </div>
              ) : (
                (() => {
                  const previousTimelineItem = timeline[index - 1];
                  const previousMessage =
                    previousTimelineItem?.type === "message"
                      ? previousTimelineItem.message
                      : null;
                  // Группируем только соседние message-элементы одного автора.
                  const grouped =
                    previousMessage !== null &&
                    resolveMessageActorRef(previousMessage) ===
                      resolveMessageActorRef(item.message);
                  const ownMessage = isOwnMessage(
                    item.message,
                    currentActorRef,
                  );
                  const canModerateMessage = Boolean(
                    user && canManageMessagesToRoom && !ownMessage,
                  );
                  const canEditOrDelete = ownMessage || canModerateMessage;
                  return (
                    <MessageBubble
                      key={`${item.message.id}-${item.message.createdAt}`}
                      message={item.message}
                      isOwn={ownMessage}
                      showAvatar={!grouped}
                      showHeader={!grouped}
                      grouped={grouped}
                      canModerate={canModerateMessage}
                      canViewReaders={ownMessage && !item.message.isDeleted}
                      isRead={ownMessage && item.message.id <= maxReadMessageId}
                      highlighted={item.message.id === highlightedMessageId}
                      onlineUsernames={onlineUsernames}
                      onReply={user ? handleReply : undefined}
                      onEdit={canEditOrDelete ? handleEdit : undefined}
                      onDelete={canEditOrDelete ? handleDelete : undefined}
                      onReact={user ? handleReact : undefined}
                      onViewReaders={user ? handleOpenReaders : undefined}
                      onReplyQuoteClick={handleReplyQuoteClick}
                      onAvatarClick={openUserProfile}
                      onOpenMediaAttachment={handleOpenMediaAttachment}
                    />
                  );
                })()
              ),
            )}
          </div>

          {showScrollFab && (
            <button
              type="button"
              className={styles.scrollFab}
              onClick={scrollToBottom}
              aria-label="Прокрутить вниз"
            >
              {newMsgCount > 0 && (
                <span className={styles.scrollFabBadge}>{newMsgCount}</span>
              )}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          {activeTypingUsers.length > 0 && (
            <TypingIndicator users={activeTypingUsers} />
          )}

          {!user && isPublicRoom && (
            <div className={styles.authCallout} data-testid="chat-auth-callout">
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Чтобы писать в публичном чате, войдите или зарегистрируйтесь.
                </p>
              </div>
            </div>
          )}

          {user && isBlocked && isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Вы заблокировали этого пользователя.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  const peerId = details?.peer?.userId;
                  if (!peerId) return;
                  void friendsController
                    .unblockUser(peerId)
                    .then(() => window.location.reload())
                    .catch(() => {});
                }}
              >
                Разблокировать
              </Button>
            </div>
          )}

          {user && isBlocked && !isBlockedByMe && (
            <div className={styles.authCallout}>
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Вы не можете писать этому пользователю.
                </p>
              </div>
            </div>
          )}

          {user && showGroupJoinCta && (
            <div
              className={styles.authCallout}
              data-testid="group-join-callout"
            >
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  Чтобы отправлять сообщения, сначала присоединитесь к группе.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  void handleJoinGroup();
                }}
                disabled={joinInProgress || permissionsLoading}
              >
                {joinInProgress ? "Присоединяемся..." : "Присоединиться"}
              </Button>
            </div>
          )}

          {user && showGroupReadOnlyNotice && (
            <div
              className={styles.authCallout}
              data-testid="group-readonly-callout"
            >
              <div className={styles.authCalloutText}>
                <p className={styles.muted}>
                  {isBannedInRoom
                    ? "Вы заблокированы в этой группе."
                    : "У вас нет прав на отправку сообщений в этой группе."}
                </p>
              </div>
            </div>
          )}

          {canSendMessages && (
            <MessageInput
              draft={draft}
              onDraftChange={setDraft}
              onSend={() => {
                void sendMessage();
              }}
              onTyping={sendTyping}
              disabled={status !== "online" || !isOnline}
              rateLimitActive={rateLimitActive}
              replyTo={editingMessage ?? replyTo}
              onCancelReply={handleCancelReply}
              onAttach={handleAttach}
              pendingFiles={queuedFiles}
              onRemovePendingFile={handleRemoveQueuedFile}
              onClearPendingFiles={handleClearQueuedFiles}
              uploadProgress={uploadProgress}
              onCancelUpload={handleCancelUpload}
            />
          )}
        </div>
      )}

      {lightboxAttachmentId !== null &&
        lightboxOpenIndex >= 0 &&
        lightboxMediaItems.length > 0 && (
          <ImageLightbox
            mediaItems={lightboxMediaItems}
            initialIndex={lightboxOpenIndex}
            onClose={() => setLightboxAttachmentId(null)}
          />
        )}

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удалить сообщение?"
      >
        <p
          style={{
            color: "var(--tg-text-secondary, #aaa)",
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Это действие нельзя отменить.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={confirmDelete}>
            Удалить
          </Button>
        </div>
      </Modal>
      {readersMenu && (
        <ReadersMenu
          x={readersMenu.x}
          y={readersMenu.y}
          loading={readersMenu.loading}
          error={readersMenu.error}
          entries={readersMenuEntries}
          emptyLabel={
            readersMenu.result?.roomKind === "direct"
              ? "Еще не прочитано"
              : "Еще никто не прочитал"
          }
          onClose={closeReadersMenu}
          onOpenProfile={openUserProfile}
        />
      )}
    </div>
  );
}




