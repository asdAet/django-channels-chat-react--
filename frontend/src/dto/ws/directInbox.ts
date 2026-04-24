import { z } from "zod";

import type { DirectChatListItem } from "../../entities/room/types";
import { parseJson, safeDecode } from "../core/codec";

const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const unreadSchema = z
  .object({
    dialogs: z.number().optional(),
    roomIds: z.array(z.number()).optional(),
    counts: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  })
  .passthrough();

const itemSchema = z
  .object({
    roomId: z.number(),
    peer: z
      .object({
        publicRef: z.string().min(1),
        username: z.string().min(1),
        displayName: z.string().optional(),
        profileImage: z.string().nullable().optional(),
        avatarCrop: avatarCropSchema.nullable().optional(),
      })
      .passthrough(),
    lastMessage: z.string().optional(),
    lastMessageAt: z.string().optional(),
  })
  .passthrough();

const unreadStateEventSchema = z
  .object({
    type: z.literal("direct_unread_state"),
    unread: unreadSchema.optional(),
  })
  .passthrough();

const inboxItemEventSchema = z
  .object({
    type: z.literal("direct_inbox_item"),
    item: itemSchema.optional(),
    unread: unreadSchema.optional(),
  })
  .passthrough();

const markReadAckEventSchema = z
  .object({
    type: z.literal("direct_mark_read_ack"),
    unread: unreadSchema.optional(),
  })
  .passthrough();

const roomUnreadStateEventSchema = z
  .object({
    type: z.literal("room_unread_state"),
    unread: unreadSchema.optional(),
  })
  .passthrough();

const errorEventSchema = z
  .object({
    type: z.literal("error"),
    code: z.string().optional(),
  })
  .passthrough();

/**
 * Преобразует WebSocket-данные для операции normalize unread.
 * @param value Входное значение для преобразования.
 * @returns Строковое значение результата.
 */
const normalizeUnread = (
  value: z.infer<typeof unreadSchema> | undefined,
): { dialogs: number; roomIds: string[]; counts: Record<string, number> } => {
  if (!value) return { dialogs: 0, roomIds: [], counts: {} };

  const counts: Record<string, number> = {};
  const rawCounts = value.counts ?? {};
  for (const [roomRef, raw] of Object.entries(rawCounts)) {
    const key = roomRef.trim();
    if (!key) continue;
    const roomId = Number(key);
    if (!Number.isFinite(roomId) || roomId <= 0) continue;
    const parsed = typeof raw === "string" ? Number(raw) : raw;
    if (!Number.isFinite(parsed) || parsed <= 0) continue;
    counts[String(Math.trunc(roomId))] = Math.floor(parsed);
  }

  const roomIdsFromPayload = Array.isArray(value.roomIds)
    ? value.roomIds.filter((roomId) => Number.isFinite(roomId) && roomId > 0)
    : [];

  if (!Object.keys(counts).length) {
    for (const roomId of roomIdsFromPayload) {
      counts[String(Math.trunc(roomId))] = 1;
    }
  }

  const roomIds = Object.keys(counts);
  const dialogs =
    typeof value.dialogs === "number"
      ? Math.max(0, value.dialogs)
      : roomIds.length;

  return { dialogs, roomIds, counts };
};

/**
 * Преобразует WebSocket-данные для операции normalize item.
 * @param value Входное значение для преобразования.
 * @returns Нормализованные данные после декодирования.
 */
const normalizeItem = (
  value: z.infer<typeof itemSchema>,
): DirectChatListItem => ({
  roomId: Math.trunc(value.roomId),
  peer: {
    publicRef: value.peer.publicRef,
    username: value.peer.username,
    displayName: value.peer.displayName ?? value.peer.username,
    profileImage: value.peer.profileImage ?? null,
    avatarCrop: value.peer.avatarCrop ?? null,
  },
  lastMessage: value.lastMessage ?? "",
  lastMessageAt: value.lastMessageAt ?? new Date().toISOString(),
});

/**
 * Описывает полезную нагрузку события `DirectInboxWsEvent`.
 */
export type DirectInboxWsEvent =
  | {
      type: "direct_unread_state";
      unread: {
        dialogs: number;
        roomIds: string[];
        counts: Record<string, number>;
      };
    }
  | {
      type: "direct_inbox_item";
      item: DirectChatListItem | null;
      unread: {
        dialogs: number;
        roomIds: string[];
        counts: Record<string, number>;
      } | null;
    }
  | {
      type: "direct_mark_read_ack";
      unread: {
        dialogs: number;
        roomIds: string[];
        counts: Record<string, number>;
      };
    }
  | {
      type: "room_unread_state";
      unread: {
        dialogs: number;
        roomIds: string[];
        counts: Record<string, number>;
      };
    }
  | { type: "error"; code: string }
  | { type: "unknown" };

/**
 * Преобразует WebSocket-данные для операции decode direct inbox ws event.
 * @param raw Сырые входные данные до нормализации.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeDirectInboxWsEvent = (raw: string): DirectInboxWsEvent => {
  const payload = parseJson(raw);
  if (!payload || typeof payload !== "object") {
    return { type: "unknown" };
  }

  const unreadState = safeDecode(unreadStateEventSchema, payload);
  if (unreadState) {
    return {
      type: "direct_unread_state",
      unread: normalizeUnread(unreadState.unread),
    };
  }

  const inboxItem = safeDecode(inboxItemEventSchema, payload);
  if (inboxItem) {
    return {
      type: "direct_inbox_item",
      item: inboxItem.item ? normalizeItem(inboxItem.item) : null,
      unread: inboxItem.unread ? normalizeUnread(inboxItem.unread) : null,
    };
  }

  const markReadAck = safeDecode(markReadAckEventSchema, payload);
  if (markReadAck) {
    return {
      type: "direct_mark_read_ack",
      unread: normalizeUnread(markReadAck.unread),
    };
  }

  const roomUnreadState = safeDecode(roomUnreadStateEventSchema, payload);
  if (roomUnreadState) {
    return {
      type: "room_unread_state",
      unread: normalizeUnread(roomUnreadState.unread),
    };
  }

  const errorEvent = safeDecode(errorEventSchema, payload);
  if (errorEvent) {
    return {
      type: "error",
      code: errorEvent.code ?? "unknown",
    };
  }

  return { type: "unknown" };
};
