import { z } from "zod";

import type {
  BlockedUser,
  Friend,
  FriendRequest,
} from "../../entities/friend/types";
import { decodeOrThrow } from "../core/codec";

// Backend returns: { id, user: { id, username }, created_at }
const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const userBriefSchema = z
  .object({
    id: z.number(),
    publicRef: z.string().min(1),
    username: z.string(),
    displayName: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
  })
  .passthrough();

const friendshipSchema = z
  .object({
    id: z.number(),
    user: userBriefSchema,
    created_at: z.string(),
  })
  .passthrough();

const friendListSchema = z
  .object({ items: z.array(friendshipSchema) })
  .passthrough();
const requestListSchema = z
  .object({ items: z.array(friendshipSchema) })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции map friend.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapFriend = (dto: z.infer<typeof friendshipSchema>): Friend => ({
  id: dto.id,
  userId: dto.user.id,
  publicRef: dto.user.publicRef,
  username: dto.user.username,
  displayName: dto.user.displayName ?? dto.user.username,
  profileImage: dto.user.profileImage ?? null,
  avatarCrop: dto.user.avatarCrop ?? null,
  lastSeen: null,
});

/**
 * Преобразует HTTP-данные для операции map incoming request.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapIncomingRequest = (
  dto: z.infer<typeof friendshipSchema>,
): FriendRequest => ({
  id: dto.id,
  userId: dto.user.id,
  publicRef: dto.user.publicRef,
  username: dto.user.username,
  displayName: dto.user.displayName ?? dto.user.username,
  profileImage: dto.user.profileImage ?? null,
  avatarCrop: dto.user.avatarCrop ?? null,
  createdAt: dto.created_at,
});

/**
 * Преобразует HTTP-данные для операции map outgoing request.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapOutgoingRequest = (
  dto: z.infer<typeof friendshipSchema>,
): FriendRequest => ({
  id: dto.id,
  userId: dto.user.id,
  publicRef: dto.user.publicRef,
  username: dto.user.username,
  displayName: dto.user.displayName ?? dto.user.username,
  profileImage: dto.user.profileImage ?? null,
  avatarCrop: dto.user.avatarCrop ?? null,
  createdAt: dto.created_at,
});

/**
 * Преобразует HTTP-данные для операции decode friends list response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeFriendsListResponse = (input: unknown): Friend[] => {
  const parsed = decodeOrThrow(friendListSchema, input, "friends/list");
  return parsed.items.map(mapFriend);
};

/**
 * Преобразует HTTP-данные для операции decode incoming requests response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeIncomingRequestsResponse = (
  input: unknown,
): FriendRequest[] => {
  const parsed = decodeOrThrow(requestListSchema, input, "friends/incoming");
  return parsed.items.map(mapIncomingRequest);
};

/**
 * Преобразует HTTP-данные для операции decode outgoing requests response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeOutgoingRequestsResponse = (
  input: unknown,
): FriendRequest[] => {
  const parsed = decodeOrThrow(requestListSchema, input, "friends/outgoing");
  return parsed.items.map(mapOutgoingRequest);
};

const sendRequestResponseSchema = z
  .object({
    item: z
      .object({
        id: z.number(),
        user: userBriefSchema.optional(),
        created_at: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Описывает структуру ответа API `SendFriendRequestResponse`.
 */
export type SendFriendRequestResponse = {
  id: number;
  status: string;
};

/**
 * Преобразует HTTP-данные для операции decode send friend request response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeSendFriendRequestResponse = (
  input: unknown,
): SendFriendRequestResponse => {
  const parsed = decodeOrThrow(
    sendRequestResponseSchema,
    input,
    "friends/send-request",
  );
  return { id: parsed.item.id, status: "pending" };
};

const blockResponseSchema = z
  .object({
    item: z.object({ id: z.number(), status: z.string() }).passthrough(),
  })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции decode block response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeBlockResponse = (input: unknown): BlockedUser => {
  const parsed = decodeOrThrow(blockResponseSchema, input, "friends/block");
  return {
    id: parsed.item.id,
    userId: 0,
    publicRef: "",
    username: "",
    displayName: "",
    profileImage: null,
    avatarCrop: null,
  };
};

const blockedListSchema = z
  .object({ items: z.array(friendshipSchema) })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции map blocked user.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapBlockedUser = (
  dto: z.infer<typeof friendshipSchema>,
): BlockedUser => ({
  id: dto.id,
  userId: dto.user.id,
  publicRef: dto.user.publicRef,
  username: dto.user.username,
  displayName: dto.user.displayName ?? dto.user.username,
  profileImage: dto.user.profileImage ?? null,
  avatarCrop: dto.user.avatarCrop ?? null,
});

/**
 * Преобразует HTTP-данные для операции decode blocked list response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeBlockedListResponse = (input: unknown): BlockedUser[] => {
  const parsed = decodeOrThrow(blockedListSchema, input, "friends/blocked");
  return parsed.items.map(mapBlockedUser);
};
