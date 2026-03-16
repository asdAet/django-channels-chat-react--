import { useCallback, useMemo, useState } from "react";

import type { Message } from "../../entities/message/types";

export type ReadTrackerState = {
  localLastReadMessageId: number;
  firstUnreadMessageId: number | null;
  localUnreadCount: number;
};

type UnreadStats = {
  firstUnreadMessageId: number | null;
  unreadCount: number;
};

type ComputeNextLastReadMessageIdParams = {
  messages: Message[];
  currentActorRef: string | null | undefined;
  previousLastReadMessageId: number;
  visibleMessageIds: ReadonlySet<number>;
};

type ComputeUnreadStatsParams = {
  messages: Message[];
  currentActorRef: string | null | undefined;
  lastReadMessageId: number;
};

type UseReadTrackerParams = {
  messages: Message[];
  currentActorRef: string | null | undefined;
  serverLastReadMessageId: number | null | undefined;
  enabled: boolean;
  resetKey: string;
};

const normalizeLastReadMessageId = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
};

const normalizeActorRef = (value: string | null | undefined): string => {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith("@") ? normalized.slice(1) : normalized;
};

const resolveMessageActorRef = (message: Message): string =>
  message.publicRef || "";

const isForeignMessage = (
  message: Message,
  currentActorRef: string | null | undefined,
) =>
  !currentActorRef ||
  normalizeActorRef(resolveMessageActorRef(message)) !==
    normalizeActorRef(currentActorRef);

export const collectVisibleMessageIdsByBottomEdge = (
  listElement: HTMLElement,
): Set<number> => {
  const visibleIds = new Set<number>();
  const viewportBottom = listElement.getBoundingClientRect().bottom;
  const nodes = listElement.querySelectorAll<HTMLElement>(
    "article[data-message-id]",
  );

  for (const node of nodes) {
    const rawId = node.dataset.messageId;
    if (!rawId) continue;
    const messageId = Number(rawId);
    if (!Number.isFinite(messageId) || messageId < 1) continue;
    const rect = node.getBoundingClientRect();
    if (rect.bottom <= viewportBottom + 0.5) {
      visibleIds.add(messageId);
    }
  }

  return visibleIds;
};

export const computeNextLastReadMessageId = ({
  messages,
  currentActorRef,
  previousLastReadMessageId,
  visibleMessageIds,
}: ComputeNextLastReadMessageIdParams): number => {
  let nextLastRead = normalizeLastReadMessageId(previousLastReadMessageId);

  for (const message of messages) {
    if (message.id <= nextLastRead) continue;
    if (!isForeignMessage(message, currentActorRef)) continue;
    if (!visibleMessageIds.has(message.id)) continue;
    nextLastRead = message.id;
  }

  return nextLastRead;
};

export const computeUnreadStats = ({
  messages,
  currentActorRef,
  lastReadMessageId,
}: ComputeUnreadStatsParams): UnreadStats => {
  const normalizedLastRead = normalizeLastReadMessageId(lastReadMessageId);
  let firstUnreadMessageId: number | null = null;
  let unreadCount = 0;

  for (const message of messages) {
    if (message.id <= normalizedLastRead) continue;
    if (!isForeignMessage(message, currentActorRef)) continue;
    if (firstUnreadMessageId === null) {
      firstUnreadMessageId = message.id;
    }
    unreadCount += 1;
  }

  return { firstUnreadMessageId, unreadCount };
};

export const useReadTracker = ({
  messages,
  currentActorRef,
  serverLastReadMessageId,
  enabled,
  resetKey,
}: UseReadTrackerParams) => {
  const serverLastRead = normalizeLastReadMessageId(serverLastReadMessageId);
  const [progressByKey, setProgressByKey] = useState<Record<string, number>>(
    {},
  );
  const localProgress = normalizeLastReadMessageId(progressByKey[resetKey]);
  const localLastReadMessageId = Math.max(serverLastRead, localProgress);

  const applyViewportRead = useCallback(
    (listElement: HTMLElement | null) => {
      if (!enabled || !listElement) return localLastReadMessageId;
      if (
        listElement.querySelectorAll("article[data-message-id]").length === 0
      ) {
        return localLastReadMessageId;
      }

      const visibleIds = collectVisibleMessageIdsByBottomEdge(listElement);
      const nextLastRead = computeNextLastReadMessageId({
        messages,
        currentActorRef,
        previousLastReadMessageId: localLastReadMessageId,
        visibleMessageIds: visibleIds,
      });

      if (nextLastRead <= localLastReadMessageId) return localLastReadMessageId;

      setProgressByKey((prev) => {
        const prevLastRead = normalizeLastReadMessageId(prev[resetKey]);
        if (nextLastRead <= prevLastRead) return prev;
        return { ...prev, [resetKey]: nextLastRead };
      });
      return nextLastRead;
    },
    [currentActorRef, enabled, localLastReadMessageId, messages, resetKey],
  );

  const unreadStats = useMemo(
    () =>
      computeUnreadStats({
        messages,
        currentActorRef,
        lastReadMessageId: localLastReadMessageId,
      }),
    [currentActorRef, localLastReadMessageId, messages],
  );

  return {
    localLastReadMessageId,
    firstUnreadMessageId: unreadStats.firstUnreadMessageId,
    localUnreadCount: unreadStats.unreadCount,
    applyViewportRead,
  } satisfies ReadTrackerState & {
    applyViewportRead: (listElement: HTMLElement | null) => number;
  };
};
