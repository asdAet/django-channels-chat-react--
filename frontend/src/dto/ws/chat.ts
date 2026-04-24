import { z } from "zod";

import { parseJson, safeDecode } from "../core/codec";

const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const rateLimitedSchema = z
  .object({
    error: z.literal("rate_limited"),
    retry_after: z.union([z.number(), z.string()]).optional(),
    retryAfter: z.union([z.number(), z.string()]).optional(),
    retry: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

const messageTooLongSchema = z
  .object({ error: z.literal("message_too_long") })
  .passthrough();
const forbiddenSchema = z
  .object({ error: z.literal("forbidden") })
  .passthrough();

const replyToSchema = z
  .object({
    id: z.number(),
    publicRef: z.string().nullable().optional(),
    username: z.string().nullable(),
    displayName: z.string().nullable().optional(),
    content: z.string(),
  })
  .passthrough();

const attachmentWsSchema = z
  .object({
    id: z.number(),
    originalFilename: z.string(),
    contentType: z.string(),
    fileSize: z.number(),
    url: z.string().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    message: z.string(),
    publicRef: z.string().min(1),
    username: z.string().min(1),
    displayName: z.string().optional(),
    profile_pic: z.string().nullable().optional(),
    avatar_crop: avatarCropSchema.nullable().optional(),
    roomId: z.union([z.number(), z.string()]).optional(),
    id: z.number().optional(),
    createdAt: z.string().optional(),
    replyTo: replyToSchema.nullable().optional(),
    attachments: z.array(attachmentWsSchema).optional(),
  })
  .passthrough();

const typingSchema = z
  .object({
    type: z.literal("typing"),
    roomId: z.union([z.number(), z.string()]).optional(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
    userId: z.number(),
  })
  .passthrough();

const messageEditSchema = z
  .object({
    type: z.literal("message_edit"),
    messageId: z.number(),
    roomId: z.union([z.number(), z.string()]).optional(),
    content: z.string(),
    editedAt: z.string(),
    editedBy: z.string(),
  })
  .passthrough();

const messageDeleteSchema = z
  .object({
    type: z.literal("message_delete"),
    messageId: z.number(),
    roomId: z.union([z.number(), z.string()]).optional(),
    deletedBy: z.string(),
  })
  .passthrough();

const reactionAddSchema = z
  .object({
    type: z.literal("reaction_add"),
    messageId: z.number(),
    roomId: z.union([z.number(), z.string()]).optional(),
    emoji: z.string(),
    userId: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();

const reactionRemoveSchema = z
  .object({
    type: z.literal("reaction_remove"),
    messageId: z.number(),
    roomId: z.union([z.number(), z.string()]).optional(),
    emoji: z.string(),
    userId: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();

const readReceiptSchema = z
  .object({
    type: z.literal("read_receipt"),
    userId: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
    lastReadMessageId: z.number(),
    lastReadAt: z.string().nullable().optional(),
    roomId: z.union([z.number(), z.string()]),
  })
  .passthrough();

/**
 * Описывает полезную нагрузку события `ChatWsEvent`.
 */
export type ChatWsEvent =
  | {
      type: "rate_limited";
      retryAfterSeconds: number | null;
    }
  | { type: "message_too_long" }
  | { type: "forbidden" }
  | {
      type: "chat_message";
      message: {
        id: number | null;
        content: string;
        publicRef: string;
        username: string;
        displayName: string;
        profilePic: string | null;
        avatarCrop: {
          x: number;
          y: number;
          width: number;
          height: number;
        } | null;
        roomId: number | null;
        createdAt: string | null;
        replyTo: {
          id: number;
          publicRef: string | null;
          username: string | null;
          displayName: string | null;
          content: string;
        } | null;
        attachments: {
          id: number;
          originalFilename: string;
          contentType: string;
          fileSize: number;
          url: string | null;
          thumbnailUrl: string | null;
          width: number | null;
          height: number | null;
        }[];
      };
    }
  | {
      type: "typing";
      roomId: number | null;
      publicRef: string;
      username: string;
      displayName: string;
      userId: number;
    }
  | {
      type: "message_edit";
      messageId: number;
      roomId: number | null;
      content: string;
      editedAt: string;
      editedBy: string;
    }
  | {
      type: "message_delete";
      messageId: number;
      roomId: number | null;
      deletedBy: string;
    }
  | {
      type: "reaction_add";
      messageId: number;
      roomId: number | null;
      emoji: string;
      userId: number;
      publicRef: string;
      username: string;
      displayName: string;
    }
  | {
      type: "reaction_remove";
      messageId: number;
      roomId: number | null;
      emoji: string;
      userId: number;
      publicRef: string;
      username: string;
      displayName: string;
    }
  | {
      type: "read_receipt";
      userId: number;
      publicRef: string;
      username: string;
      displayName: string;
      lastReadMessageId: number;
      lastReadAt: string | null;
      roomId: number;
    }
  | { type: "unknown" };

/**
 * Преобразует WebSocket-данные для операции to number or null.
 * @param value Входное значение для преобразования.
 * @returns Числовое значение результата.
 */
const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Преобразует WebSocket-данные для операции decode chat ws event.
 * @param raw Сырые входные данные до нормализации.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeChatWsEvent = (raw: string): ChatWsEvent => {
  const payload = parseJson(raw);
  if (!payload || typeof payload !== "object") {
    return { type: "unknown" };
  }

  const rateLimited = safeDecode(rateLimitedSchema, payload);
  if (rateLimited) {
    const retryAfterSeconds =
      toNumberOrNull(rateLimited.retry_after) ??
      toNumberOrNull(rateLimited.retryAfter) ??
      toNumberOrNull(rateLimited.retry);
    return { type: "rate_limited", retryAfterSeconds };
  }

  if (safeDecode(messageTooLongSchema, payload)) {
    return { type: "message_too_long" };
  }

  if (safeDecode(forbiddenSchema, payload)) {
    return { type: "forbidden" };
  }

  // Typed events (have a "type" field)
  const typed = safeDecode(typingSchema, payload);
  if (typed) {
    return {
      type: "typing",
      roomId: toNumberOrNull(typed.roomId),
      publicRef: typed.publicRef,
      username: typed.username,
      displayName: typed.displayName ?? typed.username,
      userId: typed.userId,
    };
  }

  const edit = safeDecode(messageEditSchema, payload);
  if (edit) {
    return {
      type: "message_edit",
      messageId: edit.messageId,
      roomId: toNumberOrNull(edit.roomId),
      content: edit.content,
      editedAt: edit.editedAt,
      editedBy: edit.editedBy,
    };
  }

  const del = safeDecode(messageDeleteSchema, payload);
  if (del) {
    return {
      type: "message_delete",
      messageId: del.messageId,
      roomId: toNumberOrNull(del.roomId),
      deletedBy: del.deletedBy,
    };
  }

  const reactAdd = safeDecode(reactionAddSchema, payload);
  if (reactAdd) {
    return {
      type: "reaction_add",
      messageId: reactAdd.messageId,
      roomId: toNumberOrNull(reactAdd.roomId),
      emoji: reactAdd.emoji,
      userId: reactAdd.userId,
      publicRef: reactAdd.publicRef,
      username: reactAdd.username,
      displayName: reactAdd.displayName ?? reactAdd.username,
    };
  }

  const reactRemove = safeDecode(reactionRemoveSchema, payload);
  if (reactRemove) {
    return {
      type: "reaction_remove",
      messageId: reactRemove.messageId,
      roomId: toNumberOrNull(reactRemove.roomId),
      emoji: reactRemove.emoji,
      userId: reactRemove.userId,
      publicRef: reactRemove.publicRef,
      username: reactRemove.username,
      displayName: reactRemove.displayName ?? reactRemove.username,
    };
  }

  const receipt = safeDecode(readReceiptSchema, payload);
  if (receipt) {
    const roomId = toNumberOrNull(receipt.roomId);
    if (roomId === null) {
      return { type: "unknown" };
    }
    return {
      type: "read_receipt",
      userId: receipt.userId,
      publicRef: receipt.publicRef,
      username: receipt.username,
      displayName: receipt.displayName ?? receipt.username,
      lastReadMessageId: receipt.lastReadMessageId,
      lastReadAt: receipt.lastReadAt ?? null,
      roomId,
    };
  }

  // Chat message (no "type" field)
  const message = safeDecode(messageSchema, payload);
  if (message) {
    return {
      type: "chat_message",
      message: {
        id: message.id ?? null,
        content: message.message,
        publicRef: message.publicRef,
        username: message.username,
        displayName: message.displayName ?? message.username,
        profilePic: message.profile_pic ?? null,
        avatarCrop: message.avatar_crop ?? null,
        roomId: toNumberOrNull(message.roomId),
        createdAt: message.createdAt ?? null,
        replyTo: message.replyTo
          ? {
              ...message.replyTo,
              publicRef:
                typeof message.replyTo.publicRef === "string" &&
                message.replyTo.publicRef.trim().length > 0
                  ? message.replyTo.publicRef
                  : null,
              displayName:
                message.replyTo.displayName ?? message.replyTo.username,
            }
          : null,
        attachments: (message.attachments ?? []).map((a) => ({
          id: a.id,
          originalFilename: a.originalFilename,
          contentType: a.contentType,
          fileSize: a.fileSize,
          url: a.url ?? null,
          thumbnailUrl: a.thumbnailUrl ?? null,
          width: a.width ?? null,
          height: a.height ?? null,
        })),
      },
    };
  }

  return { type: "unknown" };
};
