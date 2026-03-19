# Frontend Reference

Generated: 2026-03-19T00:46:47Z

Total modules: 251

## `frontend/src/adapters/apiService/acceptFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function acceptFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/addReaction.ts`

- Top-level declarations: 1

### Declarations

- `export async function addReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<ReactionResult> {`

## `frontend/src/adapters/apiService/approveJoinRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function approveJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/banMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function banMember( apiClient: AxiosInstance, roomId: string, userId: number, reason?: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/blockUser.ts`

- Top-level declarations: 1

### Declarations

- `export async function blockUser( apiClient: AxiosInstance, publicRef: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/cancelOutgoingFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function cancelOutgoingFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/createGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function createGroup( apiClient: AxiosInstance, data: { name: string; description?: string; isPublic?: boolean; username?: string | null; }, ): Promise<Group> {`

## `frontend/src/adapters/apiService/createInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function createInvite( apiClient: AxiosInstance, roomId: string, data?: { maxUses?: number; expiresInHours?: number }, ): Promise<GroupInvite> {`

## `frontend/src/adapters/apiService/createRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function createRoomOverride( apiClient: AxiosInstance, roomId: string, data: { targetRoleId?: number; targetUserId?: number; allow?: number; deny?: number; }, ): Promise<PermissionOverride> {`

## `frontend/src/adapters/apiService/createRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function createRoomRole( apiClient: AxiosInstance, roomId: string, data: { name: string; color?: string; permissions?: number }, ): Promise<Role> {`

## `frontend/src/adapters/apiService/declineFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function declineFriendRequest( apiClient: AxiosInstance, friendshipId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/deleteGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/deleteMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/deleteRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/deleteRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function deleteRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/editMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function editMessage( apiClient: AxiosInstance, roomId: string, messageId: number, content: string, ): Promise<EditMessageResult> {`

## `frontend/src/adapters/apiService/ensureCsrf.ts`

- Top-level declarations: 1

### Declarations

- `export async function ensureCsrf( apiClient: AxiosInstance, ): Promise<{ csrfToken: string }> {`
  - Выполняет запрос CSRF и декодирует DTO-ответ. @param apiClient HTTP-клиент. @returns Нормализованный CSRF payload.

## `frontend/src/adapters/apiService/ensurePresenceSession.ts`

- Top-level declarations: 1

### Declarations

- `export async function ensurePresenceSession( apiClient: AxiosInstance, ): Promise<{ ok: boolean }> {`
  - Фиксирует гостевую session перед presence websocket. @param apiClient HTTP-клиент. @returns Признак успешного bootstrap.

## `frontend/src/adapters/apiService/getBannedMembers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getBannedMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<BannedMembersResult> {`

## `frontend/src/adapters/apiService/getBlockedUsers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getBlockedUsers( apiClient: AxiosInstance, ): Promise<BlockedUser[]> {`

## `frontend/src/adapters/apiService/getClientConfig.ts`

- Top-level declarations: 1

### Declarations

- `export const getClientConfig = async (apiClient: AxiosInstance) => {`
  - Загружает runtime-конфиг клиента из backend policy endpoint.

## `frontend/src/adapters/apiService/getDirectChats.ts`

- Top-level declarations: 1

### Declarations

- `export const getDirectChats = async ( apiClient: AxiosInstance, ): Promise<DirectChatsResponse> => {`
  - Загружает список direct-чатов текущего пользователя. @param apiClient HTTP-клиент. @returns Нормализованный список direct-чатов.

## `frontend/src/adapters/apiService/getFriends.ts`

- Top-level declarations: 1

### Declarations

- `export async function getFriends(apiClient: AxiosInstance): Promise<Friend[]> {`

## `frontend/src/adapters/apiService/getGroupDetails.ts`

- Top-level declarations: 1

### Declarations

- `export async function getGroupDetails( apiClient: AxiosInstance, roomId: string, ): Promise<Group> {`

## `frontend/src/adapters/apiService/getGroupMembers.ts`

- Top-level declarations: 1

### Declarations

- `export async function getGroupMembers( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<GroupMembersResult> {`

## `frontend/src/adapters/apiService/getIncomingRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getIncomingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`

## `frontend/src/adapters/apiService/getInvitePreview.ts`

- Top-level declarations: 1

### Declarations

- `export async function getInvitePreview( apiClient: AxiosInstance, code: string, ): Promise<InvitePreview> {`

## `frontend/src/adapters/apiService/getInvites.ts`

- Top-level declarations: 1

### Declarations

- `export async function getInvites( apiClient: AxiosInstance, roomId: string, ): Promise<GroupInvite[]> {`

## `frontend/src/adapters/apiService/getJoinRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getJoinRequests( apiClient: AxiosInstance, roomId: string, ): Promise<JoinRequest[]> {`

## `frontend/src/adapters/apiService/getMemberRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<MemberRoles> {`

## `frontend/src/adapters/apiService/getMyGroups.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMyGroups( apiClient: AxiosInstance, params?: { search?: string; limit?: number; before?: number }, ): Promise<{`

## `frontend/src/adapters/apiService/getMyPermissions.ts`

- Top-level declarations: 1

### Declarations

- `export async function getMyPermissions( apiClient: AxiosInstance, roomId: string, ): Promise<MyPermissions> {`

## `frontend/src/adapters/apiService/getOutgoingRequests.ts`

- Top-level declarations: 1

### Declarations

- `export async function getOutgoingRequests( apiClient: AxiosInstance, ): Promise<FriendRequest[]> {`

## `frontend/src/adapters/apiService/getPasswordRules.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPasswordRules( apiClient: AxiosInstance, ): Promise<{ rules: string[] }> {`
  - Загружает подсказки по правилам пароля. @param apiClient HTTP-клиент. @returns Нормализованный список правил.

## `frontend/src/adapters/apiService/getPinnedMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPinnedMessages( apiClient: AxiosInstance, roomId: string, ): Promise<PinnedMessage[]> {`

## `frontend/src/adapters/apiService/getPublicGroups.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPublicGroups( apiClient: AxiosInstance, params?: PublicGroupsParams, ): Promise<PublicGroupsResult> {`

## `frontend/src/adapters/apiService/getPublicRoom.ts`

- Top-level declarations: 1

### Declarations

- `export async function getPublicRoom( apiClient: AxiosInstance, ): Promise<RoomDetails> {`
  - Загружает данные публичной комнаты. @param apiClient HTTP-клиент. @returns Нормализованные данные комнаты.

## `frontend/src/adapters/apiService/getRoomAttachments.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomAttachments( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; before?: number }, ): Promise<RoomAttachmentsResult> {`

## `frontend/src/adapters/apiService/getRoomDetails.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomDetails( apiClient: AxiosInstance, roomRef: string, ): Promise<RoomDetails> {`
  - Загружает детали комнаты по roomRef. @param apiClient HTTP-клиент. @param roomRef Идентификатор комнаты (public|roomId). @returns Нормализованные данные комнаты.

## `frontend/src/adapters/apiService/getRoomMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomMessages( apiClient: AxiosInstance, roomId: string, params?: { limit?: number; beforeId?: number }, ): Promise<RoomMessagesResponse> {`
  - Загружает сообщения комнаты с пагинацией. @param apiClient HTTP-клиент. @param roomId Идентификатор комнаты. @param params Параметры пагинации. @returns Нормализованный список сообщений.

## `frontend/src/adapters/apiService/getRoomOverrides.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomOverrides( apiClient: AxiosInstance, roomId: string, ): Promise<PermissionOverride[]> {`

## `frontend/src/adapters/apiService/getRoomRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function getRoomRoles( apiClient: AxiosInstance, roomId: string, ): Promise<Role[]> {`

## `frontend/src/adapters/apiService/getSession.ts`

- Top-level declarations: 1

### Declarations

- `export async function getSession( apiClient: AxiosInstance, ): Promise<SessionResponse> {`
  - Загружает текущую сессию пользователя. @param apiClient HTTP-клиент. @returns Декодированное состояние сессии.

## `frontend/src/adapters/apiService/getUnreadCounts.ts`

- Top-level declarations: 1

### Declarations

- `export async function getUnreadCounts( apiClient: AxiosInstance, ): Promise<UnreadCountItem[]> {`

## `frontend/src/adapters/apiService/getUserProfile.ts`

- Top-level declarations: 1

### Declarations

- `export async function getUserProfile( apiClient: AxiosInstance, ref: string, ): Promise<{ user: UserProfile }> {`
  - Загружает публичный профиль пользователя. @param apiClient HTTP-клиент. @param ref Публичный ref пользователя (handle/fallback-id). @returns Нормализованный профиль пользователя.

## `frontend/src/adapters/apiService/globalSearch.ts`

- Top-level declarations: 1

### Declarations

- `export async function globalSearch( apiClient: AxiosInstance, query: string, params?: { usersLimit?: number; groupsLimit?: number; messagesLimit?: number; }, ): Promise<GlobalSearchResult> {`

## `frontend/src/adapters/apiService/joinGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function joinGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/joinViaInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function joinViaInvite( apiClient: AxiosInstance, code: string, ): Promise<{ roomId: number }> {`

## `frontend/src/adapters/apiService/kickMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function kickMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/leaveGroup.ts`

- Top-level declarations: 1

### Declarations

- `export async function leaveGroup( apiClient: AxiosInstance, roomId: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/login.ts`

- Top-level declarations: 1

### Declarations

- `export async function login( apiClient: AxiosInstance, identifier: string, password: string, ): Promise<SessionResponse> {`
  - Выполняет логин пользователя. @param apiClient HTTP-клиент. @param identifier Логин или email. @param password Пароль. @returns Декодированное состояние сессии.

## `frontend/src/adapters/apiService/logout.ts`

- Top-level declarations: 1

### Declarations

- `export async function logout( apiClient: AxiosInstance, ): Promise<{ ok: boolean }> {`
  - Выполняет logout и декодирует DTO-ответ. @param apiClient HTTP-клиент. @returns Признак успешного выхода.

## `frontend/src/adapters/apiService/markRead.ts`

- Top-level declarations: 1

### Declarations

- `export async function markRead( apiClient: AxiosInstance, roomId: string, messageId?: number, ): Promise<ReadStateResult> {`

## `frontend/src/adapters/apiService/muteMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function muteMember( apiClient: AxiosInstance, roomId: string, userId: number, durationSeconds = 3600, ): Promise<void> {`

## `frontend/src/adapters/apiService/oauthGoogle.ts`

- Top-level declarations: 1

### Declarations

- `export async function oauthGoogle( apiClient: AxiosInstance, token: string, tokenType: "idToken" | "accessToken" = "idToken", username?: string, ): Promise<SessionResponse> {`
  - Выполняет вход/регистрацию через Google OAuth. @param apiClient HTTP-клиент. @param token OAuth token от Google Identity Services. @param tokenType Тип токена (`idToken` или `accessToken`). @returns Декодированное состояние сессии.

## `frontend/src/adapters/apiService/pinMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function pinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/register.ts`

- Top-level declarations: 1

### Declarations

- `export async function register( apiClient: AxiosInstance, login: string, password: string, passwordConfirm: string, name: string, username?: string, email?: string, ): Promise<SessionResponse> {`
  - Выполняет регистрацию пользователя. @param apiClient HTTP-клиент. @param login Логин. @param password Пароль. @param passwordConfirm Повтор пароля. @returns Декодированное состояние сессии.

## `frontend/src/adapters/apiService/rejectJoinRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function rejectJoinRequest( apiClient: AxiosInstance, roomId: string, requestId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/removeFriend.ts`

- Top-level declarations: 1

### Declarations

- `export async function removeFriend( apiClient: AxiosInstance, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/removeReaction.ts`

- Top-level declarations: 1

### Declarations

- `export async function removeReaction( apiClient: AxiosInstance, roomId: string, messageId: number, emoji: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/resolveRoomId.ts`

- Top-level declarations: 2

### Declarations

- `const toPositiveRoomIdString = (value: unknown): string | null => {`
- `export async function resolveRoomId( apiClient: AxiosInstance, roomRef: string, ): Promise<string> {`
  - Resolves UI room ref into backend API room ref. Backend room endpoints are roomId-based, so "public" must be converted.

## `frontend/src/adapters/apiService/revokeInvite.ts`

- Top-level declarations: 1

### Declarations

- `export async function revokeInvite( apiClient: AxiosInstance, roomId: string, code: string, ): Promise<void> {`

## `frontend/src/adapters/apiService/searchMessages.ts`

- Top-level declarations: 1

### Declarations

- `export async function searchMessages( apiClient: AxiosInstance, roomId: string, query: string, ): Promise<SearchResult> {`

## `frontend/src/adapters/apiService/sendFriendRequest.ts`

- Top-level declarations: 1

### Declarations

- `export async function sendFriendRequest( apiClient: AxiosInstance, publicRef: string, ): Promise<SendFriendRequestResponse> {`

## `frontend/src/adapters/apiService/setMemberRoles.ts`

- Top-level declarations: 1

### Declarations

- `export async function setMemberRoles( apiClient: AxiosInstance, roomId: string, userId: number, roleIds: number[], ): Promise<MemberRoles> {`

## `frontend/src/adapters/apiService/startDirectChat.ts`

- Top-level declarations: 1

### Declarations

- `export const startDirectChat = async ( apiClient: AxiosInstance, publicRef: string, ): Promise<DirectStartResponse> => {`
  - Создает или возвращает direct-чат по публичному ref. @param apiClient HTTP-клиент. @param publicRef Публичный handle/public_id собеседника. @returns Нормализованные данные direct-комнаты.

## `frontend/src/adapters/apiService/transferOwnership.ts`

- Top-level declarations: 1

### Declarations

- `export async function transferOwnership( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/unbanMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function unbanMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/unblockUser.ts`

- Top-level declarations: 1

### Declarations

- `export async function unblockUser( apiClient: AxiosInstance, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/unmuteMember.ts`

- Top-level declarations: 1

### Declarations

- `export async function unmuteMember( apiClient: AxiosInstance, roomId: string, userId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/unpinMessage.ts`

- Top-level declarations: 1

### Declarations

- `export async function unpinMessage( apiClient: AxiosInstance, roomId: string, messageId: number, ): Promise<void> {`

## `frontend/src/adapters/apiService/updateGroup.ts`

- Top-level declarations: 2

### Declarations

- `const appendScalar = (formData: FormData, key: string, value: unknown) => {`
- `export async function updateGroup( apiClient: AxiosInstance, roomId: string, data: UpdateGroupInput, ): Promise<Group> {`

## `frontend/src/adapters/apiService/updateProfile.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateProfile( apiClient: AxiosInstance, fields: UpdateProfileInput, ): Promise<{ user: UserProfile }> {`
  - Обновляет профиль пользователя. @param apiClient HTTP-клиент. @param fields Поля формы профиля. @returns Нормализованный профиль пользователя.

## `frontend/src/adapters/apiService/updateRoomOverride.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateRoomOverride( apiClient: AxiosInstance, roomId: string, overrideId: number, data: Partial<{ allow: number; deny: number }>, ): Promise<PermissionOverride> {`

## `frontend/src/adapters/apiService/updateRoomRole.ts`

- Top-level declarations: 1

### Declarations

- `export async function updateRoomRole( apiClient: AxiosInstance, roomId: string, roleId: number, data: Partial<{ name: string; color: string; permissions: number; position: number; }>, ): Promise<Role> {`

## `frontend/src/adapters/apiService/uploadAttachments.test.ts`

- Top-level declarations: 0

## `frontend/src/adapters/apiService/uploadAttachments.ts`

- Top-level declarations: 1

### Declarations

- `export async function uploadAttachments( apiClient: AxiosInstance, roomId: string, files: File[], options?: UploadAttachmentsOptions, ): Promise<UploadResult> {`

## `frontend/src/adapters/ApiService.test.ts`

- Top-level declarations: 0

## `frontend/src/adapters/ApiService.ts`

- Top-level declarations: 4

### Declarations

- `const getCsrfToken = () =>`
- `export const normalizeAxiosError = (error: unknown): ApiError => {`
  - Нормализует любые ошибки HTTP-клиента в единый формат ApiError.
- `class ApiService implements IApiService {`
  - Реализация API-сервиса с единым декодированием и нормализацией ошибок.
- `export const apiService = new ApiService();`

## `frontend/src/app/App.tsx`

- Top-level declarations: 10

### Declarations

- `function AppInner() {`
  - Внутренний роутинг-слой приложения с глобальными провайдерами.
- `const updateViewportVars = () => {`
- `const timerId = window.setTimeout(() => setBanner(null), 4200);`
- `const extractMessage = (err: unknown) => {`
- `const extractAuthMessage = (err: unknown, fallback: string) => {`
- `const extractFromData = (data: unknown) => {`
- `const extractProfileErrors = (err: unknown): ProfileFieldErrors | null => {`
- `const handleGoogleOAuth = useCallback(async () => {`
- `const handleLogout = useCallback(async () => {`
- `export function App() {`
  - Корневой компонент frontend-приложения.

## `frontend/src/app/routes.test.tsx`

- Top-level declarations: 0

## `frontend/src/app/routes.tsx`

- Top-level declarations: 5

### Declarations

- `function UserProfileRoute({ user, onNavigate, onLogout, }: Pick<AppRoutesProps, "user" | "onNavigate" | "onLogout">) {`
  - Обертка для пользовательского профиля с получением username из URL.
- `function DirectRoute({ user, onNavigate, }: Pick<AppRoutesProps, "user" | "onNavigate">) {`
  - Обертка для direct-чата по username из URL.
- `function RoomRoute({ user, onNavigate, }: Pick<AppRoutesProps, "user" | "onNavigate">) {`
  - Обертка для комнаты с валидацией roomRef.
- `function InviteRoute({ onNavigate }: Pick<AppRoutesProps, "onNavigate">) {`
  - Обертка для инвайт-превью с получением code из URL.
- `export function AppRoutes({ user, error, passwordRules, googleAuthDisabledReason, onNavigate, onLogin, onGoogleOAuth, onRegister, onLogout, onProfileSave, }: AppRoutesProps) {`
  - Декларация всех frontend-маршрутов приложения.

## `frontend/src/App.tsx`

- Top-level declarations: 0

## `frontend/src/controllers/AuthController.ts`

- Top-level declarations: 2

### Declarations

- `class AuthController {`
  - Описывает назначение класса AuthController.
- `export const authController = new AuthController();`

## `frontend/src/controllers/ChatController.test.ts`

- Top-level declarations: 7

### Declarations

- `const apiMocks = vi.hoisted(() => ({`
- `const loadController = async () => {`
- `const resetApiMocks = () => {`
- `const pending = new Promise<RoomDetailsDto>((res) => {`
- `const pending = new Promise<RoomDetailsDto>((res) => {`
- `const pending = new Promise<RoomMessagesDto>((res) => {`
- `const pending = new Promise<DirectChatsResponseDto>((res) => {`

## `frontend/src/controllers/ChatController.ts`

- Top-level declarations: 5

### Declarations

- `const buildRoomMessagesKey = (roomId: string, params?: RoomMessagesParams) => {`
  - Формирует ключ in-flight-кэша для getRoomMessages.
- `class ChatController {`
  - Контроллер чата с дедупликацией одинаковых in-flight запросов.
- `const request = apiService.getRoomDetails(roomId).finally(() => {`
- `const request = apiService.getRoomMessages(roomId, params).finally(() => {`
- `export const chatController = new ChatController();`

## `frontend/src/controllers/FriendsController.ts`

- Top-level declarations: 2

### Declarations

- `class FriendsController {`
- `export const friendsController = new FriendsController();`

## `frontend/src/controllers/GroupController.ts`

- Top-level declarations: 2

### Declarations

- `class GroupController {`
- `export const groupController = new GroupController();`

## `frontend/src/controllers/RolesController.ts`

- Top-level declarations: 2

### Declarations

- `class RolesController {`
- `export const rolesController = new RolesController();`

## `frontend/src/domain/interfaces/IApiService.ts`

- Top-level declarations: 0

## `frontend/src/dto/core/codec.ts`

- Top-level declarations: 5

### Declarations

- `const formatPath = (path: PropertyKey[]) =>`
- `const formatIssues = (error: z.ZodError): string[] =>`
- `export const decodeOrThrow = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, source: string, ): z.infer<TSchema> => {`
  - Проверяет входное значение по схеме и бросает DtoDecodeError при невалидном payload. @param schema Zod-схема внешнего контракта. @param input Входное внешнее значение. @param source Идентификатор источника (endpoint/event key). @returns Валидированные и типизированные данные.
- `export const safeDecode = <TSchema extends z.ZodTypeAny>( schema: TSchema, input: unknown, ): z.infer<TSchema> | null => {`
  - Проверяет входное значение по схеме без броска исключения. @param schema Zod-схема внешнего контракта. @param input Входное внешнее значение. @returns Валидированное значение или null.
- `export const parseJson = (raw: string): unknown | null => {`
  - Разбирает JSON-строку в unknown-объект без падения. @param raw Сырой JSON payload. @returns Разобранное значение или null.

## `frontend/src/dto/core/errors.ts`

- Top-level declarations: 1

### Declarations

- `export class DtoDecodeError extends Error {`

## `frontend/src/dto/http/auth.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/auth.ts`

- Top-level declarations: 12

### Declarations

- `export const decodeCsrfResponse = (input: unknown) =>`
- `export const decodePresenceSessionResponse = (input: unknown) =>`
- `export const decodePasswordRulesResponse = (input: unknown) =>`
- `export const decodeLogoutResponse = (input: unknown) =>`
- `export const decodeSessionResponse = (input: unknown): SessionResponseDto => {`
- `export const decodeProfileEnvelopeResponse = ( input: unknown, ): ProfileEnvelopeDto => {`
- `export const decodeAuthErrorPayload = ( input: unknown, ): AuthErrorPayloadDto | null => safeDecode(errorPayloadSchema, input);`
- `export const buildLoginRequestDto = (input: unknown): LoginRequestDto =>`
- `export const buildRegisterRequestDto = (input: unknown): RegisterRequestDto =>`
- `export const buildOAuthGoogleRequestDto = ( input: unknown, ): OAuthGoogleRequestDto =>`
- `export const buildUpdateProfileRequestDto = ( input: unknown, ): UpdateProfileRequestDto =>`
- `export const validatePublicUsername = (username: string): string =>`

## `frontend/src/dto/http/chat.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/chat.ts`

- Top-level declarations: 16

### Declarations

- `const mapPeer = (dto: z.infer<typeof roomPeerSchema>): RoomPeer => {`
- `const mapMessage = (dto: z.infer<typeof messageSchema>): Message => ({`
- `export const decodePublicRoomResponse = (input: unknown): RoomDetails => {`
  - Декодирует payload /api/chat/public-room/.
- `export const decodeRoomDetailsResponse = (input: unknown): RoomDetails => {`
  - Декодирует payload /api/chat/rooms/{room_id}/.
- `export const decodeRoomMessagesResponse = (input: unknown): RoomMessagesDto => {`
  - Декодирует payload /api/chat/rooms/{room_id}/messages/.
- `export const decodeDirectStartResponse = ( input: unknown, ): DirectStartResponseDto => {`
  - Декодирует payload /api/chat/direct/start/.
- `export const decodeDirectChatsResponse = ( input: unknown, ): DirectChatsResponseDto => {`
  - Декодирует payload /api/chat/direct/chats/.
- `const toRoomId = (value: number | string): number => {`
- `export const decodeEditMessageResponse = ( input: unknown, ): EditMessageResponse => {`
- `export const decodeReactionResponse = (input: unknown): ReactionResponse => {`
- `export const decodeSearchResponse = (input: unknown): SearchResponse => {`
- `export const decodeUploadResponse = (input: unknown): UploadResponse => {`
- `export const decodeReadStateResponse = (input: unknown): ReadStateResponse => {`
- `export const decodeUnreadCountsResponse = ( input: unknown, ): UnreadCountItem[] => {`
- `export const decodeRoomAttachmentsResponse = ( input: unknown, ): RoomAttachmentsResponse => {`
- `export const decodeGlobalSearchResponse = ( input: unknown, ): GlobalSearchResponse => {`

## `frontend/src/dto/http/friends.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/friends.ts`

- Top-level declarations: 7

### Declarations

- `const mapFriend = (dto: z.infer<typeof friendshipSchema>): Friend => ({`
- `export const decodeFriendsListResponse = (input: unknown): Friend[] => {`
- `export const decodeIncomingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`
- `export const decodeOutgoingRequestsResponse = ( input: unknown, ): FriendRequest[] => {`
- `export const decodeSendFriendRequestResponse = ( input: unknown, ): SendFriendRequestResponse => {`
- `export const decodeBlockResponse = (input: unknown): BlockedUser => {`
- `export const decodeBlockedListResponse = (input: unknown): BlockedUser[] => {`

## `frontend/src/dto/http/groups.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/groups.ts`

- Top-level declarations: 11

### Declarations

- `const toRoomId = (value: number | string): number => {`
- `const mapGroup = (dto: z.infer<typeof groupSchema>): Group => ({`
- `export const decodeGroupResponse = (input: unknown): Group =>`
- `export const decodeGroupListResponse = ( input: unknown, ): {`
- `export const decodeGroupMembersResponse = ( input: unknown, ): {`
- `export const decodeInvitesResponse = (input: unknown): GroupInvite[] => {`
- `export const decodeInviteResponse = (input: unknown): GroupInvite => {`
- `export const decodeInvitePreviewResponse = (input: unknown): InvitePreview => {`
- `export const decodeJoinRequestsResponse = (input: unknown): JoinRequest[] => {`
- `export const decodePinnedMessagesResponse = ( input: unknown, ): PinnedMessage[] => {`
- `export const decodeBannedMembersResponse = ( input: unknown, ): {`

## `frontend/src/dto/http/meta.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/http/meta.ts`

- Top-level declarations: 1

### Declarations

- `export const decodeClientConfigResponse = ( input: unknown, ): ClientRuntimeConfig =>`
  - Декодирует payload /api/meta/client-config/.

## `frontend/src/dto/http/roles.ts`

- Top-level declarations: 7

### Declarations

- `const mapRole = (dto: z.infer<typeof roleSchema>): Role => ({`
- `export const decodeRolesListResponse = (input: unknown): Role[] => {`
- `export const decodeRoleResponse = (input: unknown): Role => {`
- `export const decodeMemberRolesResponse = (input: unknown): MemberRoles => {`
- `export const decodeOverridesResponse = ( input: unknown, ): PermissionOverride[] => {`
- `export const decodeOverrideResponse = (input: unknown): PermissionOverride => {`
- `export const decodeMyPermissionsResponse = (input: unknown): MyPermissions => {`

## `frontend/src/dto/index.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/route.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/route.ts`

- Top-level declarations: 2

### Declarations

- `export const decodeRoomRefParam = (value: unknown): string | null => {`
  - Декодирует roomRef из route-параметра. Разрешены: `public` и положительный roomId.
- `export const decodePublicRefParam = (value: unknown): string | null => {`
  - Декодирует public ref из route-параметра. Нормализует `@handle` -> `handle`.

## `frontend/src/dto/input/storage.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/storage.ts`

- Top-level declarations: 6

### Declarations

- `export const readCookieValue = ( cookie: string | null | undefined, name: string, ): string | null => {`
  - Извлекает значение cookie по имени. @param cookie Сырой document.cookie. @param name Имя cookie. @returns Значение cookie или null.
- `const chunks = cookie.split(";").map((entry) => entry.trim());`
- `const match = chunks.find((entry) => entry.startsWith(`${cookieName.data}=`));`
- `export const readCsrfFromCookie = (): string | null => {`
  - Читает csrf token из document.cookie в браузере. @returns Значение csrf cookie или null.
- `export const readCsrfFromSessionStorage = ( storageKey: string, ): string | null => {`
  - Читает csrf token из sessionStorage. @param storageKey Ключ в sessionStorage. @returns Значение csrf token или null.
- `export const writeCsrfToSessionStorage = ( storageKey: string, token: string | null, ): void => {`
  - Сохраняет csrf token в sessionStorage. @param storageKey Ключ в sessionStorage. @param token Значение токена.

## `frontend/src/dto/input/swMessage.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/input/swMessage.ts`

- Top-level declarations: 2

### Declarations

- `export const encodeSwCacheMessage = (input: unknown): SwCacheMessage => {`
  - Валидирует исходящее сообщение в Service Worker. @param input Сырой payload. @returns Валидированный payload.
- `export const decodeSwCacheMessage = (input: unknown): SwCacheMessage | null => {`
  - Безопасно декодирует входящее сообщение в Service Worker. @param input Сырой payload. @returns Валидированный payload или null.

## `frontend/src/dto/ws/chat.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/chat.ts`

- Top-level declarations: 2

### Declarations

- `const toNumberOrNull = (value: unknown): number | null => {`
- `export const decodeChatWsEvent = (raw: string): ChatWsEvent => {`
  - Декодирует входящее WS-сообщение комнаты чата. @param raw Сырой JSON payload из websocket. @returns Нормализованное WS-событие.

## `frontend/src/dto/ws/directInbox.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/directInbox.ts`

- Top-level declarations: 1

### Declarations

- `export const decodeDirectInboxWsEvent = (raw: string): DirectInboxWsEvent => {`
  - Декодирует входящее WS-сообщение direct inbox. @param raw Сырой JSON payload из websocket. @returns Нормализованное WS-событие.

## `frontend/src/dto/ws/presence.test.ts`

- Top-level declarations: 0

## `frontend/src/dto/ws/presence.ts`

- Top-level declarations: 2

### Declarations

- `const toGuests = (value: unknown): number | null => {`
- `export const decodePresenceWsEvent = (raw: string): PresenceWsEvent => {`
  - Декодирует входящее WS-сообщение presence. @param raw Сырой JSON payload из websocket. @returns Нормализованное WS-событие.

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
- `export const hasPermissionFlag = (mask: number, flag: number): boolean => {`
- `export const combinePermissionFlags = (flags: Iterable<number>): number => {`
- `export const flagsFromMask = ( mask: number, flags: readonly number[], ): number[] => flags.filter((flag) => hasPermissionFlag(mask, flag));`

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
  - Выполняет функцию `normalizeProfileImage`. @param user Входной параметр `user`. @returns Результат выполнения `normalizeProfileImage`.
- `export const useAuth = () => {`
  - Управляет состоянием и эффектами хука `useAuth`. @returns Результат выполнения `useAuth`.
- `const login = useCallback(async (dto: LoginDto) => {`
- `const register = useCallback(async (dto: RegisterDto) => {`
- `const logout = useCallback(async () => {`

## `frontend/src/hooks/useChatActions.ts`

- Top-level declarations: 2

### Declarations

- `export const useChatActions = () => {`
  - Управляет состоянием и эффектами хука `useChatActions`. @returns Результат выполнения `useChatActions`.
- `const getDirectChats = useCallback(() => chatController.getDirectChats(), []);`

## `frontend/src/hooks/useChatRoom.test.ts`

- Top-level declarations: 2

### Declarations

- `const controllerMocks = vi.hoisted(() => ({`
- `const messages = Array.from({ length: 50 }, (_, idx) =>`

## `frontend/src/hooks/useChatRoom.ts`

- Top-level declarations: 13

### Declarations

- `const messageKey = (message: Message) => `${message.id}-${message.createdAt}`;`
- `const dedupeMessages = (messages: Message[]) => {`
- `const resolveHasMore = (payload: RoomMessagesDto, fetched: Message[]) => {`
- `const resolveNextBefore = (payload: RoomMessagesDto, fetched: Message[]) => {`
- `const createInitialRoomState = (roomSlug: string): ChatRoomState => ({`
- `export const useChatRoom = (slug: string, user: UserProfileDto | null) => {`
  - Управляет состоянием страницы комнаты: загрузка, пагинация и дедуп сообщений.
- `const loadInitial = useCallback(() => {`
- `const sanitized = payload.messages.map((message) =>`
- `const taskId = window.setTimeout(() => {`
- `const loadMore = useCallback(async () => {`
- `const sanitized = payload.messages.map((message) =>`
- `const sanitized = nextMessages.map((message) =>`
- `const setError = useCallback((error: string | null) => {`

## `frontend/src/hooks/useFriends.ts`

- Top-level declarations: 2

### Declarations

- `export function useFriends(): UseFriendsResult {`
- `const reload = useCallback(async () => {`

## `frontend/src/hooks/useGroupDetails.ts`

- Top-level declarations: 5

### Declarations

- `export function useGroupDetails(slug: string): UseGroupDetailsResult {`
- `const reload = useCallback(async () => {`
- `const deleteGroupCb = useCallback(async () => {`
- `const joinGroupCb = useCallback(async () => {`
- `const leaveGroupCb = useCallback(async () => {`

## `frontend/src/hooks/useGroupList.ts`

- Top-level declarations: 2

### Declarations

- `export function useGroupList(): UseGroupListResult {`
- `const reload = useCallback(async () => {`

## `frontend/src/hooks/useKeyboardShortcuts.ts`

- Top-level declarations: 2

### Declarations

- `export function useKeyboardShortcuts({ slug }: Options = {}) {`
- `const handler = (e: KeyboardEvent) => {`

## `frontend/src/hooks/useOnlineStatus.ts`

- Top-level declarations: 3

### Declarations

- `export const useOnlineStatus = () => {`
  - Управляет состоянием и эффектами хука `useOnlineStatus`. @returns Результат выполнения `useOnlineStatus`.
- `const handleOnline = () => setOnline(true);`
- `const handleOffline = () => setOnline(false);`

## `frontend/src/hooks/usePasswordRules.ts`

- Top-level declarations: 1

### Declarations

- `export const usePasswordRules = (enabled: boolean) => {`
  - Управляет состоянием и эффектами хука `usePasswordRules`. @param enabled Входной параметр `enabled`. @returns Результат выполнения `usePasswordRules`.

## `frontend/src/hooks/usePublicRoom.ts`

- Top-level declarations: 1

### Declarations

- `export const usePublicRoom = (user: UserProfileDto | null) => {`
  - Управляет состоянием и эффектами хука `usePublicRoom`. @param user Входной параметр `user`. @returns Результат выполнения `usePublicRoom`.

## `frontend/src/hooks/useReconnectingWebSocket.test.ts`

- Top-level declarations: 1

### Declarations

- `class MockWebSocket {`
  - Описывает назначение класса `MockWebSocket`.

## `frontend/src/hooks/useReconnectingWebSocket.ts`

- Top-level declarations: 8

### Declarations

- `export const useReconnectingWebSocket = (options: WebSocketOptions) => {`
  - Управляет состоянием и эффектами хука `useReconnectingWebSocket`. @param options Входной параметр `options`. @returns Результат выполнения `useReconnectingWebSocket`.
- `const connectRef = useRef<(() => void) | null>(null);`
- `const clearRetry = () => {`
- `const cleanup = useCallback(() => {`
- `const connect = useCallback(() => {`
- `const handleOnline = () => {`
- `const handleOffline = () => {`
- `const send = useCallback((data: string) => {`

## `frontend/src/hooks/useRoomPermissions.ts`

- Top-level declarations: 2

### Declarations

- `export function useRoomPermissions( slug: string | null, ): UseRoomPermissionsResult {`
- `const load = useCallback(async () => {`

## `frontend/src/hooks/useTypingIndicator.ts`

- Top-level declarations: 2

### Declarations

- `export function useTypingIndicator(send: (data: string) => boolean) {`
- `const sendTyping = useCallback(() => {`

## `frontend/src/hooks/useUserProfile.ts`

- Top-level declarations: 1

### Declarations

- `export const useUserProfile = (publicRef: string) => {`
  - Управляет состоянием и эффектами хука `useUserProfile`. @param publicRef Входной параметр `publicRef`. @returns Результат выполнения `useUserProfile`.

## `frontend/src/main.tsx`

- Top-level declarations: 1

### Declarations

- `const registerServiceWorker = () => {`
  - Выполняет функцию `registerServiceWorker`. @returns Результат выполнения `registerServiceWorker`.

## `frontend/src/pages/chatRoomPage/useFileDropZone.ts`

- Top-level declarations: 2

### Declarations

- `export const useFileDropZone = ({ enabled, onFilesDrop }: Options): Result => {`
- `const resetState = useCallback(() => {`

## `frontend/src/pages/chatRoomPage/utils.ts`

- Top-level declarations: 23

### Declarations

- `export const TYPING_TIMEOUT_MS = 5_000;`
- `export const MAX_HISTORY_JUMP_ATTEMPTS = 60;`
- `export const MAX_HISTORY_NO_PROGRESS_ATTEMPTS = 2;`
- `export const MARK_READ_DEBOUNCE_MS = 180;`
- `export const normalizeActorRef = (value: string | null | undefined): string => {`
- `export const resolveCurrentActorRef = (user: UserProfile | null): string => {`
- `export const resolveMessageActorRef = ( message: Pick<Message, "publicRef">, ): string => normalizeActorRef(message.publicRef);`
- `export const isOwnMessage = (message: Message, currentActorRef: string) =>`
- `export const normalizeReadMessageId = (value: unknown): number => {`
- `export const parseRoomIdRef = (value: unknown): number | null => {`
- `export const isFileDragPayload = ( dataTransfer: DataTransfer | null | undefined, ): boolean => {`
- `const pendingReadStorageKey = (roomSlug: string) =>`
- `export const readPendingReadFromStorage = (roomSlug: string): number => {`
- `export const writePendingReadToStorage = ( roomSlug: string, lastReadMessageId: number, ): void => {`
- `export const clearPendingReadFromStorage = (roomSlug: string): void => {`
- `const readCookieValue = (cookie: string, name: string): string | null => {`
- `const chunks = cookie.split(";").map((entry) => entry.trim());`
- `const match = chunks.find((entry) => entry.startsWith(`${name}=`));`
- `export const resolveCsrfToken = (): string | null => {`
- `export const extractApiErrorMessage = (error: unknown, fallback: string) => {`
- `export const sameAvatarCrop = ( left: Message["avatarCrop"], right: Message["avatarCrop"], ) => {`
- `export const formatGroupTypingLabel = ( kind: string | null | undefined, activeTypingUsers: string[], ): string | null => {`
- `export const buildTimeline = ( messages: Message[], unreadDividerRenderTarget: UnreadDividerRenderTarget, ): TimelineItem[] => {`

## `frontend/src/pages/ChatRoomPage.test.tsx`

- Top-level declarations: 11

### Declarations

- `const wsState = vi.hoisted(() => ({`
- `const chatRoomMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`
- `const infoPanelMock = vi.hoisted(() => ({`
- `const permissionsMock = vi.hoisted(() => ({`
- `const groupControllerMock = vi.hoisted(() => ({`
- `const chatControllerMock = vi.hoisted(() => ({`
- `const makeForeignMessage = (id: number, content: string): Message => ({`
- `const mockViewport = () => {`
- `const files = Array.from({ length: 6 }, (_, index) =>`
- `const files = Array.from({ length: 6 }, (_, index) =>`

## `frontend/src/pages/ChatRoomPage.tsx`

- Top-level declarations: 38

### Declarations

- `export function ChatRoomPage({ slug, user, onNavigate }: Props) {`
- `const parsedSlugRoomId = useMemo(() => parseRoomIdRef(slug), [slug]);`
- `const resolvedRoomId = useMemo(() => {`
- `const roomApiRef = useMemo(() => {`
- `const currentActorRef = useMemo(() => resolveCurrentActorRef(user), [user]);`
- `const beginProgrammaticScroll = useCallback(() => {`
- `const unreadDividerRenderTarget = useMemo(() => {`
- `const wsUrl = useMemo(() => {`
- `const applyRateLimit = useCallback((cooldownMs: number) => {`
- `const scrollMessageIntoView = useCallback((messageId: number) => {`
- `const onKeyDown = (event: KeyboardEvent) => {`
- `const onMouseDown = (event: MouseEvent) => {`
- `const id = window.setInterval(() => {`
- `const flushPendingRead = useCallback(() => {`
- `const scheduleViewportReadSync = useCallback(() => {`
- `const onVisibilityChange = () => {`
- `const onPageHide = () => {`
- `const onBeforeUnload = () => {`
- `const id = window.setInterval(() => {`
- `const updated = prev.map((msg) => {`
- `const armPaginationInteraction = useCallback(() => {`
- `const scrollToBottom = useCallback(() => {`
- `const sendMessage = useCallback(async () => {`
- `const handleReply = useCallback((msg: Message) => {`
- `const handleEdit = useCallback((msg: Message) => {`
- `const handleDelete = useCallback((msg: Message) => {`
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
- `const openRoomSearch = useCallback(() => {`
- `const maxReadMessageId = useMemo(() => {`

## `frontend/src/pages/DirectChatByUsernamePage.test.tsx`

- Top-level declarations: 1

### Declarations

- `const controllerMock = vi.hoisted(() => ({`

## `frontend/src/pages/DirectChatByUsernamePage.tsx`

- Top-level declarations: 1

### Declarations

- `export function DirectChatByUsernamePage({ user, publicRef, onNavigate }: Props) {`

## `frontend/src/pages/DirectChatsPage.test.tsx`

- Top-level declarations: 2

### Declarations

- `const inboxMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`

## `frontend/src/pages/DirectChatsPage.tsx`

- Top-level declarations: 3

### Declarations

- `const normalizeActorRef = (value: string): string =>`
- `export function DirectChatsList({ user, onNavigate, activeUsername, resetActiveOnMount = true, className, }: ListProps) {`
- `export function DirectChatsPage({ user, onNavigate }: Props) {`

## `frontend/src/pages/FriendsPage.tsx`

- Top-level declarations: 4

### Declarations

- `const normalizeActorRef = (value: string): string =>`
- `const IconPlus = () => (`
- `export function FriendsPage({ user, onNavigate }: Props) {`
- `const timer = window.setTimeout(() => clearInfoMessage(), 3000);`

## `frontend/src/pages/GroupsPage.tsx`

- Top-level declarations: 2

### Declarations

- `const IconPlus = () => (`
- `export function GroupsPage({ user, onNavigate }: Props) {`

## `frontend/src/pages/HomePage copy.tsx`

- Top-level declarations: 9

### Declarations

- `const buildTempId = (seed: number) => Date.now() * 1000 + seed;`
- `export function HomePage({ user, onNavigate }: Props) {`
  - Главная страница приложения с публичным эфиром и списком онлайн. @param props Текущий пользователь и навигация. @returns JSX главной страницы.
- `const visiblePublicRoom = useMemo(() => publicRoom, [publicRoom]);`
- `const isLoading = useMemo(() => loading, [loading]);`
- `const sanitized = payload.messages.map((msg) => ({`
- `const liveUrl = useMemo(() => {`
- `const handleLiveMessage = useCallback((event: MessageEvent) => {`
- `const createRoomSlug = (length = 12) => {`
- `const onCreateRoom = async () => {`

## `frontend/src/pages/HomePage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/HomePage.tsx`

- Top-level declarations: 1

### Declarations

- `export function HomePage({ user, onNavigate }: Props) {`

## `frontend/src/pages/InvitePreviewPage.tsx`

- Top-level declarations: 2

### Declarations

- `export function InvitePreviewPage({ code, onNavigate }: Props) {`
- `const handleJoin = useCallback(async () => {`

## `frontend/src/pages/LoginPage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/LoginPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function LoginPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, }: Props) {`

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
- `export function ProfilePage({ user, onSave, onNavigate }: Props) {`
- `const clearFieldError = (field: string) => {`
- `const revokeBlobUrl = (value: string | null) => {`
- `const clearPendingState = (revoke = true) => {`
- `const timeoutId = window.setTimeout(() => setFormError(null), 4200);`
- `const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {`
- `const handleCropCancel = () => {`
- `const handleCropApply = (nextCrop: AvatarCrop) => {`

## `frontend/src/pages/RegisterPage.test.tsx`

- Top-level declarations: 0

## `frontend/src/pages/RegisterPage.tsx`

- Top-level declarations: 1

### Declarations

- `export function RegisterPage({ onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], }: Props) {`

## `frontend/src/pages/SettingsPage.tsx`

- Top-level declarations: 2

### Declarations

- `export function SettingsPage({ user, onNavigate, onLogout }: Props) {`
- `const handleToggleNotifications = useCallback(async () => {`

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
- `export function UserProfilePage({ username, currentUser, onNavigate, onLogout, }: Props) {`
  - Публичная страница профиля пользователя. @param props Данные маршрута, текущей сессии и обработчики действий. @returns JSX-страница профиля пользователя.
- `const clampZoom = (value: number) => Math.min(15, Math.max(1, value));`
- `const clampPan = (nextX: number, nextY: number, zoomValue: number = zoom) => {`
- `const openPreview = () => {`
- `const closePreview = () => setIsPreviewOpen(false);`
- `const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {`
- `const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {`
- `const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {`
- `const handleTouchEnd = () => {`
- `const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {`
- `const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {`
- `const handleMouseUp = () => {`
- `const handleAvatarKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {`
- `const onKeyDown = (event: KeyboardEvent) => {`

## `frontend/src/shared/api/types.ts`

- Top-level declarations: 0

## `frontend/src/shared/api/users.ts`

- Top-level declarations: 0

## `frontend/src/shared/auth/googleIdentity.ts`

- Top-level declarations: 10

### Declarations

- `export class GoogleOAuthError extends Error {`
- `const getGoogleIdApi = (): GoogleAccountsId | null =>`
- `const getGoogleOauth2Api = (): GoogleAccountsOauth2 | null =>`
- `const loadGoogleIdentitySdk = async (): Promise<void> => {`
- `const toGoogleAuthError = (message: string): GoogleOAuthError =>`
- `const timeoutId = window.setTimeout(() => {`
- `const finish = (result: { token?: string; error?: GoogleOAuthError }) => {`
- `const timeoutId = window.setTimeout(() => {`
- `const finish = (result: { token?: string; error?: GoogleOAuthError }) => {`
- `export const signInWithGoogle = async ( clientId: string, ): Promise<GoogleOAuthSuccess> => {`

## `frontend/src/shared/cache/cacheConfig.ts`

- Top-level declarations: 3

### Declarations

- `export const CACHE_NAMES = {`
- `export const CACHE_TTLS = {`
- `export const CACHE_LIMITS = {`

## `frontend/src/shared/cache/cacheManager.ts`

- Top-level declarations: 7

### Declarations

- `const postMessage = (message: SwCacheMessage): void => {`
- `export const invalidateRoomMessages = (roomRef: string) => {`
  - Инвалидирует кэш сообщений комнаты. @param roomRef Room ref (обычно roomId).
- `export const invalidateRoomDetails = (roomRef: string) => {`
  - Инвалидирует кэш деталей комнаты. @param roomRef Room ref (обычно roomId).
- `export const invalidateDirectChats = () => {`
  - Инвалидирует кэш списка direct-чатов.
- `export const invalidateUserProfile = (publicRef: string) => {`
  - Инвалидирует кэш публичного профиля пользователя. @param publicRef Публичный ref пользователя (handle или fallback-id).
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
- `const normalizeActorRef = (value: string | null | undefined): string => {`
- `const resolveMessageActorRef = (message: Message): string =>`
- `export const collectVisibleMessageIdsByBottomEdge = ( listElement: HTMLElement, ): Set<number> => {`
- `export const computeNextLastReadMessageId = ({ messages, currentActorRef, previousLastReadMessageId, visibleMessageIds, }: ComputeNextLastReadMessageIdParams): number => {`
- `export const computeUnreadStats = ({ messages, currentActorRef, lastReadMessageId, }: ComputeUnreadStatsParams): UnreadStats => {`
- `export const useReadTracker = ({ messages, currentActorRef, serverLastReadMessageId, enabled, resetKey, }: UseReadTrackerParams) => {`

## `frontend/src/shared/config/limits.ts`

- Top-level declarations: 11

### Declarations

- `export const getUsernameMaxLength = () => getRuntimeConfig().usernameMaxLength;`
  - Возвращает ограничение длины username из backend policy.
- `export const useUsernameMaxLength = () =>`
  - Хук доступа к ограничению длины username из runtime policy.
- `export const getChatMessageMaxLength = () =>`
  - Возвращает ограничение длины сообщения из runtime policy.
- `export const useChatMessageMaxLength = () =>`
  - Хук доступа к ограничению длины сообщения из runtime policy.
- `export const getChatAttachmentMaxSizeMb = () =>`
  - Возвращает максимальный размер одного вложения в МБ из runtime policy.
- `export const getChatAttachmentMaxSizeBytes = () =>`
  - Возвращает максимальный размер одного вложения в байтах из runtime policy.
- `export const useChatAttachmentMaxSizeMb = () =>`
  - Хук доступа к лимиту размера одного вложения (в МБ).
- `export const useChatAttachmentMaxPerMessage = () =>`
  - Хук доступа к лимиту количества вложений на сообщение.
- `export const useChatAttachmentAllowedTypes = () =>`
  - Хук доступа к списку разрешенных MIME-типов вложений.
- `export const getChatRoomSlugRegex = () => {`
  - Возвращает строковое regex-правило для slug комнаты.
- `export const getChatRoomSlugRegExp = () => {`
  - Возвращает RegExp для валидации slug комнаты с безопасным fallback.

## `frontend/src/shared/config/runtimeConfig.ts`

- Top-level declarations: 3

### Declarations

- `export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {`
- `export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;`
  - Возвращает актуальный runtime-конфиг клиента.
- `export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {`
  - Обновляет runtime-конфиг клиента значениями с backend.

## `frontend/src/shared/config/RuntimeConfigContext.ts`

- Top-level declarations: 2

### Declarations

- `export const RuntimeConfigContext = createContext<RuntimeConfigContextValue>({ config: DEFAULT_RUNTIME_CONFIG, ready: false, });`
- `export function useRuntimeConfig(): RuntimeConfigContextValue {`
  - Возвращает runtime policy-конфиг frontend.

## `frontend/src/shared/config/RuntimeConfigProvider.tsx`

- Top-level declarations: 1

### Declarations

- `export function RuntimeConfigProvider({ children, }: RuntimeConfigProviderProps) {`
  - Подгружает runtime policy-конфиг и делает его доступным всему frontend.

## `frontend/src/shared/conversationList/ConversationListProvider.test.tsx`

- Top-level declarations: 3

### Declarations

- `const chatMock = vi.hoisted(() => ({`
- `const groupMock = vi.hoisted(() => ({`
- `function Probe() {`

## `frontend/src/shared/conversationList/ConversationListProvider.tsx`

- Top-level declarations: 9

### Declarations

- `const canRunGlobalSearchQuery = (query: string) => {`
- `const normalizeActorRef = (value: string): string =>`
- `export function ConversationListProvider({ user, ready, children }: Props) {`
- `const fetchData = useCallback(async () => {`
- `const onRefresh = () => {`
- `const timerId = window.setTimeout(() => {`
- `const items = useMemo<ConversationItem[]>(() => {`
- `const resolveUnreadCount = (slug: string, wsUnreadCount?: number) => {`
- `export function useConversationList() {`

## `frontend/src/shared/conversationList/events.ts`

- Top-level declarations: 2

### Declarations

- `export const CONVERSATION_LIST_REFRESH_EVENT = "conversation-list:refresh";`
- `export const emitConversationListRefresh = (): void => {`

## `frontend/src/shared/directInbox/context.ts`

- Top-level declarations: 4

### Declarations

- `const noop = () => {};`
  - Выполняет функцию `noop`. @returns Результат выполнения `noop`.
- `const noopAsync = async () => {};`
  - Выполняет функцию `noopAsync`. @returns Результат выполнения `noopAsync`.
- `export const FALLBACK_DIRECT_INBOX: DirectInboxContextValue = {`
- `export const DirectInboxContext = createContext<DirectInboxContextValue>( FALLBACK_DIRECT_INBOX, );`

## `frontend/src/shared/directInbox/DirectInboxProvider.test.tsx`

- Top-level declarations: 4

### Declarations

- `const wsMock = vi.hoisted(() => ({`
- `const chatMock = vi.hoisted(() => ({`
- `function Probe() {`
  - Рендерит компонент `Probe` и связанную разметку. @returns Результат выполнения `Probe`.
- `const sentPayloads = () =>`
  - Выполняет функцию `sentPayloads`. @returns Результат выполнения `sentPayloads`.

## `frontend/src/shared/directInbox/DirectInboxProvider.tsx`

- Top-level declarations: 7

### Declarations

- `const filtered = prev.filter((item) => item.slug !== incoming.slug);`
- `export function DirectInboxProvider({ user, ready = true, children, }: ProviderProps) {`
  - Провайдер списка direct-чатов и unread-состояния. @param props Пользователь, флаг готовности и дочерние компоненты. @returns React context provider direct inbox.
- `const wsUrl = useMemo(() => {`
- `const refresh = useCallback(async () => {`
- `const unreadCountsWithOverrides = useMemo(() => {`
- `const knownDirectSlugs = new Set(items.map((item) => item.slug));`
- `const id = window.setInterval(() => {`

## `frontend/src/shared/directInbox/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/directInbox/useDirectInbox.ts`

- Top-level declarations: 1

### Declarations

- `export const useDirectInbox = () => useContext(DirectInboxContext);`
  - Управляет состоянием и эффектами хука `useDirectInbox`. @returns Результат выполнения `useDirectInbox`.

## `frontend/src/shared/layout/useInfoPanel.tsx`

- Top-level declarations: 4

### Declarations

- `export function InfoPanelProvider({ children }: { children: ReactNode }) {`
- `const close = useCallback(() => {`
- `const clearClosed = useCallback(() => {`
- `export function useInfoPanel() {`

## `frontend/src/shared/lib/attachmentMedia.ts`

- Top-level declarations: 5

### Declarations

- `const normalizeContentType = (contentType: string | null | undefined): string =>`
- `const hasSvgExtension = (fileName: string | null | undefined): boolean =>`
- `export const isSvgAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`
- `export const isImageAttachment = ( contentType: string | null | undefined, fileName: string | null | undefined, ): boolean => {`
- `export const resolveImagePreviewUrl = ({ url, thumbnailUrl, contentType, fileName, }: { url: string | null; thumbnailUrl: string | null; contentType: string | null | undefined; fileName: string | null | undefined; }): string | null => {`

## `frontend/src/shared/lib/attachmentTypeLabel.test.ts`

- Top-level declarations: 0

## `frontend/src/shared/lib/attachmentTypeLabel.ts`

- Top-level declarations: 3

### Declarations

- `const extractExtension = (fileName: string | null | undefined): string => {`
  - Извлекает расширение файла из имени. @param fileName Имя файла или путь. @returns Нормализованное расширение без точки или пустую строку.
- `const normalizeMimeSubtype = (subtype: string): string => {`
  - Нормализует MIME subtype до короткой метки. @param subtype Подтип MIME из content-type. @returns Упрощенная метка типа файла.
- `export const resolveAttachmentTypeLabel = ( contentType: string | null | undefined, fileName: string | null | undefined, ): string => {`
  - Возвращает метку типа вложения для интерфейса. @param contentType MIME-тип файла. @param fileName Имя файла. @returns Короткая метка типа, например pdf, zip, mp4.

## `frontend/src/shared/lib/avatarCrop.ts`

- Top-level declarations: 2

### Declarations

- `export const normalizeAvatarCrop = ( value?: AvatarCrop | null, ): AvatarCrop | null => {`
- `export const buildAvatarCropImageStyle = (crop: AvatarCrop): CSSProperties => ({`

## `frontend/src/shared/lib/debug.ts`

- Top-level declarations: 1

### Declarations

- `export const debugLog = (...args: unknown[]) => {`
  - Выполняет функцию `debugLog`. @param args Входной параметр `args`. @returns Результат выполнения `debugLog`.

## `frontend/src/shared/lib/format.ts`

- Top-level declarations: 6

### Declarations

- `export const formatTimestamp = (iso: string) =>`
  - Выполняет функцию `formatTimestamp`. @param iso Входной параметр `iso`. @returns Результат выполнения `formatTimestamp`.
- `export const formatDayLabel = (date: Date, now: Date = new Date()) => {`
  - Выполняет функцию `formatDayLabel`. @param date Входной параметр `date`. @param now Входной параметр `now`. @returns Результат выполнения `formatDayLabel`.
- `export const avatarFallback = (username: string) =>`
  - Выполняет функцию `avatarFallback`. @param username Входной параметр `username`. @returns Результат выполнения `avatarFallback`.
- `export const formatFullName = ( name: string | null | undefined, lastName?: string | null | undefined, ) => {`
- `export const formatRegistrationDate = (iso: string | null) => {`
  - Выполняет функцию `formatRegistrationDate`. @param iso Входной параметр `iso`. @returns Результат выполнения `formatRegistrationDate`.
- `export const formatLastSeen = (iso: string | null) => {`
  - Выполняет функцию `formatLastSeen`. @param iso Входной параметр `iso`. @returns Результат выполнения `formatLastSeen`.

## `frontend/src/shared/lib/publicRef.ts`

- Top-level declarations: 6

### Declarations

- `export const normalizePublicRef = ( value: string | null | undefined, ): string => {`
- `export const isHandleRef = (value: string): boolean =>`
- `export const isFallbackPublicId = (value: string): boolean => {`
- `export const formatPublicRef = (value: string): string => {`
- `export const buildDirectPath = (value: string): string => {`
- `export const buildUserProfilePath = (value: string): string => {`

## `frontend/src/shared/lib/sanitize.ts`

- Top-level declarations: 2

### Declarations

- `const stripControlChars = (value: string) => {`
  - Выполняет функцию `stripControlChars`. @param value Входной параметр `value`. @returns Результат выполнения `stripControlChars`.
- `export const sanitizeText = (input: string, maxLen = 1000) => {`
  - Выполняет функцию `sanitizeText`. @param input Входной параметр `input`. @param maxLen Входной параметр `maxLen`. @returns Результат выполнения `sanitizeText`.

## `frontend/src/shared/lib/ws.ts`

- Top-level declarations: 2

### Declarations

- `const resolveDevWsOrigin = (scheme: "ws" | "wss"): string => {`
  - Возвращает базовый websocket origin для текущего окружения. В dev подключаемся напрямую к backend (`:8000`), чтобы не зависеть от Vite WS-proxy и не получать `ws proxy ECONNABORTED` в терминале.
- `export const getWebSocketBase = () => {`

## `frontend/src/shared/presence/context.ts`

- Top-level declarations: 2

### Declarations

- `export const FALLBACK_PRESENCE: PresenceContextValue = {`
- `export const PresenceContext =`

## `frontend/src/shared/presence/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/presence/PresenceProvider.test.tsx`

- Top-level declarations: 3

### Declarations

- `const wsMock = vi.hoisted(() => ({`
- `const apiMock = vi.hoisted(() => ({`
- `function PresenceProbe() {`

## `frontend/src/shared/presence/PresenceProvider.tsx`

- Top-level declarations: 5

### Declarations

- `const normalizePresenceRef = (value: string | null | undefined): string =>`
- `export function PresenceProvider({ user, children, ready = true, }: ProviderProps) {`
  - Провайдер presence-состояния (онлайн-пользователи и гости). @param props Пользователь, флаг готовности и дочерние компоненты. @returns React context provider presence.
- `const presenceUrl = useMemo(() => {`
- `const sendPing = () => {`
- `const visibleOnline = useMemo(() => {`

## `frontend/src/shared/presence/usePresence.ts`

- Top-level declarations: 1

### Declarations

- `export const usePresence = () => useContext(PresenceContext);`
  - Управляет состоянием и эффектами хука `usePresence`. @returns Результат выполнения `usePresence`.

## `frontend/src/shared/ui/AudioAttachmentPlayer.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/AudioAttachmentPlayer.tsx`

- Top-level declarations: 5

### Declarations

- `const normalizeTime = (value: number) =>`
- `const createInitialPlaybackState = (srcKey: string): PlaybackState => ({`
- `const formatTime = (value: number) => {`
- `export function AudioAttachmentPlayer({ src, title, subtitle, downloadName, compact = false, className, }: Props) {`
- `const handleToggle = useCallback(async () => {`

## `frontend/src/shared/ui/Avatar.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/Avatar.tsx`

- Top-level declarations: 1

### Declarations

- `export function Avatar({ username, profileImage = null, avatarCrop = null, size = "default", online = false, className, loading = "lazy", }: AvatarProps) {`
  - Унифицированный аватар пользователя с fallback-инициалами и online-бейджем. @param props Параметры рендера аватара. @returns JSX-блок аватара.

## `frontend/src/shared/ui/AvatarCropModal.test.tsx`

- Top-level declarations: 1

### Declarations

- `const cropperState = vi.hoisted(() => ({`

## `frontend/src/shared/ui/AvatarCropModal.tsx`

- Top-level declarations: 3

### Declarations

- `const clamp = (value: number, min: number, max: number) =>`
- `const roundToSix = (value: number) =>`
- `export function AvatarCropModal({ open, image, onCancel, onApply, }: AvatarCropModalProps) {`

## `frontend/src/shared/ui/AvatarMedia.tsx`

- Top-level declarations: 1

### Declarations

- `export function AvatarMedia({ src, alt, avatarCrop = null, loading = "lazy", decoding = "async", draggable = false, className, onError, }: AvatarMediaProps) {`

## `frontend/src/shared/ui/Button.tsx`

- Top-level declarations: 1

### Declarations

- `export function Button({ variant = "primary", fullWidth = false, className, type = "button", ...props }: ButtonProps) {`
  - Универсальная кнопка интерфейса с вариантами оформления. @param props HTML-параметры кнопки и UI-модификаторы. @returns JSX-кнопка с модульными стилями.

## `frontend/src/shared/ui/Card.tsx`

- Top-level declarations: 1

### Declarations

- `export function Card<T extends ElementType = "section">({ as, wide = false, className, children, ...rest }: CardProps<T>) {`
  - Универсальный контейнер карточки. @param props Настройки контейнера и вложенное содержимое. @returns JSX-контейнер с карточным оформлением.

## `frontend/src/shared/ui/ContextMenu.test.tsx`

- Top-level declarations: 0

## `frontend/src/shared/ui/ContextMenu.tsx`

- Top-level declarations: 5

### Declarations

- `export function ContextMenu({ items, x, y, onClose }: Props) {`
- `const reposition = useCallback(() => {`
- `const handleResize = () => reposition();`
- `const handlePointerDown = (event: Event) => {`
- `const handleKey = (e: KeyboardEvent) => {`

## `frontend/src/shared/ui/Dropdown.tsx`

- Top-level declarations: 2

### Declarations

- `export function Dropdown({ trigger, children, align = "left" }: Props) {`
- `const handleClickOutside = useCallback((e: MouseEvent) => {`

## `frontend/src/shared/ui/EmptyState.tsx`

- Top-level declarations: 1

### Declarations

- `export function EmptyState({ icon, title, description, children, className, }: Props) {`

## `frontend/src/shared/ui/ImageLightbox.tsx`

- Top-level declarations: 3

### Declarations

- `export function ImageLightbox({ src, alt, onClose }: Props) {`
- `const dismiss = useCallback(() => {`
- `const handler = (e: KeyboardEvent) => {`

## `frontend/src/shared/ui/index.ts`

- Top-level declarations: 0

## `frontend/src/shared/ui/Modal.tsx`

- Top-level declarations: 1

### Declarations

- `export function Modal({ open, onClose, title, children }: Props) {`

## `frontend/src/shared/ui/Panel.tsx`

- Top-level declarations: 1

### Declarations

- `export function Panel({ muted = false, busy = false, className, children, }: PanelProps) {`
  - Вспомогательный панельный контейнер для состояний и подсказок. @param props Содержимое и модификаторы панели. @returns JSX-блок панели.

## `frontend/src/shared/ui/Spinner.tsx`

- Top-level declarations: 1

### Declarations

- `export function Spinner({ size = "md", className }: Props) {`

## `frontend/src/shared/ui/Toast.tsx`

- Top-level declarations: 2

### Declarations

- `export function Toast({ variant, role = "status", className, autoDismissMs = 5000, onDismiss, children, }: ToastProps) {`
- `const dismiss = useCallback(() => {`

## `frontend/src/shared/unreadOverrides/store.ts`

- Top-level declarations: 9

### Declarations

- `const emit = () => {`
- `const rebuildSnapshot = () => {`
- `const normalizeUnreadCount = (value: number) => {`
- `export const setUnreadOverride = ({ roomSlug, unreadCount, }: UnreadOverride) => {`
- `export const clearUnreadOverride = (roomSlug: string) => {`
- `export const resetUnreadOverrides = () => {`
- `const getSnapshot = () => snapshot;`
- `const subscribe = (listener: Listener) => {`
- `export const useUnreadOverrides = () =>`

## `frontend/src/sw.ts`

- Top-level declarations: 11

### Declarations

- `const isSameOrigin = (url: URL) => url.origin === self.location.origin;`
- `const isGetRequest = (request: Request) => request.method === "GET";`
- `const matchSignedMedia = (url: URL) =>`
- `const matchRoomMessages = (url: URL) =>`
- `const matchRoomDetails = (url: URL) =>`
- `const matchPublicRoom = (url: URL) => url.pathname === "/api/chat/public-room/";`
- `const matchDirectChats = (url: URL) =>`
- `const matchUserProfile = (url: URL) =>`
- `const matchSelfProfile = (url: URL) => url.pathname === "/api/profile/";`
- `const matchAuthNoCache = (url: URL) =>`
- `const clearUserCaches = async () => {`

## `frontend/src/test/setup.ts`

- Top-level declarations: 1

### Declarations

- `export const server = setupServer();`

## `frontend/src/widgets/admin/RolesManager.tsx`

- Top-level declarations: 3

### Declarations

- `export function RolesManager({ slug }: Props) {`
- `const reload = useCallback(async () => {`
- `const handleCreate = useCallback(async () => {`

## `frontend/src/widgets/auth/AuthForm.tsx`

- Top-level declarations: 4

### Declarations

- `export function AuthForm({ mode, title, submitLabel, onSubmit, onGoogleAuth, googleAuthDisabledReason = null, onNavigate, error = null, passwordRules = [], className, }: AuthFormProps) {`
- `const canSubmit = useMemo(() => {`
- `const handleSubmit = (event: FormEvent) => {`
- `const handleGoogleAuth = async () => {`

## `frontend/src/widgets/chat/ChatSearch.tsx`

- Top-level declarations: 2

### Declarations

- `function highlightText(text: string, query: string): string {`
- `export function ChatSearch({ slug, onResultClick }: Props) {`

## `frontend/src/widgets/chat/DirectInfoPanel.test.tsx`

- Top-level declarations: 1

### Declarations

- `const chatControllerMock = vi.hoisted(() => ({`

## `frontend/src/widgets/chat/DirectInfoPanel.tsx`

- Top-level declarations: 8

### Declarations

- `const isVideo = (contentType: string) => contentType.startsWith("video/");`
- `const isAudio = (contentType: string) => contentType.startsWith("audio/");`
- `const formatFileSize = (bytes: number) => {`
- `function AttachmentCard({ item }: { item: RoomAttachmentItem }) {`
- `export function DirectInfoPanel({ slug }: Props) {`
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
  - Нормализует лимит отображаемых изображений. @param value Входное значение лимита. @returns Целое число не меньше 1.
- `export const buildAttachmentRenderItems = ( attachments: Attachment[], ): AttachmentRenderItem[] =>`
  - Подготавливает вложения сообщения для рендера. @param attachments Исходные вложения сообщения. @returns Массив с флагом изображения и рассчитанным preview URL.
- `export const splitAttachmentRenderItems = ( items: AttachmentRenderItem[], maxVisibleImages: number, ): AttachmentBuckets => {`
  - Делит вложения на изображения и прочие файлы. @param items Подготовленные элементы рендера вложений. @param maxVisibleImages Максимум изображений, видимых в сетке сообщения. @returns Структура с полным списком изображений, видимой частью и остатком.
- `export const resolveMediaGridVariant = (count: number): MediaGridVariant => {`
  - Определяет вариант сетки изображений по количеству элементов. @param count Количество отображаемых изображений. @returns Вариант CSS-сетки для текущего количества.
- `export const resolveImageAspectRatio = (attachment: Attachment): number => {`
  - Вычисляет ограниченное соотношение сторон изображения. @param attachment Вложение с метаданными ширины и высоты. @returns Число для CSS aspect-ratio в безопасном диапазоне.

## `frontend/src/widgets/chat/MessageBubble.test.tsx`

- Top-level declarations: 3

### Declarations

- `const createImageAttachment = (id: number, filename: string) => ({`
- `const installTouchMatchMedia = () => {`
- `const installDesktopInputModel = () => {`

## `frontend/src/widgets/chat/MessageBubble.tsx`

- Top-level declarations: 12

### Declarations

- `const formatFileSize = (bytes: number) => {`
  - Форматирует размер файла для отображения рядом с вложением. @param bytes Размер файла в байтах. @returns Строку в формате B, KB или MB.
- `const isVideoType = (ct: string) => ct.startsWith("video/");`
  - Проверяет, относится ли MIME-тип к видео. @param ct MIME-тип вложения. @returns true, если вложение является видео.
- `const isAudioType = (ct: string) => ct.startsWith("audio/");`
  - Проверяет, относится ли MIME-тип к аудио. @param ct MIME-тип вложения. @returns true, если вложение является аудио.
- `const normalizeActorRef = (value: string) =>`
  - Нормализует публичный идентификатор пользователя для сравнения. @param value Исходный publicRef. @returns Нормализованный идентификатор в нижнем регистре.
- `const isTouchLikeDevice = () => {`
  - Определяет, что устройство работает как тач-устройство. @returns true, если интерфейс должен использовать тач-поведение.
- `const shouldIgnoreMobileMenuTap = (target: EventTarget | null) => {`
  - Проверяет, что тап был по интерактивному элементу и меню открывать не нужно. @param target Целевой DOM-узел события. @returns true, если тап нужно проигнорировать для мобильного меню.
- `function ReplyQuote({ replyTo, onClick, }: { replyTo: ReplyTo; onClick?: () => void;`
  - Рендерит блок цитаты ответа в верхней части сообщения. @param props Свойства цитаты ответа. @param props.replyTo Данные исходного сообщения, на которое сделан ответ. @param props.onClick Опциональный обработчик перехода к исходному сообщению. @returns JSX-элемент цитаты в виде кнопки или статичного блока.
- `function ReactionChip({ reaction, onToggle, }: { reaction: ReactionSummary; onToggle: () => void;`
  - Рендерит кнопку реакции с количеством и состоянием текущего пользователя. @param props Свойства чипа реакции. @param props.reaction Сводка по реакции конкретного emoji. @param props.onToggle Обработчик переключения реакции. @returns JSX-кнопку реакции.
- `function CheckMark({ isRead }: { isRead: boolean }) {`
  - Рендерит индикатор доставки и прочтения исходящего сообщения. @param props Свойства индикатора прочтения. @param props.isRead Признак, что сообщение прочитано собеседником. @returns JSX-элемент с двойной галочкой.
- `function EmojiPicker({ onPick, onClose, }: { onPick: (emoji: string) => void;`
  - Рендерит панель быстрых emoji для выбора реакции. @param props Свойства панели выбора реакции. @param props.onPick Колбэк выбора emoji. @param props.onClose Колбэк закрытия панели. @returns JSX-панель выбора реакции с фоном-перехватчиком.
- `export function MessageBubble({ message, isOwn, canModerate = false, isRead = false, highlighted = false, onlineUsernames, onReply, onEdit, onDelete, onReact, onReplyQuoteClick, onAvatarClick, }: Props) {`
  - Рендерит пузырь сообщения чата с текстом, вложениями, реакциями и контекстным меню. @param props Параметры отображения и обработчики действий над сообщением. @returns JSX-элемент сообщения вместе со вспомогательными оверлеями.
- `const openContextMenuAt = useCallback((x: number, y: number) => {`

## `frontend/src/widgets/chat/MessageInput.tsx`

- Top-level declarations: 4

### Declarations

- `const IconAttach = () => (`
- `const IconSend = () => (`
- `const IconClose = () => (`
- `export function MessageInput({ draft, onDraftChange, onSend, onTyping, disabled, rateLimitActive, replyTo, onCancelReply, onAttach, pendingFiles = [], onRemovePendingFile, onClearPendingFiles, uploadProgress, onCancelUpload, }: Props) {`

## `frontend/src/widgets/chat/TypingIndicator.tsx`

- Top-level declarations: 1

### Declarations

- `export function TypingIndicator({ users }: Props) {`

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
- `export function UserProfilePanel({ publicRef, currentPublicRef }: Props) {`
- `const loadRelationState = useCallback(async () => {`
- `const run = async () => {`
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
- `const handleSubmit = useCallback(async () => {`

## `frontend/src/widgets/friends/FriendListItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function FriendListItem({ friend, isOnline, onMessage, onRemove, onBlock, }: Props) {`

## `frontend/src/widgets/friends/FriendRequestItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function FriendRequestItem(props: Props) {`

## `frontend/src/widgets/groups/CreateGroupDialog.tsx`

- Top-level declarations: 2

### Declarations

- `export function CreateGroupDialog({ onCreated, onClose }: Props) {`
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
- `const groupPromise = new Promise<Group>((resolve) => {`

## `frontend/src/widgets/groups/GroupInfoPanel.tsx`

- Top-level declarations: 37

### Declarations

- `const PERMISSION_BITS = PERMISSION_ITEMS.map((item) => item.bit);`
- `const extractErrorMessage = (error: unknown, fallback: string) => {`
- `const getElevatedRoles = (roles: string[]) =>`
- `const toggleBit = (current: number[], bit: number): number[] =>`
- `const bitsFromMask = (mask: number): number[] =>`
- `const formatFileSize = (bytes: number) => {`
- `const extractHttpLinks = (content: string): string[] => {`
- `const formatDateTime = (value: string) => {`
- `const revokeBlobUrl = (value: string | null) => {`
- `export function GroupInfoPanel({ slug }: Props) {`
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

## `frontend/src/widgets/groups/GroupMembersList.tsx`

- Top-level declarations: 1

### Declarations

- `export function GroupMembersList({ members, isAdmin, onKick, onBan, onMute, onUnmute, }: Props) {`

## `frontend/src/widgets/layout/AppShell.tsx`

- Top-level declarations: 2

### Declarations

- `function ShellLayout({ user, onNavigate, onLogout, banner, error, isAuthRoute, children, }: Props) {`
- `export function AppShell(props: Props) {`

## `frontend/src/widgets/layout/InfoPanel.test.tsx`

- Top-level declarations: 1

### Declarations

- `function Harness() {`

## `frontend/src/widgets/layout/InfoPanel.tsx`

- Top-level declarations: 3

### Declarations

- `function PanelContent({ content, targetId, currentPublicRef, onJumpToMessage, }: { content: string; targetId: string | null; currentPublicRef: string | null; onJumpToMessage: (slug: string, messageId: number) => void;`
- `export function InfoPanel({ currentPublicRef, }: { currentPublicRef: string | null; }) {`
- `const onJumpToMessage = (slug: string, messageId: number) => {`

## `frontend/src/widgets/layout/Sidebar.test.tsx`

- Top-level declarations: 2

### Declarations

- `const directInboxMock = vi.hoisted(() => ({`
- `const conversationListMock = vi.hoisted(() => ({`

## `frontend/src/widgets/layout/Sidebar.tsx`

- Top-level declarations: 9

### Declarations

- `const IconMenu = () => (`
- `const IconSearch = () => (`
- `const IconHome = () => (`
- `const IconFriends = () => (`
- `const IconGroup = () => (`
- `const IconSettings = () => (`
- `const IconLogout = () => (`
- `export function Sidebar({ user, onNavigate, onLogout }: Props) {`
- `const handler = (e: KeyboardEvent) => {`

## `frontend/src/widgets/layout/TopBar.test.tsx`

- Top-level declarations: 2

### Declarations

- `const directInboxMock = vi.hoisted(() => ({`
- `const presenceMock = vi.hoisted(() => ({`

## `frontend/src/widgets/layout/TopBar.tsx`

- Top-level declarations: 1

### Declarations

- `export function TopBar({ user, onNavigate }: Props) {`

## `frontend/src/widgets/sidebar/ConversationList.tsx`

- Top-level declarations: 1

### Declarations

- `export function ConversationList({ onNavigate }: Props) {`

## `frontend/src/widgets/sidebar/ConversationListItem.tsx`

- Top-level declarations: 1

### Declarations

- `export function ConversationListItem({ item, isActive, onClick }: Props) {`
