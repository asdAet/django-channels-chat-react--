import { z } from "zod";

import type { Message } from "../../entities/message/types";
import type {
  DirectChatListItem,
  RoomDetails,
  RoomKind,
  RoomPeer,
} from "../../entities/room/types";
import type { AvatarCrop } from "../../shared/api/users";
import { decodeOrThrow } from "../core/codec";

const roomKindSchema = z.enum(["public", "private", "direct", "group"]);
const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const roomPeerSchema = z
  .object({
    publicRef: z.string().min(1),
    username: z.string().min(1),
    displayName: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    lastSeen: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
  })
  .passthrough();

const roomDetailsSchema = z
  .object({
    name: z.string(),
    kind: roomKindSchema,
    avatarUrl: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    peer: roomPeerSchema.nullable().optional(),
    created: z.boolean().optional(),
    createdBy: z.string().nullable().optional(),
  })
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

const attachmentSchema = z
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

const reactionSummarySchema = z
  .object({
    emoji: z.string(),
    count: z.number(),
    me: z.boolean(),
  })
  .passthrough();

const messageSchema = z
  .object({
    id: z.number(),
    publicRef: z.string().min(1),
    username: z.string().min(1),
    displayName: z.string().optional(),
    content: z.string(),
    profilePic: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    createdAt: z.string(),
    editedAt: z.string().nullable().optional(),
    isDeleted: z.boolean().optional(),
    replyTo: replyToSchema.nullable().optional(),
    attachments: z.array(attachmentSchema).optional(),
    reactions: z.array(reactionSummarySchema).optional(),
  })
  .passthrough();

const roomMessagesPaginationSchema = z
  .object({
    limit: z.number(),
    hasMore: z.boolean(),
    nextBefore: z.number().nullable(),
  })
  .passthrough();

const roomMessagesSchema = z
  .object({
    messages: z.array(messageSchema),
    pagination: roomMessagesPaginationSchema.optional(),
  })
  .passthrough();

const chatResolveSchema = z
  .object({
    targetKind: z.enum(["direct", "group", "public"]),
    roomId: z.union([z.number(), z.string()]),
    roomKind: roomKindSchema,
    resolvedTarget: z.string().min(1),
    peer: roomPeerSchema.optional(),
    room: roomDetailsSchema.optional(),
  })
  .passthrough();

const directChatsSchema = z
  .object({
    items: z.array(
      z
        .object({
          roomId: z.union([z.number(), z.string()]),
          peer: roomPeerSchema,
          lastMessage: z.string(),
          lastMessageAt: z.string().nullable().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции map peer.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapPeer = (dto: z.infer<typeof roomPeerSchema>): RoomPeer => {
  const raw = dto as Record<string, unknown>;
  return {
    userId: typeof raw.userId === "number" ? raw.userId : undefined,
    publicRef: dto.publicRef,
    username: dto.username,
    displayName: dto.displayName ?? dto.username,
    profileImage: dto.profileImage ?? null,
    avatarCrop: dto.avatarCrop ?? null,
    lastSeen: dto.lastSeen ?? null,
    bio: dto.bio ?? null,
  };
};

/**
 * Преобразует HTTP-данные для операции map room details.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapRoomDetails = (
  dto: z.infer<typeof roomDetailsSchema>,
): RoomDetails => {
  const raw = dto as Record<string, unknown>;
  const rawRoomId =
    typeof raw.roomId === "number"
      ? raw.roomId
      : Number(raw.roomId ?? Number.NaN);
  return {
    roomId: Number.isFinite(rawRoomId) ? Math.trunc(rawRoomId) : undefined,
    name: dto.name,
    kind: dto.kind,
    avatarUrl: dto.avatarUrl ?? null,
    avatarCrop: dto.avatarCrop ?? null,
    peer: dto.peer ? mapPeer(dto.peer) : (dto.peer ?? undefined),
    created: dto.created,
    createdBy: dto.createdBy ?? null,
    blocked: typeof raw.blocked === "boolean" ? raw.blocked : undefined,
    blockedByMe:
      typeof raw.blockedByMe === "boolean" ? raw.blockedByMe : undefined,
    lastReadMessageId:
      typeof raw.lastReadMessageId === "number" ? raw.lastReadMessageId : null,
  };
};

/**
 * Преобразует HTTP-данные для операции map message.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapMessage = (dto: z.infer<typeof messageSchema>): Message => ({
  id: dto.id,
  publicRef: dto.publicRef,
  username: dto.username,
  displayName: dto.displayName ?? dto.username,
  content: dto.content,
  profilePic: dto.profilePic ?? null,
  avatarCrop: dto.avatarCrop ?? null,
  createdAt: dto.createdAt,
  editedAt: dto.editedAt ?? null,
  isDeleted: dto.isDeleted ?? false,
  replyTo: dto.replyTo
    ? {
        ...dto.replyTo,
        publicRef:
          typeof dto.replyTo.publicRef === "string" &&
          dto.replyTo.publicRef.trim().length > 0
            ? dto.replyTo.publicRef.trim()
            : null,
        displayName: dto.replyTo.displayName ?? dto.replyTo.username,
      }
    : null,
  attachments: (dto.attachments ?? []).map((a) => ({
    id: a.id,
    originalFilename: a.originalFilename,
    contentType: a.contentType,
    fileSize: a.fileSize,
    url: a.url ?? null,
    thumbnailUrl: a.thumbnailUrl ?? null,
    width: a.width ?? null,
    height: a.height ?? null,
  })),
  reactions: (dto.reactions ?? []).map((r) => ({
    emoji: r.emoji,
    count: r.count,
    me: r.me,
  })),
});

/**
 * Описывает структуру данных `RoomMessagesDto`.
 */
export type RoomMessagesDto = {
  messages: Message[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

/**
 * Описывает параметры вызова для `RoomMessages`.
 */
export type RoomMessagesParams = {
  limit?: number;
  beforeId?: number;
};

export type ChatResolveResponseDto = {
  targetKind: "direct" | "group" | "public";
  roomId: number;
  roomKind: RoomDetails["kind"];
  resolvedTarget: string;
  peer?: RoomPeer;
  room?: RoomDetails;
};

/**
 * Описывает структуру ответа API `DirectChatsResponseDto`.
 */
export type DirectChatsResponseDto = {
  items: DirectChatListItem[];
};

/**
 * Преобразует HTTP-данные для операции decode room details response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeRoomDetailsResponse = (input: unknown): RoomDetails => {
  const parsed = decodeOrThrow(roomDetailsSchema, input, "chat/room-details");
  return mapRoomDetails(parsed);
};

/**
 * Преобразует HTTP-данные для операции decode room messages response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeRoomMessagesResponse = (input: unknown): RoomMessagesDto => {
  const parsed = decodeOrThrow(roomMessagesSchema, input, "chat/room-messages");
  return {
    messages: parsed.messages.map(mapMessage),
    pagination: parsed.pagination,
  };
};

/**
 * Декодирует `decode chat resolve response`.
 *
 * @param input Параметр `input` в формате `unknown`.
 * @returns Возвращает результат `decode chat resolve response` в формате `ChatResolveResponseDto`.
 */
export const decodeChatResolveResponse = (
  input: unknown,
): ChatResolveResponseDto => {
  const parsed = decodeOrThrow(chatResolveSchema, input, "chat/resolve");
  return {
    targetKind: parsed.targetKind,
    roomId: toRoomId(parsed.roomId),
    roomKind: parsed.roomKind,
    resolvedTarget: parsed.resolvedTarget,
    peer: parsed.peer ? mapPeer(parsed.peer) : undefined,
    room: parsed.room ? mapRoomDetails(parsed.room) : undefined,
  };
};

/**
 * Преобразует HTTP-данные для операции decode direct chats response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeDirectChatsResponse = (
  input: unknown,
): DirectChatsResponseDto => {
  const parsed = decodeOrThrow(directChatsSchema, input, "chat/direct-chats");
  return {
    items: parsed.items.map((item) => ({
      roomId: toRoomId(item.roomId),
      peer: mapPeer(item.peer),
      lastMessage: item.lastMessage,
      lastMessageAt: item.lastMessageAt ?? "",
    })),
  };
};

// ── Message operations DTO schemas ──────────────────────────────────

const editMessageResponseSchema = z
  .object({ id: z.number(), content: z.string(), editedAt: z.string() })
  .passthrough();

const reactionResponseSchema = z
  .object({
    messageId: z.number(),
    emoji: z.string(),
    userId: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();

const searchResultSchema = z
  .object({
    id: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
    content: z.string(),
    createdAt: z.string(),
    highlight: z.string().nullable().optional(),
  })
  .passthrough();

const searchResponseSchema = z
  .object({
    results: z.array(searchResultSchema),
    pagination: roomMessagesPaginationSchema.optional(),
  })
  .passthrough();

const uploadResponseSchema = z
  .object({
    id: z.number(),
    content: z.string(),
    attachments: z.array(attachmentSchema),
  })
  .passthrough();

const roomAttachmentItemSchema = attachmentSchema
  .extend({
    messageId: z.number(),
    createdAt: z.string(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();

const roomAttachmentsResponseSchema = z
  .object({
    items: z.array(roomAttachmentItemSchema),
    pagination: roomMessagesPaginationSchema,
  })
  .passthrough();

const readStateResponseSchema = z
  .object({
    roomId: z.union([z.number(), z.string()]),
    lastReadMessageId: z.number().nullable(),
    lastReadAt: z.string().nullable().optional(),
  })
  .passthrough();

const messageReaderItemSchema = z
  .object({
    userId: z.number(),
    publicRef: z.string().min(1),
    username: z.string().min(1),
    displayName: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    readAt: z.string(),
  })
  .passthrough();

const messageReadersResponseSchema = z
  .object({
    roomKind: roomKindSchema,
    messageId: z.number(),
    readAt: z.string().nullable().optional(),
    readers: z.array(messageReaderItemSchema).optional(),
  })
  .passthrough();

const unreadCountItemSchema = z
  .object({
    roomId: z.union([z.number(), z.string()]),
    unreadCount: z.number(),
  })
  .passthrough();

const unreadCountsResponseSchema = z
  .object({ items: z.array(unreadCountItemSchema) })
  .passthrough();

const globalSearchUserSchema = roomPeerSchema;
const globalSearchGroupSchema = z
  .object({
    roomId: z.union([z.number(), z.string()]),
    name: z.string(),
    description: z.string().optional(),
    publicRef: z.string().min(1),
    roomTarget: z.string().min(1).optional(),
    memberCount: z.number().optional(),
    isPublic: z.boolean().optional(),
  })
  .passthrough();

const globalSearchMessageSchema = z
  .object({
    id: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
    content: z.string(),
    createdAt: z.string(),
    roomId: z.union([z.number(), z.string()]),
    roomName: z.string().optional(),
    roomKind: roomKindSchema.optional(),
    roomTarget: z.string().nullable().optional(),
  })
  .passthrough();

const globalSearchResponseSchema = z
  .object({
    users: z.array(globalSearchUserSchema),
    groups: z.array(globalSearchGroupSchema),
    messages: z.array(globalSearchMessageSchema),
  })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции to room id.
 * @param value Входное значение для преобразования.
 * @returns Нормализованные данные после декодирования.
 */
const toRoomId = (value: number | string): number => {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
};

/**
 * Описывает структуру ответа API `EditMessageResponse`.
 */
export type EditMessageResponse = {
  id: number;
  content: string;
  editedAt: string;
};
/**
 * Описывает структуру ответа API `ReactionResponse`.
 */
export type ReactionResponse = {
  messageId: number;
  emoji: string;
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
};
/**
 * Описывает результат операции `Search`.
 */
export type SearchResult = {
  id: number;
  publicRef: string;
  username: string;
  displayName?: string;
  content: string;
  createdAt: string;
  highlight: string | null;
};
/**
 * Описывает структуру ответа API `SearchResponse`.
 */
export type SearchResponse = {
  results: SearchResult[];
  pagination?: { limit: number; hasMore: boolean; nextBefore: number | null };
};
/**
 * Описывает структуру ответа API `UploadResponse`.
 */
export type UploadResponse = {
  id: number;
  content: string;
  attachments: import("../../entities/message/types").Attachment[];
};
/**
 * Описывает структуру ответа API `ReadStateResponse`.
 */
export type ReadStateResponse = {
  roomId: number;
  lastReadMessageId: number | null;
  lastReadAt?: string | null;
};
/**
 * Описывает структуру данных `UnreadCountItem`.
 */
export type UnreadCountItem = { roomId: number; unreadCount: number };

/**
 * Описывает exact reader конкретного сообщения.
 */
export type MessageReaderItem = {
  userId: number;
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage: string | null;
  avatarCrop?: AvatarCrop | null;
  readAt: string;
};

/**
 * Описывает ответ API `MessageReadersResponse`.
 */
export type MessageReadersResponse = {
  roomKind: RoomKind;
  messageId: number;
  readAt: string | null;
  readers: MessageReaderItem[];
};
/**
 * Описывает структуру данных `RoomAttachmentItem`.
 */
export type RoomAttachmentItem =
  import("../../domain/interfaces/IApiService").RoomAttachmentItem;
/**
 * Описывает структуру ответа API `RoomAttachmentsResponse`.
 */
export type RoomAttachmentsResponse = {
  items: RoomAttachmentItem[];
  pagination: { limit: number; hasMore: boolean; nextBefore: number | null };
};
/**
 * Описывает структуру ответа API `GlobalSearchResponse`.
 */
export type GlobalSearchResponse = {
  users: {
    publicRef: string;
    username: string;
    displayName?: string;
    profileImage: string | null;
    avatarCrop: { x: number; y: number; width: number; height: number } | null;
    lastSeen: string | null;
  }[];
  groups: {
    roomId: number;
    name: string;
    description: string;
    publicRef: string;
    roomTarget: string;
    memberCount: number;
    isPublic: boolean;
  }[];
  messages: {
    id: number;
    publicRef: string;
    username: string;
    displayName?: string;
    content: string;
    createdAt: string;
    roomId: number;
    roomName: string;
    roomKind: RoomKind;
    roomTarget: string | null;
  }[];
};

/**
 * Преобразует HTTP-данные для операции decode edit message response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeEditMessageResponse = (
  input: unknown,
): EditMessageResponse => {
  return decodeOrThrow(editMessageResponseSchema, input, "chat/edit-message");
};

/**
 * Преобразует HTTP-данные для операции decode reaction response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeReactionResponse = (input: unknown): ReactionResponse => {
  return decodeOrThrow(reactionResponseSchema, input, "chat/reaction");
};

/**
 * Преобразует HTTP-данные для операции decode search response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeSearchResponse = (input: unknown): SearchResponse => {
  const parsed = decodeOrThrow(searchResponseSchema, input, "chat/search");
  return {
    results: parsed.results.map((r) => ({
      id: r.id,
      publicRef: r.publicRef,
      username: r.username,
      displayName: r.displayName ?? r.username,
      content: r.content,
      createdAt: r.createdAt,
      highlight: r.highlight ?? null,
    })),
    pagination: parsed.pagination,
  };
};

/**
 * Преобразует HTTP-данные для операции decode upload response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeUploadResponse = (input: unknown): UploadResponse => {
  const parsed = decodeOrThrow(uploadResponseSchema, input, "chat/upload");
  return {
    id: parsed.id,
    content: parsed.content,
    attachments: parsed.attachments.map((a) => ({
      id: a.id,
      originalFilename: a.originalFilename,
      contentType: a.contentType,
      fileSize: a.fileSize,
      url: a.url ?? null,
      thumbnailUrl: a.thumbnailUrl ?? null,
      width: a.width ?? null,
      height: a.height ?? null,
    })),
  };
};

/**
 * Преобразует HTTP-данные для операции decode read state response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeReadStateResponse = (input: unknown): ReadStateResponse => {
  const parsed = decodeOrThrow(readStateResponseSchema, input, "chat/read-state");
  return {
    roomId: toRoomId(parsed.roomId),
    lastReadMessageId: parsed.lastReadMessageId,
    lastReadAt: parsed.lastReadAt ?? null,
  };
};

/**
 * Преобразует HTTP-данные для операции decode message readers response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */
export const decodeMessageReadersResponse = (
  input: unknown,
): MessageReadersResponse => {
  const parsed = decodeOrThrow(
    messageReadersResponseSchema,
    input,
    "chat/message-readers",
  );
  return {
    roomKind: parsed.roomKind,
    messageId: parsed.messageId,
    readAt: parsed.readAt ?? null,
    readers: (parsed.readers ?? []).map((reader) => ({
      userId: reader.userId,
      publicRef: reader.publicRef,
      username: reader.username,
      displayName: reader.displayName ?? reader.username,
      profileImage: reader.profileImage ?? null,
      avatarCrop: reader.avatarCrop ?? null,
      readAt: reader.readAt,
    })),
  };
};

/**
 * Преобразует HTTP-данные для операции decode unread counts response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeUnreadCountsResponse = (
  input: unknown,
): UnreadCountItem[] => {
  const parsed = decodeOrThrow(
    unreadCountsResponseSchema,
    input,
    "chat/unread-counts",
  );
  return parsed.items.map((item) => ({
    roomId: toRoomId(item.roomId),
    unreadCount: item.unreadCount,
  }));
};

/**
 * Преобразует HTTP-данные для операции decode room attachments response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeRoomAttachmentsResponse = (
  input: unknown,
): RoomAttachmentsResponse => {
  const parsed = decodeOrThrow(
    roomAttachmentsResponseSchema,
    input,
    "chat/room-attachments",
  );
  return {
    items: parsed.items.map((a) => ({
      id: a.id,
      originalFilename: a.originalFilename,
      contentType: a.contentType,
      fileSize: a.fileSize,
      url: a.url ?? null,
      thumbnailUrl: a.thumbnailUrl ?? null,
      width: a.width ?? null,
      height: a.height ?? null,
      messageId: a.messageId,
      createdAt: a.createdAt,
      publicRef: a.publicRef,
      username: a.username,
      displayName: a.displayName ?? a.username,
    })),
    pagination: parsed.pagination,
  };
};

/**
 * Преобразует HTTP-данные для операции decode global search response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeGlobalSearchResponse = (
  input: unknown,
): GlobalSearchResponse => {
  const parsed = decodeOrThrow(
    globalSearchResponseSchema,
    input,
    "chat/global-search",
  );
  return {
    users: parsed.users.map((u) => ({
      publicRef: u.publicRef,
      username: u.username,
      displayName: u.displayName ?? u.username,
      profileImage: u.profileImage ?? null,
      avatarCrop: u.avatarCrop ?? null,
      lastSeen: u.lastSeen ?? null,
    })),
    groups: parsed.groups.map((g) => ({
      roomId: toRoomId(g.roomId),
      name: g.name,
      description: g.description ?? "",
      publicRef: g.publicRef,
      roomTarget: g.roomTarget ?? g.publicRef,
      memberCount: g.memberCount ?? 0,
      isPublic: g.isPublic ?? false,
    })),
    messages: parsed.messages.map((m) => ({
      id: m.id,
      publicRef: m.publicRef,
      username: m.username,
      displayName: m.displayName ?? m.username,
      content: m.content,
      createdAt: m.createdAt,
      roomId: toRoomId(m.roomId),
      roomName: m.roomName ?? "",
      roomKind: m.roomKind ?? "public",
      roomTarget: m.roomTarget ?? null,
    })),
  };
};
