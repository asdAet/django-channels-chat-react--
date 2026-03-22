# Frontend Reference

Generated: 2026-03-22T02:06:48Z

Total modules: 257

## `frontend/src/adapters/apiService/acceptFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function acceptFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции accept friend request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param friendshipId Идентификатор связи дружбы. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/addReaction.ts`

- Top-level declarations: 1

### Declarations

- `export async function addReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<ReactionResult> {`
  - Р”РѕР±Р°РІР»СЏРµС‚ reaction. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param messageId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ. @param emoji Р­РјРѕРґР·Рё СЂРµР°РєС†РёРё. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/approveJoinRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function approveJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции approve join request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param requestId Идентификатор заявки. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/banMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function banMember( apiClient: AxiosInstance, roomId: string, userId: number, reason?: string, ): Promise<void> {`
  - Выполняет API-запрос для операции ban member. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @param reason Причина административного действия. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/blockUser.ts`

- Top-level declarations: 1

### Declarations

- `export async function blockUser( apiClient: AxiosInstance, publicRef: string, ): Promise<void> {`
  - Выполняет API-запрос для операции block user. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param publicRef Публичный идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/cancelOutgoingFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function cancelOutgoingFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`
  - Проверяет условие cancel outgoing friend request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param friendshipId Идентификатор связи дружбы. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/createGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function createGroup( apiClient: AxiosInstance, data: { name: string; description?: string; isPublic?: boolean; username?: string | null; }, ): Promise<Group> {`
  - Асинхронно создаёт группы. @param apiClient HTTP-клиент для выполнения API-запросов. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/createInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function createInvite( apiClient: AxiosInstance, roomId: string, data?: { maxUses?: number; expiresInHours?: number }, ): Promise<GroupInvite> {`
  - Асинхронно создаёт приглашение. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/createRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function createRoomOverride( apiClient: AxiosInstance, roomId: string, data: { targetRoleId?: number; targetUserId?: number; allow?: number; deny?: number; }, ): Promise<PermissionOverride> {`
  - Асинхронно создаёт комнаты override. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/createRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function createRoomRole( apiClient: AxiosInstance, roomId: string, data: { name: string; color?: string; permissions?: number }, ): Promise<Role> {`
  - Асинхронно создаёт комнаты роли. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/declineFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function declineFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции decline friend request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param friendshipId Идентификатор связи дружбы. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/deleteGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`
  - Удаляет group. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/deleteMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`
  - РЈРґР°Р»СЏРµС‚ message. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param messageId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/deleteRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, ): Promise<void> {`
  - Удаляет room override. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param overrideId Идентификатор переопределения прав. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/deleteRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, ): Promise<void> {`
  - Удаляет room role. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param roleId Идентификатор роли. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/editMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function editMessage( apiClient: AxiosInstance, roomId: string, messageId: number, content: string, ): Promise<EditMessageResult> {`
  - Выполняет API-запрос для операции edit message. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param messageId Идентификатор сообщения. @param content Текст сообщения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/ensureCsrf.ts`

- Top-level declarations: 1

### Declarations

- `export async function ensureCsrf( apiClient: AxiosInstance, ): Promise<{ csrfToken: string }> {`
  - Гарантирует csrf. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/ensurePresenceSession.ts`

- Top-level declarations: 1

### Declarations

- `export async function ensurePresenceSession( apiClient: AxiosInstance, ): Promise<{ ok: boolean }> {`
  - Гарантирует presence session. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getBannedMembers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getBannedMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<BannedMembersResult> {`
  - Асинхронно возвращает заблокированные участников. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param params Параметры запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getBlockedUsers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getBlockedUsers( apiClient: AxiosInstance, ): Promise<BlockedUser[]> {`
  - Возвращает blocked users. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getClientConfig.ts`

- Top-level declarations: 1

### Declarations

- `export const getClientConfig = async (apiClient: AxiosInstance) => {`
  - Возвращает client config. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.

## `frontend/src/adapters/apiService/getDirectChats.ts`

- Top-level declarations: 1

### Declarations

- `export const getDirectChats = async ( apiClient: AxiosInstance, ): Promise<DirectChatsResponse> => {`
  - Возвращает direct chats. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getFriends.ts`

- Top-level declarations: 1

### Declarations

- `export async function getFriends(apiClient: AxiosInstance): Promise<Friend[]> {`
  - Возвращает friends. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getGroupDetails.ts`

- Top-level declarations: 1

### Declarations

- `export async function getGroupDetails( apiClient: AxiosInstance, roomId: string, ): Promise<Group> {`
  - Возвращает group details. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getGroupMembers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getGroupMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<GroupMembersResult> {`
  - Асинхронно возвращает группы участников. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param params Параметры запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getIncomingRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getIncomingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`
  - Возвращает incoming requests. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getInvitePreview.ts`

- Top-level declarations: 1

### Declarations

- `export async function getInvitePreview( apiClient: AxiosInstance, code: string, ): Promise<InvitePreview> {`
  - Возвращает invite preview. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param code Код приглашения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getInvites.ts`

- Top-level declarations: 1

### Declarations

- `export async function getInvites( apiClient: AxiosInstance, roomId: string, ): Promise<GroupInvite[]> {`
  - Возвращает invites. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getJoinRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getJoinRequests( apiClient: AxiosInstance, roomId: string, ): Promise<JoinRequest[]> {`
  - Возвращает join requests. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getMemberRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<MemberRoles> {`
  - Возвращает member roles. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getMessageReaders.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMessageReaders( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<MessageReadersResult> {`
  - Р’С‹РїРѕР»РЅСЏРµС‚ API-Р·Р°РїСЂРѕСЃ РґР»СЏ Р·Р°РіСЂСѓР·РєРё readers РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param messageId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/getMyGroups.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMyGroups( apiClient: AxiosInstance, params?: { search?: string; limit?: number; before?: number }, ): Promise<{`
  - Асинхронно возвращает my групп. @param apiClient HTTP-клиент для выполнения API-запросов. @param params Параметры запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getMyPermissions.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMyPermissions( apiClient: AxiosInstance, roomId: string, ): Promise<MyPermissions> {`
  - Р’РѕР·РІСЂР°С‰Р°РµС‚ my permissions. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/getOutgoingRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getOutgoingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`
  - Возвращает outgoing requests. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getPasswordRules.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPasswordRules( apiClient: AxiosInstance, ): Promise<{ rules: string[] }> {`
  - Возвращает password rules. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getPinnedMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPinnedMessages( apiClient: AxiosInstance, roomId: string, ): Promise<PinnedMessage[]> {`
  - Возвращает pinned messages. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getPublicGroups.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPublicGroups( apiClient: AxiosInstance, params?: PublicGroupsParams, ): Promise<PublicGroupsResult> {`
  - Возвращает public groups. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param params Параметры запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getRoomAttachments.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomAttachments( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<RoomAttachmentsResult> {`
  - РђСЃРёРЅС…СЂРѕРЅРЅРѕ РІРѕР·РІСЂР°С‰Р°РµС‚ РєРѕРјРЅР°С‚С‹ РІР»РѕР¶РµРЅРёСЏ. @param apiClient HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ API-Р·Р°РїСЂРѕСЃРѕРІ. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param params РџР°СЂР°РјРµС‚СЂС‹ Р·Р°РїСЂРѕСЃР°. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/getRoomDetails.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomDetails( apiClient: AxiosInstance, roomTarget: string, ): Promise<RoomDetails> {`
  - Возвращает room details. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomRef Текстовая ссылка или числовой идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getRoomMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomMessages( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; beforeId?: number }, ): Promise<RoomMessagesResponse> {`
  - РђСЃРёРЅС…СЂРѕРЅРЅРѕ РІРѕР·РІСЂР°С‰Р°РµС‚ РєРѕРјРЅР°С‚С‹ СЃРѕРѕР±С‰РµРЅРёР№. @param apiClient HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ API-Р·Р°РїСЂРѕСЃРѕРІ. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param params РџР°СЂР°РјРµС‚СЂС‹ Р·Р°РїСЂРѕСЃР°. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/getRoomOverrides.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomOverrides( apiClient: AxiosInstance, roomId: string, ): Promise<PermissionOverride[]> {`
  - Возвращает room overrides. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getRoomRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomRoles( apiClient: AxiosInstance, roomId: string, ): Promise<Role[]> {`
  - Возвращает room roles. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getSession.ts`

- Top-level declarations: 1

### Declarations

- `export async function getSession( apiClient: AxiosInstance, ): Promise<SessionResponse> {`
  - Возвращает session. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getUnreadCounts.ts`

- Top-level declarations: 1

### Declarations

- `export async function getUnreadCounts( apiClient: AxiosInstance, ): Promise<UnreadCountItem[]> {`
  - Возвращает unread counts. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/getUserProfile.ts`

- Top-level declarations: 1

### Declarations

- `export async function getUserProfile( apiClient: AxiosInstance, ref: string, ): Promise<{ user: UserProfile }> {`
  - Возвращает user profile. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param ref Аргумент `ref` текущего вызова. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/globalSearch.ts`

- Top-level declarations: 1

### Declarations

- `export async function globalSearch( apiClient: AxiosInstance, query: string, params?: { usersLimit?: number; groupsLimit?: number; messagesLimit?: number; }, ): Promise<GlobalSearchResult> {`
  - Асинхронно выполняет поиск. @param apiClient HTTP-клиент для выполнения API-запросов. @param query Поисковый запрос. @param params Параметры запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/joinGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function joinGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`
  - Выполняет API-запрос для операции join group. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/joinViaInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function joinViaInvite( apiClient: AxiosInstance, code: string, ): Promise<{ roomId: number; groupPublicRef?: string | null }> {`
  - Выполняет API-запрос для операции join via invite. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param code Код приглашения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/kickMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function kickMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции kick member. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/leaveGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function leaveGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`
  - Выполняет API-запрос для операции leave group. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/login.ts`

- Top-level declarations: 1

### Declarations

- `export async function login( apiClient: AxiosInstance, identifier: string, password: string, ): Promise<SessionResponse> {`
  - Выполняет API-запрос для операции login. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param identifier Идентификатор сущности, с которой выполняется операция. @param password Пароль пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/logout.ts`

- Top-level declarations: 1

### Declarations

- `export async function logout( apiClient: AxiosInstance, ): Promise<{ ok: boolean }> {`
  - Выполняет API-запрос для операции logout. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/markRead.ts`

- Top-level declarations: 1

### Declarations

- `export async function markRead( apiClient: AxiosInstance, roomId: string, messageId?: number, ): Promise<ReadStateResult> {`
  - Р’С‹РїРѕР»РЅСЏРµС‚ API-Р·Р°РїСЂРѕСЃ РґР»СЏ РѕРїРµСЂР°С†РёРё mark read. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param messageId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/muteMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function muteMember( apiClient: AxiosInstance, roomId: string, userId: number, durationSeconds = 3600, ): Promise<void> {`
  - Выполняет API-запрос для операции mute member. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @param durationSeconds Длительность действия в секундах. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/oauthGoogle.ts`

- Top-level declarations: 1

### Declarations

- `export async function oauthGoogle( apiClient: AxiosInstance, token: string, tokenType: "idToken" | "accessToken" = "idToken", username?: string, ): Promise<SessionResponse> {`
  - Выполняет API-запрос для операции oauth google. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param token Токен аутентификации. @param tokenType Тип токена аутентификации. @param username Имя пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/pinMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function pinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции pin message. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param messageId Идентификатор сообщения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/register.ts`

- Top-level declarations: 1

### Declarations

- `export async function register( apiClient: AxiosInstance, login: string, password: string, passwordConfirm: string, name: string, username?: string, email?: string, ): Promise<SessionResponse> {`
  - Выполняет API-запрос для операции register. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param login Аргумент `login` текущего вызова. @param password Пароль пользователя. @param passwordConfirm Аргумент `passwordConfirm` текущего вызова. @param name Имя параметра или ключа, который используется в операции. @param username Имя пользователя. @param email Email пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/rejectJoinRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function rejectJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции reject join request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param requestId Идентификатор заявки. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/removeFriend.ts`

- Top-level declarations: 1

### Declarations

- `export async function removeFriend( apiClient: AxiosInstance, userId: number, ): Promise<void> {`
  - Удаляет friend. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/removeReaction.ts`

- Top-level declarations: 1

### Declarations

- `export async function removeReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<void> {`
  - РЈРґР°Р»СЏРµС‚ reaction. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param messageId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ. @param emoji Р­РјРѕРґР·Рё СЂРµР°РєС†РёРё. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/resolveChatTarget.ts`

- Top-level declarations: 1

### Declarations

- `export const resolveChatTarget = async ( apiClient: AxiosInstance, target: string, ): Promise<ChatResolveResult> => {`

## `frontend/src/adapters/apiService/resolveRoomId.ts`

- Top-level declarations: 1

### Declarations

- `export async function resolveRoomId( apiClient: AxiosInstance, roomTarget: string, ): Promise<string> {`

## `frontend/src/adapters/apiService/revokeInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function revokeInvite( apiClient: AxiosInstance, roomId: string, code: string, ): Promise<void> {`
  - Выполняет API-запрос для операции revoke invite. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param code Код приглашения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/searchMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function searchMessages( apiClient: AxiosInstance, roomId: string, query: string, ): Promise<SearchResult> {`
  - Р’С‹РїРѕР»РЅСЏРµС‚ API-Р·Р°РїСЂРѕСЃ РґР»СЏ РѕРїРµСЂР°С†РёРё search messages. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param query РџРѕРёСЃРєРѕРІС‹Р№ Р·Р°РїСЂРѕСЃ. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/apiService/sendFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function sendFriendRequest( apiClient: AxiosInstance, publicRef: string, ): Promise<SendFriendRequestResponse> {`
  - Выполняет API-запрос для операции send friend request. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param publicRef Публичный идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/setMemberRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function setMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, roleIds: number[], ): Promise<MemberRoles> {`
  - Устанавливает member roles. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @param roleIds Список идентификаторов ролей. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/transferOwnership.ts`

- Top-level declarations: 1

### Declarations

- `export async function transferOwnership( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции transfer ownership. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/unbanMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function unbanMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции unban member. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/unblockUser.ts`

- Top-level declarations: 1

### Declarations

- `export async function unblockUser( apiClient: AxiosInstance, userId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции unblock user. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/unmuteMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function unmuteMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции unmute member. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param userId Идентификатор пользователя. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/unpinMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function unpinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`
  - Выполняет API-запрос для операции unpin message. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param messageId Идентификатор сообщения. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/updateGroup.ts`

- Top-level declarations: 2

### Declarations

- `const appendScalar = (formData: FormData, key: string, value: unknown) => {`
  - Выполняет API-запрос для операции append scalar. @param formData Аргумент `formData` текущего вызова. @param key Аргумент `key` текущего вызова. @param value Входное значение для преобразования.
- `export async function updateGroup( apiClient: AxiosInstance, roomId: string, data: UpdateGroupInput, ): Promise<Group> {`
  - Обновляет group. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param roomId Идентификатор комнаты. @param data Входные данные операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/updateProfile.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateProfile( apiClient: AxiosInstance, fields: UpdateProfileInput, ): Promise<{ user: UserProfile }> {`
  - Обновляет profile. @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса. @param fields Набор полей для обновления. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/updateRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, data: Partial<{ allow: number; deny: number }>, ): Promise<PermissionOverride> {`
  - Асинхронно обновляет комнаты override. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param overrideId Идентификатор переопределения прав. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/updateRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, data: Partial<{ name: string; color: string; permissions: number; position: number; }>, ): Promise<Role> {`
  - Асинхронно обновляет комнаты роли. @param apiClient HTTP-клиент для выполнения API-запросов. @param roomId Идентификатор комнаты. @param roleId Идентификатор роли. @param data Данные запроса или полезная нагрузка операции. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/adapters/apiService/uploadAttachments.test.ts`

- Top-level declarations: 0

## `frontend/src/adapters/apiService/uploadAttachments.ts`

- Top-level declarations: 1

### Declarations

- `export async function uploadAttachments( apiClient: AxiosInstance, roomId: string, files: File[], options?: UploadAttachmentsOptions, ): Promise<UploadResult> {`
  - Р’С‹РїРѕР»РЅСЏРµС‚ API-Р·Р°РїСЂРѕСЃ РґР»СЏ РѕРїРµСЂР°С†РёРё upload attachments. @param apiClient РЎРєРѕРЅС„РёРіСѓСЂРёСЂРѕРІР°РЅРЅС‹Р№ HTTP-РєР»РёРµРЅС‚ РґР»СЏ РІС‹РїРѕР»РЅРµРЅРёСЏ Р·Р°РїСЂРѕСЃР°. @param roomId РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РєРѕРјРЅР°С‚С‹. @param files РЎРїРёСЃРѕРє С„Р°Р№Р»РѕРІ РґР»СЏ Р·Р°РіСЂСѓР·РєРё. @param options РћРїС†РёРѕРЅР°Р»СЊРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹ РїРѕРІРµРґРµРЅРёСЏ. @returns РџСЂРѕРјРёСЃ СЃ РґР°РЅРЅС‹РјРё, РІРѕР·РІСЂР°С‰Р°РµРјС‹РјРё СЌС‚РѕР№ С„СѓРЅРєС†РёРµР№.

## `frontend/src/adapters/ApiService.test.ts`

- Top-level declarations: 1

### Declarations

- `const makeResolvePayload = (target: string, roomId: number) => ({`

## `frontend/src/adapters/ApiService.ts`

- Top-level declarations: 7

### Declarations

- `const isHtmlErrorPayload = (payload: string): boolean =>`
  - Определяет, что строка выглядит как HTML-страница ошибки. @param payload Строка ответа от сервера. @returns true, когда в ответе обнаружены HTML-теги документа.
- `const decodeEscapedUnicode = (value: string): string =>`
  - Декодирует escaped unicode-последовательности вида \uXXXX. @param value Исходная строка. @returns Строка после декодирования unicode-последовательностей.
- `const getStatusFallbackMessage = (status: number): string => {`
  - Возвращает fallback-сообщение для HTTP-статуса. @param status HTTP-статус. @returns Сообщение для отображения пользователю.
- `const getCsrfToken = () =>`
  - Возвращает csrf token.
- `export const normalizeAxiosError = (error: unknown): ApiError => {`
  - Нормализует axios error. @param error Объект ошибки, полученный в обработчике. @returns Нормализованное значение после обработки входа.
- `class ApiService implements IApiService {`
  - Класс ApiService инкапсулирует логику текущего слоя приложения.
- `export const apiService = new ApiService();`
  - Экспорт `apiService` предоставляет инициализированный экземпляр для повторного использования в модуле.

## `frontend/src/app/App.tsx`

- Top-level declarations: 15

### Declarations

- `const resolveSeoDescriptor = (pathname: string): SeoDescriptor => {`
  - Возвращает SEO-описание для текущего пути.
- `const matched = MATCHED_ROUTE_SEO.find((item) => item.match(pathname));`
- `const upsertMetaByName = (name: string, content: string) => {`
  - Обновляет или создает meta-тег по имени.
- `const upsertMetaByProperty = (property: string, content: string) => {`
  - Обновляет или создает meta-тег по property.
- `const upsertCanonicalLink = (href: string) => {`
  - Обновляет или создает canonical-ссылку.
- `function AppInner() {`
  - React-компонент AppInner отвечает за отрисовку и обработку UI-сценария.
- `const updateViewportVars = () => {`
  - Обновляет viewport vars.
- `const timerId = window.setTimeout(() => setBanner(null), 4200);`
- `const extractMessage = (err: unknown) => {`
  - Извлекает message. @param err Объект ошибки, полученный в обработчике.
- `const extractAuthMessage = (err: unknown, fallback: string) => {`
  - Извлекает auth message. @param err Объект ошибки, полученный в обработчике. @param fallback Резервное значение на случай ошибки или отсутствия данных.
- `const extractFromData = (data: unknown) => {`
  - Извлекает from data. @param data Входные данные операции.
- `const extractProfileErrors = (err: unknown): ProfileFieldErrors | null => {`
  - Извлекает profile errors. @param err Объект ошибки, полученный в обработчике. @returns Извлеченное значение из входных данных.
- `const handleGoogleOAuth = useCallback(async () => {`
- `const handleLogout = useCallback(async () => {`
- `export function App() {`
  - React-компонент App отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/app/routes.test.tsx`

- Top-level declarations: 0

## `frontend/src/app/routes.tsx`

- Top-level declarations: 4

### Declarations

- `function UserProfileRoute({ user, onNavigate, onLogout, }: Pick<AppRoutesProps, "user" | "onNavigate" | "onLogout">) {`
- `function ChatTargetRoute({ user, onNavigate, }: Pick<AppRoutesProps, "user" | "onNavigate">) {`
- `function InviteRoute({ onNavigate }: Pick<AppRoutesProps, "onNavigate">) {`
- `export function AppRoutes({ user, error, passwordRules, googleAuthDisabledReason, onNavigate, onLogin, onGoogleOAuth, onRegister, onLogout, onProfileSave, }: AppRoutesProps) {`

## `frontend/src/App.tsx`

- Top-level declarations: 0

## `frontend/src/controllers/AuthController.ts`

- Top-level declarations: 2

### Declarations

- `class AuthController {`
  - Класс AuthController инкапсулирует логику текущего слоя приложения.
- `export const authController = new AuthController();`
  - Хранит значение auth controller.

## `frontend/src/controllers/ChatController.test.ts`

- Top-level declarations: 6

### Declarations

- `const apiMocks = vi.hoisted(() => ({`
- `const loadController = async () => {`
  - Загружает экземпляр контроллера для тестового сценария.
- `const resetApiMocks = () => {`
  - Сбрасывает состояния моков API перед каждым тестом.
- `const pending = new Promise<RoomDetailsDto>((res) => {`
- `const pending = new Promise<RoomMessagesDto>((res) => {`
- `const pending = new Promise<DirectChatsResponseDto>((res) => {`

## `frontend/src/controllers/ChatController.ts`

- Top-level declarations: 5

### Declarations

- `const buildRoomMessagesKey = (roomId: string, params?: RoomMessagesParams) => {`
  - Формирует room messages key. @param roomId Идентификатор комнаты. @param params Параметры запроса.
- `class ChatController {`
  - Класс ChatController инкапсулирует логику текущего слоя приложения.
- `const request = apiService.getRoomDetails(roomId).finally(() => {`
- `const request = apiService.getRoomMessages(roomId, params).finally(() => {`
- `export const chatController = new ChatController();`
  - Экспорт `chatController` предоставляет инициализированный экземпляр для повторного использования в модуле.

## `frontend/src/controllers/FriendsController.ts`

- Top-level declarations: 2

### Declarations

- `class FriendsController {`
  - Класс FriendsController инкапсулирует логику текущего слоя приложения.
- `export const friendsController = new FriendsController();`
  - Экспорт `friendsController` предоставляет инициализированный экземпляр для повторного использования в модуле.

## `frontend/src/controllers/GroupController.ts`

- Top-level declarations: 2

### Declarations

- `class GroupController {`
  - Класс GroupController инкапсулирует логику текущего слоя приложения.
- `export const groupController = new GroupController();`
  - Экспорт `groupController` предоставляет инициализированный экземпляр для повторного использования в модуле.

## `frontend/src/controllers/RolesController.ts`

- Top-level declarations: 2

### Declarations

- `class RolesController {`
  - Класс RolesController инкапсулирует логику текущего слоя приложения.
- `export const rolesController = new RolesController();`
  - Хранит значение roles controller.

## `frontend/src/domain/interfaces/IApiService.ts`

- Top-level declarations: 0

## `frontend/src/dto/core/codec.ts`

- Top-level declarations: 5

### Declarations

- `const formatPath = (path: PropertyKey[]) =>`
  - Форматирует path. @param path Путь до поля внутри входной структуры.
- `const formatIssues = (error: z.ZodError): string[] =>`
  - Форматирует issues. @param error Объект ошибки, полученный в обработчике. @returns Строковое значение результата.
- `export const decodeOrThrow = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, source: string, ): z.infer<TSchema> => {`
  - Проверяет входное значение по схеме и бросает DtoDecodeError при невалидном payload. @param schema Схема валидации входных данных. @param input Входные данные для валидации и преобразования. @param source DOM-событие, вызвавшее обработчик. @returns Нормализованные данные после декодирования.
- `export const safeDecode = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, ): z.infer<TSchema> | null => {`
  - Проверяет входное значение по схеме без броска исключения. @param schema Схема валидации входных данных. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const parseJson = (raw: string): unknown | null => {`
  - Разбирает JSON-строку в unknown-объект без падения. @param raw Сырые входные данные до нормализации. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/core/errors.ts`

- Top-level declarations: 1

### Declarations

- `export class DtoDecodeError extends Error {`
  - Класс DtoDecodeError инкапсулирует логику текущего слоя приложения.

## `frontend/src/dto/http/auth.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/auth.ts`

- Top-level declarations: 12

### Declarations

- `export const decodeCsrfResponse = (input: unknown) =>`
  - Декодирует csrf response. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const decodePresenceSessionResponse = (input: unknown) =>`
  - Декодирует presence session response. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const decodePasswordRulesResponse = (input: unknown) =>`
  - Декодирует password rules response. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const decodeLogoutResponse = (input: unknown) =>`
  - Декодирует logout response. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const decodeSessionResponse = (input: unknown): SessionResponseDto => {`
  - Преобразует HTTP-данные для операции decode session response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeProfileEnvelopeResponse = ( input: unknown, ): ProfileEnvelopeDto => {`
  - Преобразует HTTP-данные для операции decode profile envelope response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeAuthErrorPayload = ( input: unknown, ): AuthErrorPayloadDto | null => safeDecode(errorPayloadSchema, input);`
  - Преобразует HTTP-данные для операции decode auth error payload. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const buildLoginRequestDto = (input: unknown): LoginRequestDto =>`
  - Преобразует HTTP-данные для операции build login request dto. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const buildRegisterRequestDto = (input: unknown): RegisterRequestDto =>`
  - Преобразует HTTP-данные для операции build register request dto. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const buildOAuthGoogleRequestDto = ( input: unknown, ): OAuthGoogleRequestDto =>`
  - Преобразует HTTP-данные для операции build oauth google request dto. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const buildUpdateProfileRequestDto = ( input: unknown, ): UpdateProfileRequestDto =>`
  - Преобразует HTTP-данные для операции build update profile request dto. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const validatePublicUsername = (username: string): string =>`
  - Преобразует HTTP-данные для операции validate public username. @param username Имя пользователя. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/http/chat.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/chat.ts`

- Top-level declarations: 16

### Declarations

- `const mapPeer = (dto: z.infer<typeof roomPeerSchema>): RoomPeer => {`
  - Преобразует HTTP-данные для операции map peer. @param dto DTO-объект для декодирования данных. @returns Нормализованные данные после декодирования.
- `const mapMessage = (dto: z.infer<typeof messageSchema>): Message => ({`
  - Преобразует HTTP-данные для операции map message. @param dto DTO-объект для декодирования данных. @returns Нормализованные данные после декодирования.
- `export const decodeRoomDetailsResponse = (input: unknown): RoomDetails => {`
  - Преобразует HTTP-данные для операции decode room details response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeRoomMessagesResponse = (input: unknown): RoomMessagesDto => {`
  - Преобразует HTTP-данные для операции decode room messages response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeChatResolveResponse = ( input: unknown, ): ChatResolveResponseDto => {`
- `export const decodeDirectChatsResponse = ( input: unknown, ): DirectChatsResponseDto => {`
  - Преобразует HTTP-данные для операции decode direct chats response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `const toRoomId = (value: number | string): number => {`
  - Преобразует HTTP-данные для операции to room id. @param value Входное значение для преобразования. @returns Нормализованные данные после декодирования.
- `export const decodeEditMessageResponse = ( input: unknown, ): EditMessageResponse => {`
  - Преобразует HTTP-данные для операции decode edit message response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeReactionResponse = (input: unknown): ReactionResponse => {`
  - Преобразует HTTP-данные для операции decode reaction response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeSearchResponse = (input: unknown): SearchResponse => {`
  - Преобразует HTTP-данные для операции decode search response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeUploadResponse = (input: unknown): UploadResponse => {`
  - Преобразует HTTP-данные для операции decode upload response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeReadStateResponse = (input: unknown): ReadStateResponse => {`
  - Преобразует HTTP-данные для операции decode read state response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeMessageReadersResponse = ( input: unknown, ): MessageReadersResponse => {`
  - Преобразует HTTP-данные для операции decode message readers response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeUnreadCountsResponse = ( input: unknown, ): UnreadCountItem[] => {`
  - Преобразует HTTP-данные для операции decode unread counts response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeRoomAttachmentsResponse = ( input: unknown, ): RoomAttachmentsResponse => {`
  - Преобразует HTTP-данные для операции decode room attachments response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeGlobalSearchResponse = ( input: unknown, ): GlobalSearchResponse => {`
  - Преобразует HTTP-данные для операции decode global search response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/http/friends.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/friends.ts`

- Top-level declarations: 7

### Declarations

- `const mapFriend = (dto: z.infer<typeof friendshipSchema>): Friend => ({`
  - Преобразует HTTP-данные для операции map friend. @param dto DTO-объект для декодирования данных. @returns Нормализованные данные после декодирования.
- `export const decodeFriendsListResponse = (input: unknown): Friend[] => {`
  - Преобразует HTTP-данные для операции decode friends list response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeIncomingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`
  - Преобразует HTTP-данные для операции decode incoming requests response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeOutgoingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`
  - Преобразует HTTP-данные для операции decode outgoing requests response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeSendFriendRequestResponse = ( input: unknown, ): SendFriendRequestResponse => {`
  - Преобразует HTTP-данные для операции decode send friend request response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeBlockResponse = (input: unknown): BlockedUser => {`
  - Преобразует HTTP-данные для операции decode block response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeBlockedListResponse = (input: unknown): BlockedUser[] => {`
  - Преобразует HTTP-данные для операции decode blocked list response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/http/groups.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/groups.ts`

- Top-level declarations: 11

### Declarations

- `const toRoomId = (value: number | string): number => {`
  - Преобразует HTTP-данные для операции to room id. @param value Входное значение для преобразования. @returns Нормализованные данные после декодирования.
- `const mapGroup = (dto: z.infer<typeof groupSchema>): Group => ({`
  - Преобразует HTTP-данные для операции map group. @param dto DTO-объект для декодирования данных. @returns Нормализованные данные после декодирования.
- `export const decodeGroupResponse = (input: unknown): Group =>`
  - Преобразует HTTP-данные для операции decode group response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeGroupListResponse = ( input: unknown, ): {`
  - Декодирует group list response. @returns Нормализованные данные после декодирования.
- `export const decodeGroupMembersResponse = ( input: unknown, ): {`
  - Декодирует group members response. @returns Нормализованные данные после декодирования.
- `export const decodeInvitesResponse = (input: unknown): GroupInvite[] => {`
  - Преобразует HTTP-данные для операции decode invites response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeInviteResponse = (input: unknown): GroupInvite => {`
  - Преобразует HTTP-данные для операции decode invite response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeInvitePreviewResponse = (input: unknown): InvitePreview => {`
  - Преобразует HTTP-данные для операции decode invite preview response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeJoinRequestsResponse = (input: unknown): JoinRequest[] => {`
  - Преобразует HTTP-данные для операции decode join requests response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodePinnedMessagesResponse = ( input: unknown, ): PinnedMessage[] => {`
  - Преобразует HTTP-данные для операции decode pinned messages response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeBannedMembersResponse = ( input: unknown, ): {`
  - Декодирует banned members response. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/http/meta.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/meta.ts`

- Top-level declarations: 1

### Declarations

- `export const decodeClientConfigResponse = ( input: unknown, ): ClientRuntimeConfig =>`
  - Преобразует HTTP-данные для операции decode client config response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/http/roles.ts`

- Top-level declarations: 7

### Declarations

- `const mapRole = (dto: z.infer<typeof roleSchema>): Role => ({`
  - Преобразует HTTP-данные для операции map role. @param dto DTO-объект для декодирования данных. @returns Нормализованные данные после декодирования.
- `export const decodeRolesListResponse = (input: unknown): Role[] => {`
  - Преобразует HTTP-данные для операции decode roles list response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeRoleResponse = (input: unknown): Role => {`
  - Преобразует HTTP-данные для операции decode role response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeMemberRolesResponse = (input: unknown): MemberRoles => {`
  - Преобразует HTTP-данные для операции decode member roles response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeOverridesResponse = ( input: unknown, ): PermissionOverride[] => {`
  - Преобразует HTTP-данные для операции decode overrides response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeOverrideResponse = (input: unknown): PermissionOverride => {`
  - Преобразует HTTP-данные для операции decode override response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.
- `export const decodeMyPermissionsResponse = (input: unknown): MyPermissions => {`
  - Преобразует HTTP-данные для операции decode my permissions response. @param input Входной объект с параметрами операции. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/index.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/route.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/route.ts`

- Top-level declarations: 2

### Declarations

- `export const decodeRoomRefParam = (value: unknown): string | null => {`
  - Декодирует room ref param. @param value Входное значение для преобразования. @returns Строковое значение результата.
- `export const decodePublicRefParam = (value: unknown): string | null => {`
  - Декодирует public ref param. @param value Входное значение для преобразования. @returns Строковое значение результата.

## `frontend/src/dto/input/storage.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/storage.ts`

- Top-level declarations: 6

### Declarations

- `export const readCookieValue = ( cookie: string | null | undefined, name: string, ): string | null => {`
  - Извлекает значение cookie по имени. @param cookie Строка cookie, из которой извлекается значение. @param name Отображаемое имя. @returns Нормализованные данные после декодирования.
- `const chunks = cookie.split(";").map((entry) => entry.trim());`
- `const match = chunks.find((entry) => entry.startsWith(`${cookieName.data}=`));`
- `export const readCsrfFromCookie = (): string | null => {`
  - Читает csrf token из document.cookie в браузере. @returns Нормализованные данные после декодирования.
- `export const readCsrfFromSessionStorage = ( storageKey: string, ): string | null => {`
  - Читает csrf token из sessionStorage. @param storageKey Аргумент `storageKey` текущего вызова. @returns Нормализованные данные после декодирования.
- `export const writeCsrfToSessionStorage = ( storageKey: string, token: string | null, ): void => {`
  - Сохраняет csrf token в sessionStorage. @param storageKey Аргумент `storageKey` текущего вызова. @param token Токен OAuth-провайдера.

## `frontend/src/dto/input/swMessage.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/swMessage.ts`

- Top-level declarations: 2

### Declarations

- `export const encodeSwCacheMessage = (input: unknown): SwCacheMessage => {`
  - Валидирует исходящее сообщение в Service Worker. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.
- `export const decodeSwCacheMessage = (input: unknown): SwCacheMessage | null => {`
  - Безопасно декодирует входящее сообщение в Service Worker. @param input Входные данные для валидации и преобразования. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/ws/chat.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/chat.ts`

- Top-level declarations: 2

### Declarations

- `const toNumberOrNull = (value: unknown): number | null => {`
  - Преобразует WebSocket-данные для операции to number or null. @param value Входное значение для преобразования. @returns Числовое значение результата.
- `export const decodeChatWsEvent = (raw: string): ChatWsEvent => {`
  - Преобразует WebSocket-данные для операции decode chat ws event. @param raw Сырые входные данные до нормализации. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/ws/directInbox.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/directInbox.ts`

- Top-level declarations: 1

### Declarations

- `export const decodeDirectInboxWsEvent = (raw: string): DirectInboxWsEvent => {`
  - Преобразует WebSocket-данные для операции decode direct inbox ws event. @param raw Сырые входные данные до нормализации. @returns Нормализованные данные после декодирования.

## `frontend/src/dto/ws/presence.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/presence.ts`

- Top-level declarations: 2

### Declarations

- `const toGuests = (value: unknown): number | null => {`
  - Преобразует WebSocket-данные для операции to guests. @param value Входное значение для преобразования. @returns Числовое значение результата.
- `export const decodePresenceWsEvent = (raw: string): PresenceWsEvent => {`
  - Преобразует WebSocket-данные для операции decode presence ws event. @param raw Сырые входные данные до нормализации. @returns Нормализованные данные после декодирования.

## `frontend/src/entities/conversation/types.ts`

- Top-level declarations: 0

## `frontend/src/entities/friend/types.ts`

- Top-level declarations: 0

## `frontend/src/entities/group/types.ts`

- Top-level declarations: 0

## `frontend/src/entities/message/types.ts`

- Top-level declarations: 0

## `frontend/src/entities/role/bitmask.ts`

- Top-level declarations: 4

### Declarations

- `const asBigInt = (value: number): bigint => {`
  - Обрабатывает as big int. @param value Входное значение для преобразования. @returns Логический флаг наличия условия.
- `export const hasPermissionFlag = (mask: number, flag: number): boolean => {`
  - Проверяет наличие permission flag. @param mask Битовая маска разрешений. @param flag Флаг разрешения. @returns Логический флаг наличия условия.
- `export const combinePermissionFlags = (flags: Iterable<number>): number => {`
  - Выполняет permission flags. @param flags Набор флагов разрешений.
- `export const flagsFromMask = ( mask: number, flags: readonly number[], ): number[] => flags.filter((flag) => hasPermissionFlag(mask, flag));`
  - Обрабатывает flags from mask. @param mask Битовая маска разрешений. @param flags Набор флагов разрешений. @returns Числовое значение результата.

## `frontend/src/entities/role/types.ts`

- Top-level declarations: 1

### Declarations

- `export const Perm = {`
  - Bitmask flags matching backend roles/permissions.py Perm enum.

## `frontend/src/entities/room/types.ts`

- Top-level declarations: 0

## `frontend/src/entities/user/types.ts`

- Top-level declarations: 0

## `frontend/src/hooks/useAuth.test.ts`

- Top-level declarations: 1

### Declarations

- `const authControllerMock = vi.hoisted(() => ({`

## `frontend/src/hooks/useAuth.ts`

- Top-level declarations: 5

### Declarations

- `const normalizeProfileImage = (user: UserProfileDto): UserProfileDto => {`
  - Нормализует profile image. @param user Текущий пользователь. @returns Нормализованное значение после обработки входа.
- `export const useAuth = () => {`
  - Хук useAuth управляет состоянием и побочными эффектами текущего сценария.
- `const login = useCallback(async (dto: LoginDto) => {`
- `const register = useCallback(async (dto: RegisterDto) => {`
- `const logout = useCallback(async () => {`

## `frontend/src/hooks/useChatRoom.test.ts`

- Top-level declarations: 2

### Declarations

- `const controllerMocks = vi.hoisted(() => ({`
- `const messages = Array.from({ length: 50 }, (_, idx) =>`

## `frontend/src/hooks/useChatRoom.ts`

- Top-level declarations: 13

### Declarations

- `const sanitizeMessage = (message: Message, maxMessageLength: number): Message => ({`
- `const messageKey = (message: Message) => `${message.id}-${message.createdAt}`;`
- `const dedupeMessages = (messages: Message[]) => {`
- `const resolveHasMore = (payload: RoomMessagesDto, fetched: Message[]) => {`
- `const resolveNextBefore = (payload: RoomMessagesDto, fetched: Message[]) => {`
- `const createInitialRoomState = (roomId: string): ChatRoomState => ({`
- `export const useChatRoom = ( roomId: string, user: UserProfileDto | null, initialRoomKind: RoomKind | null = null, ) => {`
- `const loadInitial = useCallback(() => {`
- `const sanitized = payload.messages.map((message) =>`
- `const taskId = window.setTimeout(() => {`
- `const loadMore = useCallback(async () => {`
- `const sanitized = payload.messages.map((message) =>`
- `const sanitized = nextMessages.map((message) =>`

## `frontend/src/hooks/useFriends.ts`

- Top-level declarations: 2

### Declarations

- `export function useFriends(): UseFriendsResult {`
  - Хук useFriends управляет состоянием и побочными эффектами текущего сценария. @returns Публичное состояние хука и его обработчики.
- `const reload = useCallback(async () => {`

## `frontend/src/hooks/useGroupDetails.ts`

- Top-level declarations: 5

### Declarations

- `export function useGroupDetails(roomId: string): UseGroupDetailsResult {`
  - Хук useGroupDetails управляет состоянием и побочными эффектами текущего сценария. @param roomId ????????????? ???????. @returns Публичное состояние хука и его обработчики.
- `const reload = useCallback(async () => {`
- `const deleteGroupCb = useCallback(async () => {`
- `const joinGroupCb = useCallback(async () => {`
- `const leaveGroupCb = useCallback(async () => {`

## `frontend/src/hooks/useGroupList.ts`

- Top-level declarations: 2

### Declarations

- `export function useGroupList(): UseGroupListResult {`
  - Хук useGroupList управляет состоянием и побочными эффектами текущего сценария. @returns Публичное состояние хука и его обработчики.
- `const reload = useCallback(async () => {`

## `frontend/src/hooks/useKeyboardShortcuts.ts`

- Top-level declarations: 2

### Declarations

- `export function useKeyboardShortcuts({ roomId }: Options = {}) {`
  - Хук useKeyboardShortcuts управляет состоянием и побочными эффектами текущего сценария.
- `const handler = (e: KeyboardEvent) => {`
  - Обрабатывает handler. @param e DOM-событие, вызвавшее обработчик.

## `frontend/src/hooks/useOnlineStatus.ts`

- Top-level declarations: 3

### Declarations

- `export const useOnlineStatus = () => {`
  - Хук useOnlineStatus управляет состоянием и побочными эффектами текущего сценария.
- `const handleOnline = () => setOnline(true);`
  - Обрабатывает handle online.
- `const handleOffline = () => setOnline(false);`
  - Обрабатывает handle offline.

## `frontend/src/hooks/usePasswordRules.ts`

- Top-level declarations: 1

### Declarations

- `export const usePasswordRules = (enabled: boolean) => {`
  - Хук usePasswordRules управляет состоянием и побочными эффектами текущего сценария. @param enabled Флаг включения поведения.

## `frontend/src/hooks/useReconnectingWebSocket.test.ts`

- Top-level declarations: 1

### Declarations

- `class MockWebSocket {`
  - Реализует класс MockWebSocket.

## `frontend/src/hooks/useReconnectingWebSocket.ts`

- Top-level declarations: 8

### Declarations

- `export const useReconnectingWebSocket = (options: WebSocketOptions) => {`
  - Хук useReconnectingWebSocket управляет состоянием и побочными эффектами текущего сценария. @param options Опциональные параметры поведения.
- `const connectRef = useRef<(() => void) | null>(null);`
- `const clearRetry = () => {`
  - Обрабатывает clear retry.
- `const cleanup = useCallback(() => {`
- `const connect = useCallback(() => {`
- `const handleOnline = () => {`
  - Обрабатывает handle online.
- `const handleOffline = () => {`
  - Обрабатывает handle offline.
- `const send = useCallback((data: string) => {`

## `frontend/src/hooks/useRoomPermissions.ts`

- Top-level declarations: 2

### Declarations

- `export function useRoomPermissions( roomId: string | null, ): UseRoomPermissionsResult {`
  - Хук useRoomPermissions управляет состоянием и побочными эффектами текущего сценария. @param roomId ????????????? ???????. @returns Публичное состояние хука и его обработчики.
- `const load = useCallback(async () => {`

## `frontend/src/hooks/useTypingIndicator.ts`

- Top-level declarations: 2

### Declarations

- `export function useTypingIndicator(send: (data: string) => boolean) {`
  - Хук useTypingIndicator управляет состоянием и побочными эффектами текущего сценария. @param send Аргумент `send` текущего вызова.
- `const sendTyping = useCallback(() => {`

## `frontend/src/hooks/useUserProfile.ts`

- Top-level declarations: 1

### Declarations

- `export const useUserProfile = (publicRef: string) => {`
  - Хук useUserProfile управляет состоянием и побочными эффектами текущего сценария. @param publicRef Публичный идентификатор пользователя.

## `frontend/src/main.tsx`

- Top-level declarations: 1

### Declarations

- `const registerServiceWorker = () => {`
  - Обрабатывает register service worker.

## `frontend/src/pages/chatRoomPage/useFileDropZone.ts`

- Top-level declarations: 2

### Declarations

- `export const useFileDropZone = ({ enabled, onFilesDrop }: Options): Result => {`
  - Хук useFileDropZone управляет состоянием и побочными эффектами текущего сценария. @returns Публичное состояние хука и его обработчики.
- `const resetState = useCallback(() => {`

## `frontend/src/pages/chatRoomPage/utils.ts`

- Top-level declarations: 23

### Declarations

- `export const TYPING_TIMEOUT_MS = 5_000;`
  - Константа `TYPING_TIMEOUT_MS` хранит используемое в модуле значение.
- `export const MAX_HISTORY_JUMP_ATTEMPTS = 60;`
  - Константа `MAX_HISTORY_JUMP_ATTEMPTS` задает верхнюю границу для соответствующего лимита.
- `export const MAX_HISTORY_NO_PROGRESS_ATTEMPTS = 2;`
  - Константа `MAX_HISTORY_NO_PROGRESS_ATTEMPTS` задает верхнюю границу для соответствующего лимита.
- `export const MARK_READ_DEBOUNCE_MS = 180;`
  - Константа `MARK_READ_DEBOUNCE_MS` хранит используемое в модуле значение.
- `export const normalizeActorRef = (value: string | null | undefined): string => {`
  - Нормализует actor ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export const resolveCurrentActorRef = (user: UserProfile | null): string => {`
  - Определяет current actor ref. @param user Пользователь текущего контекста. @returns Разрешенное значение с учетом fallback-логики.
- `export const resolveMessageActorRef = ( message: Pick<Message, "publicRef">, ): string => normalizeActorRef(message.publicRef);`
  - Определяет message actor ref. @returns Разрешенное значение с учетом fallback-логики.
- `export const isOwnMessage = (message: Message, currentActorRef: string) =>`
  - Проверяет own message. @param message Текст сообщения. @param currentActorRef Публичный идентификатор текущего пользователя. @returns Логический флаг результата проверки.
- `export const normalizeReadMessageId = (value: unknown): number => {`
  - Нормализует read message id. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export const parseRoomIdRef = (value: unknown): number | null => {`
  - Разбирает room id ref. @param value Входное значение для преобразования. @returns Числовое значение результата.
- `export const isFileDragPayload = ( dataTransfer: DataTransfer | null | undefined, ): boolean => {`
  - Проверяет условие is file drag payload. @param dataTransfer Объект DataTransfer из drag-and-drop события. @returns Булев результат проверки условия.
- `const pendingReadStorageKey = (roomId: string) =>`
  - Обрабатывает pending read storage key. @param roomId Слаг комнаты чата.
- `export const readPendingReadFromStorage = (roomId: string): number => {`
  - Выполняет pending read from storage. @param roomId Идентификатор комнаты. @returns Прочитанные данные из источника.
- `export const writePendingReadToStorage = ( roomId: string, lastReadMessageId: number, ): void => {`
  - Выполняет pending read to storage. @returns Ничего не возвращает.
- `export const clearPendingReadFromStorage = (roomId: string): void => {`
  - Выполняет pending read from storage. @param roomId Идентификатор комнаты. @returns Ничего не возвращает.
- `const readCookieValue = (cookie: string, name: string): string | null => {`
  - Обрабатывает read cookie value. @param cookie Строка cookie, из которой извлекается значение. @param name Имя параметра или ключа, который используется в операции. @returns Строковое значение результата.
- `const chunks = cookie.split(";").map((entry) => entry.trim());`
- `const match = chunks.find((entry) => entry.startsWith(`${name}=`));`
- `export const resolveCsrfToken = (): string | null => {`
  - Определяет csrf token. @returns Строковое значение результата.
- `export const extractApiErrorMessage = (error: unknown, fallback: string) => {`
  - Выполняет api error message. @param error Ошибка, полученная в процессе выполнения. @param fallback Резервное значение при ошибке. @returns Извлеченное значение из входных данных.
- `export const sameAvatarCrop = ( left: Message["avatarCrop"], right: Message["avatarCrop"], ) => {`
  - Выполняет avatar crop.
- `export const formatGroupTypingLabel = ( kind: string | null | undefined, activeTypingUsers: string[], ): string | null => {`
  - Форматирует group typing label. @param kind Аргумент `kind` текущего вызова. @param activeTypingUsers Список `activeTypingUsers`, который обрабатывается функцией. @returns Строковое значение результата.
- `export const buildTimeline = ( messages: Message[], unreadDividerRenderTarget: UnreadDividerRenderTarget, ): TimelineItem[] => {`
  - Формирует timeline. @param messages Список сообщений для дальнейшей обработки. @param unreadDividerRenderTarget Аргумент `unreadDividerRenderTarget` текущего вызова. @returns Сформированное значение для дальнейшего использования.

## `frontend/src/pages/ChatRoomPage.test.tsx`

- Top-level declarations: 14

### Declarations

- `const wsState = vi.hoisted(() => ({`
- `const chatRoomMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`
- `const infoPanelMock = vi.hoisted(() => ({`
- `const mobileShellMock = vi.hoisted(() => ({`
- `const locationMock = vi.hoisted(() => ({`
- `const permissionsMock = vi.hoisted(() => ({`
- `const groupControllerMock = vi.hoisted(() => ({`
- `const chatControllerMock = vi.hoisted(() => ({`
- `const formatReadReceiptTimestamp = (iso: string) =>`
- `const makeForeignMessage = (id: number, content: string): Message => ({`
  - Создает сообщение от другого пользователя для проверки прав. @param id Идентификатор сущности. @param content Текстовое содержимое. @returns Возвращает значение типа Message.
- `const mockViewport = () => {`
  - Эмулирует параметры viewport для тестового сценария.
- `const files = Array.from({ length: 6 }, (_, index) =>`
- `const files = Array.from({ length: 6 }, (_, index) =>`

## `frontend/src/pages/ChatRoomPage.tsx`

- Top-level declarations: 42

### Declarations

- `export function ChatRoomPage({ roomId, initialRoomKind = null, user, onNavigate }: Props) {`
  - React-компонент ChatRoomPage отвечает за отрисовку и обработку UI-сценария.
- `const parsedInitialRoomId = useMemo(() => parseRoomIdRef(roomId), [roomId]);`
- `const resolvedRoomId = useMemo(() => {`
- `const roomApiRef = useMemo(() => {`
- `const currentActorRef = useMemo(() => resolveCurrentActorRef(user), [user]);`
- `const beginProgrammaticScroll = useCallback(() => {`
- `const unreadDividerRenderTarget = useMemo(() => {`
- `const wsUrl = useMemo(() => {`
- `const applyRateLimit = useCallback((cooldownMs: number) => {`
- `const scrollMessageIntoView = useCallback((messageId: number) => {`
- `const onKeyDown = (event: KeyboardEvent) => {`
  - Обрабатывает on key down. @param event Событие браузера.
- `const onMouseDown = (event: MouseEvent) => {`
  - Обрабатывает on mouse down. @param event Событие браузера.
- `const id = window.setInterval(() => {`
- `const flushPendingRead = useCallback(() => {`
- `const scheduleViewportReadSync = useCallback(() => {`
- `const onVisibilityChange = () => {`
  - Обрабатывает on visibility change.
- `const onPageHide = () => {`
  - Обрабатывает on page hide.
- `const onBeforeUnload = () => {`
  - Обрабатывает on before unload.
- `const id = window.setInterval(() => {`
- `const updated = prev.map((msg) => {`
- `const armPaginationInteraction = useCallback(() => {`
- `const scrollToBottom = useCallback(() => {`
- `const snapToBottom = () => {`
- `const sendMessage = useCallback(async () => {`
- `const handleReply = useCallback((msg: Message) => {`
- `const handleEdit = useCallback((msg: Message) => {`
- `const handleDelete = useCallback((msg: Message) => {`
- `const closeReadersMenu = useCallback(() => {`
- `const confirmDelete = useCallback(() => {`
- `const msg = messages.find((m) => m.id === msgId);`
- `const existing = msg?.reactions.find((r) => r.emoji === emoji);`
- `const handleRemoveQueuedFile = useCallback((index: number) => {`
- `const handleClearQueuedFiles = useCallback(() => {`
- `const handleCancelUpload = useCallback(() => {`
- `const handleCancelReply = useCallback(() => {`
- `const openDirectInfo = useCallback(() => {`
- `const openGroupInfo = useCallback(() => {`
- `const handleJoinGroup = useCallback(async () => {`
- `const handleMobileOpenClick = useCallback(() => {`
- `const openRoomSearch = useCallback(() => {`
- `const maxReadMessageId = useMemo(() => {`
- `const readersMenuEntries = useMemo<ReadersMenuEntry[]>(() => {`

## `frontend/src/pages/ChatTargetPage.test.tsx`

- Top-level declarations: 1

### Declarations

- `const controllerMock = vi.hoisted(() => ({`

## `frontend/src/pages/ChatTargetPage.tsx`

- Top-level declarations: 2

### Declarations

- `export function ChatTargetPage({ user, target, onNavigate }: Props) {`
- `const normalizedTarget = useMemo(() => normalizeChatTarget(target), [target]);`

## `frontend/src/pages/FriendsPage.test.tsx`

- Top-level declarations: 2

### Declarations

- `const friendsHookMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`

## `frontend/src/pages/FriendsPage.tsx`

- Top-level declarations: 7

### Declarations

- `const normalizeActorRef = (value: string): string =>`
- `const IconPlus = () => (`
- `const IconFriends = () => (`
- `const IconSearch = () => (`
- `export function FriendsPage({ user, onNavigate }: Props) {`
- `const timer = window.setTimeout(() => clearInfoMessage(), 3000);`
- `const renderContent = () => {`

## `frontend/src/pages/GroupsPage.tsx`

- Top-level declarations: 2

### Declarations

- `const IconPlus = () => (`
  - React-компонент IconPlus отвечает за отрисовку и обработку UI-сценария.
- `export function GroupsPage({ user, onNavigate }: Props) {`
  - React-компонент GroupsPage отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/pages/HomePage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/HomePage.tsx`

- Top-level declarations: 1

### Declarations

- `export function HomePage({ user, onNavigate }: Props) {`
  - React-компонент HomePage отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/pages/InvitePreviewPage.tsx`

- Top-level declarations: 2

### Declarations

- `export function InvitePreviewPage({ code, onNavigate }: Props) {`
  - React-компонент InvitePreviewPage отвечает за отрисовку и обработку UI-сценария.
- `const handleJoin = useCallback(async () => {`

## `frontend/src/pages/LoginPage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/LoginPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function LoginPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, }: Props) {`
  - Компонент LoginPage рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/pages/NotFoundPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function NotFoundPage({ onNavigate }: Props) {`

## `frontend/src/pages/ProfilePage.test.tsx`

- Top-level declarations: 7

### Declarations

- `const presenceMock = vi.hoisted(() => ({`
- `const createObjectUrlMock = vi.hoisted(() => vi.fn(() => "blob:avatar-upload"));`
- `const revokeObjectUrlMock = vi.hoisted(() => vi.fn());`
- `const onSave = vi.fn(async () => ({`
- `const onSave = vi.fn(async () => ({ ok: true as const }));`
- `const onSave = vi.fn(async () => ({ ok: true as const }));`
- `const onSave = vi.fn(async () => ({ ok: true as const }));`

## `frontend/src/pages/ProfilePage.tsx`

- Top-level declarations: 9

### Declarations

- `const normalizeActorRef = (value: string): string =>`
  - Нормализует actor ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export function ProfilePage({ user, onSave, onNavigate }: Props) {`
  - React-компонент ProfilePage отвечает за отрисовку и обработку UI-сценария.
- `const clearFieldError = (field: string) => {`
  - Обрабатывает clear field error. @param field Поле формы, к которому применяется действие.
- `const revokeBlobUrl = (value: string | null) => {`
  - Обрабатывает revoke blob url. @param value Входное значение для преобразования.
- `const clearPendingState = (revoke = true) => {`
  - Обрабатывает clear pending state. @param revoke Флаг, определяющий необходимость отзыва доступа.
- `const timeoutId = window.setTimeout(() => setFormError(null), 4200);`
- `const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {`
  - Обрабатывает handle file change. @param event Событие браузера.
- `const handleCropCancel = () => {`
  - Обрабатывает handle crop cancel.
- `const handleCropApply = (nextCrop: AvatarCrop) => {`
  - Обрабатывает handle crop apply. @param nextCrop Следующие координаты и размеры области обрезки.

## `frontend/src/pages/RegisterPage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/RegisterPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function RegisterPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], }: Props) {`
  - Компонент RegisterPage рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/pages/SettingsPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function SettingsPage({ user, onNavigate, onLogout }: Props) {`
  - React-компонент SettingsPage отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/pages/UserProfilePage.test.tsx`

- Top-level declarations: 3

### Declarations

- `const profileMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`
- `const makeUser = (username: string) =>`

## `frontend/src/pages/UserProfilePage.tsx`

- Top-level declarations: 15

### Declarations

- `const normalizeActorRef = (value: string): string =>`
  - Нормализует actor ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export function UserProfilePage({ username, currentUser, onNavigate, onLogout, }: Props) {`
  - Компонент UserProfilePage рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const clampZoom = (value: number) => Math.min(15, Math.max(1, value));`
  - Обрабатывает clamp zoom. @param value Входное значение для преобразования.
- `const clampPan = (nextX: number, nextY: number, zoomValue: number = zoom) => {`
  - Обрабатывает clamp pan. @param nextX Новое состояние или значение после изменения. @param nextY Новое состояние или значение после изменения. @param zoomValue DOM-событие, вызвавшее обработчик.
- `const openPreview = () => {`
  - Обрабатывает open preview.
- `const closePreview = () => setIsPreviewOpen(false);`
  - Обрабатывает close preview.
- `const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {`
  - Обрабатывает handle wheel. @param event Событие браузера.
- `const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {`
  - Обрабатывает handle touch start. @param event Событие браузера.
- `const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {`
  - Обрабатывает handle touch move. @param event Событие браузера.
- `const handleTouchEnd = () => {`
  - Обрабатывает handle touch end.
- `const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {`
  - Обрабатывает handle mouse down. @param event Событие браузера.
- `const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {`
  - Обрабатывает handle mouse move. @param event Событие браузера.
- `const handleMouseUp = () => {`
  - Обрабатывает handle mouse up.
- `const handleAvatarKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {`
  - Обрабатывает handle avatar key down. @param event Событие браузера.
- `const onKeyDown = (event: KeyboardEvent) => {`
  - Обрабатывает on key down. @param event Событие браузера.

## `frontend/src/shared/api/types.ts`

- Top-level declarations: 0

## `frontend/src/shared/api/users.ts`

- Top-level declarations: 0

## `frontend/src/shared/auth/googleIdentity.ts`

- Top-level declarations: 10

### Declarations

- `export class GoogleOAuthError extends Error {`
  - Класс GoogleOAuthError инкапсулирует логику текущего слоя приложения.
- `const getGoogleIdApi = (): GoogleAccountsId | null =>`
  - Возвращает google id api. @returns Данные, полученные из источника или кэша.
- `const getGoogleOauth2Api = (): GoogleAccountsOauth2 | null =>`
  - Возвращает google oauth2 api. @returns Данные, полученные из источника или кэша.
- `const loadGoogleIdentitySdk = async (): Promise<void> => {`
  - Обрабатывает load google identity sdk. @returns Промис с данными, возвращаемыми этой функцией.
- `const toGoogleAuthError = (message: string): GoogleOAuthError =>`
  - Обрабатывает to google auth error. @param message Сообщение, которое нужно обработать.
- `const timeoutId = window.setTimeout(() => {`
- `const finish = (result: { token?: string; error?: GoogleOAuthError }) => {`
  - Обрабатывает finish. @param result Аргумент `result` текущего вызова.
- `const timeoutId = window.setTimeout(() => {`
- `const finish = (result: { token?: string; error?: GoogleOAuthError }) => {`
  - Обрабатывает finish. @param result Аргумент `result` текущего вызова.
- `export const signInWithGoogle = async ( clientId: string, ): Promise<GoogleOAuthSuccess> => {`
  - Обрабатывает sign in with google. @param clientId Идентификатор OAuth-клиента. @returns Промис с данными, возвращаемыми этой функцией.

## `frontend/src/shared/cache/cacheConfig.ts`

- Top-level declarations: 3

### Declarations

- `export const CACHE_NAMES = {`
  - Константа `CACHE_NAMES` описывает параметры кэширования.
- `export const CACHE_TTLS = {`
  - Константа `CACHE_TTLS` описывает параметры кэширования.
- `export const CACHE_LIMITS = {`
  - Константа `CACHE_LIMITS` описывает параметры кэширования.

## `frontend/src/shared/cache/cacheManager.ts`

- Top-level declarations: 7

### Declarations

- `const postMessage = (message: SwCacheMessage): void => {`
  - Обрабатывает post message. @param message Сообщение, которое нужно обработать.
- `export const invalidateRoomMessages = (roomRef: string) => {`
  - Обрабатывает invalidate room messages. @param roomRef Текстовая ссылка или числовой идентификатор комнаты.
- `export const invalidateRoomDetails = (roomRef: string) => {`
  - Обрабатывает invalidate room details. @param roomRef Текстовая ссылка или числовой идентификатор комнаты.
- `export const invalidateDirectChats = () => {`
  - Инвалидирует кэш списка direct-чатов.
- `export const invalidateUserProfile = (publicRef: string) => {`
  - Инвалидирует кэш публичного профиля пользователя. @param publicRef Публичный идентификатор пользователя или комнаты.
- `export const invalidateSelfProfile = () => {`
  - Инвалидирует кэш собственного профиля.
- `export const clearAllUserCaches = () => {`
  - Очищает все пользовательские API-кэши.

## `frontend/src/shared/chat/readTracker.test.ts`

- Top-level declarations: 1

### Declarations

- `const makeMessage = (id: number, username: string): Message => ({`

## `frontend/src/shared/chat/readTracker.ts`

- Top-level declarations: 7

### Declarations

- `const normalizeLastReadMessageId = (value: number | null | undefined) => {`
  - Нормализует last read message id. @param value Входное значение для преобразования.
- `const normalizeActorRef = (value: string | null | undefined): string => {`
  - Нормализует actor ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `const resolveMessageActorRef = (message: Message): string =>`
  - Определяет message actor ref. @param message Сообщение, которое нужно обработать. @returns Разрешенное значение с учетом fallback-логики.
- `export const collectVisibleMessageIdsByBottomEdge = ( listElement: HTMLElement, ): Set<number> => {`
  - Обрабатывает collect visible message ids by bottom edge. @param listElement Список `listElement`, который обрабатывается функцией. @returns Числовое значение результата.
- `export const computeNextLastReadMessageId = ({ messages, currentActorRef, previousLastReadMessageId, visibleMessageIds, }: ComputeNextLastReadMessageIdParams): number => {`
  - Выполняет next last read message id. @returns Вычисленный результат операции.
- `export const computeUnreadStats = ({ messages, currentActorRef, lastReadMessageId, }: ComputeUnreadStatsParams): UnreadStats => {`
  - Экспорт `computeUnreadStats` предоставляет инициализированный экземпляр для повторного использования в модуле.
- `export const useReadTracker = ({ messages, currentActorRef, serverLastReadMessageId, enabled, resetKey, }: UseReadTrackerParams) => {`
  - Выполняет read tracker. @returns Публичный API хука: состояние и доступные обработчики.

## `frontend/src/shared/config/limits.ts`

- Top-level declarations: 11

### Declarations

- `export const getUsernameMaxLength = () => getRuntimeConfig().usernameMaxLength;`
- `export const useUsernameMaxLength = () =>`
- `export const getChatMessageMaxLength = () =>`
- `export const useChatMessageMaxLength = () =>`
- `export const getChatAttachmentMaxSizeMb = () =>`
- `export const getChatAttachmentMaxSizeBytes = () =>`
- `export const useChatAttachmentMaxSizeMb = () =>`
- `export const useChatAttachmentMaxPerMessage = () =>`
- `export const useChatAttachmentAllowedTypes = () =>`
- `export const getChatTargetRegex = () => {`
- `export const getChatTargetRegExp = () => {`

## `frontend/src/shared/config/runtimeConfig.ts`

- Top-level declarations: 3

### Declarations

- `export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {`
- `export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;`
- `export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {`

## `frontend/src/shared/config/RuntimeConfigContext.ts`

- Top-level declarations: 2

### Declarations

- `export const RuntimeConfigContext = createContext<RuntimeConfigContextValue>({ config: DEFAULT_RUNTIME_CONFIG, ready: false, });`
  - Константа `RuntimeConfigContext` хранит используемое в модуле значение.
- `export function useRuntimeConfig(): RuntimeConfigContextValue {`
  - Хук useRuntimeConfig управляет состоянием и побочными эффектами текущего сценария. @returns Публичное состояние хука и его обработчики.

## `frontend/src/shared/config/RuntimeConfigProvider.tsx`

- Top-level declarations: 1

### Declarations

- `export function RuntimeConfigProvider({ children, }: RuntimeConfigProviderProps) {`
  - Компонент RuntimeConfigProvider рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/conversationList/ConversationListProvider.test.tsx`

- Top-level declarations: 3

### Declarations

- `const chatMock = vi.hoisted(() => ({`
- `const groupMock = vi.hoisted(() => ({`
- `function Probe() {`
  - Проверяет состояние провайдера в тестовом окружении.

## `frontend/src/shared/conversationList/ConversationListProvider.tsx`

- Top-level declarations: 10

### Declarations

- `const canRunGlobalSearchQuery = (query: string) => {`
- `const normalizeActorRef = (value: string): string =>`
- `const toRoomKey = (roomId: number | null | undefined): string =>`
- `export function ConversationListProvider({ user, ready, children }: Props) {`
- `const fetchData = useCallback(async () => {`
- `const onRefresh = () => {`
- `const timerId = window.setTimeout(() => {`
- `const items = useMemo<ConversationItem[]>(() => {`
- `const serverItems = useMemo<ServerRailItem[]>(() => {`
- `export function useConversationList() {`

## `frontend/src/shared/conversationList/events.ts`

- Top-level declarations: 2

### Declarations

- `export const CONVERSATION_LIST_REFRESH_EVENT = "conversation-list:refresh";`
  - Константа `CONVERSATION_LIST_REFRESH_EVENT` хранит используемое в модуле значение.
- `export const emitConversationListRefresh = (): void => {`
  - Обрабатывает emit conversation list refresh.

## `frontend/src/shared/directInbox/context.ts`

- Top-level declarations: 4

### Declarations

- `const noop = () => {};`
- `const noopAsync = async () => {};`
- `export const FALLBACK_DIRECT_INBOX: DirectInboxContextValue = {`
- `export const DirectInboxContext = createContext<DirectInboxContextValue>( FALLBACK_DIRECT_INBOX, );`

## `frontend/src/shared/directInbox/DirectInboxProvider.test.tsx`

- Top-level declarations: 4

### Declarations

- `const wsMock = vi.hoisted(() => ({`
- `const chatMock = vi.hoisted(() => ({`
- `function Probe() {`
  - Проверяет состояние провайдера в тестовом окружении.
- `const sentPayloads = () =>`
  - Возвращает отправленные payload для последующих проверок.

## `frontend/src/shared/directInbox/DirectInboxProvider.tsx`

- Top-level declarations: 7

### Declarations

- `const filtered = prev.filter((item) => item.roomId !== incoming.roomId);`
- `export function DirectInboxProvider({ user, ready = true, children, }: ProviderProps) {`
- `const wsUrl = useMemo(() => {`
- `const refresh = useCallback(async () => {`
- `const unreadCountsWithOverrides = useMemo(() => {`
- `const knownDirectRoomIds = new Set(items.map((item) => String(item.roomId)));`
- `const id = window.setInterval(() => {`

## `frontend/src/shared/directInbox/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/directInbox/useDirectInbox.ts`

- Top-level declarations: 1

### Declarations

- `export const useDirectInbox = () => useContext(DirectInboxContext);`
  - Хук useDirectInbox управляет состоянием и побочными эффектами текущего сценария.

## `frontend/src/shared/layout/useInfoPanel.tsx`

- Top-level declarations: 4

### Declarations

- `export function InfoPanelProvider({ children }: { children: ReactNode }) {`
  - React-компонент InfoPanelProvider отвечает за отрисовку и обработку UI-сценария.
- `const close = useCallback(() => {`
- `const clearClosed = useCallback(() => {`
- `export function useInfoPanel() {`
  - Хук useInfoPanel управляет состоянием и побочными эффектами текущего сценария.

## `frontend/src/shared/layout/useMobileShell.tsx`

- Top-level declarations: 7

### Declarations

- `const readIsMobileViewport = () =>`
- `export function MobileShellProvider({ children }: { children: ReactNode }) {`
- `const handleResize = () => {`
- `const openDrawer = useCallback(() => {`
- `const closeDrawer = useCallback(() => {`
- `const toggleDrawer = useCallback(() => {`
- `export function useMobileShell() {`

## `frontend/src/shared/lib/attachmentMedia.ts`

- Top-level declarations: 6

### Declarations

- `const normalizeContentType = (contentType: string | null | undefined): string =>`
  - Нормализует content type. @param contentType MIME-тип файла. @returns Нормализованное значение после обработки входа.
- `const hasSvgExtension = (fileName: string | null | undefined): boolean =>`
  - Проверяет условие has svg extension. @param fileName Имя файла вместе с расширением. @returns Булев результат проверки условия.
- `export const isSvgAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`
  - Проверяет условие is svg attachment. @param contentType MIME-тип файла. @param fileName Имя файла вместе с расширением. @returns Булев результат проверки условия.
- `export const isImageAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`
  - Проверяет условие is image attachment. @param contentType MIME-тип файла. @param fileName Имя файла вместе с расширением. @returns Булев результат проверки условия.
- `export const isVideoAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`
  - Проверяет, относится ли файл к видео по MIME-типу или расширению. @param contentType MIME-тип файла. @param fileName Имя файла вместе с расширением. @returns `true`, если файл должен отображаться как видео.
- `export const resolveImagePreviewUrl = ({ url, thumbnailUrl, contentType, fileName, }: { url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; }): string | null => {`
  - Определяет image preview url. @returns Разрешенное значение с учетом fallback-логики.

## `frontend/src/shared/lib/attachmentTypeLabel.test.ts`

- Top-level declarations: 0

## `frontend/src/shared/lib/attachmentTypeLabel.ts`

- Top-level declarations: 3

### Declarations

- `const extractExtension = (fileName: string | null | undefined): string => {`
  - Извлекает extension. @param fileName Имя файла вместе с расширением. @returns Извлеченное значение из входных данных.
- `const normalizeMimeSubtype = (subtype: string): string => {`
  - Нормализует mime subtype. @param subtype DOM-событие, вызвавшее обработчик. @returns Нормализованное значение после обработки входа.
- `export const resolveAttachmentTypeLabel = ( contentType: string | null | undefined, fileName: string | null | undefined, ): string => {`
  - Определяет attachment type label. @param contentType MIME-тип файла. @param fileName Имя файла вместе с расширением. @returns Разрешенное значение с учетом fallback-логики.

## `frontend/src/shared/lib/avatarCrop.ts`

- Top-level declarations: 2

### Declarations

- `export const normalizeAvatarCrop = ( value?: AvatarCrop | null, ): AvatarCrop | null => {`
  - Нормализует avatar crop. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export const buildAvatarCropImageStyle = (crop: AvatarCrop): CSSProperties => ({`
  - Формирует avatar crop image style. @param crop Параметры обрезки изображения. @returns Сформированная структура данных.

## `frontend/src/shared/lib/chatTarget.test.ts`

- Top-level declarations: 0

## `frontend/src/shared/lib/chatTarget.ts`

- Top-level declarations: 10

### Declarations

- `export const PUBLIC_CHAT_TARGET = "public";`
- `const isSinglePathSegment = (pathname: string): boolean => {`
- `export const normalizeChatTarget = ( value: string | null | undefined, ): string => {`
- `export const isReservedChatTarget = (value: string | null | undefined): boolean => {`
- `export const encodeChatTargetSegment = (value: string): string => {`
- `export const buildChatTargetPath = (value: string): string => {`
- `export const buildPublicChatPath = (): string =>`
- `export const buildDirectChatPath = (value: string): string => {`
- `export const parseChatTargetFromPathname = ( pathname: string, ): string | null => {`
- `export const isPrefixlessChatPath = (pathname: string): boolean =>`

## `frontend/src/shared/lib/debug.ts`

- Top-level declarations: 1

### Declarations

- `export const debugLog = (...args: unknown[]) => {`
  - Реализует функцию `debugLog`. @param args Список аргументов для логирования или проксирования.

## `frontend/src/shared/lib/directNavigation.test.ts`

- Top-level declarations: 0

## `frontend/src/shared/lib/directNavigation.ts`

- Top-level declarations: 5

### Declarations

- `export const LAST_DIRECT_REF_STORAGE_KEY = "ui.direct.last-ref";`
- `export const DIRECT_HOME_FALLBACK_PATH = "/friends";`
- `export const readStoredLastDirectRef = (): string => {`
- `export const rememberLastDirectRef = (value: string | null | undefined): void => {`
- `export const resolveRememberedDirectPath = ({ pathname, fallbackPath = DIRECT_HOME_FALLBACK_PATH, directPeerRefs = [], }: ResolveRememberedDirectPathOptions = {}): string => {`

## `frontend/src/shared/lib/format.ts`

- Top-level declarations: 6

### Declarations

- `export const formatTimestamp = (iso: string) =>`
  - Реализует функцию `formatTimestamp`. @param iso Дата в ISO-формате. @returns Строка в отформатированном виде.
- `export const formatDayLabel = (date: Date, now: Date = new Date()) => {`
  - Реализует функцию `formatDayLabel`. @param date Дата для форматирования. @param now Текущая дата для вычислений. @returns Строка в отформатированном виде.
- `export const avatarFallback = (username: string) => {`
  - Обрабатывает avatar fallback. @param username Имя пользователя.
- `export const formatFullName = ( name: string | null | undefined, lastName?: string | null | undefined, ) => {`
  - Форматирует full name. @returns Строка в отформатированном виде.
- `export const formatRegistrationDate = (iso: string | null) => {`
  - Реализует функцию `formatRegistrationDate`. @param iso Дата в ISO-формате. @returns Строка в отформатированном виде.
- `export const formatLastSeen = (iso: string | null) => {`
  - Реализует функцию `formatLastSeen`. @param iso Дата в ISO-формате. @returns Строка в отформатированном виде.

## `frontend/src/shared/lib/publicRef.ts`

- Top-level declarations: 6

### Declarations

- `export const normalizePublicRef = ( value: string | null | undefined, ): string => {`
  - Нормализует public ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export const isHandleRef = (value: string): boolean =>`
  - Проверяет условие is handle ref. @param value Входное значение для преобразования. @returns Булев результат проверки условия.
- `export const isFallbackPublicId = (value: string): boolean => {`
  - Проверяет условие is fallback public id. @param value Входное значение для преобразования. @returns Булев результат проверки условия.
- `export const formatPublicRef = (value: string): string => {`
  - Форматирует public ref. @param value Входное значение для преобразования. @returns Сформированное значение для дальнейшего использования.
- `export const buildDirectPath = (value: string): string => {`
  - Формирует direct path. @param value Входное значение для преобразования. @returns Сформированное значение для дальнейшего использования.
- `export const buildUserProfilePath = (value: string): string => {`
  - Формирует user profile path. @param value Входное значение для преобразования. @returns Сформированное значение для дальнейшего использования.

## `frontend/src/shared/lib/sanitize.ts`

- Top-level declarations: 2

### Declarations

- `const stripControlChars = (value: string) => {`
  - Обрабатывает strip control chars. @param value Входное значение для преобразования.
- `export const sanitizeText = (input: string, maxLen = 1000) => {`
  - Очищает text. @param input Входной объект с параметрами операции. @param maxLen Максимальная длина значения.

## `frontend/src/shared/lib/userIdentity.test.ts`

- Top-level declarations: 0

## `frontend/src/shared/lib/userIdentity.ts`

- Top-level declarations: 2

### Declarations

- `export const resolveIdentityLabel = ( identity: IdentityLike, fallback = "user", ): string =>`
- `export const resolveIdentityHandle = ( identity: IdentityLike, ): string | null => {`

## `frontend/src/shared/lib/ws.ts`

- Top-level declarations: 2

### Declarations

- `const resolveDevWsOrigin = (scheme: "ws" | "wss"): string => {`
  - Возвращает базовый websocket origin для текущего окружения. В dev подключаемся напрямую к backend (`:8000`), чтобы не зависеть от Vite WS-proxy и не получать `ws proxy ECONNABORTED` в терминале.
- `export const getWebSocketBase = () => {`
  - Возвращает web socket base.

## `frontend/src/shared/presence/context.ts`

- Top-level declarations: 2

### Declarations

- `export const FALLBACK_PRESENCE: PresenceContextValue = {`
  - Константа `FALLBACK_PRESENCE` описывает резервное значение для безопасного fallback.
- `export const PresenceContext =`
  - Константа `PresenceContext` хранит используемое в модуле значение.

## `frontend/src/shared/presence/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/presence/PresenceProvider.test.tsx`

- Top-level declarations: 3

### Declarations

- `const wsMock = vi.hoisted(() => ({`
- `const apiMock = vi.hoisted(() => ({`
- `function PresenceProbe() {`
  - Проверяет обновление состояния presence в тестовом окружении.

## `frontend/src/shared/presence/PresenceProvider.tsx`

- Top-level declarations: 5

### Declarations

- `const normalizePresenceRef = (value: string | null | undefined): string =>`
  - Нормализует presence ref. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export function PresenceProvider({ user, children, ready = true, }: ProviderProps) {`
  - Компонент PresenceProvider рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const presenceUrl = useMemo(() => {`
- `const sendPing = () => {`
  - Обрабатывает send ping.
- `const visibleOnline = useMemo(() => {`

## `frontend/src/shared/presence/usePresence.ts`

- Top-level declarations: 1

### Declarations

- `export const usePresence = () => useContext(PresenceContext);`
  - Хук usePresence управляет состоянием и побочными эффектами текущего сценария.

## `frontend/src/shared/ui/AudioAttachmentPlayer.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/AudioAttachmentPlayer.tsx`

- Top-level declarations: 5

### Declarations

- `const normalizeTime = (value: number) =>`
  - Нормализует time. @param value Входное значение для преобразования.
- `const createInitialPlaybackState = (srcKey: string): PlaybackState => ({`
  - Создает initial playback state. @param srcKey Аргумент `srcKey` текущего вызова. @returns Сформированное значение для дальнейшего использования.
- `const formatTime = (value: number) => {`
  - Форматирует time. @param value Входное значение для преобразования.
- `export function AudioAttachmentPlayer({ src, title, subtitle, downloadName, compact = false, className, }: Props) {`
  - Компонент AudioAttachmentPlayer рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const handleToggle = useCallback(async () => {`

## `frontend/src/shared/ui/Avatar.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/Avatar.tsx`

- Top-level declarations: 1

### Declarations

- `export function Avatar({ username, profileImage = null, avatarCrop = null, size = "default", online = false, className, loading = "lazy", }: AvatarProps) {`
  - Компонент Avatar рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/AvatarCropModal.test.tsx`

- Top-level declarations: 1

### Declarations

- `const cropperState = vi.hoisted(() => ({`

## `frontend/src/shared/ui/AvatarCropModal.tsx`

- Top-level declarations: 3

### Declarations

- `const clamp = (value: number, min: number, max: number) =>`
  - Обрабатывает clamp. @param value Входное значение для преобразования. @param min Аргумент `min` текущего вызова. @param max Аргумент `max` текущего вызова.
- `const roundToSix = (value: number) =>`
  - Обрабатывает round to six. @param value Входное значение для преобразования.
- `export function AvatarCropModal({ open, image, onCancel, onApply, }: AvatarCropModalProps) {`
  - Компонент AvatarCropModal рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/AvatarMedia.tsx`

- Top-level declarations: 1

### Declarations

- `export function AvatarMedia({ src, alt, avatarCrop = null, loading = "lazy", decoding = "async", draggable = false, className, onError, }: AvatarMediaProps) {`
  - Компонент AvatarMedia рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/Button.tsx`

- Top-level declarations: 1

### Declarations

- `export function Button({ variant = "primary", fullWidth = false, className, type = "button", ...props }: ButtonProps) {`
  - Компонент Button рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/Card.tsx`

- Top-level declarations: 1

### Declarations

- `export function Card<T extends ElementType = "section">({ as, wide = false, className, children, ...rest }: CardProps<T>) {`
  - Компонент Card рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/ContextMenu.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/ContextMenu.tsx`

- Top-level declarations: 5

### Declarations

- `export function ContextMenu({ items, x, y, onClose }: Props) {`
  - React-компонент ContextMenu отвечает за отрисовку и обработку UI-сценария.
- `const reposition = useCallback(() => {`
- `const handleResize = () => reposition();`
  - Обрабатывает handle resize.
- `const handlePointerDown = (event: Event) => {`
  - Обрабатывает handle pointer down. @param event Событие браузера.
- `const handleKey = (e: KeyboardEvent) => {`
  - Обрабатывает handle key. @param e DOM-событие, вызвавшее обработчик.

## `frontend/src/shared/ui/Dropdown.tsx`

- Top-level declarations: 3

### Declarations

- `export function Dropdown({ trigger, children, align = "left", offset = 4, wrapperClassName, triggerClassName, menuClassName, closeOnContentClick = true, }: Props) {`
  - React-компонент Dropdown отвечает за отрисовку и обработку UI-сценария.
- `const handlePointerDown = useCallback((event: Event) => {`
- `const handleKeyDown = useCallback((event: KeyboardEvent) => {`

## `frontend/src/shared/ui/EmptyState.tsx`

- Top-level declarations: 1

### Declarations

- `export function EmptyState({ icon, title, description, children, className, }: Props) {`
  - Компонент EmptyState рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/ImageLightbox.test.tsx`

- Top-level declarations: 1

### Declarations

- `const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);`

## `frontend/src/shared/ui/ImageLightbox.tsx`

- Top-level declarations: 20

### Declarations

- `const resolveFrameExpandProgress = (scale: number): number =>`
- `const clampNumber = (value: number, min: number, max: number): number =>`
- `const normalizeIndex = (value: number, size: number): number => {`
- `const formatFileSize = (bytes: number): string => {`
- `const formatSentAt = (value: string): string => {`
- `const buildSingleItem = (props: SingleMediaProps): ImageLightboxMediaItem => ({`
- `const isGalleryMediaProps = (value: Props): value is GalleryMediaProps =>`
- `export function ImageLightbox(props: Props) {`
- `const applyTransform = useCallback(() => {`
- `const applyTransformOnFrame = useCallback(() => {`
- `const resetTransform = useCallback(() => {`
- `const beginClose = useCallback(() => {`
- `const preventPageZoom = (event: WheelEvent) => {`
- `const goToPrevious = useCallback(() => {`
- `const goToNext = useCallback(() => {`
- `const handleKeyDown = (event: KeyboardEvent) => {`
- `const handleOpenFullscreen = useCallback(async () => {`
- `const openInNewTab = () => {`
- `const metadataLines = useMemo(() => {`
- `const frameStyle = useMemo(() => {`

## `frontend/src/shared/ui/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/ui/Modal.tsx`

- Top-level declarations: 1

### Declarations

- `export function Modal({ open, onClose, title, children }: Props) {`
  - React-компонент Modal отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/shared/ui/Panel.tsx`

- Top-level declarations: 1

### Declarations

- `export function Panel({ muted = false, busy = false, className, children, }: PanelProps) {`
  - Компонент Panel рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/shared/ui/Spinner.tsx`

- Top-level declarations: 1

### Declarations

- `export function Spinner({ size = "md", className }: Props) {`
  - React-компонент Spinner отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/shared/ui/Toast.tsx`

- Top-level declarations: 2

### Declarations

- `export function Toast({ variant, role = "status", className, autoDismissMs = 5000, onDismiss, children, }: ToastProps) {`
  - Компонент Toast рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const dismiss = useCallback(() => {`

## `frontend/src/shared/unreadOverrides/store.ts`

- Top-level declarations: 9

### Declarations

- `const emit = () => {`
- `const rebuildSnapshot = () => {`
- `const normalizeUnreadCount = (value: number) => {`
- `export const setUnreadOverride = ({ roomId, unreadCount }: UnreadOverride) => {`
- `export const clearUnreadOverride = (roomId: string) => {`
- `export const resetUnreadOverrides = () => {`
- `const getSnapshot = () => snapshot;`
- `const subscribe = (listener: Listener) => {`
- `export const useUnreadOverrides = () =>`

## `frontend/src/sw.ts`

- Top-level declarations: 10

### Declarations

- `const isSameOrigin = (url: URL) => url.origin === self.location.origin;`
  - Проверяет условие is same origin. @param url URL-адрес ресурса.
- `const isGetRequest = (request: Request) => request.method === "GET";`
  - Проверяет условие is get request. @param request Объект HTTP-запроса.
- `const matchSignedMedia = (url: URL) =>`
  - Обрабатывает match signed media. @param url URL-адрес ресурса.
- `const matchRoomMessages = (url: URL) =>`
  - Обрабатывает match room messages. @param url URL-адрес ресурса.
- `const matchRoomDetails = (url: URL) =>`
  - Обрабатывает match room details. @param url URL-адрес ресурса.
- `const matchDirectChats = (url: URL) =>`
  - Обрабатывает match direct chats. @param url URL-адрес ресурса.
- `const matchUserProfile = (url: URL) =>`
  - Обрабатывает match user profile. @param url URL-адрес ресурса.
- `const matchSelfProfile = (url: URL) => url.pathname === "/api/profile/";`
  - Обрабатывает match self profile. @param url URL-адрес ресурса.
- `const matchAuthNoCache = (url: URL) =>`
  - Обрабатывает match auth no cache. @param url URL-адрес ресурса.
- `const clearUserCaches = async () => {`
  - Обрабатывает clear user caches.

## `frontend/src/test/setup.ts`

- Top-level declarations: 1

### Declarations

- `export const server = setupServer();`

## `frontend/src/widgets/admin/RolesManager.tsx`

- Top-level declarations: 3

### Declarations

- `export function RolesManager({ roomId }: Props) {`
  - React-компонент RolesManager отвечает за отрисовку и обработку UI-сценария.
- `const reload = useCallback(async () => {`
- `const handleCreate = useCallback(async () => {`

## `frontend/src/widgets/auth/AuthForm.tsx`

- Top-level declarations: 4

### Declarations

- `export function AuthForm({ mode, title, submitLabel, onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], className, }: AuthFormProps) {`
  - Компонент AuthForm рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const canSubmit = useMemo(() => {`
- `const handleSubmit = (event: FormEvent) => {`
  - Обрабатывает handle submit. @param event Событие браузера.
- `const handleGoogleAuth = async () => {`
  - Обрабатывает handle google auth.

## `frontend/src/widgets/chat/ChatSearch.tsx`

- Top-level declarations: 2

### Declarations

- `function highlightText(text: string, query: string): string {`
  - Обрабатывает highlight text. @param text Текст, который используется в вычислении. @param query Поисковый запрос.
- `export function ChatSearch({ roomId, onResultClick }: Props) {`
  - React-компонент ChatSearch отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/widgets/chat/DirectInfoPanel.test.tsx`

- Top-level declarations: 1

### Declarations

- `const chatControllerMock = vi.hoisted(() => ({`

## `frontend/src/widgets/chat/DirectInfoPanel.tsx`

- Top-level declarations: 8

### Declarations

- `const isVideo = (contentType: string) => contentType.startsWith("video/");`
  - Проверяет условие is video. @param contentType MIME-тип файла.
- `const isAudio = (contentType: string) => contentType.startsWith("audio/");`
  - Проверяет условие is audio. @param contentType MIME-тип файла.
- `const formatFileSize = (bytes: number) => {`
  - Форматирует file size. @param bytes Размер файла в байтах.
- `function AttachmentCard({ item }: { item: RoomAttachmentItem }) {`
  - React-компонент AttachmentCard отвечает за отрисовку и обработку UI-сценария.
- `export function DirectInfoPanel({ roomId }: Props) {`
  - React-компонент DirectInfoPanel отвечает за отрисовку и обработку UI-сценария.
- `const loadInitial = useCallback(async () => {`
- `const loadMore = useCallback(async () => {`
- `const attachmentItems = useMemo(() => attachments, [attachments]);`

## `frontend/src/widgets/chat/lib/attachmentLayout.test.ts`

- Top-level declarations: 1

### Declarations

- `const makeAttachment = (overrides: Partial<Attachment>): Attachment => ({`

## `frontend/src/widgets/chat/lib/attachmentLayout.ts`

- Top-level declarations: 5

### Declarations

- `const normalizeVisibleImageLimit = (value: number): number => {`
  - Нормализует visible image limit. @param value Входное значение для преобразования. @returns Нормализованное значение после обработки входа.
- `export const buildAttachmentRenderItems = ( attachments: Attachment[], ): AttachmentRenderItem[] =>`
  - Формирует attachment render items. @param attachments Список вложений, переданных в текущую операцию. @returns Сформированное значение для дальнейшего использования.
- `export const splitAttachmentRenderItems = ( items: AttachmentRenderItem[], maxVisibleImages: number, ): AttachmentBuckets => {`
  - Делит вложения на изображения и прочие файлы. @param items Список элементов для обработки. @param maxVisibleImages Список `maxVisibleImages`, который обрабатывается функцией.
- `export const resolveMediaGridVariant = (count: number): MediaGridVariant => {`
  - Определяет вариант сетки изображений по количеству элементов. @param count Числовой параметр `count`, ограничивающий объем данных. @returns Разрешенное значение с учетом fallback-логики.
- `export const resolveImageAspectRatio = (attachment: Attachment): number => {`
  - Вычисляет ограниченное соотношение сторон изображения. @param attachment Аргумент `attachment` текущего вызова. @returns Разрешенное значение с учетом fallback-логики.

## `frontend/src/widgets/chat/MessageBubble.test.tsx`

- Top-level declarations: 3

### Declarations

- `const createImageAttachment = (id: number, filename: string) => ({`
- `const installTouchMatchMedia = () => {`
  - Настраивает эмуляцию touch-устройства через matchMedia.
- `const installDesktopInputModel = () => {`
  - Настраивает модель ввода для десктопного сценария.

## `frontend/src/widgets/chat/MessageBubble.tsx`

- Top-level declarations: 14

### Declarations

- `const formatFileSize = (bytes: number) => {`
  - Форматирует размер файла для отображения рядом с вложением. @param bytes Размер файла в байтах. @returns Строка в отформатированном виде.
- `const formatMediaDuration = (totalSeconds: number): string => {`
- `const isVideoType = (contentType: string, fileName: string) =>`
  - Проверяет, относится ли MIME-тип к видео. @param contentType MIME-тип вложения. @param fileName Имя файла, используется как дополнительная эвристика. @returns Логический флаг результата проверки.
- `const isAudioType = (ct: string) => ct.startsWith("audio/");`
  - Проверяет, относится ли MIME-тип к аудио. @param ct MIME-тип вложения. @returns Логический флаг результата проверки.
- `const normalizeActorRef = (value: string) =>`
  - Нормализует публичный идентификатор пользователя для сравнения online-статуса. @param value Входное значение для преобразования.
- `const isTouchLikeDevice = () => {`
  - Определяет, используется ли устройство с touch-вводом.
- `const shouldIgnoreMobileMenuTap = (target: EventTarget | null) => {`
  - Проверяет, что тап был по интерактивному элементу и меню открывать не нужно. @param target DOM-элемент, по которому пришло событие. @returns Логический флаг, нужно ли выполнять действие.
- `function ReplyQuote({ replyTo, onClick, }: { replyTo: ReplyTo; onClick?: () => void;`
  - Компонент ReplyQuote рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
- `function ReactionChip({ reaction, onToggle, }: { reaction: ReactionSummary; onToggle: () => void;`
  - Компонент ReactionChip рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
- `function CheckMark({ isRead }: { isRead: boolean }) {`
  - React-компонент CheckMark отвечает за отрисовку и обработку UI-сценария.
- `function EmojiPicker({ onPick, onClose, }: { onPick: (emoji: string) => void;`
  - Компонент EmojiPicker рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
- `export function MessageBubble({ message, isOwn, showAvatar = true, showHeader = true, grouped = false, canModerate = false, canViewReaders = false, isRead = false, highlighted = false, onlineUsernames, onReply, onEdit, onDelete, onReact, onViewReaders,`
  - Компонент MessageBubble рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
- `const openContextMenuAt = useCallback((x: number, y: number) => {`
- `const openLightboxByAttachmentId = (attachmentId: number) => {`

## `frontend/src/widgets/chat/MessageInput.tsx`

- Top-level declarations: 5

### Declarations

- `const IconAttach = () => (`
  - React-компонент IconAttach отвечает за отрисовку и обработку UI-сценария.
- `const IconSend = () => (`
  - React-компонент IconSend отвечает за отрисовку и обработку UI-сценария.
- `const IconClose = () => (`
  - React-компонент IconClose отвечает за отрисовку и обработку UI-сценария.
- `export function MessageInput({ draft, onDraftChange, onSend, onTyping, disabled, rateLimitActive, replyTo, onCancelReply, onAttach, pendingFiles = [], onRemovePendingFile, onClearPendingFiles, uploadProgress, onCancelUpload, }: Props) {`
  - Компонент MessageInput рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const resizeTextarea = useCallback(() => {`
  - Автоматически подстраивает высоту поля ввода до 3x от базовой высоты.

## `frontend/src/widgets/chat/ReadersMenu.tsx`

- Top-level declarations: 6

### Declarations

- `const formatExactReadAt = (iso: string) =>`
- `export function ReadersMenu({ x, y, loading, error, entries, emptyLabel, onClose, onOpenProfile, }: Props) {`
- `const reposition = useCallback(() => {`
- `const handleResize = () => reposition();`
- `const handlePointerDown = (event: Event) => {`
- `const handleKey = (event: KeyboardEvent) => {`

## `frontend/src/widgets/chat/TypingIndicator.tsx`

- Top-level declarations: 1

### Declarations

- `export function TypingIndicator({ users }: Props) {`
  - React-компонент TypingIndicator отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/widgets/chat/UserProfilePanel.test.tsx`

- Top-level declarations: 4

### Declarations

- `const profileMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`
- `const relationState = vi.hoisted(() => ({`
- `const friendsControllerMock = vi.hoisted(() => ({`

## `frontend/src/widgets/chat/UserProfilePanel.tsx`

- Top-level declarations: 13

### Declarations

- `const normalize = (value: string) => normalizePublicRef(value).toLowerCase();`
  - Нормализует данные. @param value Входное значение для преобразования.
- `export function UserProfilePanel({ publicRef, currentPublicRef }: Props) {`
  - React-компонент UserProfilePanel отвечает за отрисовку и обработку UI-сценария.
- `const loadRelationState = useCallback(async () => {`
- `const run = async () => {`
  - Обрабатывает run.
- `const handleAddFriend = useCallback(() => {`
- `const handleCancelRequest = useCallback(() => {`
- `const handleAcceptRequest = useCallback(() => {`
- `const handleDeclineRequest = useCallback(() => {`
- `const handleRemoveFriend = useCallback(() => {`
- `const handleBlock = useCallback(() => {`
- `const handleUnblock = useCallback(() => {`
- `const handleStartDirect = useCallback(() => {`
- `const isUserOnline = useMemo(() => {`

## `frontend/src/widgets/friends/AddFriendDialog.tsx`

- Top-level declarations: 2

### Declarations

- `export function AddFriendDialog({ onSubmit, onClose }: Props) {`
  - React-компонент AddFriendDialog отвечает за отрисовку и обработку UI-сценария.
- `const handleSubmit = useCallback(async () => {`

## `frontend/src/widgets/friends/FriendListItem.test.tsx`

- Top-level declarations: 0

## `frontend/src/widgets/friends/FriendListItem.tsx`

- Top-level declarations: 2

### Declarations

- `const IconMore = () => (`
- `export function FriendListItem({ friend, isOnline, onMessage, onRemove, onBlock, }: Props) {`
  - Компонент FriendListItem рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.

## `frontend/src/widgets/friends/FriendRequestItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function FriendRequestItem(props: Props) {`
  - React-компонент FriendRequestItem отвечает за отрисовку и обработку UI-сценария. @param props Свойства компонента или хука.

## `frontend/src/widgets/groups/CreateGroupDialog.tsx`

- Top-level declarations: 2

### Declarations

- `export function CreateGroupDialog({ onCreated, onClose }: Props) {`
  - React-компонент CreateGroupDialog отвечает за отрисовку и обработку UI-сценария.
- `const handleSubmit = useCallback(async () => {`

## `frontend/src/widgets/groups/GroupInfoPanel.test.tsx`

- Top-level declarations: 7

### Declarations

- `const groupControllerMock = vi.hoisted(() => ({`
- `const rolesControllerMock = vi.hoisted(() => ({`
- `const chatControllerMock = vi.hoisted(() => ({`
- `const roomPermissionsMock = vi.hoisted(() => ({`
- `const infoPanelMock = vi.hoisted(() => ({`
- `const withBaseMocks = () => {`
  - Создает тестовое окружение с базовыми моками зависимостей.
- `const groupPromise = new Promise<Group>((resolve) => {`

## `frontend/src/widgets/groups/GroupInfoPanel.tsx`

- Top-level declarations: 37

### Declarations

- `const PERMISSION_BITS = PERMISSION_ITEMS.map((item) => item.bit);`
- `const extractErrorMessage = (error: unknown, fallback: string) => {`
  - Извлекает error message. @param error Объект ошибки, полученный в обработчике. @param fallback Резервное значение на случай ошибки или отсутствия данных.
- `const getElevatedRoles = (roles: string[]) =>`
  - Возвращает elevated roles. @param roles Набор ролей, участвующих в вычислении.
- `const toggleBit = (current: number[], bit: number): number[] =>`
  - Обрабатывает toggle bit. @param current Аргумент `current` текущего вызова. @param bit Проверяемый бит в маске разрешений. @returns Числовое значение результата.
- `const bitsFromMask = (mask: number): number[] =>`
  - Обрабатывает bits from mask. @param mask Битовая маска разрешений. @returns Числовое значение результата.
- `const formatFileSize = (bytes: number) => {`
  - Форматирует file size. @param bytes Размер файла в байтах.
- `const extractHttpLinks = (content: string): string[] => {`
  - Извлекает http links. @param content Текст сообщения. @returns Строковое значение результата.
- `const formatDateTime = (value: string) => {`
  - Форматирует date time. @param value Входное значение для преобразования.
- `const revokeBlobUrl = (value: string | null) => {`
  - Обрабатывает revoke blob url. @param value Входное значение для преобразования.
- `export function GroupInfoPanel({ roomId }: Props) {`
  - React-компонент GroupInfoPanel отвечает за отрисовку и обработку UI-сценария.
- `const isSelfMember = useCallback((member: GroupMember) => {`
- `const resolveMemberTag = useCallback((member: GroupMember): string | null => {`
- `const loadRolesData = useCallback(async () => {`
- `const clearPendingAvatar = useCallback((revoke = true) => {`
- `const loadBase = useCallback(async () => {`
- `const loadInvites = useCallback(async () => {`
- `const loadJoinRequests = useCallback(async () => {`
- `const loadBanned = useCallback(async () => {`
- `const loadMedia = useCallback(async () => {`
- `const loadLinks = useCallback(async () => {`
- `const role = roles.find((item) => item.id === selectedRoleId);`
- `const hasGeneralChanges = useMemo(() => {`
- `const saveGroupSettings = useCallback(async () => {`
- `const removeAvatar = useCallback(async () => {`
- `const handleAvatarCropCancel = useCallback(() => {`
- `const handleLeaveGroup = useCallback(async () => {`
- `const handleDeleteGroup = useCallback(async () => {`
- `const activeViewTitle = useMemo(() => {`
- `const createInvite = useCallback(async () => {`
- `const createRole = useCallback(async () => {`
- `const updateRole = useCallback(async () => {`
- `const saveMemberRoles = useCallback(async () => {`
- `const resetOverrideForm = useCallback(() => {`
- `const editOverride = useCallback((item: PermissionOverride) => {`
- `const saveOverride = useCallback(async () => {`
- `const target = members.find((member) => member.userId === userId);`
- `const banMemberFromForm = useCallback(async () => {`

## `frontend/src/widgets/groups/GroupListItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function GroupListItem({ group, onClick }: Props) {`
  - React-компонент GroupListItem отвечает за отрисовку и обработку UI-сценария.

## `frontend/src/widgets/groups/GroupMembersList.tsx`

- Top-level declarations: 1

### Declarations

- `export function GroupMembersList({ members, isAdmin, onKick, onBan, onMute, onUnmute, }: Props) {`
  - Компонент GroupMembersList рендерит список участников и их базовые действия.

## `frontend/src/widgets/layout/AppShell.test.tsx`

- Top-level declarations: 4

### Declarations

- `const conversationListMock = vi.hoisted(() => ({`
- `const directInboxMock = vi.hoisted(() => ({`
- `const setViewport = (width: number) => {`
- `function ShellHarness() {`

## `frontend/src/widgets/layout/InfoPanel.test.tsx`

- Top-level declarations: 1

### Declarations

- `function Harness() {`
  - Создает тестовый harness для рендера и взаимодействий.

## `frontend/src/widgets/layout/InfoPanel.tsx`

- Top-level declarations: 3

### Declarations

- `function PanelContent({ content, targetId, currentPublicRef, onJumpToMessage, }: { content: string; targetId: string | null; currentPublicRef: string | null; onJumpToMessage: (roomTarget: string, messageId: number) => void;`
  - Компонент PanelContent рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `export function InfoPanel({ currentPublicRef, }: { currentPublicRef: string | null; }) {`
  - Компонент InfoPanel рендерит UI текущего раздела и связывает действия пользователя с обработчиками. @param props Свойства компонента.
- `const onJumpToMessage = (roomTarget: string, messageId: number) => {`
  - Обрабатывает on jump to message. @param roomTarget ??????? ????? ???? ??? ???????? ? ?????????. @param messageId Идентификатор сообщения.

## `frontend/src/widgets/layout/Sidebar.test.tsx`

- Top-level declarations: 2

### Declarations

- `const directInboxMock = vi.hoisted(() => ({`
- `const conversationListMock = vi.hoisted(() => ({`

## `frontend/src/widgets/layout/Sidebar.tsx`

- Top-level declarations: 13

### Declarations

- `const clampSidebarWidth = (value: number): number =>`
- `const normalizeActorRef = (value: string): string =>`
- `const FriendsIcon = () => (`
- `const PublicChatIcon = () => (`
- `const SettingsIcon = () => (`
- `export function Sidebar({ user, onNavigate, onLogout, onCloseMobileDrawer, showMobileDrawerControls = false, }: Props) {`
- `const resizeCleanupRef = useRef<(() => void) | null>(null);`
- `const filteredDirectItems = useMemo(() => {`
- `const rememberedDirectPath = useMemo(() => {`
- `const handleResizeStart = useCallback((event: React.MouseEvent) => {`
- `const handleMouseMove = (moveEvent: MouseEvent) => {`
- `const stopResize = () => {`
- `const handleSettingsLogout = useCallback(async () => {`

## `frontend/src/widgets/settings/SettingsContent.tsx`

- Top-level declarations: 2

### Declarations

- `export function SettingsContent({ user, onNavigate, onLogout, compact = false, showTitle = true, }: Props) {`
- `const handleToggleNotifications = useCallback(async () => {`

## `frontend/src/widgets/sidebar/ConversationList.tsx`

- Top-level declarations: 1

### Declarations

- `export function ConversationList({ onNavigate }: Props) {`

## `frontend/src/widgets/sidebar/ConversationListItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function ConversationListItem({ item, isActive, onClick }: Props) {`
  - React-компонент ConversationListItem отвечает за отрисовку и обработку UI-сценария.
