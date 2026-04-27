# Справочник Frontend

Сгенерировано: 2026-04-22T14:14:13Z

Всего модулей: 253

## `frontend/src/adapters/apiService/acceptFriendRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function acceptFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `acceptFriendRequest`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `friendshipId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор связи дружбы.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `accept friend request`.

## `frontend/src/adapters/apiService/addReaction.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function addReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<ReactionResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `addReaction`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `messageId` в формате `number`.
  - `emoji`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `emoji` в формате `string`.
- Возвращает: `Promise<ReactionResult>`
  - Описание: Промис с результатом операции в формате `ReactionResult`.

## `frontend/src/adapters/apiService/approveJoinRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function approveJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `approveJoinRequest`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `requestId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор заявки.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `approve join request`.

## `frontend/src/adapters/apiService/banMember.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function banMember( apiClient: AxiosInstance, roomId: string, userId: number, reason?: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `banMember`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
  - `reason`
    - Формат: `string`
    - Вид: необязательный
    - Описание: Причина административного действия.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `ban member`.

## `frontend/src/adapters/apiService/blockUser.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function blockUser( apiClient: AxiosInstance, publicRef: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `blockUser`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `publicRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `block user`.

## `frontend/src/adapters/apiService/cancelOutgoingFriendRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function cancelOutgoingFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `cancelOutgoingFriendRequest`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `friendshipId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор связи дружбы.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `cancel outgoing friend request`.

## `frontend/src/adapters/apiService/createGroup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function createGroup( apiClient: AxiosInstance, data: { name: string; description?: string; isPublic?: boolean; username?: string | null; }, ): Promise<Group> {`

- Вид: асинхронная функция
- Кратко: Асинхронно создаёт группы.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `data`
    - Формат: `{ name: string; description?: string; isPublic?: boolean; username?: string | null; }`
    - Вид: обязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<Group>`
  - Описание: Промис с результатом операции в формате `Group`.

## `frontend/src/adapters/apiService/createInvite.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function createInvite( apiClient: AxiosInstance, roomId: string, data?: { maxUses?: number; expiresInHours?: number }, ): Promise<GroupInvite> {`

- Вид: асинхронная функция
- Кратко: Асинхронно создаёт приглашение.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `data`
    - Формат: `{ maxUses?: number; expiresInHours?: number }`
    - Вид: необязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<GroupInvite>`
  - Описание: Промис с результатом операции в формате `GroupInvite`.

## `frontend/src/adapters/apiService/createRoomOverride.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function createRoomOverride( apiClient: AxiosInstance, roomId: string, data: { targetRoleId?: number; targetUserId?: number; allow?: number; deny?: number; }, ): Promise<PermissionOverride> {`

- Вид: асинхронная функция
- Кратко: Асинхронно создаёт комнаты override.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `data`
    - Формат: `{ targetRoleId?: number; targetUserId?: number; allow?: number; deny?: number; }`
    - Вид: обязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<PermissionOverride>`
  - Описание: Промис с результатом операции в формате `PermissionOverride`.

## `frontend/src/adapters/apiService/createRoomRole.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function createRoomRole( apiClient: AxiosInstance, roomId: string, data: { name: string; color?: string; permissions?: number }, ): Promise<Role> {`

- Вид: асинхронная функция
- Кратко: Асинхронно создаёт комнаты роли.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `data`
    - Формат: `{ name: string; color?: string; permissions?: number }`
    - Вид: обязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<Role>`
  - Описание: Промис с результатом операции в формате `Role`.

## `frontend/src/adapters/apiService/declineFriendRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function declineFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `declineFriendRequest`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `friendshipId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор связи дружбы.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `decline friend request`.

## `frontend/src/adapters/apiService/deleteGroup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function deleteGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Удаляет group.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `delete group`.

## `frontend/src/adapters/apiService/deleteMessage.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function deleteMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `deleteMessage`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `messageId` в формате `number`.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `delete message`.

## `frontend/src/adapters/apiService/deleteRoomOverride.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function deleteRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `deleteRoomOverride`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `overrideId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор переопределения прав.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `delete room override`.

## `frontend/src/adapters/apiService/deleteRoomRole.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function deleteRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `deleteRoomRole`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `roleId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор роли.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `delete room role`.

## `frontend/src/adapters/apiService/editMessage.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function editMessage( apiClient: AxiosInstance, roomId: string, messageId: number, content: string, ): Promise<EditMessageResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `editMessage`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор сообщения.
  - `content`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Текст сообщения.
- Возвращает: `Promise<EditMessageResult>`
  - Описание: Промис с результатом операции в формате `EditMessageResult`.

## `frontend/src/adapters/apiService/ensureCsrf.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function ensureCsrf( apiClient: AxiosInstance, ): Promise<{ csrfToken: string }> {`

- Вид: асинхронная функция
- Кратко: Гарантирует csrf.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/ensurePresenceSession.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function ensurePresenceSession( apiClient: AxiosInstance, ): Promise<{ ok: boolean; wsAuthToken: string | null }> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `ensurePresenceSession`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/getBannedMembers.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getBannedMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<BannedMembersResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронно возвращает заблокированные участников.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `params`
    - Формат: `{ limit?: number; before?: number }`
    - Вид: необязательный
    - Описание: Параметры запроса.
- Возвращает: `Promise<BannedMembersResult>`
  - Описание: Промис с результатом операции в формате `BannedMembersResult`.

## `frontend/src/adapters/apiService/getBlockedUsers.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getBlockedUsers( apiClient: AxiosInstance, ): Promise<BlockedUser[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getBlockedUsers`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<BlockedUser[]>`
  - Описание: Промис с результатом операции в формате `BlockedUser[]`.

## `frontend/src/adapters/apiService/getClientConfig.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const getClientConfig = async (apiClient: AxiosInstance) => {`

- Вид: функция
- Кратко: Функция `getClientConfig`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/adapters/apiService/getDirectChats.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const getDirectChats = async ( apiClient: AxiosInstance, ): Promise<DirectChatsResponse> => {`

- Вид: функция
- Кратко: Функция `getDirectChats`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<DirectChatsResponse>`
  - Описание: Промис с результатом операции в формате `DirectChatsResponse`.

## `frontend/src/adapters/apiService/getFriends.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getFriends(apiClient: AxiosInstance): Promise<Friend[]> {`

- Вид: асинхронная функция
- Кратко: Возвращает friends.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<Friend[]>`
  - Описание: Промис с результатом операции в формате `Friend[]`.

## `frontend/src/adapters/apiService/getGroupDetails.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getGroupDetails( apiClient: AxiosInstance, roomId: string, ): Promise<Group> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getGroupDetails`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<Group>`
  - Описание: Промис с результатом операции в формате `Group`.

## `frontend/src/adapters/apiService/getGroupMembers.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getGroupMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<GroupMembersResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронно возвращает группы участников.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `params`
    - Формат: `{ limit?: number; before?: number }`
    - Вид: необязательный
    - Описание: Параметры запроса.
- Возвращает: `Promise<GroupMembersResult>`
  - Описание: Промис с результатом операции в формате `GroupMembersResult`.

## `frontend/src/adapters/apiService/getIncomingRequests.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getIncomingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getIncomingRequests`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<FriendRequest[]>`
  - Описание: Промис с результатом операции в формате `FriendRequest[]`.

## `frontend/src/adapters/apiService/getInvitePreview.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getInvitePreview( apiClient: AxiosInstance, code: string, ): Promise<InvitePreview> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getInvitePreview`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `code`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Код приглашения.
- Возвращает: `Promise<InvitePreview>`
  - Описание: Промис с результатом операции в формате `InvitePreview`.

## `frontend/src/adapters/apiService/getInvites.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getInvites( apiClient: AxiosInstance, roomId: string, ): Promise<GroupInvite[]> {`

- Вид: асинхронная функция
- Кратко: Возвращает invites.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<GroupInvite[]>`
  - Описание: Промис с результатом операции в формате `GroupInvite[]`.

## `frontend/src/adapters/apiService/getJoinRequests.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getJoinRequests( apiClient: AxiosInstance, roomId: string, ): Promise<JoinRequest[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getJoinRequests`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<JoinRequest[]>`
  - Описание: Промис с результатом операции в формате `JoinRequest[]`.

## `frontend/src/adapters/apiService/getMemberRoles.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<MemberRoles> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getMemberRoles`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<MemberRoles>`
  - Описание: Промис с результатом операции в формате `MemberRoles`.

## `frontend/src/adapters/apiService/getMessageReaders.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getMessageReaders( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<MessageReadersResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getMessageReaders`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `messageId` в формате `number`.
- Возвращает: `Promise<MessageReadersResult>`
  - Описание: Промис с результатом операции в формате `MessageReadersResult`.

## `frontend/src/adapters/apiService/getMyGroups.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getMyGroups( apiClient: AxiosInstance, params?: { search?: string; limit?: number; before?: number }, ): Promise<{`

- Вид: асинхронная функция
- Кратко: Асинхронно возвращает my групп.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `params`
    - Формат: `{ search?: string; limit?: number; before?: number }`
    - Вид: необязательный
    - Описание: Параметры запроса.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/getMyPermissions.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getMyPermissions( apiClient: AxiosInstance, roomId: string, ): Promise<MyPermissions> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getMyPermissions`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
- Возвращает: `Promise<MyPermissions>`
  - Описание: Промис с результатом операции в формате `MyPermissions`.

## `frontend/src/adapters/apiService/getOutgoingRequests.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getOutgoingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getOutgoingRequests`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<FriendRequest[]>`
  - Описание: Промис с результатом операции в формате `FriendRequest[]`.

## `frontend/src/adapters/apiService/getPasswordRules.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getPasswordRules( apiClient: AxiosInstance, ): Promise<{ rules: string[] }> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getPasswordRules`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/getPinnedMessages.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getPinnedMessages( apiClient: AxiosInstance, roomId: string, ): Promise<PinnedMessage[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getPinnedMessages`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<PinnedMessage[]>`
  - Описание: Промис с результатом операции в формате `PinnedMessage[]`.

## `frontend/src/adapters/apiService/getPublicGroups.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getPublicGroups( apiClient: AxiosInstance, params?: PublicGroupsParams, ): Promise<PublicGroupsResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getPublicGroups`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `params`
    - Формат: `PublicGroupsParams`
    - Вид: необязательный
    - Описание: Параметры запроса.
- Возвращает: `Promise<PublicGroupsResult>`
  - Описание: Промис с результатом операции в формате `PublicGroupsResult`.

## `frontend/src/adapters/apiService/getRoomAttachments.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getRoomAttachments( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<RoomAttachmentsResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getRoomAttachments`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `params`
    - Формат: `{ limit?: number; before?: number }`
    - Вид: необязательный
    - Описание: Параметр `params` в формате `{ limit?: number; before?: number }`.
- Возвращает: `Promise<RoomAttachmentsResult>`
  - Описание: Промис с результатом операции в формате `RoomAttachmentsResult`.

## `frontend/src/adapters/apiService/getRoomDetails.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getRoomDetails( apiClient: AxiosInstance, roomTarget: string, ): Promise<RoomDetails> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getRoomDetails`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomTarget`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomTarget` в формате `string`.
- Возвращает: `Promise<RoomDetails>`
  - Описание: Промис с результатом операции в формате `RoomDetails`.

## `frontend/src/adapters/apiService/getRoomMessages.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getRoomMessages( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; beforeId?: number }, ): Promise<RoomMessagesResponse> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getRoomMessages`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `params`
    - Формат: `{ limit?: number; beforeId?: number }`
    - Вид: необязательный
    - Описание: Параметр `params` в формате `{ limit?: number; beforeId?: number }`.
- Возвращает: `Promise<RoomMessagesResponse>`
  - Описание: Промис с результатом операции в формате `RoomMessagesResponse`.

## `frontend/src/adapters/apiService/getRoomOverrides.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getRoomOverrides( apiClient: AxiosInstance, roomId: string, ): Promise<PermissionOverride[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getRoomOverrides`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<PermissionOverride[]>`
  - Описание: Промис с результатом операции в формате `PermissionOverride[]`.

## `frontend/src/adapters/apiService/getRoomRoles.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getRoomRoles( apiClient: AxiosInstance, roomId: string, ): Promise<Role[]> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getRoomRoles`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<Role[]>`
  - Описание: Промис с результатом операции в формате `Role[]`.

## `frontend/src/adapters/apiService/getSession.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getSession( apiClient: AxiosInstance, ): Promise<SessionResponse> {`

- Вид: асинхронная функция
- Кратко: Возвращает session.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<SessionResponse>`
  - Описание: Промис с результатом операции в формате `SessionResponse`.

## `frontend/src/adapters/apiService/getUserProfile.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function getUserProfile( apiClient: AxiosInstance, ref: string, ): Promise<{ user: UserProfile }> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `getUserProfile`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `ref`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `ref` в формате `string`.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/globalSearch.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function globalSearch( apiClient: AxiosInstance, query: string, params?: { usersLimit?: number; groupsLimit?: number; messagesLimit?: number; }, ): Promise<GlobalSearchResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронно выполняет поиск.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `query`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Поисковый запрос.
  - `params`
    - Формат: `{ usersLimit?: number; groupsLimit?: number; messagesLimit?: number; }`
    - Вид: необязательный
    - Описание: Параметры запроса.
- Возвращает: `Promise<GlobalSearchResult>`
  - Описание: Промис с результатом операции в формате `GlobalSearchResult`.

## `frontend/src/adapters/apiService/joinGroup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function joinGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `joinGroup`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `join group`.

## `frontend/src/adapters/apiService/joinViaInvite.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function joinViaInvite( apiClient: AxiosInstance, code: string, ): Promise<{ roomId: number; groupPublicRef?: string | null }> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `joinViaInvite`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `code`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Код приглашения.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/kickMember.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function kickMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `kickMember`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `kick member`.

## `frontend/src/adapters/apiService/leaveGroup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function leaveGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `leaveGroup`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `leave group`.

## `frontend/src/adapters/apiService/login.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function login( apiClient: AxiosInstance, identifier: string, password: string, ): Promise<SessionResponse> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `login`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `identifier`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор сущности, с которой выполняется операция.
  - `password`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Пароль пользователя.
- Возвращает: `Promise<SessionResponse>`
  - Описание: Промис с результатом операции в формате `SessionResponse`.

## `frontend/src/adapters/apiService/logout.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function logout( apiClient: AxiosInstance, ): Promise<{ ok: boolean }> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `logout`.
- Параметры: 1
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/markRead.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function markRead( apiClient: AxiosInstance, roomId: string, messageId?: number, ): Promise<ReadStateResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `markRead`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `messageId`
    - Формат: `number`
    - Вид: необязательный
    - Описание: Параметр `messageId` в формате `number`.
- Возвращает: `Promise<ReadStateResult>`
  - Описание: Промис с результатом операции в формате `ReadStateResult`.

## `frontend/src/adapters/apiService/muteMember.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function muteMember( apiClient: AxiosInstance, roomId: string, userId: number, durationSeconds = 3600, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `muteMember`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
  - `durationSeconds`
    - Формат: не указан
    - Вид: обязательный
    - Значение по умолчанию: `3600`
    - Описание: Длительность действия в секундах.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `mute member`.

## `frontend/src/adapters/apiService/oauthGoogle.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function oauthGoogle( apiClient: AxiosInstance, token: string, tokenType: "idToken" | "accessToken" = "idToken", username?: string, ): Promise<SessionResponse> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `oauthGoogle`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `token`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Токен аутентификации.
  - `tokenType`
    - Формат: `"idToken" | "accessToken"`
    - Вид: обязательный
    - Значение по умолчанию: `"idToken"`
    - Описание: Тип токена аутентификации.
  - `username`
    - Формат: `string`
    - Вид: необязательный
    - Описание: Имя пользователя.
- Возвращает: `Promise<SessionResponse>`
  - Описание: Промис с результатом операции в формате `SessionResponse`.

## `frontend/src/adapters/apiService/pinMessage.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function pinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `pinMessage`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор сообщения.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `pin message`.

## `frontend/src/adapters/apiService/register.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function register( apiClient: AxiosInstance, login: string, password: string, passwordConfirm: string, name: string, username?: string, email?: string, ): Promise<SessionResponse> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `register`.
- Параметры: 7
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `login`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `login` в формате `string`.
  - `password`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Пароль пользователя.
  - `passwordConfirm`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `passwordConfirm` в формате `string`.
  - `name`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Имя параметра или ключа, который используется в операции.
  - `username`
    - Формат: `string`
    - Вид: необязательный
    - Описание: Имя пользователя.
  - `email`
    - Формат: `string`
    - Вид: необязательный
    - Описание: Email пользователя.
- Возвращает: `Promise<SessionResponse>`
  - Описание: Промис с результатом операции в формате `SessionResponse`.

## `frontend/src/adapters/apiService/rejectJoinRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function rejectJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `rejectJoinRequest`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `requestId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор заявки.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `reject join request`.

## `frontend/src/adapters/apiService/removeFriend.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function removeFriend( apiClient: AxiosInstance, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Удаляет friend.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `remove friend`.

## `frontend/src/adapters/apiService/removeReaction.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function removeReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `removeReaction`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `messageId` в формате `number`.
  - `emoji`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `emoji` в формате `string`.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `remove reaction`.

## `frontend/src/adapters/apiService/resolveChatTarget.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const resolveChatTarget = async ( apiClient: AxiosInstance, target: string, ): Promise<ChatResolveResult> => {`

- Вид: функция
- Кратко: Функция `resolveChatTarget`.
- Детали: Используется как единая точка входа для навигации по `publicRef/publicId`, чтобы фронтенд не строил внутренние room-маршруты напрямую.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Сконфигурированный HTTP-клиент для обращения к backend API.
  - `target`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный target чата, пользователя или группы, который нужно разрешить.
- Возвращает: `Promise<ChatResolveResult>`
  - Описание: Полный результат resolve-операции с `roomId`, видом комнаты и публичными идентификаторами.

## `frontend/src/adapters/apiService/resolveRoomId.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function resolveRoomId( apiClient: AxiosInstance, roomTarget: string, ): Promise<string> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `resolveRoomId`.
- Детали: Если в функцию уже пришел числовой идентификатор, он только нормализуется. Для внешних target-значений сначала вызывается `/chat/resolve/`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Сконфигурированный HTTP-клиент для обращения к backend API.
  - `roomTarget`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Числовой room id или внешний target, который нужно разрешить.
- Возвращает: `Promise<string>`
  - Описание: Строковый идентификатор комнаты в каноническом формате.

## `frontend/src/adapters/apiService/revokeInvite.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function revokeInvite( apiClient: AxiosInstance, roomId: string, code: string, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `revokeInvite`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `code`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Код приглашения.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `revoke invite`.

## `frontend/src/adapters/apiService/searchMessages.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function searchMessages( apiClient: AxiosInstance, roomId: string, query: string, ): Promise<SearchResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `searchMessages`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `query`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `query` в формате `string`.
- Возвращает: `Promise<SearchResult>`
  - Описание: Промис с результатом операции в формате `SearchResult`.

## `frontend/src/adapters/apiService/sendFriendRequest.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function sendFriendRequest( apiClient: AxiosInstance, publicRef: string, ): Promise<SendFriendRequestResponse> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `sendFriendRequest`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `publicRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор пользователя.
- Возвращает: `Promise<SendFriendRequestResponse>`
  - Описание: Промис с результатом операции в формате `SendFriendRequestResponse`.

## `frontend/src/adapters/apiService/setMemberRoles.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function setMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, roleIds: number[], ): Promise<MemberRoles> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `setMemberRoles`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
  - `roleIds`
    - Формат: `number[]`
    - Вид: обязательный
    - Описание: Список идентификаторов ролей.
- Возвращает: `Promise<MemberRoles>`
  - Описание: Промис с результатом операции в формате `MemberRoles`.

## `frontend/src/adapters/apiService/transferOwnership.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function transferOwnership( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `transferOwnership`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `transfer ownership`.

## `frontend/src/adapters/apiService/unbanMember.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function unbanMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `unbanMember`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `unban member`.

## `frontend/src/adapters/apiService/unblockUser.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function unblockUser( apiClient: AxiosInstance, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `unblockUser`.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `unblock user`.

## `frontend/src/adapters/apiService/unmuteMember.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function unmuteMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `unmuteMember`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `userId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор пользователя.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `unmute member`.

## `frontend/src/adapters/apiService/unpinMessage.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function unpinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `unpinMessage`.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `messageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор сообщения.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `unpin message`.

## `frontend/src/adapters/apiService/updateGroup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function updateGroup( apiClient: AxiosInstance, roomId: string, data: UpdateGroupInput, ): Promise<Group> {`

- Вид: асинхронная функция
- Кратко: Обновляет group.
- Параметры: 3
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `data`
    - Формат: `UpdateGroupInput`
    - Вид: обязательный
    - Описание: Входные данные операции.
- Возвращает: `Promise<Group>`
  - Описание: Промис с результатом операции в формате `Group`.

## `frontend/src/adapters/apiService/updateProfile.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function updateProfile( apiClient: AxiosInstance, fields: UpdateProfileInput, ): Promise<{ user: UserProfile }> {`

- Вид: асинхронная функция
- Кратко: Обновляет profile.
- Параметры: 2
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `fields`
    - Формат: `UpdateProfileInput`
    - Вид: обязательный
    - Описание: Набор полей для обновления.
- Возвращает: `Promise<`
  - Описание: Результат функции в формате `Promise<`.

## `frontend/src/adapters/apiService/updateRoomOverride.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function updateRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, data: Partial<{ allow: number; deny: number }>, ): Promise<PermissionOverride> {`

- Вид: асинхронная функция
- Кратко: Асинхронно обновляет комнаты override.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `overrideId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор переопределения прав.
  - `data`
    - Формат: `Partial<{ allow: number; deny: number }>`
    - Вид: обязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<PermissionOverride>`
  - Описание: Промис с результатом операции в формате `PermissionOverride`.

## `frontend/src/adapters/apiService/updateRoomRole.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export async function updateRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, data: Partial<{ name: string; color: string; permissions: number; position: number; }>, ): Promise<Role> {`

- Вид: асинхронная функция
- Кратко: Асинхронно обновляет комнаты роли.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: HTTP-клиент для выполнения API-запросов.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
  - `roleId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Идентификатор роли.
  - `data`
    - Формат: `Partial<{ name: string; color: string; permissions: number; position: number; }>`
    - Вид: обязательный
    - Описание: Данные запроса или полезная нагрузка операции.
- Возвращает: `Promise<Role>`
  - Описание: Промис с результатом операции в формате `Role`.

## `frontend/src/adapters/apiService/uploadAttachments.ts`

- Экспортируемые объявления: 4

### Объявления

#### `export const ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS = 120_000;`

- Вид: константа
- Кратко: Хранит константное значение `ATTACHMENT_UPLOAD_IDLE_TIMEOUT_MS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const ATTACHMENT_UPLOAD_PROCESSING_TIMEOUT_MS = 300_000;`

- Вид: константа
- Кратко: Хранит константное значение `ATTACHMENT_UPLOAD_PROCESSING_TIMEOUT_MS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const ATTACHMENT_UPLOAD_MAX_RECOVERY_ATTEMPTS = 2;`

- Вид: константа
- Кратко: Хранит константное значение `ATTACHMENT_UPLOAD_MAX_RECOVERY_ATTEMPTS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export async function uploadAttachments( apiClient: AxiosInstance, roomId: string, files: File[], options?: UploadAttachmentsOptions, ): Promise<UploadResult> {`

- Вид: асинхронная функция
- Кратко: Асинхронная функция `uploadAttachments`.
- Параметры: 4
  - `apiClient`
    - Формат: `AxiosInstance`
    - Вид: обязательный
    - Описание: Параметр `apiClient` в формате `AxiosInstance`.
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `files`
    - Формат: `File[]`
    - Вид: обязательный
    - Описание: Параметр `files` в формате `File[]`.
  - `options`
    - Формат: `UploadAttachmentsOptions`
    - Вид: необязательный
    - Описание: Объект опций в формате `UploadAttachmentsOptions`.
- Возвращает: `Promise<UploadResult>`
  - Описание: Промис с результатом операции в формате `UploadResult`.

## `frontend/src/adapters/ApiService.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const normalizeAxiosError = (error: unknown): ApiError => {`

- Вид: функция
- Кратко: Функция `normalizeAxiosError`.
- Параметры: 1
  - `error`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Объект ошибки, полученный в обработчике.
- Возвращает: `ApiError`
  - Описание: Нормализованное значение после обработки входа.

#### `export const apiService = new ApiService();`

- Вид: константа
- Кратко: Экспорт `apiService` предоставляет инициализированный экземпляр для повторного использования в модуле.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/app/App.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function App() {`

- Вид: функция
- Кратко: React-компонент `App`.
- Параметры: нет
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `App`.

## `frontend/src/app/routes.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AppRoutes({ user, error, passwordRules, googleAuthDisabledReason, onNavigate, onLogin, onGoogleOAuth, onRegister, onLogout, onProfileSave, }: AppRoutesProps) {`

- Вид: функция
- Кратко: React-компонент `AppRoutes`.
- Детали: Компонент принимает готовые auth- и navigation-колбэки из верхнего уровня, а затем прокидывает их в конкретные страницы: вход, регистрацию, профиль, настройки, друзей, группы, приглашения и канонический маршрут чата по target.
- Параметры: 1
  - `{ user, error, passwordRules, googleAuthDisabledReason, onNavigate, onLogin, onGoogleOAuth, onRegister, onLogout, onProfileSave, }`
    - Формат: `AppRoutesProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `AppRoutesProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AppRoutes`.

## `frontend/src/App.tsx`

- Экспортируемые объявления: 0

## `frontend/src/controllers/AuthController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const authController = new AuthController();`

- Вид: константа
- Кратко: Хранит константное значение `authController`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/controllers/ChatController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const chatController = new ChatController();`

- Вид: константа
- Кратко: Экспорт `chatController` предоставляет инициализированный экземпляр для повторного использования в модуле.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/controllers/FriendsController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const friendsController = new FriendsController();`

- Вид: константа
- Кратко: Экспорт `friendsController` предоставляет инициализированный экземпляр для повторного использования в модуле.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/controllers/GroupController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const groupController = new GroupController();`

- Вид: константа
- Кратко: Экспорт `groupController` предоставляет инициализированный экземпляр для повторного использования в модуле.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/controllers/RolesController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const rolesController = new RolesController();`

- Вид: константа
- Кратко: Хранит константное значение `rolesController`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/domain/interfaces/IApiService.ts`

- Экспортируемые объявления: 0

## `frontend/src/dto/core/codec.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const decodeOrThrow = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, source: string, ): z.infer<TSchema> => {`

- Вид: функция
- Кратко: Функция `decodeOrThrow`.
- Параметры: 3
  - `schema`
    - Формат: `TSchema`
    - Вид: обязательный
    - Описание: Схема валидации входных данных.
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
  - `source`
    - Формат: `string`
    - Вид: обязательный
    - Описание: DOM-событие, вызвавшее обработчик.
- Возвращает: `z.infer<TSchema>`
  - Описание: Нормализованные данные после декодирования.

#### `export const safeDecode = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, ): z.infer<TSchema> | null => {`

- Вид: функция
- Кратко: Функция `safeDecode`.
- Параметры: 2
  - `schema`
    - Формат: `TSchema`
    - Вид: обязательный
    - Описание: Схема валидации входных данных.
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: `z.infer<TSchema> | null`
  - Описание: Нормализованные данные после декодирования.

#### `export const parseJson = (raw: string): unknown | null => {`

- Вид: функция
- Кратко: Функция `parseJson`.
- Параметры: 1
  - `raw`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Сырые входные данные до нормализации.
- Возвращает: `unknown | null`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/core/errors.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export class DtoDecodeError extends Error {`

- Вид: класс
- Кратко: Класс DtoDecodeError инкапсулирует логику текущего слоя приложения.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/dto/http/auth.ts`

- Экспортируемые объявления: 12

### Объявления

#### `export const decodeCsrfResponse = (input: unknown) =>`

- Вид: функция
- Кратко: Функция `decodeCsrfResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodePresenceSessionResponse = ( input: unknown, ): {`

- Вид: константа
- Кратко: Хранит константное значение `decodePresenceSessionResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodePasswordRulesResponse = (input: unknown) =>`

- Вид: функция
- Кратко: Функция `decodePasswordRulesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeLogoutResponse = (input: unknown) =>`

- Вид: функция
- Кратко: Функция `decodeLogoutResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeSessionResponse = (input: unknown): SessionResponseDto => {`

- Вид: функция
- Кратко: Функция `decodeSessionResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `SessionResponseDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeProfileEnvelopeResponse = ( input: unknown, ): ProfileEnvelopeDto => {`

- Вид: функция
- Кратко: Функция `decodeProfileEnvelopeResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `ProfileEnvelopeDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeAuthErrorPayload = ( input: unknown, ): AuthErrorPayloadDto | null => safeDecode(errorPayloadSchema, input);`

- Вид: функция
- Кратко: Функция `decodeAuthErrorPayload`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `AuthErrorPayloadDto | null`
  - Описание: Нормализованные данные после декодирования.

#### `export const buildLoginRequestDto = (input: unknown): LoginRequestDto =>`

- Вид: функция
- Кратко: Функция `buildLoginRequestDto`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `LoginRequestDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const buildRegisterRequestDto = (input: unknown): RegisterRequestDto =>`

- Вид: функция
- Кратко: Функция `buildRegisterRequestDto`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `RegisterRequestDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const buildOAuthGoogleRequestDto = ( input: unknown, ): OAuthGoogleRequestDto =>`

- Вид: функция
- Кратко: Функция `buildOAuthGoogleRequestDto`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `OAuthGoogleRequestDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const buildUpdateProfileRequestDto = ( input: unknown, ): UpdateProfileRequestDto =>`

- Вид: функция
- Кратко: Функция `buildUpdateProfileRequestDto`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `UpdateProfileRequestDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const validatePublicUsername = (username: string): string =>`

- Вид: функция
- Кратко: Функция `validatePublicUsername`.
- Детали: Функция использует ту же схему, что и сетевой контракт фронтенда: отбрасывает недопустимые значения и гарантирует строковый результат, пригодный для регистрации, профиля и поиска.
- Параметры: 1
  - `username`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Строка, которую пользователь хочет использовать как публичный username.
- Возвращает: `string`
  - Описание: Проверенный username в каноническом формате.

## `frontend/src/dto/http/chat.ts`

- Экспортируемые объявления: 12

### Объявления

#### `export const decodeRoomDetailsResponse = (input: unknown): RoomDetails => {`

- Вид: функция
- Кратко: Функция `decodeRoomDetailsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `RoomDetails`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeRoomMessagesResponse = (input: unknown): RoomMessagesDto => {`

- Вид: функция
- Кратко: Функция `decodeRoomMessagesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `RoomMessagesDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeChatResolveResponse = ( input: unknown, ): ChatResolveResponseDto => {`

- Вид: функция
- Кратко: Функция `decodeChatResolveResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Параметр `input` произвольного формата.
- Возвращает: `ChatResolveResponseDto`
  - Описание: Результат функции в формате `ChatResolveResponseDto`.

#### `export const decodeDirectChatsResponse = ( input: unknown, ): DirectChatsResponseDto => {`

- Вид: функция
- Кратко: Функция `decodeDirectChatsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `DirectChatsResponseDto`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeEditMessageResponse = ( input: unknown, ): EditMessageResponse => {`

- Вид: функция
- Кратко: Функция `decodeEditMessageResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `EditMessageResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeReactionResponse = (input: unknown): ReactionResponse => {`

- Вид: функция
- Кратко: Функция `decodeReactionResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `ReactionResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeSearchResponse = (input: unknown): SearchResponse => {`

- Вид: функция
- Кратко: Функция `decodeSearchResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `SearchResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeUploadResponse = (input: unknown): UploadResponse => {`

- Вид: функция
- Кратко: Функция `decodeUploadResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `UploadResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeReadStateResponse = (input: unknown): ReadStateResponse => {`

- Вид: функция
- Кратко: Функция `decodeReadStateResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `ReadStateResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeMessageReadersResponse = ( input: unknown, ): MessageReadersResponse => {`

- Вид: функция
- Кратко: Функция `decodeMessageReadersResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `MessageReadersResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeRoomAttachmentsResponse = ( input: unknown, ): RoomAttachmentsResponse => {`

- Вид: функция
- Кратко: Функция `decodeRoomAttachmentsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `RoomAttachmentsResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeGlobalSearchResponse = ( input: unknown, ): GlobalSearchResponse => {`

- Вид: функция
- Кратко: Функция `decodeGlobalSearchResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `GlobalSearchResponse`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/http/friends.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const decodeFriendsListResponse = (input: unknown): Friend[] => {`

- Вид: функция
- Кратко: Функция `decodeFriendsListResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `Friend[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeIncomingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`

- Вид: функция
- Кратко: Функция `decodeIncomingRequestsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `FriendRequest[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeOutgoingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`

- Вид: функция
- Кратко: Функция `decodeOutgoingRequestsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `FriendRequest[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeSendFriendRequestResponse = ( input: unknown, ): SendFriendRequestResponse => {`

- Вид: функция
- Кратко: Функция `decodeSendFriendRequestResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `SendFriendRequestResponse`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeBlockResponse = (input: unknown): BlockedUser => {`

- Вид: функция
- Кратко: Функция `decodeBlockResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `BlockedUser`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeBlockedListResponse = (input: unknown): BlockedUser[] => {`

- Вид: функция
- Кратко: Функция `decodeBlockedListResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `BlockedUser[]`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/http/groups.ts`

- Экспортируемые объявления: 9

### Объявления

#### `export const decodeGroupResponse = (input: unknown): Group =>`

- Вид: функция
- Кратко: Функция `decodeGroupResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `Group`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeGroupListResponse = ( input: unknown, ): {`

- Вид: константа
- Кратко: Хранит константное значение `decodeGroupListResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Параметр `input` произвольного формата.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeGroupMembersResponse = ( input: unknown, ): {`

- Вид: константа
- Кратко: Хранит константное значение `decodeGroupMembersResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Параметр `input` произвольного формата.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeInvitesResponse = (input: unknown): GroupInvite[] => {`

- Вид: функция
- Кратко: Функция `decodeInvitesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `GroupInvite[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeInviteResponse = (input: unknown): GroupInvite => {`

- Вид: функция
- Кратко: Функция `decodeInviteResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `GroupInvite`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeInvitePreviewResponse = (input: unknown): InvitePreview => {`

- Вид: функция
- Кратко: Функция `decodeInvitePreviewResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `InvitePreview`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeJoinRequestsResponse = (input: unknown): JoinRequest[] => {`

- Вид: функция
- Кратко: Функция `decodeJoinRequestsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `JoinRequest[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodePinnedMessagesResponse = ( input: unknown, ): PinnedMessage[] => {`

- Вид: функция
- Кратко: Функция `decodePinnedMessagesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `PinnedMessage[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeBannedMembersResponse = ( input: unknown, ): {`

- Вид: константа
- Кратко: Хранит константное значение `decodeBannedMembersResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Параметр `input` произвольного формата.
- Возвращает: не указан
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/http/meta.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const decodeClientConfigResponse = ( input: unknown, ): ClientRuntimeConfig =>`

- Вид: функция
- Кратко: Функция `decodeClientConfigResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `ClientRuntimeConfig`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/http/roles.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const decodeRolesListResponse = (input: unknown): Role[] => {`

- Вид: функция
- Кратко: Функция `decodeRolesListResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `Role[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeRoleResponse = (input: unknown): Role => {`

- Вид: функция
- Кратко: Функция `decodeRoleResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `Role`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeMemberRolesResponse = (input: unknown): MemberRoles => {`

- Вид: функция
- Кратко: Функция `decodeMemberRolesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `MemberRoles`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeOverridesResponse = ( input: unknown, ): PermissionOverride[] => {`

- Вид: функция
- Кратко: Функция `decodeOverridesResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `PermissionOverride[]`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeOverrideResponse = (input: unknown): PermissionOverride => {`

- Вид: функция
- Кратко: Функция `decodeOverrideResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `PermissionOverride`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeMyPermissionsResponse = (input: unknown): MyPermissions => {`

- Вид: функция
- Кратко: Функция `decodeMyPermissionsResponse`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
- Возвращает: `MyPermissions`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/dto/input/route.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const decodeRoomRefParam = (value: unknown): string | null => {`

- Вид: функция
- Кратко: Функция `decodeRoomRefParam`.
- Параметры: 1
  - `value`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string | null`
  - Описание: Строковое значение результата.

#### `export const decodePublicRefParam = (value: unknown): string | null => {`

- Вид: функция
- Кратко: Функция `decodePublicRefParam`.
- Параметры: 1
  - `value`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string | null`
  - Описание: Строковое значение результата.

## `frontend/src/dto/input/storage.ts`

- Экспортируемые объявления: 4

### Объявления

#### `export const readCookieValue = ( cookie: string | null | undefined, name: string, ): string | null => {`

- Вид: функция
- Кратко: Функция `readCookieValue`.
- Параметры: 2
  - `cookie`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Строка `document.cookie` или ее часть.
  - `name`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Имя cookie, которое нужно найти.
- Возвращает: `string | null`
  - Описание: Значение cookie либо `null`, если ключ отсутствует или значение не прошло проверку.

#### `export const readCsrfFromCookie = (): string | null => {`

- Вид: функция
- Кратко: Функция `readCsrfFromCookie`.
- Параметры: нет
- Возвращает: `string | null`
  - Описание: Нормализованное значение CSRF-токена или `null`, если токен недоступен.

#### `export const readCsrfFromSessionStorage = ( storageKey: string, ): string | null => {`

- Вид: функция
- Кратко: Функция `readCsrfFromSessionStorage`.
- Параметры: 1
  - `storageKey`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Ключ, под которым токен хранится в браузерной сессии.
- Возвращает: `string | null`
  - Описание: Нормализованный токен или `null`, если запись отсутствует либо повреждена.

#### `export const writeCsrfToSessionStorage = ( storageKey: string, token: string | null, ): void => {`

- Вид: функция
- Кратко: Функция `writeCsrfToSessionStorage`.
- Параметры: 2
  - `storageKey`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Ключ, под которым токен хранится в `sessionStorage`.
  - `token`
    - Формат: `string | null`
    - Вид: обязательный
    - Описание: Новый CSRF-токен или `null`, если сохраненное значение нужно удалить.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

## `frontend/src/dto/input/swMessage.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const encodeSwCacheMessage = (input: unknown): SwCacheMessage => {`

- Вид: функция
- Кратко: Функция `encodeSwCacheMessage`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: `SwCacheMessage`
  - Описание: Нормализованные данные после декодирования.

#### `export const decodeSwCacheMessage = (input: unknown): SwCacheMessage | null => {`

- Вид: функция
- Кратко: Функция `decodeSwCacheMessage`.
- Параметры: 1
  - `input`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входные данные для валидации и преобразования.
- Возвращает: `SwCacheMessage | null`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/ws/chat.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const decodeChatWsEvent = (raw: string): ChatWsEvent => {`

- Вид: функция
- Кратко: Функция `decodeChatWsEvent`.
- Параметры: 1
  - `raw`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Сырые входные данные до нормализации.
- Возвращает: `ChatWsEvent`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/ws/directInbox.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const decodeDirectInboxWsEvent = (raw: string): DirectInboxWsEvent => {`

- Вид: функция
- Кратко: Функция `decodeDirectInboxWsEvent`.
- Параметры: 1
  - `raw`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Сырые входные данные до нормализации.
- Возвращает: `DirectInboxWsEvent`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/dto/ws/presence.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const decodePresenceWsEvent = (raw: string): PresenceWsEvent => {`

- Вид: функция
- Кратко: Функция `decodePresenceWsEvent`.
- Параметры: 1
  - `raw`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Сырые входные данные до нормализации.
- Возвращает: `PresenceWsEvent`
  - Описание: Нормализованные данные после декодирования.

## `frontend/src/entities/conversation/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/entities/friend/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/entities/group/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/entities/message/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/entities/role/bitmask.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const hasPermissionFlag = (mask: number, flag: number): boolean => {`

- Вид: функция
- Кратко: Проверяет, присутствует ли конкретный permission-флаг в битовой маске.
- Параметры: 2
  - `mask`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Битовая маска разрешений.
  - `flag`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Флаг разрешения, наличие которого нужно проверить.
- Возвращает: `boolean`
  - Описание: `true`, если указанный флаг полностью содержится в маске.

#### `export const combinePermissionFlags = (flags: Iterable<number>): number => {`

- Вид: функция
- Кратко: Объединяет набор флагов прав доступа в одну битовую маску для передачи в API и хранения в локальном состоянии.
- Параметры: 1
  - `flags`
    - Формат: `Iterable<number>`
    - Вид: обязательный
    - Описание: Набор числовых флагов прав доступа.
- Возвращает: `number`
  - Описание: Итоговая битовая маска, в которой выставлены все переданные флаги.

#### `export const flagsFromMask = ( mask: number, flags: readonly number[], ): number[] => flags.filter((flag) => hasPermissionFlag(mask, flag));`

- Вид: функция
- Кратко: Возвращает только те флаги, которые реально присутствуют в переданной битовой маске.
- Параметры: 2
  - `mask`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Битовая маска разрешений.
  - `flags`
    - Формат: `readonly number[]`
    - Вид: обязательный
    - Описание: Список флагов, которые нужно проверить на наличие в маске.
- Возвращает: `number[]`
  - Описание: Подмножество исходных флагов, найденных в `mask`.

## `frontend/src/entities/role/types.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const Perm = {`

- Вид: константа
- Кратко: Хранит константное значение `Perm`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/entities/room/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/entities/user/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/hooks/useAuth.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useAuth = () => {`

- Вид: функция
- Кратко: Хук useAuth управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useChatRoom.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useChatRoom = ( roomId: string, user: UserProfileDto | null, initialRoomKind: RoomKind | null = null, ) => {`

- Вид: функция
- Кратко: Хук `useChatRoom`.
- Параметры: 3
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `user`
    - Формат: `UserProfileDto | null`
    - Вид: обязательный
    - Описание: Параметр `user` в формате `UserProfileDto | null`.
  - `initialRoomKind`
    - Формат: `RoomKind | null`
    - Вид: обязательный
    - Значение по умолчанию: `null`
    - Описание: Параметр `initialRoomKind` в формате `RoomKind | null`.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useFriends.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useFriends(): UseFriendsResult {`

- Вид: функция
- Кратко: Хук useFriends управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: `UseFriendsResult`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/hooks/useGroupDetails.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useGroupDetails(roomId: string): UseGroupDetailsResult {`

- Вид: функция
- Кратко: Хук useGroupDetails управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `UseGroupDetailsResult`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/hooks/useGroupList.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useGroupList(): UseGroupListResult {`

- Вид: функция
- Кратко: Хук useGroupList управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: `UseGroupListResult`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/hooks/useKeyboardShortcuts.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useKeyboardShortcuts({ roomId }: Options = {}) {`

- Вид: функция
- Кратко: Хук useKeyboardShortcuts управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `{ roomId }`
    - Формат: `Options`
    - Вид: обязательный
    - Значение по умолчанию: `{}`
    - Описание: Объект параметров в формате `Options`.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useOnlineStatus.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useOnlineStatus = () => {`

- Вид: функция
- Кратко: Хук useOnlineStatus управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/usePasswordRules.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const usePasswordRules = (enabled: boolean) => {`

- Вид: функция
- Кратко: Хук usePasswordRules управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `enabled`
    - Формат: `boolean`
    - Вид: обязательный
    - Описание: Флаг включения поведения.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useReconnectingWebSocket.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useReconnectingWebSocket = (options: WebSocketOptions) => {`

- Вид: функция
- Кратко: Хук useReconnectingWebSocket управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `options`
    - Формат: `WebSocketOptions`
    - Вид: обязательный
    - Описание: Опциональные параметры поведения.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useRoomPermissions.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useRoomPermissions( roomId: string | null, ): UseRoomPermissionsResult {`

- Вид: функция
- Кратко: Хук useRoomPermissions управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `roomId`
    - Формат: `string | null`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `UseRoomPermissionsResult`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/hooks/useTypingIndicator.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useTypingIndicator(send: (data: string) => boolean) {`

- Вид: функция
- Кратко: Хук useTypingIndicator управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `send`
    - Формат: `(data: string)`
    - Вид: обязательный
    - Значение по умолчанию: `> boolean`
    - Описание: Параметр `send` в формате `(data: string)`.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/hooks/useUserProfile.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useUserProfile = (publicRef: string) => {`

- Вид: функция
- Кратко: Хук useUserProfile управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `publicRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор пользователя.
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/main.tsx`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/ChatHeaderSearchPopover.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ChatHeaderSearchPopover({ anchorRef, layerRef, isOpen, className, children, }: Props) {`

- Вид: функция
- Кратко: React-компонент `ChatHeaderSearchPopover`.
- Параметры: 1
  - `{ anchorRef, layerRef, isOpen, className, children, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: Верхний слой поиска или `null`, если поиск закрыт.

## `frontend/src/pages/chatRoomPage/ChatRoomPageView.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ChatRoomPageView({ controller, onNavigate, user, }: ChatRoomPageViewProps) {`

- Вид: функция
- Кратко: Презентационный слой страницы комнаты.
- Параметры: 1
  - `{ controller, onNavigate, user, }`
    - Формат: `ChatRoomPageViewProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ChatRoomPageViewProps`.
- Возвращает: не указан
  - Описание: Полная разметка страницы комнаты.

## `frontend/src/pages/chatRoomPage/ChatRoomPageView.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/mediaLightbox.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const buildChatLightboxMediaItems = ( messages: Message[], ): ImageLightboxMediaItem[] => {`

- Вид: функция
- Кратко: Функция `buildChatLightboxMediaItems`.
- Параметры: 1
  - `messages`
    - Формат: `Message[]`
    - Вид: обязательный
    - Описание: Параметр `messages` в формате `Message[]`.
- Возвращает: `ImageLightboxMediaItem[]`
  - Описание: Результат функции в формате `ImageLightboxMediaItem[]`.

#### `export const findLightboxMediaIndex = ( mediaItems: ImageLightboxMediaItem[], attachmentId: number | null, ): number => {`

- Вид: функция
- Кратко: Функция `findLightboxMediaIndex`.
- Параметры: 2
  - `mediaItems`
    - Формат: `ImageLightboxMediaItem[]`
    - Вид: обязательный
    - Описание: Параметр `mediaItems` в формате `ImageLightboxMediaItem[]`.
  - `attachmentId`
    - Формат: `number | null`
    - Вид: обязательный
    - Описание: Параметр `attachmentId` в формате `number | null`.
- Возвращает: `number`
  - Описание: Числовое значение результата.

#### `export const buildChatLightboxSession = ( messages: Message[], attachmentId: number, ): ChatLightboxSession | null => {`

- Вид: функция
- Кратко: Функция `buildChatLightboxSession`.
- Параметры: 2
  - `messages`
    - Формат: `Message[]`
    - Вид: обязательный
    - Описание: Параметр `messages` в формате `Message[]`.
  - `attachmentId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `attachmentId` в формате `number`.
- Возвращает: `ChatLightboxSession | null`
  - Описание: Результат функции в формате `ChatLightboxSession | null`.

## `frontend/src/pages/chatRoomPage/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageComposer.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageComposer({ roomIdForRequests, user, messages, maxMessageLength, maxAttachmentPerMessage, maxAttachmentSizeBytes, maxAttachmentSizeMb, isCurrentUserSuperuser, currentActorRef, isOnline, status, send, rateLimitActive, reload, refreshRoomPermissions, jumpToMessageById, updateUnreadDividerAnchor,`

- Вид: функция
- Кратко: Управляет состоянием composer и мутациями сообщений страницы комнаты.
- Параметры: нет
- Возвращает: не указан
  - Описание: Публичное состояние composer и набор обработчиков.

## `frontend/src/pages/chatRoomPage/useChatRoomPageComposer.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageController.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageController({ roomId, initialRoomKind = null, user, }: UseChatRoomPageControllerOptions): ChatRoomPageController {`

- Вид: функция
- Кратко: Хук `useChatRoomPageController`.
- Параметры: 1
  - `{ roomId, initialRoomKind = null, user, }`
    - Формат: `UseChatRoomPageControllerOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageControllerOptions`.
- Возвращает: `ChatRoomPageController`
  - Описание: Структурированные slices для презентационного слоя.

## `frontend/src/pages/chatRoomPage/useChatRoomPageController.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageHeaderSearch.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageHeaderSearch({ roomIdForRequests, jumpToMessageById, setRoomError, }: UseChatRoomPageHeaderSearchOptions): UseChatRoomPageHeaderSearchResult {`

- Вид: функция
- Кратко: Управляет поиском по сообщениям в заголовке комнаты.
- Параметры: 1
  - `{ roomIdForRequests, jumpToMessageById, setRoomError, }`
    - Формат: `UseChatRoomPageHeaderSearchOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageHeaderSearchOptions`.
- Возвращает: `UseChatRoomPageHeaderSearchResult`
  - Описание: Ссылки, состояние и обработчики виджета поиска.

## `frontend/src/pages/chatRoomPage/useChatRoomPageHeaderSearch.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageReadState.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageReadState({ roomId, roomIdForRequests, roomApiRef, locationSearch, user, details, messages, loading, loadingMore, hasMore, error, loadMore, currentActorRef, resolvedRoomId, setActiveRoom, markDirectRoomRead, }: UseChatRoomPageReadStateOptions): UseChatRoomPageReadStateResult {`

- Вид: функция
- Кратко: Управляет прокруткой, непрочитанным разделителем и синхронизацией чтения.
- Параметры: 1
  - `{ roomId, roomIdForRequests, roomApiRef, locationSearch, user, details, messages, loading, loadingMore, hasMore, error, loadMore, currentActorRef, resolvedRoomId, setActiveRoom, markDirectRoomRead, }`
    - Формат: `UseChatRoomPageReadStateOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageReadStateOptions`.
- Возвращает: `UseChatRoomPageReadStateResult`
  - Описание: Ссылки на список, read-state и обработчики навигации.

## `frontend/src/pages/chatRoomPage/useChatRoomPageReadState.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageRealtime.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageRealtime({ wsUrl, roomIdForRequests, roomKind, maxMessageLength, currentActorRef, readStateEnabled, user, setMessages, setRoomError, onIncomingForeignMessage, }: UseChatRoomPageRealtimeOptions): UseChatRoomPageRealtimeResult {`

- Вид: функция
- Кратко: Хук `useChatRoomPageRealtime`.
- Параметры: 1
  - `{ wsUrl, roomIdForRequests, roomKind, maxMessageLength, currentActorRef, readStateEnabled, user, setMessages, setRoomError, onIncomingForeignMessage, }`
    - Формат: `UseChatRoomPageRealtimeOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageRealtimeOptions`.
- Возвращает: `UseChatRoomPageRealtimeResult`
  - Описание: Состояние транспорта, typing-индикаторы и read receipts.

## `frontend/src/pages/chatRoomPage/useChatRoomPageRealtime.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageUiActions.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageUiActions({ details, roomIdForRequests, openInfoPanel, openDrawer, }: UseChatRoomPageUiActionsOptions): UseChatRoomPageUiActionsResult {`

- Вид: функция
- Кратко: Собирает UI-обработчики для панели информации и мобильной навигации.
- Параметры: 1
  - `{ details, roomIdForRequests, openInfoPanel, openDrawer, }`
    - Формат: `UseChatRoomPageUiActionsOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageUiActionsOptions`.
- Возвращает: `UseChatRoomPageUiActionsResult`
  - Описание: Стабильные callbacks для презентационного слоя.

## `frontend/src/pages/chatRoomPage/useChatRoomPageUiActions.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useChatRoomPageViewModel.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useChatRoomPageViewModel({ details, roomIdForRequests, messages, unreadDividerRenderTarget, typingUsers, typingDisplayNames, readReceipts, currentActorRef, user, permissionsLoading, canWriteToRoom, canJoinRoom, presenceOnline, presenceStatus, readersMenu, }: UseChatRoomPageViewModelOptions): UseChatRoomPageViewModelResult {`

- Вид: функция
- Кратко: Собирает производные данные, нужные только для отображения страницы.
- Параметры: 1
  - `{ details, roomIdForRequests, messages, unreadDividerRenderTarget, typingUsers, typingDisplayNames, readReceipts, currentActorRef, user, permissionsLoading, canWriteToRoom, canJoinRoom, presenceOnline, presenceStatus, readersMenu, }`
    - Формат: `UseChatRoomPageViewModelOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseChatRoomPageViewModelOptions`.
- Возвращает: `UseChatRoomPageViewModelResult`
  - Описание: Мемозависимые данные для прямого рендера.

## `frontend/src/pages/chatRoomPage/useChatRoomPageViewModel.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/chatRoomPage/useFileDropZone.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useFileDropZone = ({ enabled, onFilesDrop }: Options): Result => {`

- Вид: функция
- Кратко: Хук useFileDropZone управляет состоянием и побочными эффектами текущего сценария.
- Параметры: 1
  - `{ enabled, onFilesDrop }`
    - Формат: `Options`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Options`.
- Возвращает: `Result`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/pages/chatRoomPage/utils.ts`

- Экспортируемые объявления: 19

### Объявления

#### `export const TYPING_TIMEOUT_MS = 5_000;`

- Вид: константа
- Кратко: Хранит константное значение `TYPING_TIMEOUT_MS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const MAX_HISTORY_JUMP_ATTEMPTS = 60;`

- Вид: константа
- Кратко: Хранит константное значение `MAX_HISTORY_JUMP_ATTEMPTS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const MAX_HISTORY_NO_PROGRESS_ATTEMPTS = 2;`

- Вид: константа
- Кратко: Хранит константное значение `MAX_HISTORY_NO_PROGRESS_ATTEMPTS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const MARK_READ_DEBOUNCE_MS = 180;`

- Вид: константа
- Кратко: Хранит константное значение `MARK_READ_DEBOUNCE_MS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const normalizeActorRef = (value: string | null | undefined): string => {`

- Вид: функция
- Кратко: Функция `normalizeActorRef`.
- Параметры: 1
  - `value`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string`
  - Описание: Нормализованное значение после обработки входа.

#### `export const resolveCurrentActorRef = (user: UserProfile | null): string => {`

- Вид: функция
- Кратко: Функция `resolveCurrentActorRef`.
- Параметры: 1
  - `user`
    - Формат: `UserProfile | null`
    - Вид: обязательный
    - Описание: Пользователь текущего контекста.
- Возвращает: `string`
  - Описание: Разрешенное значение с учетом fallback-логики.

#### `export const resolveMessageActorRef = ( message: Pick<Message, "publicRef">, ): string => normalizeActorRef(message.publicRef);`

- Вид: функция
- Кратко: Функция `resolveMessageActorRef`.
- Параметры: 1
  - `message`
    - Формат: `Pick<Message, "publicRef">`
    - Вид: обязательный
    - Описание: Параметр `message` в формате `Pick<Message, "publicRef">`.
- Возвращает: `string`
  - Описание: Разрешенное значение с учетом fallback-логики.

#### `export const isOwnMessage = (message: Message, currentActorRef: string) =>`

- Вид: функция
- Кратко: Функция `isOwnMessage`.
- Параметры: 2
  - `message`
    - Формат: `Message`
    - Вид: обязательный
    - Описание: Текст сообщения.
  - `currentActorRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор текущего пользователя.
- Возвращает: не указан
  - Описание: Логический флаг результата проверки.

#### `export const normalizeReadMessageId = (value: unknown): number => {`

- Вид: функция
- Кратко: Функция `normalizeReadMessageId`.
- Параметры: 1
  - `value`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `number`
  - Описание: Нормализованное значение после обработки входа.

#### `export const parseRoomIdRef = (value: unknown): number | null => {`

- Вид: функция
- Кратко: Функция `parseRoomIdRef`.
- Параметры: 1
  - `value`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `number | null`
  - Описание: Числовое значение результата.

#### `export const isFileDragPayload = ( dataTransfer: DataTransfer | null | undefined, ): boolean => {`

- Вид: функция
- Кратко: Функция `isFileDragPayload`.
- Параметры: 1
  - `dataTransfer`
    - Формат: `DataTransfer | null | undefined`
    - Вид: обязательный
    - Описание: Объект DataTransfer из drag-and-drop события.
- Возвращает: `boolean`
  - Описание: Булев результат проверки условия.

#### `export const readPendingReadFromStorage = (roomId: string): number => {`

- Вид: функция
- Кратко: Функция `readPendingReadFromStorage`.
- Параметры: 1
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `number`
  - Описание: Прочитанные данные из источника.

#### `export const writePendingReadToStorage = ( roomId: string, lastReadMessageId: number, ): void => {`

- Вид: функция
- Кратко: Функция `writePendingReadToStorage`.
- Параметры: 2
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
  - `lastReadMessageId`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `lastReadMessageId` в формате `number`.
- Возвращает: `void`
  - Описание: Ничего не возвращает.

#### `export const clearPendingReadFromStorage = (roomId: string): void => {`

- Вид: функция
- Кратко: Функция `clearPendingReadFromStorage`.
- Параметры: 1
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор комнаты.
- Возвращает: `void`
  - Описание: Ничего не возвращает.

#### `export const resolveCsrfToken = (): string | null => {`

- Вид: функция
- Кратко: Функция `resolveCsrfToken`.
- Параметры: нет
- Возвращает: `string | null`
  - Описание: Строковое значение результата.

#### `export const extractApiErrorMessage = ( error: unknown, fallback: string, ): string => {`

- Вид: функция
- Кратко: Функция `extractApiErrorMessage`.
- Параметры: 2
  - `error`
    - Формат: `unknown`
    - Вид: обязательный
    - Описание: Ошибка, полученная из HTTP-клиента или runtime-слоя.
  - `fallback`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Сообщение по умолчанию, если распознать структуру ошибки не удалось.
- Возвращает: `string`
  - Описание: Текст, который можно безопасно показать пользователю.

#### `export const sameAvatarCrop = ( left: Message["avatarCrop"], right: Message["avatarCrop"], ): boolean => {`

- Вид: функция
- Кратко: Сравнивает два набора параметров кропа аватара после нормализации. Это позволяет понять, нужно ли перерисовывать аватар или отправлять обновление на backend.
- Параметры: 2
  - `left`
    - Формат: `Message["avatarCrop"]`
    - Вид: обязательный
    - Описание: Первый вариант параметров кропа.
  - `right`
    - Формат: `Message["avatarCrop"]`
    - Вид: обязательный
    - Описание: Второй вариант параметров кропа.
- Возвращает: `boolean`
  - Описание: `true`, если оба варианта описывают один и тот же crop.

#### `export const formatGroupTypingLabel = ( kind: string | null | undefined, activeTypingUsers: string[], ): string | null => {`

- Вид: функция
- Кратко: Функция `formatGroupTypingLabel`.
- Параметры: 2
  - `kind`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `kind` в формате `string | null | undefined`.
  - `activeTypingUsers`
    - Формат: `string[]`
    - Вид: обязательный
    - Описание: Список `activeTypingUsers`, который обрабатывается функцией.
- Возвращает: `string | null`
  - Описание: Строковое значение результата.

#### `export const buildTimeline = ( messages: Message[], unreadDividerRenderTarget: UnreadDividerRenderTarget, ): TimelineItem[] => {`

- Вид: функция
- Кратко: Формирует timeline.
- Параметры: 2
  - `messages`
    - Формат: `Message[]`
    - Вид: обязательный
    - Описание: Список сообщений для дальнейшей обработки.
  - `unreadDividerRenderTarget`
    - Формат: `UnreadDividerRenderTarget`
    - Вид: обязательный
    - Описание: Параметр `unreadDividerRenderTarget` в формате `UnreadDividerRenderTarget`.
- Возвращает: `TimelineItem[]`
  - Описание: Сформированное значение для дальнейшего использования.

## `frontend/src/pages/ChatRoomPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ChatRoomPage(props: ChatRoomPageProps) {`

- Вид: функция
- Кратко: Точка входа страницы комнаты чата.
- Параметры: 1
  - `props`
    - Формат: `ChatRoomPageProps`
    - Вид: обязательный
    - Описание: Входные параметры маршрута и текущего пользователя.
- Возвращает: не указан
  - Описание: Страница комнаты с изолированным ключом сессии.

## `frontend/src/pages/ChatRoomPage.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/pages/ChatTargetPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ChatTargetPage({ user, target, onNavigate }: Props) {`

- Вид: функция
- Кратко: React-компонент `ChatTargetPage`.
- Детали: Страница нужна как мост между канонической внешней навигацией по public target и внутренним room-id transport: сначала дергает `resolveChatTarget`, а затем либо показывает `ChatRoomPage`, либо выводит понятную ошибку доступа.
- Параметры: 1
  - `{ user, target, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ChatTargetPage`.

## `frontend/src/pages/FriendsPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function FriendsPage({ user, onNavigate }: Props) {`

- Вид: функция
- Кратко: Показывает единый экран управления дружбой, блокировками и быстрым переходом в ЛС.
- Детали: Компонент объединяет вкладки друзей, онлайна, входящих и исходящих запросов, а также список заблокированных пользователей. Все действия завязаны на `useFriends`, а переход в личный чат строится через публичный ref собеседника.
- Параметры: 1
  - `{ user, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `FriendsPage`.

## `frontend/src/pages/GroupsPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function GroupsPage({ user, onNavigate }: Props) {`

- Вид: функция
- Кратко: React-компонент `GroupsPage`.
- Параметры: 1
  - `{ user, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `GroupsPage`.

## `frontend/src/pages/HomePage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function HomePage({ user, onNavigate }: Props) {`

- Вид: функция
- Кратко: React-компонент `HomePage`.
- Параметры: 1
  - `{ user, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `HomePage`.

## `frontend/src/pages/InvitePreviewPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function InvitePreviewPage({ code, onNavigate }: Props) {`

- Вид: функция
- Кратко: React-компонент `InvitePreviewPage`.
- Параметры: 1
  - `{ code, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `InvitePreviewPage`.

## `frontend/src/pages/LoginPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function LoginPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, }: Props) {`

- Вид: функция
- Кратко: Рендерит экран входа и прокидывает действия пользователя в auth-форму.
- Параметры: 1
  - `{ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `LoginPage`.

## `frontend/src/pages/NotFoundPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function NotFoundPage({ onNavigate }: Props) {`

- Вид: функция
- Кратко: Отображает fallback-экран для неизвестных или невалидных маршрутов.
- Детали: Страница не пытается восстановить контекст автоматически: она явно сообщает пользователю, что путь не найден, и предлагает вернуться на главную.
- Параметры: 1
  - `{ onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `NotFoundPage`.

## `frontend/src/pages/ProfilePage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ProfilePage({ user, onSave, onNavigate }: Props) {`

- Вид: функция
- Кратко: React-компонент `ProfilePage`.
- Параметры: 1
  - `{ user, onSave, onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ProfilePage`.

## `frontend/src/pages/RegisterPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function RegisterPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], }: Props) {`

- Вид: функция
- Кратко: Рендерит экран регистрации и передает действия пользователя в auth-форму.
- Параметры: 1
  - `{ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `RegisterPage`.

## `frontend/src/pages/SettingsPage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function SettingsPage({ user, onNavigate, onLogout }: Props) {`

- Вид: функция
- Кратко: React-компонент `SettingsPage`.
- Параметры: 1
  - `{ user, onNavigate, onLogout }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `SettingsPage`.

## `frontend/src/pages/UserProfilePage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function UserProfilePage({ username, currentUser, onNavigate, onLogout, }: Props) {`

- Вид: функция
- Кратко: React-компонент `UserProfilePage`.
- Параметры: 1
  - `{ username, currentUser, onNavigate, onLogout, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `UserProfilePage`.

## `frontend/src/shared/api/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/api/users.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/auth/googleIdentity.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export class GoogleOAuthError extends Error {`

- Вид: класс
- Кратко: Класс GoogleOAuthError инкапсулирует логику текущего слоя приложения.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const renderGoogleSignInButton = async ({ clientId, container, onSuccess, }: GoogleSignInButtonRenderOptions): Promise<void> => {`

- Вид: функция
- Кратко: Функция `renderGoogleSignInButton`.
- Детали: Основной production-путь использует официальный GIS button вместо ручного popup token flow. Это уменьшает шум в консоли вокруг `window.closed` и оставляет совместимый fallback только для браузеров, где GIS button недоступен.
- Параметры: 1
  - `{ clientId, container, onSuccess, }`
    - Формат: `GoogleSignInButtonRenderOptions`
    - Вид: обязательный
    - Описание: Объект параметров в формате `GoogleSignInButtonRenderOptions`.
- Возвращает: `Promise<void>`
  - Описание: Промис, который завершается после успешного выполнения операции `render google sign in button`.

#### `export const signInWithGoogle = async ( clientId: string, ): Promise<GoogleOAuthSuccess> => {`

- Вид: функция
- Кратко: Функция `signInWithGoogle`.
- Детали: Функция сама выбирает доступный механизм авторизации: сначала пробует popup OAuth2 для production-сценария, а при необходимости откатывается к Google Identity token flow.
- Параметры: 1
  - `clientId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Идентификатор Google OAuth-клиента, выданный для фронтенда.
- Возвращает: `Promise<GoogleOAuthSuccess>`
  - Описание: Данные успешной авторизации, которые затем передаются на backend для обмена на сессию.

## `frontend/src/shared/auth/GoogleIdentityButton.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function GoogleIdentityButton({ clientId, disabled = false, onSuccess, onUnavailable, }: GoogleIdentityButtonProps) {`

- Вид: функция
- Кратко: React-компонент `GoogleIdentityButton`.
- Детали: Если GIS SDK или сам button недоступны, компонент сообщает родителю о необходимости включить fallback-сценарий. Ошибка в этом случае не показывается пользователю автоматически: fallback должен отработать прозрачно, без лишнего шума.
- Параметры: 1
  - `{ clientId, disabled = false, onSuccess, onUnavailable, }`
    - Формат: `GoogleIdentityButtonProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `GoogleIdentityButtonProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `GoogleIdentityButton`.

## `frontend/src/shared/auth/googleRedirect.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const buildGoogleAuthRedirectUrl = (returnTo: string): string => {`

- Вид: функция
- Кратко: Функция `buildGoogleAuthRedirectUrl`.
- Параметры: 1
  - `returnTo`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Путь SPA, к которому backend может вернуть пользователя при ошибке.
- Возвращает: `string`
  - Описание: Абсолютно безопасный относительный URL для перехода на backend.

#### `export const startGoogleAuthRedirect = (returnTo: string): void => {`

- Вид: функция
- Кратко: Функция `startGoogleAuthRedirect`.
- Детали: Фронтенд не получает OAuth-токены напрямую и не открывает popup-окно. Вместо этого браузер уходит на backend endpoint, который сам начинает Google OAuth, принимает callback и создает серверную сессию.
- Параметры: 1
  - `returnTo`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Путь SPA, к которому backend может вернуть пользователя при ошибке.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

## `frontend/src/shared/cache/cacheConfig.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const CACHE_NAMES = {`

- Вид: константа
- Кратко: Хранит константное значение `CACHE_NAMES`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const CACHE_TTLS = {`

- Вид: константа
- Кратко: Хранит константное значение `CACHE_TTLS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const CACHE_LIMITS = {`

- Вид: константа
- Кратко: Хранит константное значение `CACHE_LIMITS`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/cache/cacheManager.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const invalidateRoomMessages = (roomRef: string): void => {`

- Вид: функция
- Кратко: Инвалидирует кэш сообщений конкретной комнаты, чтобы следующий запрос забрал свежую историю.
- Параметры: 1
  - `roomRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор комнаты или строковый `roomId`.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const invalidateRoomDetails = (roomRef: string): void => {`

- Вид: функция
- Кратко: Инвалидирует кэш сведений о комнате, например после смены названия или состава участников.
- Параметры: 1
  - `roomRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор комнаты или строковый `roomId`.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const invalidateDirectChats = (): void => {`

- Вид: функция
- Кратко: Инвалидирует кэш списка direct-чатов.
- Параметры: нет
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const invalidateUserProfile = (publicRef: string): void => {`

- Вид: функция
- Кратко: Инвалидирует кэш публичного профиля пользователя после обновления карточки или аватара.
- Параметры: 1
  - `publicRef`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Публичный идентификатор пользователя.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const invalidateSelfProfile = (): void => {`

- Вид: функция
- Кратко: Инвалидирует кэш собственного профиля текущего пользователя.
- Параметры: нет
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const clearAllUserCaches = (): void => {`

- Вид: функция
- Кратко: Функция `clearAllUserCaches`.
- Параметры: нет
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

## `frontend/src/shared/chat/readTracker.ts`

- Экспортируемые объявления: 4

### Объявления

#### `export const collectVisibleMessageIdsByBottomEdge = ( listElement: HTMLElement, ): Set<number> => {`

- Вид: функция
- Кратко: Функция `collectVisibleMessageIdsByBottomEdge`.
- Параметры: 1
  - `listElement`
    - Формат: `HTMLElement`
    - Вид: обязательный
    - Описание: Список `listElement`, который обрабатывается функцией.
- Возвращает: `Set<number>`
  - Описание: Числовое значение результата.

#### `export const computeNextLastReadMessageId = ({ messages, currentActorRef, previousLastReadMessageId, visibleMessageIds, }: ComputeNextLastReadMessageIdParams): number => {`

- Вид: функция
- Кратко: Функция `computeNextLastReadMessageId`.
- Параметры: 1
  - `{ messages, currentActorRef, previousLastReadMessageId, visibleMessageIds, }`
    - Формат: `ComputeNextLastReadMessageIdParams`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ComputeNextLastReadMessageIdParams`.
- Возвращает: `number`
  - Описание: Вычисленный результат операции.

#### `export const computeUnreadStats = ({ messages, currentActorRef, lastReadMessageId, }: ComputeUnreadStatsParams): UnreadStats => {`

- Вид: функция
- Кратко: Экспорт `computeUnreadStats` предоставляет инициализированный экземпляр для повторного использования в модуле.
- Параметры: 1
  - `{ messages, currentActorRef, lastReadMessageId, }`
    - Формат: `ComputeUnreadStatsParams`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ComputeUnreadStatsParams`.
- Возвращает: `UnreadStats`
  - Описание: Результат функции в формате `UnreadStats`.

#### `export const useReadTracker = ({ messages, currentActorRef, serverLastReadMessageId, enabled, resetKey, }: UseReadTrackerParams) => {`

- Вид: функция
- Кратко: Хук `useReadTracker`.
- Параметры: 1
  - `{ messages, currentActorRef, serverLastReadMessageId, enabled, resetKey, }`
    - Формат: `UseReadTrackerParams`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UseReadTrackerParams`.
- Возвращает: не указан
  - Описание: Публичный API хука: состояние и доступные обработчики.

## `frontend/src/shared/config/limits.ts`

- Экспортируемые объявления: 11

### Объявления

#### `export const getUsernameMaxLength = () => getRuntimeConfig().usernameMaxLength;`

- Вид: функция
- Кратко: Функция `getUsernameMaxLength`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const useUsernameMaxLength = () =>`

- Вид: функция
- Кратко: Хук `useUsernameMaxLength`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

#### `export const getChatMessageMaxLength = () =>`

- Вид: функция
- Кратко: Функция `getChatMessageMaxLength`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const useChatMessageMaxLength = () =>`

- Вид: функция
- Кратко: Хук `useChatMessageMaxLength`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

#### `export const getChatAttachmentMaxSizeMb = () =>`

- Вид: функция
- Кратко: Функция `getChatAttachmentMaxSizeMb`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const getChatAttachmentMaxSizeBytes = () =>`

- Вид: функция
- Кратко: Функция `getChatAttachmentMaxSizeBytes`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const useChatAttachmentMaxSizeMb = () =>`

- Вид: функция
- Кратко: Хук `useChatAttachmentMaxSizeMb`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

#### `export const useChatAttachmentMaxPerMessage = () =>`

- Вид: функция
- Кратко: Хук `useChatAttachmentMaxPerMessage`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

#### `export const useChatAttachmentAllowedTypes = () =>`

- Вид: функция
- Кратко: Хук `useChatAttachmentAllowedTypes`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

#### `export const getChatTargetRegex = () => {`

- Вид: функция
- Кратко: Функция `getChatTargetRegex`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const getChatTargetRegExp = () => {`

- Вид: функция
- Кратко: Функция `getChatTargetRegExp`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/config/runtimeConfig.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {`

- Вид: константа
- Кратко: Хранит константное значение `DEFAULT_RUNTIME_CONFIG`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;`

- Вид: функция
- Кратко: Функция `getRuntimeConfig`.
- Параметры: нет
- Возвращает: `ClientRuntimeConfig`
  - Описание: Результат функции в формате `ClientRuntimeConfig`.

#### `export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {`

- Вид: функция
- Кратко: Функция `setRuntimeConfig`.
- Параметры: 1
  - `next`
    - Формат: `ClientRuntimeConfig`
    - Вид: обязательный
    - Описание: Параметр `next` в формате `ClientRuntimeConfig`.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

## `frontend/src/shared/config/RuntimeConfigContext.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const RuntimeConfigContext = createContext<RuntimeConfigContextValue>({ config: DEFAULT_RUNTIME_CONFIG, ready: false, });`

- Вид: константа
- Кратко: Хранит константное значение `RuntimeConfigContext`.
- Параметры: 1
  - `{ config: DEFAULT_RUNTIME_CONFIG, ready: false, }`
    - Формат: не указан
    - Вид: обязательный
    - Описание: Объект параметров, переданный через деструктуризацию.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export function useRuntimeConfig(): RuntimeConfigContextValue {`

- Вид: функция
- Кратко: Хук useRuntimeConfig управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: `RuntimeConfigContextValue`
  - Описание: Публичное состояние хука и его обработчики.

## `frontend/src/shared/config/RuntimeConfigProvider.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function RuntimeConfigProvider({ children, }: RuntimeConfigProviderProps) {`

- Вид: функция
- Кратко: Провайдер `RuntimeConfigProvider`.
- Параметры: 1
  - `{ children, }`
    - Формат: `RuntimeConfigProviderProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `RuntimeConfigProviderProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `RuntimeConfigProvider`.

## `frontend/src/shared/conversationList/ConversationListProvider.tsx`

- Экспортируемые объявления: 2

### Объявления

#### `export function ConversationListProvider({ user, ready, children }: Props) {`

- Вид: функция
- Кратко: Собирает и хранит состояние бокового списка диалогов и серверов.
- Детали: Провайдер объединяет данные из direct inbox, групп, публичной комнаты, presence и глобального поиска, чтобы sidebar и связанные виджеты работали с единым согласованным снимком состояния.
- Параметры: 1
  - `{ user, ready, children }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ConversationListProvider`.

#### `export function useConversationList() {`

- Вид: функция
- Кратко: Хук `useConversationList`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/conversationList/events.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const CONVERSATION_LIST_REFRESH_EVENT = "conversation-list:refresh";`

- Вид: константа
- Кратко: Хранит константное значение `CONVERSATION_LIST_REFRESH_EVENT`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const emitConversationListRefresh = (): void => {`

- Вид: функция
- Кратко: Немедленно уведомляет sidebar-провайдер о необходимости обновить данные.
- Параметры: нет
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

## `frontend/src/shared/directInbox/context.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const FALLBACK_DIRECT_INBOX: DirectInboxContextValue = {`

- Вид: константа
- Кратко: Хранит константное значение `FALLBACK_DIRECT_INBOX`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const DirectInboxContext = createContext<DirectInboxContextValue>( FALLBACK_DIRECT_INBOX, );`

- Вид: константа
- Кратко: Хранит константное значение `DirectInboxContext`.
- Параметры: 1
  - `FALLBACK_DIRECT_INBOX`
    - Формат: не указан
    - Вид: обязательный
    - Описание: Контекст `FALLBACK_DIRECT_INBOX`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/directInbox/DirectInboxProvider.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function DirectInboxProvider({ user, ready = true, children, }: ProviderProps) {`

- Вид: функция
- Кратко: Поддерживает список личных чатов и их unread-состояние в реальном времени.
- Детали: Провайдер загружает начальный inbox по HTTP, затем синхронизирует его через `ws/inbox`, применяя ack/unread update события и локальные unread overrides.
- Параметры: 1
  - `{ user, ready = true, children, }`
    - Формат: `ProviderProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ProviderProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `DirectInboxProvider`.

## `frontend/src/shared/directInbox/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/directInbox/useDirectInbox.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const useDirectInbox = () => useContext(DirectInboxContext);`

- Вид: функция
- Кратко: Хук useDirectInbox управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/layout/useInfoPanel.tsx`

- Экспортируемые объявления: 2

### Объявления

#### `export function InfoPanelProvider({ children }: { children: ReactNode }) {`

- Вид: функция
- Кратко: Провайдер `InfoPanelProvider`.
- Параметры: 1
  - `{ children }`
    - Формат: `{ children: ReactNode }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ children: ReactNode }`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `InfoPanelProvider`.

#### `export function useInfoPanel() {`

- Вид: функция
- Кратко: Хук useInfoPanel управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/layout/useMobileShell.tsx`

- Экспортируемые объявления: 2

### Объявления

#### `export function MobileShellProvider({ children }: { children: ReactNode }) {`

- Вид: функция
- Кратко: Провайдер `MobileShellProvider`.
- Детали: Наружу этот провайдер отдает флаги viewport и управление боковым drawer, чтобы layout-компоненты не дублировали одну и ту же логику.
- Параметры: 1
  - `{ children }`
    - Формат: `{ children: ReactNode }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ children: ReactNode }`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `MobileShellProvider`.

#### `export function useMobileShell() {`

- Вид: функция
- Кратко: Возвращает состояние мобильной оболочки и методы управления drawer.
- Детали: Используется виджетами layout, когда им нужно узнать, открыт ли mobile drawer и можно ли программно его открыть, закрыть или переключить.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/lib/attachmentMedia.ts`

- Экспортируемые объявления: 5

### Объявления

#### `export const isSvgAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`

- Вид: функция
- Кратко: Функция `isSvgAttachment`.
- Параметры: 2
  - `contentType`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `contentType` в формате `string | null | undefined`.
  - `fileName`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `fileName` в формате `string | null | undefined`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

#### `export const isImageAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`

- Вид: функция
- Кратко: Функция `isImageAttachment`.
- Параметры: 2
  - `contentType`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `contentType` в формате `string | null | undefined`.
  - `fileName`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `fileName` в формате `string | null | undefined`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

#### `export const isVideoAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`

- Вид: функция
- Кратко: Функция `isVideoAttachment`.
- Детали: The viewer intentionally does not second-guess the browser here. If the file is identified as video by MIME type or file extension, the modal opens a plain native `<video>` and leaves playback support to the browser runtime.
- Параметры: 2
  - `contentType`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `contentType` в формате `string | null | undefined`.
  - `fileName`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `fileName` в формате `string | null | undefined`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

#### `export const resolveImagePreviewUrl = ({ url, thumbnailUrl, contentType, fileName, }: { url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; }): string | null => {`

- Вид: функция
- Кратко: Функция `resolveImagePreviewUrl`.
- Параметры: 1
  - `{ url, thumbnailUrl, contentType, fileName, }`
    - Формат: `{ url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; }`.
- Возвращает: `string | null`
  - Описание: Результат функции в формате `string | null`.

#### `export const resolveResponsiveImageSource = ({ url, thumbnailUrl, contentType, fileName, expectedWidthPx, }: { url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; expectedWidthPx: number; }): ResponsiveImageSource => {`

- Вид: функция
- Кратко: Функция `resolveResponsiveImageSource`.
- Параметры: 1
  - `{ url, thumbnailUrl, contentType, fileName, expectedWidthPx, }`
    - Формат: `{ url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; expectedWidthPx: number; }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; expectedWidthPx: number; }`.
- Возвращает: `ResponsiveImageSource`
  - Описание: Результат функции в формате `ResponsiveImageSource`.

## `frontend/src/shared/lib/attachmentTypeLabel.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const resolveAttachmentTypeLabel = ( contentType: string | null | undefined, fileName: string | null | undefined, ): string => {`

- Вид: функция
- Кратко: Функция `resolveAttachmentTypeLabel`.
- Параметры: 2
  - `contentType`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: MIME-тип файла.
  - `fileName`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Имя файла вместе с расширением.
- Возвращает: `string`
  - Описание: Разрешенное значение с учетом fallback-логики.

## `frontend/src/shared/lib/avatarCrop.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const normalizeAvatarCrop = ( value?: AvatarCrop | null, ): AvatarCrop | null => {`

- Вид: функция
- Кратко: Функция `normalizeAvatarCrop`.
- Параметры: 1
  - `value`
    - Формат: `AvatarCrop | null`
    - Вид: необязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `AvatarCrop | null`
  - Описание: Нормализованное значение после обработки входа.

#### `export const buildAvatarCropImageStyle = (crop: AvatarCrop): CSSProperties => ({ width: `${100 / crop.width}%`, height: `${100 / crop.height}%`, left: `-${(crop.x / crop.width) * 100}%`, top: `-${(crop.y / crop.height) * 100}%`, objectFit: "fill", borderRadius: 0, maxWidth: "none", });`

- Вид: функция
- Кратко: Функция `buildAvatarCropImageStyle`.
- Параметры: 1
  - `crop`
    - Формат: `AvatarCrop`
    - Вид: обязательный
    - Описание: Параметры обрезки изображения.
- Возвращает: `CSSProperties`
  - Описание: Сформированная структура данных.

## `frontend/src/shared/lib/chatTarget.ts`

- Экспортируемые объявления: 9

### Объявления

#### `export const PUBLIC_CHAT_TARGET = "public";`

- Вид: константа
- Кратко: Хранит константное значение `PUBLIC_CHAT_TARGET`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const normalizeChatTarget = ( value: string | null | undefined, ): string => {`

- Вид: функция
- Кратко: Функция `normalizeChatTarget`.
- Параметры: 1
  - `value`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string | null | undefined`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const isReservedChatTarget = (value: string | null | undefined): boolean => {`

- Вид: функция
- Кратко: Функция `isReservedChatTarget`.
- Параметры: 1
  - `value`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string | null | undefined`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

#### `export const encodeChatTargetSegment = (value: string): string => {`

- Вид: функция
- Кратко: Функция `encodeChatTargetSegment`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const buildChatTargetPath = (value: string): string => {`

- Вид: функция
- Кратко: Функция `buildChatTargetPath`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const buildPublicChatPath = (): string =>`

- Вид: функция
- Кратко: Функция `buildPublicChatPath`.
- Параметры: нет
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const buildDirectChatPath = (value: string): string => {`

- Вид: функция
- Кратко: Функция `buildDirectChatPath`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const parseChatTargetFromPathname = ( pathname: string, ): string | null => {`

- Вид: функция
- Кратко: Функция `parseChatTargetFromPathname`.
- Параметры: 1
  - `pathname`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `pathname` в формате `string`.
- Возвращает: `string | null`
  - Описание: Результат функции в формате `string | null`.

#### `export const isPrefixlessChatPath = (pathname: string): boolean =>`

- Вид: функция
- Кратко: Функция `isPrefixlessChatPath`.
- Параметры: 1
  - `pathname`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `pathname` в формате `string`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

## `frontend/src/shared/lib/debug.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const debugLog = (...args: unknown[]) => {`

- Вид: функция
- Кратко: Реализует функцию `debugLog`.
- Параметры: 1
  - `args`
    - Формат: `unknown[]`
    - Вид: rest-параметр
    - Описание: Список аргументов для логирования или проксирования.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/lib/device/constants.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const MOBILE_VIEWPORT_MAX_PX = 768;`

- Вид: константа
- Кратко: Хранит константное значение `MOBILE_VIEWPORT_MAX_PX`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/lib/device/device-context.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const DeviceContext = createContext<DeviceSnapshot | null>(null);`

- Вид: константа
- Кратко: Хранит константное значение `DeviceContext`.
- Параметры: 1
  - `null`
    - Формат: не указан
    - Вид: обязательный
    - Описание: Контекст `null`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/lib/device/DeviceProvider.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function DeviceProvider({ children }: { children: ReactNode }) {`

- Вид: функция
- Кратко: Публикует в контекст актуальный снимок устройства и viewport.
- Детали: Провайдер слушает media query, resize и orientation changes, а затем обновляет `DeviceContext` только тогда, когда snapshot реально изменился.
- Параметры: 1
  - `{ children }`
    - Формат: `{ children: ReactNode }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ children: ReactNode }`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `DeviceProvider`.

## `frontend/src/shared/lib/device/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/lib/device/readDeviceSnapshot.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const DEFAULT_DEVICE_SNAPSHOT: DeviceSnapshot = {`

- Вид: константа
- Кратко: Хранит константное значение `DEFAULT_DEVICE_SNAPSHOT`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const areDeviceSnapshotsEqual = ( left: DeviceSnapshot, right: DeviceSnapshot, ): boolean =>`

- Вид: функция
- Кратко: Функция `areDeviceSnapshotsEqual`.
- Параметры: 2
  - `left`
    - Формат: `DeviceSnapshot`
    - Вид: обязательный
    - Описание: Параметр `left` в формате `DeviceSnapshot`.
  - `right`
    - Формат: `DeviceSnapshot`
    - Вид: обязательный
    - Описание: Параметр `right` в формате `DeviceSnapshot`.
- Возвращает: `boolean`
  - Описание: Булево значение, отражающее результат проверки.

#### `export const readDeviceSnapshot = ( targetWindow?: Window | null, ): DeviceSnapshot => {`

- Вид: функция
- Кратко: Функция `readDeviceSnapshot`.
- Параметры: 1
  - `targetWindow`
    - Формат: `Window | null`
    - Вид: необязательный
    - Описание: Параметр `targetWindow` в формате `Window | null`.
- Возвращает: `DeviceSnapshot`
  - Описание: Результат функции в формате `DeviceSnapshot`.

## `frontend/src/shared/lib/device/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/lib/device/useDevice.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useDevice(): DeviceSnapshot {`

- Вид: функция
- Кратко: Хук `useDevice`.
- Параметры: нет
- Возвращает: `DeviceSnapshot`
  - Описание: Результат функции в формате `DeviceSnapshot`.

## `frontend/src/shared/lib/directNavigation.ts`

- Экспортируемые объявления: 5

### Объявления

#### `export const LAST_DIRECT_REF_STORAGE_KEY = "ui.direct.last-ref";`

- Вид: константа
- Кратко: Ключ localStorage, под которым хранится последний открытый личный диалог.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const DIRECT_HOME_FALLBACK_PATH = "/friends";`

- Вид: константа
- Кратко: Безопасный маршрут по умолчанию, если восстановить последнее ЛС не удалось.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const readStoredLastDirectRef = (): string => {`

- Вид: функция
- Кратко: Функция `readStoredLastDirectRef`.
- Детали: Возвращает уже нормализованное значение с префиксом public ref или пустую строку, если в хранилище нет корректных данных.
- Параметры: нет
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const rememberLastDirectRef = (value: string | null | undefined): void => {`

- Вид: функция
- Кратко: Запоминает публичный ref собеседника, чтобы можно было быстро вернуться в ЛС.
- Детали: Пустые и некорректные значения игнорируются, чтобы не засорять хранилище мусорными ключами и не ломать последующее восстановление навигации.
- Параметры: 1
  - `value`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `value` в формате `string | null | undefined`.
- Возвращает: `void`
  - Описание: Ничего не возвращает; эффект достигается побочным действием.

#### `export const resolveRememberedDirectPath = ({ pathname, fallbackPath = DIRECT_HOME_FALLBACK_PATH, directPeerRefs = [], }: ResolveRememberedDirectPathOptions = {}): string => {`

- Вид: функция
- Кратко: Вычисляет маршрут, в который нужно вести пользователя из shortcut-а личных чатов.
- Детали: Приоритет такой: активный подходящий direct route, сохраненный в localStorage peer ref, первый доступный peer ref из списка и только потом fallback path.
- Параметры: 1
  - `{ pathname, fallbackPath = DIRECT_HOME_FALLBACK_PATH, directPeerRefs = [], }`
    - Формат: `ResolveRememberedDirectPathOptions`
    - Вид: обязательный
    - Значение по умолчанию: `{}`
    - Описание: Объект параметров в формате `ResolveRememberedDirectPathOptions`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

## `frontend/src/shared/lib/format.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const formatTimestamp = (iso: string) =>`

- Вид: функция
- Кратко: Реализует функцию `formatTimestamp`.
- Параметры: 1
  - `iso`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Дата в ISO-формате.
- Возвращает: не указан
  - Описание: Строка в отформатированном виде.

#### `export const formatDayLabel = (date: Date, now: Date = new Date()) => {`

- Вид: функция
- Кратко: Реализует функцию `formatDayLabel`.
- Параметры: 2
  - `date`
    - Формат: `Date`
    - Вид: обязательный
    - Описание: Дата для форматирования.
  - `now`
    - Формат: `Date`
    - Вид: обязательный
    - Значение по умолчанию: `new Date()`
    - Описание: Текущая дата для вычислений.
- Возвращает: не указан
  - Описание: Строка в отформатированном виде.

#### `export const avatarFallback = (username: string) => {`

- Вид: функция
- Кратко: Функция `avatarFallback`.
- Параметры: 1
  - `username`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Имя пользователя.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const formatFullName = ( name: string | null | undefined, lastName?: string | null | undefined, ) => {`

- Вид: функция
- Кратко: Функция `formatFullName`.
- Параметры: 2
  - `name`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `name` в формате `string | null | undefined`.
  - `lastName`
    - Формат: `string | null | undefined`
    - Вид: необязательный
    - Описание: Параметр `lastName` в формате `string | null | undefined`.
- Возвращает: не указан
  - Описание: Строка в отформатированном виде.

#### `export const formatRegistrationDate = (iso: string | null) => {`

- Вид: функция
- Кратко: Реализует функцию `formatRegistrationDate`.
- Параметры: 1
  - `iso`
    - Формат: `string | null`
    - Вид: обязательный
    - Описание: Дата в ISO-формате.
- Возвращает: не указан
  - Описание: Строка в отформатированном виде.

#### `export const formatLastSeen = (iso: string | null) => {`

- Вид: функция
- Кратко: Реализует функцию `formatLastSeen`.
- Параметры: 1
  - `iso`
    - Формат: `string | null`
    - Вид: обязательный
    - Описание: Дата в ISO-формате.
- Возвращает: не указан
  - Описание: Строка в отформатированном виде.

## `frontend/src/shared/lib/publicRef.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const normalizePublicRef = ( value: string | null | undefined, ): string => {`

- Вид: функция
- Кратко: Функция `normalizePublicRef`.
- Параметры: 1
  - `value`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string`
  - Описание: Нормализованное значение после обработки входа.

#### `export const isHandleRef = (value: string): boolean =>`

- Вид: функция
- Кратко: Функция `isHandleRef`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `boolean`
  - Описание: Булев результат проверки условия.

#### `export const isFallbackPublicId = (value: string): boolean => {`

- Вид: функция
- Кратко: Функция `isFallbackPublicId`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `boolean`
  - Описание: Булев результат проверки условия.

#### `export const formatPublicRef = (value: string): string => {`

- Вид: функция
- Кратко: Функция `formatPublicRef`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string`
  - Описание: Сформированное значение для дальнейшего использования.

#### `export const buildDirectPath = (value: string): string => {`

- Вид: функция
- Кратко: Функция `buildDirectPath`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string`
  - Описание: Сформированное значение для дальнейшего использования.

#### `export const buildUserProfilePath = (value: string): string => {`

- Вид: функция
- Кратко: Функция `buildUserProfilePath`.
- Параметры: 1
  - `value`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входное значение для преобразования.
- Возвращает: `string`
  - Описание: Сформированное значение для дальнейшего использования.

## `frontend/src/shared/lib/sanitize.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const sanitizeText = (input: string, maxLen = 1000) => {`

- Вид: функция
- Кратко: Очищает text.
- Параметры: 2
  - `input`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Входной объект с параметрами операции.
  - `maxLen`
    - Формат: не указан
    - Вид: обязательный
    - Значение по умолчанию: `1000`
    - Описание: Максимальная длина значения.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/lib/userIdentity.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const resolveIdentityLabel = ( identity: IdentityLike, fallback = "user", ): string =>`

- Вид: функция
- Кратко: Функция `resolveIdentityLabel`.
- Параметры: 2
  - `identity`
    - Формат: `IdentityLike`
    - Вид: обязательный
    - Описание: Параметр `identity` в формате `IdentityLike`.
  - `fallback`
    - Формат: не указан
    - Вид: обязательный
    - Значение по умолчанию: `"user"`
    - Описание: Контекст `fallback`.
- Возвращает: `string`
  - Описание: Строковое значение результата.

#### `export const resolveIdentityHandle = ( identity: IdentityLike, ): string | null => {`

- Вид: функция
- Кратко: Функция `resolveIdentityHandle`.
- Параметры: 1
  - `identity`
    - Формат: `IdentityLike`
    - Вид: обязательный
    - Описание: Параметр `identity` в формате `IdentityLike`.
- Возвращает: `string | null`
  - Описание: Результат функции в формате `string | null`.

## `frontend/src/shared/lib/ws.ts`

- Экспортируемые объявления: 3

### Объявления

#### `export const getWebSocketBase = () => {`

- Вид: функция
- Кратко: Функция `getWebSocketBase`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const appendWebSocketParams = ( url: string, params: Record<string, WebSocketQueryValue>, ) => {`

- Вид: функция
- Кратко: Функция `appendWebSocketParams`.
- Параметры: 2
  - `url`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `url` в формате `string`.
  - `params`
    - Формат: `Record<string, WebSocketQueryValue>`
    - Вид: обязательный
    - Описание: Параметр `params` в формате `Record<string, WebSocketQueryValue>`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const appendWebSocketAuthToken = ( url: string, token: string | null | undefined, ) => appendWebSocketParams(url, { wst: token?.trim() || undefined });`

- Вид: функция
- Кратко: Функция `appendWebSocketAuthToken`.
- Параметры: 2
  - `url`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `url` в формате `string`.
  - `token`
    - Формат: `string | null | undefined`
    - Вид: обязательный
    - Описание: Параметр `token` в формате `string | null | undefined`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/presence/context.ts`

- Экспортируемые объявления: 2

### Объявления

#### `export const FALLBACK_PRESENCE: PresenceContextValue = {`

- Вид: константа
- Кратко: Хранит константное значение `FALLBACK_PRESENCE`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const PresenceContext = createContext<PresenceContextValue>(FALLBACK_PRESENCE);`

- Вид: константа
- Кратко: Хранит константное значение `PresenceContext`.
- Параметры: 1
  - `FALLBACK_PRESENCE`
    - Формат: не указан
    - Вид: обязательный
    - Описание: Параметр `FALLBACK_PRESENCE`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/presence/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/presence/PresenceProvider.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function PresenceProvider({ user, children, ready = true, }: ProviderProps) {`

- Вид: функция
- Кратко: Провайдер `PresenceProvider`.
- Параметры: 1
  - `{ user, children, ready = true, }`
    - Формат: `ProviderProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ProviderProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `PresenceProvider`.

## `frontend/src/shared/presence/usePresence.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const usePresence = () => useContext(PresenceContext);`

- Вид: функция
- Кратко: Хук usePresence управляет состоянием и побочными эффектами текущего сценария.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/ui/AudioAttachmentPlayer.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AudioAttachmentPlayer({ src, title, subtitle, downloadName, compact = false, className, }: Props) {`

- Вид: функция
- Кратко: React-компонент `AudioAttachmentPlayer`.
- Параметры: 1
  - `{ src, title, subtitle, downloadName, compact = false, className, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AudioAttachmentPlayer`.

## `frontend/src/shared/ui/Avatar.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Avatar({ username, profileImage = null, avatarCrop = null, size = "default", online = false, className, loading = "lazy", }: AvatarProps) {`

- Вид: функция
- Кратко: React-компонент `Avatar`.
- Параметры: 1
  - `{ username, profileImage = null, avatarCrop = null, size = "default", online = false, className, loading = "lazy", }`
    - Формат: `AvatarProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `AvatarProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Avatar`.

## `frontend/src/shared/ui/AvatarCropModal.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AvatarCropModal({ open, image, onCancel, onApply, }: AvatarCropModalProps) {`

- Вид: функция
- Кратко: React-компонент `AvatarCropModal`.
- Параметры: 1
  - `{ open, image, onCancel, onApply, }`
    - Формат: `AvatarCropModalProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `AvatarCropModalProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AvatarCropModal`.

## `frontend/src/shared/ui/AvatarMedia.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AvatarMedia({ src, alt, avatarCrop = null, loading = "lazy", decoding = "async", draggable = false, className, onError, }: AvatarMediaProps) {`

- Вид: функция
- Кратко: React-компонент `AvatarMedia`.
- Параметры: 1
  - `{ src, alt, avatarCrop = null, loading = "lazy", decoding = "async", draggable = false, className, onError, }`
    - Формат: `AvatarMediaProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `AvatarMediaProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AvatarMedia`.

## `frontend/src/shared/ui/Button.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Button({ variant = "primary", fullWidth = false, className, type = "button", ...props }: ButtonProps) {`

- Вид: функция
- Кратко: React-компонент `Button`.
- Параметры: 1
  - `{ variant = "primary", fullWidth = false, className, type = "button", ...props }`
    - Формат: `ButtonProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ButtonProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Button`.

## `frontend/src/shared/ui/Card.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Card<T extends ElementType = "section">({ as, wide = false, className, children, ...rest }: CardProps<T>) {`

- Вид: функция
- Кратко: React-компонент `Card`.
- Параметры: 1
  - `{ as, wide = false, className, children, ...rest }`
    - Формат: `CardProps<T>`
    - Вид: обязательный
    - Описание: Объект параметров в формате `CardProps<T>`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Card`.

## `frontend/src/shared/ui/ContextMenu.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ContextMenu({ items, x, y, onClose }: Props) {`

- Вид: функция
- Кратко: Контекст `ContextMenu`.
- Параметры: 1
  - `{ items, x, y, onClose }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ContextMenu`.

## `frontend/src/shared/ui/Dropdown.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Dropdown({ trigger, children, align = "left", offset = 4, wrapperClassName, triggerClassName, menuClassName, closeOnContentClick = true, onOpenChange, }: Props) {`

- Вид: функция
- Кратко: React-компонент `Dropdown`.
- Параметры: 1
  - `{ trigger, children, align = "left", offset = 4, wrapperClassName, triggerClassName, menuClassName, closeOnContentClick = true, onOpenChange, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Dropdown`.

## `frontend/src/shared/ui/EmptyState.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function EmptyState({ icon, title, description, children, className, }: Props) {`

- Вид: функция
- Кратко: React-компонент `EmptyState`.
- Параметры: 1
  - `{ icon, title, description, children, className, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `EmptyState`.

## `frontend/src/shared/ui/ImageLightbox.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ImageLightbox(props: ImageLightboxProps) {`

- Вид: функция
- Кратко: React-компонент `ImageLightbox`.
- Детали: The shell restores the earlier fullscreen stage presentation for images and videos while keeping the current native `<video controls>` implementation.
- Параметры: 1
  - `props`
    - Формат: `ImageLightboxProps`
    - Вид: обязательный
    - Описание: Объект props в формате `ImageLightboxProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ImageLightbox`.

## `frontend/src/shared/ui/ImageLightbox.types.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/ui/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/ui/LightboxVideoPlayer.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function LightboxVideoPlayer({ src, poster, fileName, }: LightboxVideoPlayerProps) {`

- Вид: функция
- Кратко: React-компонент `LightboxVideoPlayer`.
- Детали: The component deliberately stays close to the browser's default player: there are no custom playback layers, no third-party runtime and no detached player session. Closing the viewer always tears the media element down.
- Параметры: 1
  - `{ src, poster, fileName, }`
    - Формат: `LightboxVideoPlayerProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `LightboxVideoPlayerProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `LightboxVideoPlayer`.

## `frontend/src/shared/ui/Modal.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Modal({ open, onClose, title, children }: Props) {`

- Вид: функция
- Кратко: React-компонент `Modal`.
- Параметры: 1
  - `{ open, onClose, title, children }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Modal`.

## `frontend/src/shared/ui/Panel.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Panel({ muted = false, busy = false, className, children, }: PanelProps) {`

- Вид: функция
- Кратко: React-компонент `Panel`.
- Параметры: 1
  - `{ muted = false, busy = false, className, children, }`
    - Формат: `PanelProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `PanelProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Panel`.

## `frontend/src/shared/ui/Spinner.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Spinner({ size = "md", className }: Props) {`

- Вид: функция
- Кратко: React-компонент `Spinner`.
- Параметры: 1
  - `{ size = "md", className }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Spinner`.

## `frontend/src/shared/ui/Toast.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Toast({ variant, role = "status", className, autoDismissMs = 5000, onDismiss, children, }: ToastProps) {`

- Вид: функция
- Кратко: React-компонент `Toast`.
- Параметры: 1
  - `{ variant, role = "status", className, autoDismissMs = 5000, onDismiss, children, }`
    - Формат: `ToastProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ToastProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Toast`.

## `frontend/src/shared/ui/useGuardedModalState.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useGuardedModalState<T>(): GuardedModalState<T> {`

- Вид: функция
- Кратко: Хук `useGuardedModalState`.
- Детали: Такой guard нужен для быстрых повторных кликов, тачей и event replay после reload, когда UI должен открыть только один экземпляр модального слоя.
- Параметры: нет
- Возвращает: `GuardedModalState<T>`
  - Описание: Guard с синхронным lock-before-render и безопасным освобождением.

## `frontend/src/shared/ui/ZoomableImageStage.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ZoomableImageStage({ src, alt, onRequestClose, }: ZoomableImageStageProps) {`

- Вид: функция
- Кратко: React-компонент `ZoomableImageStage`.
- Детали: The stage keeps fit-to-screen as the base state. Every zoom step is applied around the visual center of the viewer, while pan stays unrestricted after the image has already been scaled.
- Параметры: 1
  - `{ src, alt, onRequestClose, }`
    - Формат: `ZoomableImageStageProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `ZoomableImageStageProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ZoomableImageStage`.

## `frontend/src/shared/unreadOverrides/store.ts`

- Экспортируемые объявления: 6

### Объявления

#### `export const setUnreadOverride = ({ roomId, unreadCount }: UnreadOverride) => {`

- Вид: функция
- Кратко: Функция `setUnreadOverride`.
- Детали: Store хранит и положительные значения, и явный `0`. Это позволяет сразу обновлять бейдж текущего чата после прочтения, не дожидаясь отдельного refetch списка комнат.
- Параметры: 1
  - `{ roomId, unreadCount }`
    - Формат: `UnreadOverride`
    - Вид: обязательный
    - Описание: Объект параметров в формате `UnreadOverride`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const clearUnreadOverride = (roomId: string) => {`

- Вид: функция
- Кратко: Функция `clearUnreadOverride`.
- Параметры: 1
  - `roomId`
    - Формат: `string`
    - Вид: обязательный
    - Описание: Параметр `roomId` в формате `string`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const clearUnreadOverridesForRooms = (roomIds: Iterable<string>) => {`

- Вид: функция
- Кратко: Функция `clearUnreadOverridesForRooms`.
- Детали: После этого UI снова начинает опираться на backend/WebSocket-снимок, а временный локальный override больше не влияет на бейдж.
- Параметры: 1
  - `roomIds`
    - Формат: `Iterable<string>`
    - Вид: обязательный
    - Описание: Параметр `roomIds` в формате `Iterable<string>`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const collectSettledUnreadOverrideRoomIds = ({ authoritativeRoomIds, authoritativeCounts, }: SettledUnreadOverrideParams): string[] => {`

- Вид: функция
- Кратко: Функция `collectSettledUnreadOverrideRoomIds`.
- Детали: Правило слияния намеренно сохраняет локальный `0`, если пришедший с сервера снапшот unread ещё сообщает положительный unread по этой комнате. Это защищает текущий чат от отката бейджа назад, когда локальное чтение уже зафиксировано, а авторитативный push-снимок ещё не догнал только что отправленный `mark_read`. Override снимается только в двух случаях: 1. сервер явно подтвердил ноль unread для комнаты; 2. локальный override был положительным, и сервер прислал свой авторитативный count.
- Параметры: 1
  - `{ authoritativeRoomIds, authoritativeCounts, }`
    - Формат: `SettledUnreadOverrideParams`
    - Вид: обязательный
    - Описание: Объект параметров в формате `SettledUnreadOverrideParams`.
- Возвращает: `string[]`
  - Описание: Результат функции в формате `string[]`.

#### `export const resetUnreadOverrides = () => {`

- Вид: функция
- Кратко: Функция `resetUnreadOverrides`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

#### `export const useUnreadOverrides = () =>`

- Вид: функция
- Кратко: Хук `useUnreadOverrides`.
- Детали: `useSyncExternalStore` нужен, чтобы React видел консистентный снимок даже при одновременных рендерах и внешних обновлениях store.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/visitorTelemetry/buildSiteVisitPayload.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const buildSiteVisitPayload = ( snapshot: DeviceSnapshot, ): SiteVisitPayload => ({ visitorId: getOrCreateVisitorId(), pagePath: `${window.location.pathname}${window.location.search}`, pageTitle: document.title.trim() || null, referrer: document.referrer || null, viewportWidth: snapshot.viewportWidth, viewportHeight: snapshot.viewportHeight,`

- Вид: функция
- Кратко: Функция `buildSiteVisitPayload`.
- Параметры: 1
  - `snapshot`
    - Формат: `DeviceSnapshot`
    - Вид: обязательный
    - Описание: Параметр `snapshot` в формате `DeviceSnapshot`.
- Возвращает: `SiteVisitPayload`
  - Описание: Результат функции в формате `SiteVisitPayload`.

## `frontend/src/shared/visitorTelemetry/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/visitorTelemetry/sendSiteVisit.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const sendSiteVisit = async ( payload: SiteVisitPayload, ): Promise<boolean> => {`

- Вид: функция
- Кратко: Функция `sendSiteVisit`.
- Параметры: 1
  - `payload`
    - Формат: `SiteVisitPayload`
    - Вид: обязательный
    - Описание: Параметр `payload` в формате `SiteVisitPayload`.
- Возвращает: `Promise<boolean>`
  - Описание: Промис с результатом операции в формате `boolean`.

## `frontend/src/shared/visitorTelemetry/SiteVisitTelemetry.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function SiteVisitTelemetry() {`

- Вид: функция
- Кратко: Отправляет одно visitor-событие на каждый полный заход в приложение.
- Параметры: нет
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `SiteVisitTelemetry`.

## `frontend/src/shared/visitorTelemetry/types.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/visitorTelemetry/visitorId.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const getOrCreateVisitorId = (): string => {`

- Вид: функция
- Кратко: Возвращает стабильный анонимный visitorId для одного браузера.
- Параметры: нет
- Возвращает: `string`
  - Описание: Строковое значение результата.

## `frontend/src/shared/wsAuth/context.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const WsAuthContext = createContext<string | null>(null);`

- Вид: константа
- Кратко: Хранит текущий токен авторизации для WebSocket-подключений.
- Детали: В `null` находится состояние до логина или после явного сброса авторизации, когда клиенту нечего отправлять в handshake.
- Параметры: 1
  - `null`
    - Формат: не указан
    - Вид: обязательный
    - Описание: Параметр `null`.
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/shared/wsAuth/index.ts`

- Экспортируемые объявления: 0

## `frontend/src/shared/wsAuth/useWsAuthToken.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export function useWsAuthToken() {`

- Вид: функция
- Кратко: Возвращает токен, который должен быть отправлен при авторизации WebSocket.
- Детали: Хук читает значение из `WsAuthContext` и не создает побочных эффектов. Если токен еще не получен или пользователь не авторизован, вернет `null`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Состояние, вычисленные значения и колбэки, возвращаемые хуком.

## `frontend/src/shared/wsAuth/WsAuthProvider.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function WsAuthProvider({ token, children }: WsAuthProviderProps) {`

- Вид: функция
- Кратко: Провайдер `WsAuthProvider`.
- Детали: Провайдер ничего не вычисляет сам: он лишь публикует токен, полученный извне, чтобы нижележащие части приложения могли брать его через `useWsAuthToken` и использовать в handshake при открытии сокета.
- Параметры: 1
  - `{ token, children }`
    - Формат: `WsAuthProviderProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `WsAuthProviderProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `WsAuthProvider`.

## `frontend/src/sw.ts`

- Экспортируемые объявления: 0

## `frontend/src/test/setup.ts`

- Экспортируемые объявления: 1

### Объявления

#### `export const server = setupServer();`

- Вид: константа
- Кратко: Хранит константное значение `server`.
- Параметры: нет
- Возвращает: не указан
  - Описание: Возвращает результат выполнения функции.

## `frontend/src/widgets/admin/RolesManager.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function RolesManager({ roomId }: Props) {`

- Вид: функция
- Кратко: React-компонент `RolesManager`.
- Параметры: 1
  - `{ roomId }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `RolesManager`.

## `frontend/src/widgets/auth/AuthForm.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AuthForm({ mode, title, submitLabel, onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], className, }: AuthFormProps) {`

- Вид: функция
- Кратко: React-компонент `AuthForm`.
- Детали: Google-вход здесь намеренно не использует popup. Кнопка запускает server-side redirect flow: браузер уходит на backend endpoint, backend сам завершает Google OAuth и затем возвращает пользователя обратно уже с готовой серверной сессией.
- Параметры: 1
  - `{ mode, title, submitLabel, onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], className, }`
    - Формат: `AuthFormProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `AuthFormProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AuthForm`.

## `frontend/src/widgets/chat/ChatSearch.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ChatSearch({ roomId, onResultClick }: Props) {`

- Вид: функция
- Кратко: React-компонент `ChatSearch`.
- Параметры: 1
  - `{ roomId, onResultClick }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ChatSearch`.

## `frontend/src/widgets/chat/DirectInfoPanel.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function DirectInfoPanel({ roomId }: Props) {`

- Вид: функция
- Кратко: React-компонент `DirectInfoPanel`.
- Параметры: 1
  - `{ roomId }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `DirectInfoPanel`.

## `frontend/src/widgets/chat/lib/attachmentLayout.ts`

- Экспортируемые объявления: 4

### Объявления

#### `export const resolveImageAspectRatio = (attachment: Attachment): number => {`

- Вид: функция
- Кратко: Функция `resolveImageAspectRatio`.
- Параметры: 1
  - `attachment`
    - Формат: `Attachment`
    - Вид: обязательный
    - Описание: Параметр `attachment` в формате `Attachment`.
- Возвращает: `number`
  - Описание: Числовое значение результата.

#### `export const buildAttachmentRenderItems = ( attachments: Attachment[], ): AttachmentRenderItem[] =>`

- Вид: функция
- Кратко: Функция `buildAttachmentRenderItems`.
- Параметры: 1
  - `attachments`
    - Формат: `Attachment[]`
    - Вид: обязательный
    - Описание: Параметр `attachments` в формате `Attachment[]`.
- Возвращает: `AttachmentRenderItem[]`
  - Описание: Результат функции в формате `AttachmentRenderItem[]`.

#### `export const splitAttachmentRenderItems = ( items: AttachmentRenderItem[], maxVisibleImages: number, ): AttachmentBuckets => {`

- Вид: функция
- Кратко: Делит вложения на группы изображений и остальные файлы.
- Параметры: 2
  - `items`
    - Формат: `AttachmentRenderItem[]`
    - Вид: обязательный
    - Описание: Параметр `items` в формате `AttachmentRenderItem[]`.
  - `maxVisibleImages`
    - Формат: `number`
    - Вид: обязательный
    - Описание: Параметр `maxVisibleImages` в формате `number`.
- Возвращает: `AttachmentBuckets`
  - Описание: Результат функции в формате `AttachmentBuckets`.

#### `export const buildMediaTileLayout = ( items: ImageAttachmentRenderItem[], ): MediaTileLayout => {`

- Вид: функция
- Кратко: Функция `buildMediaTileLayout`.
- Детали: Layout сохраняет порядок изображений и ближе к Telegram, чем обычный CSS grid: portrait и landscape кадры получают разные прямоугольники вместо равных колонок.
- Параметры: 1
  - `items`
    - Формат: `ImageAttachmentRenderItem[]`
    - Вид: обязательный
    - Описание: Параметр `items` в формате `ImageAttachmentRenderItem[]`.
- Возвращает: `MediaTileLayout`
  - Описание: Результат функции в формате `MediaTileLayout`.

## `frontend/src/widgets/chat/MessageBubble.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function MessageBubble({ message, isOwn, showAvatar = true, showHeader = true, grouped = false, canModerate = false, canViewReaders = false, isRead = false, highlighted = false, onlineUsernames, onReply, onEdit, onDelete, onReact, onViewReaders, onReplyQuoteClick, onAvatarClick, onOpenMediaAttachment, }: Props) {`

- Вид: функция
- Кратко: React-компонент `MessageBubble`.
- Параметры: 1
  - `{ message, isOwn, showAvatar = true, showHeader = true, grouped = false, canModerate = false, canViewReaders = false, isRead = false, highlighted = false, onlineUsernames, onReply, onEdit, onDelete, onReact, onViewReaders, onReplyQuoteClick, onAvatarClick, onOpenMediaAttachment, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `MessageBubble`.

## `frontend/src/widgets/chat/MessageInput.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function MessageInput({ draft, onDraftChange, onSend, onTyping, disabled, rateLimitActive, replyTo, onCancelReply, onAttach, pendingFiles = [], onRemovePendingFile, onClearPendingFiles, uploadProgress, onCancelUpload, }: Props) {`

- Вид: функция
- Кратко: React-компонент `MessageInput`.
- Параметры: 1
  - `{ draft, onDraftChange, onSend, onTyping, disabled, rateLimitActive, replyTo, onCancelReply, onAttach, pendingFiles = [], onRemovePendingFile, onClearPendingFiles, uploadProgress, onCancelUpload, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `MessageInput`.

## `frontend/src/widgets/chat/ReadersMenu.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ReadersMenu({ x, y, loading, error, entries, emptyLabel, onClose, onOpenProfile, }: Props) {`

- Вид: функция
- Кратко: Показывает контекстное меню с пользователями, прочитавшими сообщение.
- Детали: Меню привязывается к координатам клика, само удерживает себя внутри viewport и умеет открывать профиль читателя, если для него доступен public ref.
- Параметры: 1
  - `{ x, y, loading, error, entries, emptyLabel, onClose, onOpenProfile, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ReadersMenu`.

## `frontend/src/widgets/chat/TypingIndicator.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function TypingIndicator({ users }: Props) {`

- Вид: функция
- Кратко: React-компонент `TypingIndicator`.
- Параметры: 1
  - `{ users }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `TypingIndicator`.

## `frontend/src/widgets/chat/UserProfilePanel.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function UserProfilePanel({ publicRef, currentPublicRef }: Props) {`

- Вид: функция
- Кратко: React-компонент `UserProfilePanel`.
- Параметры: 1
  - `{ publicRef, currentPublicRef }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `UserProfilePanel`.

## `frontend/src/widgets/chat/VideoAttachmentPreview.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function VideoAttachmentPreview({ attachment, onOpen, }: VideoAttachmentPreviewProps) {`

- Вид: функция
- Кратко: React-компонент `VideoAttachmentPreview`.
- Детали: Preview всегда использует обычный браузерный `<video>` без controls и без playback-ownership: он нужен только для первого кадра и metadata.
- Параметры: 1
  - `{ attachment, onOpen, }`
    - Формат: `VideoAttachmentPreviewProps`
    - Вид: обязательный
    - Описание: Объект параметров в формате `VideoAttachmentPreviewProps`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `VideoAttachmentPreview`.

## `frontend/src/widgets/friends/AddFriendDialog.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AddFriendDialog({ onSubmit, onClose }: Props) {`

- Вид: функция
- Кратко: React-компонент `AddFriendDialog`.
- Параметры: 1
  - `{ onSubmit, onClose }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AddFriendDialog`.

## `frontend/src/widgets/friends/FriendListItem.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function FriendListItem({ friend, isOnline, onMessage, onRemove, onBlock, }: Props) {`

- Вид: функция
- Кратко: React-компонент `FriendListItem`.
- Параметры: 1
  - `{ friend, isOnline, onMessage, onRemove, onBlock, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `FriendListItem`.

## `frontend/src/widgets/friends/FriendRequestItem.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function FriendRequestItem(props: Props) {`

- Вид: функция
- Кратко: React-компонент `FriendRequestItem`.
- Параметры: 1
  - `props`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Свойства компонента или хука.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `FriendRequestItem`.

## `frontend/src/widgets/groups/CreateGroupDialog.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function CreateGroupDialog({ onCreated, onClose }: Props) {`

- Вид: функция
- Кратко: React-компонент `CreateGroupDialog`.
- Параметры: 1
  - `{ onCreated, onClose }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `CreateGroupDialog`.

## `frontend/src/widgets/groups/GroupInfoPanel.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function GroupInfoPanel({ roomId }: Props) {`

- Вид: функция
- Кратко: React-компонент `GroupInfoPanel`.
- Параметры: 1
  - `{ roomId }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `GroupInfoPanel`.

## `frontend/src/widgets/groups/GroupListItem.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function GroupListItem({ group, onClick }: Props) {`

- Вид: функция
- Кратко: React-компонент `GroupListItem`.
- Параметры: 1
  - `{ group, onClick }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `GroupListItem`.

## `frontend/src/widgets/groups/GroupMembersList.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function GroupMembersList({ members, isAdmin, onKick, onBan, onMute, onUnmute, }: Props) {`

- Вид: функция
- Кратко: Компонент GroupMembersList рендерит список участников и их базовые действия.
- Параметры: 1
  - `{ members, isAdmin, onKick, onBan, onMute, onUnmute, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `GroupMembersList`.

## `frontend/src/widgets/layout/AppShell.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function AppShell(props: Props) {`

- Вид: функция
- Кратко: React-компонент `AppShell`.
- Параметры: 1
  - `props`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Свойства компонента или хука.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `AppShell`.

## `frontend/src/widgets/layout/InfoPanel.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function InfoPanel({ currentPublicRef, }: { currentPublicRef: string | null; }) {`

- Вид: функция
- Кратко: React-компонент `InfoPanel`.
- Параметры: 1
  - `{ currentPublicRef, }`
    - Формат: `{ currentPublicRef: string | null; }`
    - Вид: обязательный
    - Описание: Объект параметров в формате `{ currentPublicRef: string | null; }`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `InfoPanel`.

## `frontend/src/widgets/layout/Sidebar.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function Sidebar({ user, onNavigate, onLogout, onCloseMobileDrawer, showMobileDrawerControls = false, }: Props) {`

- Вид: функция
- Кратко: React-компонент `Sidebar`.
- Детали: Компонент также отвечает за desktop-resize, mobile drawer UX, открытие настроек, быстрый переход к друзьям и восстановление последнего личного чата.
- Параметры: 1
  - `{ user, onNavigate, onLogout, onCloseMobileDrawer, showMobileDrawerControls = false, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `Sidebar`.

## `frontend/src/widgets/settings/SettingsContent.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function SettingsContent({ user, onNavigate, onLogout, compact = false, showTitle = true, }: Props) {`

- Вид: функция
- Кратко: Показывает основной контент страницы настроек аккаунта.
- Детали: Компонент объединяет блок профиля, переключатель browser push-уведомлений, памятку по горячим клавишам и действие выхода из аккаунта. В компактном режиме используется как встраиваемая панель без лишнего визуального шума.
- Параметры: 1
  - `{ user, onNavigate, onLogout, compact = false, showTitle = true, }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `SettingsContent`.

## `frontend/src/widgets/sidebar/ConversationList.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ConversationList({ onNavigate }: Props) {`

- Вид: функция
- Кратко: Отрисовывает список диалогов и результаты глобального поиска в боковой панели.
- Детали: В обычном режиме показывает conversation list по выбранному фильтру, а при активном поиске переключается на секции пользователей, групп и сообщений.
- Параметры: 1
  - `{ onNavigate }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ConversationList`.

## `frontend/src/widgets/sidebar/ConversationListItem.tsx`

- Экспортируемые объявления: 1

### Объявления

#### `export function ConversationListItem({ item, isActive, onClick }: Props) {`

- Вид: функция
- Кратко: React-компонент `ConversationListItem`.
- Параметры: 1
  - `{ item, isActive, onClick }`
    - Формат: `Props`
    - Вид: обязательный
    - Описание: Объект параметров в формате `Props`.
- Возвращает: не указан
  - Описание: React-элемент, который отрисовывает компонент `ConversationListItem`.
