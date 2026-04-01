import { useMemo } from "react";

import { formatLastSeen } from "../../shared/lib/format";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import {
  buildChatLightboxMediaItems,
  findLightboxMediaIndex,
} from "./mediaLightbox";
import type {
  UseChatRoomPageViewModelOptions,
  UseChatRoomPageViewModelResult,
} from "./useChatRoomPageViewModel.types";
import {
  buildTimeline,
  formatGroupTypingLabel,
  normalizeActorRef,
} from "./utils";

/**
 * Собирает производные данные, нужные только для отображения страницы.
 *
 * @param options Сырые данные комнаты, presence и прав доступа.
 * @returns Мемозависимые данные для прямого рендера.
 */
export function useChatRoomPageViewModel({
  details,
  roomIdForRequests,
  messages,
  unreadDividerRenderTarget,
  typingUsers,
  typingDisplayNames,
  readReceipts,
  currentActorRef,
  user,
  permissionsLoading,
  canWriteToRoom,
  canJoinRoom,
  presenceOnline,
  presenceStatus,
  lightboxAttachmentId,
  readersMenu,
}: UseChatRoomPageViewModelOptions): UseChatRoomPageViewModelResult {
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

  const timeline = useMemo(
    () => buildTimeline(messages, unreadDividerRenderTarget),
    [messages, unreadDividerRenderTarget],
  );

  const lightboxMediaItems =
    useMemo<UseChatRoomPageViewModelResult["lightboxMediaItems"]>(
    () => buildChatLightboxMediaItems(messages),
    [messages],
  );
  const lightboxOpenIndex = useMemo(
    () => findLightboxMediaIndex(lightboxMediaItems, lightboxAttachmentId),
    [lightboxAttachmentId, lightboxMediaItems],
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
      ? resolveIdentityLabel(
          details.peer ?? { name: details.name },
          details.name,
        )
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

  const readersMenuEntries =
    useMemo<UseChatRoomPageViewModelResult["readersMenuEntries"]>(() => {
    if (!readersMenu?.result) {
      return [];
    }

    if (readersMenu.result.roomKind === "direct") {
      if (!readersMenu.result.readAt || !details?.peer) {
        return [];
      }

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
  }, [details, readersMenu]);

  return {
    onlineUsernames,
    timeline,
    lightboxMediaItems,
    lightboxOpenIndex,
    roomTitle,
    roomSubtitle,
    activeTypingUsers,
    isBlocked,
    isBlockedByMe,
    showGroupJoinCta,
    showGroupReadOnlyNotice,
    canSendMessages,
    maxReadMessageId,
    readersMenuEntries,
  };
}
