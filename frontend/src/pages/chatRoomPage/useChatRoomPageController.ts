import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useChatRoom } from "../../hooks/useChatRoom";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useRoomPermissions } from "../../hooks/useRoomPermissions";
import {
  useChatAttachmentMaxPerMessage,
  useChatAttachmentMaxSizeMb,
  useChatMessageMaxLength,
} from "../../shared/config/limits";
import { useDirectInbox } from "../../shared/directInbox";
import { useInfoPanel } from "../../shared/layout/useInfoPanel";
import { useMobileShell } from "../../shared/layout/useMobileShell";
import { appendWebSocketAuthToken, getWebSocketBase } from "../../shared/lib/ws";
import { usePresence } from "../../shared/presence";
import { useWsAuthToken } from "../../shared/wsAuth/useWsAuthToken";
import { useChatRoomPageComposer } from "./useChatRoomPageComposer";
import type {
  ChatRoomPageController,
  UseChatRoomPageControllerOptions,
} from "./useChatRoomPageController.types";
import { useChatRoomPageHeaderSearch } from "./useChatRoomPageHeaderSearch";
import { useChatRoomPageReadState } from "./useChatRoomPageReadState";
import { useChatRoomPageRealtime } from "./useChatRoomPageRealtime";
import { useChatRoomPageUiActions } from "./useChatRoomPageUiActions";
import { useChatRoomPageViewModel } from "./useChatRoomPageViewModel";
import { useFileDropZone } from "./useFileDropZone";
import { parseRoomIdRef, resolveCurrentActorRef } from "./utils";

/**
 * Собирает все feature-hooks страницы комнаты в единый контроллер.
 *
 * @param options Контекст маршрута и текущего пользователя.
 * @returns Структурированные slices для презентационного слоя.
 */
export function useChatRoomPageController({
  roomId,
  initialRoomKind = null,
  user,
}: UseChatRoomPageControllerOptions): ChatRoomPageController {
  const authWsToken = useWsAuthToken();
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
  const isOnline = useOnlineStatus();
  const { open: openInfoPanel } = useInfoPanel();
  const { openDrawer } = useMobileShell();
  const { setActiveRoom, markRead: markDirectRoomRead } = useDirectInbox();
  const { online: presenceOnline, status: presenceStatus } = usePresence();
  const maxMessageLength = useChatMessageMaxLength();
  const maxAttachmentSizeMb = useChatAttachmentMaxSizeMb();
  const maxAttachmentPerMessage = useChatAttachmentMaxPerMessage();

  const [roomError, setRoomError] = useState<string | null>(null);

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
  const currentActorRef = useMemo(() => resolveCurrentActorRef(user), [user]);
  const maxAttachmentSizeBytes = useMemo(
    () => maxAttachmentSizeMb * 1024 * 1024,
    [maxAttachmentSizeMb],
  );
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

  const readState = useChatRoomPageReadState({
    roomId,
    roomIdForRequests,
    roomApiRef,
    locationSearch: location.search,
    user,
    details,
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    currentActorRef,
    resolvedRoomId,
    setActiveRoom,
    markDirectRoomRead,
  });

  const realtime = useChatRoomPageRealtime({
    wsUrl:
      !user && !isPublicRoom
        ? null
        : roomApiRef
          ? appendWebSocketAuthToken(
              `${getWebSocketBase()}/ws/chat/${encodeURIComponent(roomApiRef)}/`,
              user ? authWsToken : null,
            )
          : null,
    roomIdForRequests,
    roomKind: details?.kind ?? initialRoomKind ?? null,
    maxMessageLength,
    currentActorRef,
    readStateEnabled: Boolean(user),
    user,
    setMessages,
    setRoomError,
    onIncomingForeignMessage: readState.handleIncomingForeignMessage,
  });

  const composer = useChatRoomPageComposer({
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
    status: realtime.status,
    send: realtime.send,
    rateLimitActive: realtime.rateLimitActive,
    reload,
    refreshRoomPermissions,
    jumpToMessageById: readState.jumpToMessageById,
    updateUnreadDividerAnchor: readState.updateUnreadDividerAnchor,
    scrollToBottom: readState.scrollToBottom,
    setRoomError,
    setMessages,
  });

  const headerSearch = useChatRoomPageHeaderSearch({
    roomIdForRequests,
    jumpToMessageById: readState.jumpToMessageById,
    setRoomError,
  });

  const actions = useChatRoomPageUiActions({
    details,
    roomIdForRequests,
    openInfoPanel,
    openDrawer,
  });

  const view = useChatRoomPageViewModel({
    details,
    roomIdForRequests,
    messages,
    unreadDividerRenderTarget: readState.unreadDividerRenderTarget,
    typingUsers: realtime.typingUsers,
    typingDisplayNames: realtime.typingDisplayNames,
    readReceipts: realtime.readReceipts,
    currentActorRef,
    user,
    permissionsLoading,
    canWriteToRoom,
    canJoinRoom,
    presenceOnline,
    presenceStatus,
    lightboxAttachmentId: composer.lightboxAttachmentId,
    readersMenu: composer.readersMenu,
  });

  const {
    active: isDropTargetActive,
    bindings: fileDropBindings,
    reset: resetFileDropZone,
  } = useFileDropZone({
    enabled: view.canSendMessages,
    onFilesDrop: composer.handleAttach,
  });

  useEffect(() => {
    if (view.canSendMessages || !isDropTargetActive) {
      return;
    }

    resetFileDropZone();
  }, [isDropTargetActive, resetFileDropZone, view.canSendMessages]);

  const loadError = error ? "Не удалось загрузить комнату" : null;
  const visibleError = roomError || loadError;

  return {
    room: {
      details,
      messages,
      loading,
      loadingMore,
      hasMore,
      isPublicRoom,
      isOnline,
      canManageMessagesToRoom,
      permissionsLoading,
      isBannedInRoom,
      visibleError,
      status: realtime.status,
      lastError: realtime.lastError,
      currentActorRef,
    },
    headerSearch: {
      searchAnchorRef: headerSearch.searchAnchorRef,
      searchLayerRef: headerSearch.searchLayerRef,
      headerSearchInputRef: headerSearch.headerSearchInputRef,
      isHeaderSearchOpen: headerSearch.isHeaderSearchOpen,
      headerSearchQuery: headerSearch.headerSearchQuery,
      headerSearchLoading: headerSearch.headerSearchLoading,
      headerSearchResults: headerSearch.headerSearchResults,
      setHeaderSearchQuery: headerSearch.setHeaderSearchQuery,
      openRoomSearch: headerSearch.openRoomSearch,
      closeRoomSearch: headerSearch.closeRoomSearch,
      onHeaderSearchResultClick: headerSearch.onHeaderSearchResultClick,
    },
    scroll: {
      listRef: readState.listRef,
      highlightedMessageId: readState.highlightedMessageId,
      showScrollFab: readState.showScrollFab,
      newMsgCount: readState.newMsgCount,
      unreadDividerAnchorId: readState.unreadDividerAnchorId,
      handleScroll: readState.handleScroll,
      armPaginationInteraction: readState.armPaginationInteraction,
      scrollToBottom: readState.scrollToBottom,
    },
    composer: {
      draft: composer.draft,
      setDraft: composer.setDraft,
      replyTo: composer.replyTo,
      editingMessage: composer.editingMessage,
      deleteConfirm: composer.deleteConfirm,
      setDeleteConfirm: composer.setDeleteConfirm,
      readersMenu: composer.readersMenu,
      uploadProgress: composer.uploadProgress,
      queuedFiles: composer.queuedFiles,
      joinInProgress: composer.joinInProgress,
      lightboxAttachmentId: composer.lightboxAttachmentId,
      setLightboxAttachmentId: composer.setLightboxAttachmentId,
      sendMessage: composer.sendMessage,
      handleReply: composer.handleReply,
      handleEdit: composer.handleEdit,
      handleDelete: composer.handleDelete,
      closeReadersMenu: composer.closeReadersMenu,
      handleOpenReaders: composer.handleOpenReaders,
      confirmDelete: composer.confirmDelete,
      handleReact: composer.handleReact,
      handleAttach: composer.handleAttach,
      handleRemoveQueuedFile: composer.handleRemoveQueuedFile,
      handleClearQueuedFiles: composer.handleClearQueuedFiles,
      handleCancelUpload: composer.handleCancelUpload,
      handleCancelReply: composer.handleCancelReply,
      handleReplyQuoteClick: composer.handleReplyQuoteClick,
      handleJoinGroup: composer.handleJoinGroup,
      handleOpenMediaAttachment: composer.handleOpenMediaAttachment,
      sendTyping: realtime.sendTyping,
      rateLimitActive: realtime.rateLimitActive,
    },
    actions,
    view,
    fileDrop: {
      isDropTargetActive,
      fileDropBindings,
    },
  };
}
