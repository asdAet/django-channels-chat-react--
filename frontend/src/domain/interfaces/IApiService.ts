import type { SendFriendRequestResponse } from "../../dto/http/friends";
import type {
  BlockedUser,
  Friend,
  FriendRequest,
} from "../../entities/friend/types";
import type {
  BannedMember,
  Group,
  GroupInvite,
  GroupListItem,
  GroupMember,
  InvitePreview,
  JoinRequest,
  PinnedMessage,
} from "../../entities/group/types";
import type { Attachment, Message } from "../../entities/message/types";
import type {
  MemberRoles,
  MyPermissions,
  PermissionOverride,
  Role,
} from "../../entities/role/types";
import type {
  DirectChatListItem,
  RoomDetails,
  RoomKind,
  RoomPeer,
} from "../../entities/room/types";
import type { UserProfile } from "../../entities/user/types";
import type { AvatarCrop } from "../../shared/api/users";

/**
 * Описывает структуру данных `UpdateProfileInput`.
 */
export type UpdateProfileInput = {
  name?: string;
  username?: string;
  image?: File | null;
  avatarCrop?: AvatarCrop | null;
  bio?: string;
};

/**
 * Описывает структуру ответа API `SessionResponse`.
 */
export type SessionResponse = {
  authenticated: boolean;
  user: UserProfile | null;
  wsAuthToken: string | null;
};

/**
 * Описывает структуру данных `UpdateGroupInput`.
 */
export type UpdateGroupInput = Partial<{
  name: string;
  description: string;
  isPublic: boolean;
  username: string | null;
  slowModeSeconds: number;
  joinApprovalRequired: boolean;
}> & {
  avatar?: File | null;
  avatarCrop?: AvatarCrop | null;
  avatarAction?: "remove";
};

/**
 * Описывает структуру ответа API `RoomMessagesResponse`.
 */
export type RoomMessagesResponse = {
  messages: Message[];
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

export type ChatResolveTargetKind = "direct" | "group" | "public";

export type ChatResolveResult = {
  targetKind: ChatResolveTargetKind;
  roomId: number;
  roomKind: RoomKind;
  resolvedTarget: string;
  peer?: RoomPeer;
  room?: RoomDetails;
};

/**
 * Описывает структуру ответа API `DirectChatsResponse`.
 */
export type DirectChatsResponse = {
  items: DirectChatListItem[];
};

/**
 * Описывает параметры конфигурации `ClientRuntimeConfig`.
 */
export type ClientRuntimeConfig = {
  usernameMaxLength: number;
  chatMessageMaxLength: number;
  chatTargetRegex: string;
  chatAttachmentMaxSizeMb: number;
  chatAttachmentMaxPerMessage: number;
  chatAttachmentAllowedTypes: string[];
  mediaUrlTtlSeconds: number;
  mediaMode: "signed_only";
  googleOAuthClientId: string;
};

/**
 * Интерфейс IApiService задает публичный контракт модуля.
 */
export interface IApiService {
    /**
     * Гарантирует csrf.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
ensureCsrf(): Promise<{ csrfToken: string }>;

    /**
     * Гарантирует presence session.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
ensurePresenceSession(): Promise<{ ok: boolean; wsAuthToken: string | null }>;

    /**
     * Возвращает client config.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getClientConfig(): Promise<ClientRuntimeConfig>;

    /**
     * Возвращает session.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getSession(): Promise<SessionResponse>;

    /**
     * Обрабатывает login.
     * @param identifier Идентификатор сущности, с которой выполняется операция.
     * @param password Пароль пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
login(identifier: string, password: string): Promise<SessionResponse>;

    /**
     * Обрабатывает oauth google.
     * @param token Токен аутентификации.
     * @param tokenType Тип токена аутентификации.
     * @param username Имя пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
oauthGoogle(
    token: string,
    tokenType?: "idToken" | "accessToken",
    username?: string,
  ): Promise<SessionResponse>;

    /**
     * Обрабатывает register.
     * @param login Аргумент `login` текущего вызова.
     * @param password Пароль пользователя.
     * @param passwordConfirm Аргумент `passwordConfirm` текущего вызова.
     * @param name Имя параметра или ключа, который используется в операции.
     * @param username Имя пользователя.
     * @param email Email пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
register(
    login: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username?: string,
    email?: string,
  ): Promise<SessionResponse>;

    /**
     * Возвращает password rules.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getPasswordRules(): Promise<{ rules: string[] }>;

    /**
     * Обрабатывает logout.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
logout(): Promise<{ ok: boolean }>;

    /**
     * Обновляет profile.
     * @param fields Набор полей для обновления.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
updateProfile(fields: UpdateProfileInput): Promise<{ user: UserProfile }>;

    /**
     * Разрешает prefixless chat target в конкретную комнату.
     * @param target Внешний адрес чата: public, @username, public id или group publicRef.
     * @returns Промис с данными разрешения target.
     */
resolveChatTarget(target: string): Promise<ChatResolveResult>;

    /**
     * Возвращает room details.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getRoomDetails(roomId: string): Promise<RoomDetails>;

    /**
   * Возвращает комнаты сообщений.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getRoomMessages(
    roomId: string,
    params?: { limit?: number; beforeId?: number },
  ): Promise<RoomMessagesResponse>;

    /**
     * Возвращает direct chats.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getDirectChats(): Promise<DirectChatsResponse>;

    /**
     * Возвращает user profile.
     * @param publicRef Публичный идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getUserProfile(publicRef: string): Promise<{ user: UserProfile }>;

    /**
     * Возвращает exact readers конкретного сообщения.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getMessageReaders(
    roomId: string,
    messageId: number,
  ): Promise<MessageReadersResult>;

    /**
     * Обрабатывает edit message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param content Текст сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
editMessage(
    roomId: string,
    messageId: number,
    content: string,
  ): Promise<EditMessageResult>;

    /**
     * Удаляет message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
deleteMessage(roomId: string, messageId: number): Promise<void>;

    /**
     * Добавляет reaction.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param emoji Эмодзи реакции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
addReaction(
    roomId: string,
    messageId: number,
    emoji: string,
  ): Promise<ReactionResult>;

    /**
     * Удаляет reaction.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param emoji Эмодзи реакции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
removeReaction(roomId: string, messageId: number, emoji: string): Promise<void>;

    /**
     * Обрабатывает search messages.
     * @param roomId Идентификатор комнаты.
     * @param query Поисковый запрос.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
searchMessages(roomId: string, query: string): Promise<SearchResult>;

    /**
     * Обрабатывает upload attachments.
     * @param roomId Идентификатор комнаты.
     * @param files Список файлов для загрузки.
     * @param options Опциональные параметры поведения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
uploadAttachments(
    roomId: string,
    files: File[],
    options?: UploadAttachmentsOptions,
  ): Promise<UploadResult>;

    /**
     * Обрабатывает mark read.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
markRead(roomId: string, messageId?: number): Promise<ReadStateResult>;

  // --- Phase 4: Friends ---
    /**
     * Возвращает friends.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getFriends(): Promise<Friend[]>;
    /**
     * Обрабатывает send friend request.
     * @param publicRef Публичный идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
sendFriendRequest(publicRef: string): Promise<SendFriendRequestResponse>;
    /**
     * Возвращает incoming requests.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getIncomingRequests(): Promise<FriendRequest[]>;
    /**
     * Возвращает outgoing requests.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getOutgoingRequests(): Promise<FriendRequest[]>;
    /**
     * Обрабатывает accept friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
acceptFriendRequest(friendshipId: number): Promise<void>;
    /**
     * Обрабатывает decline friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
declineFriendRequest(friendshipId: number): Promise<void>;
    /**
     * Проверяет условие cancel outgoing friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
cancelOutgoingFriendRequest(friendshipId: number): Promise<void>;
    /**
     * Удаляет friend.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
removeFriend(userId: number): Promise<void>;
    /**
     * Обрабатывает block user.
     * @param publicRef Публичный идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
blockUser(publicRef: string): Promise<void>;
    /**
     * Обрабатывает unblock user.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
unblockUser(userId: number): Promise<void>;
    /**
     * Возвращает blocked users.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getBlockedUsers(): Promise<BlockedUser[]>;

  // --- Phase 5: Groups ---
    /**
   * Создаёт группы.
   *
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
createGroup(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string | null;
  }): Promise<Group>;
    /**
   * Возвращает public групп.
   *
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getPublicGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{
    items: GroupListItem[];
    total: number;
    pagination: {
      limit: number;
      hasMore: boolean;
      nextBefore: number | null;
    };
  }>;
    /**
   * Возвращает my групп.
   *
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getMyGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{
    items: GroupListItem[];
    total: number;
    pagination: {
      limit: number;
      hasMore: boolean;
      nextBefore: number | null;
    };
  }>;
    /**
     * Возвращает group details.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getGroupDetails(roomId: string): Promise<Group>;
    /**
     * Обновляет group.
     * @param roomId Идентификатор комнаты.
     * @param data Входные данные операции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
updateGroup(roomId: string, data: UpdateGroupInput): Promise<Group>;
    /**
     * Удаляет group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
deleteGroup(roomId: string): Promise<void>;
    /**
     * Обрабатывает join group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
joinGroup(roomId: string): Promise<void>;
    /**
     * Обрабатывает leave group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
leaveGroup(roomId: string): Promise<void>;
    /**
   * Возвращает группы участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getGroupMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{
    items: GroupMember[];
    total: number;
    pagination: {
      limit: number;
      hasMore: boolean;
      nextBefore: number | null;
    };
  }>;
    /**
     * Обрабатывает kick member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
kickMember(roomId: string, userId: number): Promise<void>;
    /**
     * Обрабатывает ban member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param reason Причина административного действия.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
banMember(roomId: string, userId: number, reason?: string): Promise<void>;
    /**
     * Обрабатывает unban member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
unbanMember(roomId: string, userId: number): Promise<void>;
    /**
     * Обрабатывает mute member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param durationSeconds Длительность действия в секундах.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
muteMember(
    roomId: string,
    userId: number,
    durationSeconds?: number,
  ): Promise<void>;
    /**
     * Обрабатывает unmute member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
unmuteMember(roomId: string, userId: number): Promise<void>;
    /**
   * Возвращает заблокированные участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getBannedMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{
    items: BannedMember[];
    total: number;
    pagination: {
      limit: number;
      hasMore: boolean;
      nextBefore: number | null;
    };
  }>;
    /**
   * Создаёт приглашение.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
createInvite(
    roomId: string,
    data?: { maxUses?: number; expiresInHours?: number },
  ): Promise<GroupInvite>;
    /**
     * Возвращает invites.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getInvites(roomId: string): Promise<GroupInvite[]>;
    /**
     * Обрабатывает revoke invite.
     * @param roomId Идентификатор комнаты.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
revokeInvite(roomId: string, code: string): Promise<void>;
    /**
     * Возвращает invite preview.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getInvitePreview(code: string): Promise<InvitePreview>;
    /**
     * Обрабатывает join via invite.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
joinViaInvite(
    code: string,
  ): Promise<{ roomId: number; groupPublicRef?: string | null }>;
    /**
     * Возвращает join requests.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getJoinRequests(roomId: string): Promise<JoinRequest[]>;
    /**
     * Обрабатывает approve join request.
     * @param roomId Идентификатор комнаты.
     * @param requestId Идентификатор заявки.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
approveJoinRequest(roomId: string, requestId: number): Promise<void>;
    /**
     * Обрабатывает reject join request.
     * @param roomId Идентификатор комнаты.
     * @param requestId Идентификатор заявки.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
rejectJoinRequest(roomId: string, requestId: number): Promise<void>;
    /**
     * Возвращает pinned messages.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getPinnedMessages(roomId: string): Promise<PinnedMessage[]>;
    /**
     * Обрабатывает pin message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
pinMessage(roomId: string, messageId: number): Promise<void>;
    /**
     * Обрабатывает unpin message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
unpinMessage(roomId: string, messageId: number): Promise<void>;
    /**
     * Обрабатывает transfer ownership.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
transferOwnership(roomId: string, userId: number): Promise<void>;

  // --- Phase 6: Roles & Permissions ---
    /**
     * Возвращает room roles.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getRoomRoles(roomId: string): Promise<Role[]>;
    /**
   * Создаёт комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
createRoomRole(
    roomId: string,
    data: { name: string; color?: string; permissions?: number },
  ): Promise<Role>;
    /**
   * Обновляет комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param roleId Идентификатор роли.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
updateRoomRole(
    roomId: string,
    roleId: number,
    data: Partial<{
      name: string;
      color: string;
      permissions: number;
      position: number;
    }>,
  ): Promise<Role>;
    /**
     * Удаляет room role.
     * @param roomId Идентификатор комнаты.
     * @param roleId Идентификатор роли.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
deleteRoomRole(roomId: string, roleId: number): Promise<void>;
    /**
     * Возвращает member roles.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getMemberRoles(roomId: string, userId: number): Promise<MemberRoles>;
    /**
     * Устанавливает member roles.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param roleIds Список идентификаторов ролей.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
setMemberRoles(
    roomId: string,
    userId: number,
    roleIds: number[],
  ): Promise<MemberRoles>;
    /**
     * Возвращает room overrides.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getRoomOverrides(roomId: string): Promise<PermissionOverride[]>;
    /**
   * Создаёт комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
createRoomOverride(
    roomId: string,
    data: {
      targetRoleId?: number;
      targetUserId?: number;
      allow?: number;
      deny?: number;
    },
  ): Promise<PermissionOverride>;
    /**
   * Обновляет комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param overrideId Идентификатор переопределения прав.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
updateRoomOverride(
    roomId: string,
    overrideId: number,
    data: Partial<{ allow: number; deny: number }>,
  ): Promise<PermissionOverride>;
    /**
     * Удаляет room override.
     * @param roomId Идентификатор комнаты.
     * @param overrideId Идентификатор переопределения прав.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
deleteRoomOverride(roomId: string, overrideId: number): Promise<void>;
    /**
     * Возвращает my permissions.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
getMyPermissions(roomId: string): Promise<MyPermissions>;

    /**
   * Выполняет поиск.
   *
   * @param query Поисковый запрос.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
globalSearch(
    query: string,
    params?: {
      usersLimit?: number;
      groupsLimit?: number;
      messagesLimit?: number;
    },
  ): Promise<GlobalSearchResult>;

    /**
   * Возвращает комнаты вложения.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
getRoomAttachments(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<RoomAttachmentsResult>;
}

/**
 * Описывает результат операции `EditMessage`.
 */
export type EditMessageResult = {
  id: number;
  content: string;
  editedAt: string;
};
/**
 * Описывает результат операции `Reaction`.
 */
export type ReactionResult = {
  messageId: number;
  emoji: string;
  userId: number;
  publicRef: string;
  username: string;
};
/**
 * Описывает структуру данных `SearchResultItem`.
 */
export type SearchResultItem = {
  id: number;
  publicRef: string;
  username: string;
  displayName?: string;
  content: string;
  createdAt: string;
  highlight: string | null;
};
/**
 * Описывает результат операции `Search`.
 */
export type SearchResult = {
  results: SearchResultItem[];
  pagination?: { limit: number; hasMore: boolean; nextBefore: number | null };
};
/**
 * Описывает результат операции `Upload`.
 */
export type UploadResult = {
  id: number;
  content: string;
  attachments: Attachment[];
};
export type UploadProgressPhase = "uploading" | "processing";
export type UploadProgress = {
  phase: UploadProgressPhase;
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
};
/**
 * Описывает результат операции `ReadState`.
 */
export type ReadStateResult = {
  roomId: number;
  lastReadMessageId: number | null;
  lastReadAt?: string | null;
};
/**
 * Описывает одного reader для конкретного сообщения.
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
 * Описывает результат загрузки readers конкретного сообщения.
 */
export type MessageReadersResult = {
  roomKind: RoomKind;
  messageId: number;
  readAt: string | null;
  readers: MessageReaderItem[];
};

/**
 * Описывает настраиваемые опции `UploadAttachments`.
 */
export type UploadAttachmentsOptions = {
  onProgress?: (progress: UploadProgress) => void;
  messageContent?: string;
  replyTo?: number | null;
  signal?: AbortSignal;
};

/**
 * Описывает структуру данных `RoomAttachmentItem`.
 */
export type RoomAttachmentItem = Attachment & {
  messageId: number;
  createdAt: string;
  publicRef: string;
  username: string;
  displayName?: string;
};

/**
 * Описывает результат операции `RoomAttachments`.
 */
export type RoomAttachmentsResult = {
  items: RoomAttachmentItem[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

/**
 * Описывает структуру данных `GlobalSearchUser`.
 */
export type GlobalSearchUser = {
  publicRef: string;
  username: string;
  displayName?: string;
  profileImage: string | null;
  avatarCrop: AvatarCrop | null;
  lastSeen: string | null;
};

/**
 * Описывает структуру данных `GlobalSearchGroup`.
 */
export type GlobalSearchGroup = {
  roomId: number;
  name: string;
  description: string;
  publicRef: string;
  roomTarget: string;
  memberCount: number;
  isPublic: boolean;
};

/**
 * Описывает структуру данных `GlobalSearchMessage`.
 */
export type GlobalSearchMessage = {
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
};

/**
 * Описывает результат операции `GlobalSearch`.
 */
export type GlobalSearchResult = {
  users: GlobalSearchUser[];
  groups: GlobalSearchGroup[];
  messages: GlobalSearchMessage[];
};
