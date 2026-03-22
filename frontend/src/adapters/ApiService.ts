import type { AxiosError, AxiosInstance } from "axios";
import axios, { AxiosHeaders } from "axios";

import type {
  IApiService,
  UpdateGroupInput,
  UpdateProfileInput,
} from "../domain/interfaces/IApiService";
import { decodeAuthErrorPayload } from "../dto";
import { DtoDecodeError, parseJson } from "../dto";
import {
  readCsrfFromCookie,
  readCsrfFromSessionStorage,
  writeCsrfToSessionStorage,
} from "../dto";
import type { ApiError } from "../shared/api/types";
import { acceptFriendRequest } from "./apiService/acceptFriendRequest";
import { addReaction } from "./apiService/addReaction";
import { approveJoinRequest } from "./apiService/approveJoinRequest";
import { banMember } from "./apiService/banMember";
import { blockUser } from "./apiService/blockUser";
import { cancelOutgoingFriendRequest } from "./apiService/cancelOutgoingFriendRequest";
import { createGroup } from "./apiService/createGroup";
import { createInvite } from "./apiService/createInvite";
import { createRoomOverride } from "./apiService/createRoomOverride";
import { createRoomRole } from "./apiService/createRoomRole";
import { declineFriendRequest } from "./apiService/declineFriendRequest";
import { deleteGroup } from "./apiService/deleteGroup";
import { deleteMessage } from "./apiService/deleteMessage";
import { deleteRoomOverride } from "./apiService/deleteRoomOverride";
import { deleteRoomRole } from "./apiService/deleteRoomRole";
import { editMessage } from "./apiService/editMessage";
import { ensureCsrf as ensureCsrfRequest } from "./apiService/ensureCsrf";
import { ensurePresenceSession } from "./apiService/ensurePresenceSession";
import { getBannedMembers } from "./apiService/getBannedMembers";
import { getBlockedUsers } from "./apiService/getBlockedUsers";
import { getClientConfig } from "./apiService/getClientConfig";
import { getDirectChats } from "./apiService/getDirectChats";
import { getFriends } from "./apiService/getFriends";
import { getGroupDetails } from "./apiService/getGroupDetails";
import { getGroupMembers } from "./apiService/getGroupMembers";
import { getIncomingRequests } from "./apiService/getIncomingRequests";
import { getInvitePreview } from "./apiService/getInvitePreview";
import { getInvites } from "./apiService/getInvites";
import { getJoinRequests } from "./apiService/getJoinRequests";
import { getMemberRoles } from "./apiService/getMemberRoles";
import { getMessageReaders } from "./apiService/getMessageReaders";
import { getMyGroups } from "./apiService/getMyGroups";
import { getMyPermissions } from "./apiService/getMyPermissions";
import { getOutgoingRequests } from "./apiService/getOutgoingRequests";
import { getPasswordRules } from "./apiService/getPasswordRules";
import { getPinnedMessages } from "./apiService/getPinnedMessages";
import { getPublicGroups } from "./apiService/getPublicGroups";
import { getRoomAttachments } from "./apiService/getRoomAttachments";
import { getRoomDetails } from "./apiService/getRoomDetails";
import { getRoomMessages } from "./apiService/getRoomMessages";
import { getRoomOverrides } from "./apiService/getRoomOverrides";
import { getRoomRoles } from "./apiService/getRoomRoles";
import { getSession } from "./apiService/getSession";
import { getUnreadCounts } from "./apiService/getUnreadCounts";
import { getUserProfile } from "./apiService/getUserProfile";
import { globalSearch } from "./apiService/globalSearch";
import { joinGroup } from "./apiService/joinGroup";
import { joinViaInvite } from "./apiService/joinViaInvite";
import { kickMember } from "./apiService/kickMember";
import { leaveGroup } from "./apiService/leaveGroup";
import { login } from "./apiService/login";
import { logout } from "./apiService/logout";
import { markRead } from "./apiService/markRead";
import { muteMember } from "./apiService/muteMember";
import { oauthGoogle } from "./apiService/oauthGoogle";
import { pinMessage } from "./apiService/pinMessage";
import { register } from "./apiService/register";
import { rejectJoinRequest } from "./apiService/rejectJoinRequest";
import { removeFriend } from "./apiService/removeFriend";
import { removeReaction } from "./apiService/removeReaction";
import { resolveChatTarget } from "./apiService/resolveChatTarget";
import { revokeInvite } from "./apiService/revokeInvite";
import { searchMessages } from "./apiService/searchMessages";
import { sendFriendRequest } from "./apiService/sendFriendRequest";
import { setMemberRoles } from "./apiService/setMemberRoles";
import { transferOwnership } from "./apiService/transferOwnership";
import { unbanMember } from "./apiService/unbanMember";
import { unblockUser } from "./apiService/unblockUser";
import { unmuteMember } from "./apiService/unmuteMember";
import { unpinMessage } from "./apiService/unpinMessage";
import { updateGroup } from "./apiService/updateGroup";
import { updateProfile } from "./apiService/updateProfile";
import { updateRoomOverride } from "./apiService/updateRoomOverride";
import { updateRoomRole } from "./apiService/updateRoomRole";
import { uploadAttachments } from "./apiService/uploadAttachments";

const API_BASE = "/api";
const CSRF_STORAGE_KEY = "csrfToken";
const AXIOS_STATUS_MESSAGE_PATTERN = /^Request failed with status code \d+$/i;
const HTML_ERROR_TAG_PATTERN = /<(?:!doctype\s+html|html|body|head)\b/i;
const ESCAPED_UNICODE_PATTERN = /\\u([0-9a-fA-F]{4})/g;

const STATUS_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  0: "Ошибка сети",
  400: "Некорректный запрос",
  401: "Требуется авторизация",
  403: "Доступ запрещен",
  404: "Ресурс не найден",
  408: "Превышено время ожидания запроса",
  409: "Конфликт данных",
  413: "Файл слишком большой",
  415: "Неподдерживаемый тип файла",
  422: "Некорректные данные",
  429: "Слишком много запросов, попробуйте позже",
};

/**
 * Определяет, что строка выглядит как HTML-страница ошибки.
 *
 * @param payload Строка ответа от сервера.
 * @returns true, когда в ответе обнаружены HTML-теги документа.
 */
const isHtmlErrorPayload = (payload: string): boolean =>
  HTML_ERROR_TAG_PATTERN.test(payload);

/**
 * Декодирует escaped unicode-последовательности вида \uXXXX.
 *
 * @param value Исходная строка.
 * @returns Строка после декодирования unicode-последовательностей.
 */
const decodeEscapedUnicode = (value: string): string =>
  value.replace(ESCAPED_UNICODE_PATTERN, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );

/**
 * Нормализует сообщение об ошибке до вида, пригодного для отображения.
 *
 * @param value Исходное сообщение.
 * @returns Очищенное сообщение или undefined, если сообщение бесполезно для пользователя.
 */
const normalizeErrorMessageText = (
  value: string | undefined,
): string | undefined => {
  if (!value) return undefined;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  if (AXIOS_STATUS_MESSAGE_PATTERN.test(normalized)) return undefined;
  if (isHtmlErrorPayload(normalized)) return undefined;

  return decodeEscapedUnicode(normalized);
};

/**
 * Возвращает fallback-сообщение для HTTP-статуса.
 *
 * @param status HTTP-статус.
 * @returns Сообщение для отображения пользователю.
 */
const getStatusFallbackMessage = (status: number): string => {
  if (status in STATUS_ERROR_MESSAGES) {
    return STATUS_ERROR_MESSAGES[status] as string;
  }
  if (status >= 500) {
    return "Внутренняя ошибка сервера";
  }
  return "Ошибка сервера";
};

/**
 * Возвращает csrf token.
 */
const getCsrfToken = () =>
  readCsrfFromCookie() || readCsrfFromSessionStorage(CSRF_STORAGE_KEY);

/**
 * Нормализует error payload.
 * @param payload Полезная нагрузка запроса.
 * @returns Строковое значение результата.
 */
const normalizeErrorPayload = (
  payload: unknown,
): Record<string, unknown> | undefined => {
  if (!payload) return undefined;

  if (typeof payload === "string") {
    const normalizedPayload = payload.trim();
    const parsed = parseJson(normalizedPayload);
    if (parsed && typeof parsed === "object") {
      const typed = decodeAuthErrorPayload(parsed);
      return (
        (typed as Record<string, unknown>) ??
        (parsed as Record<string, unknown>)
      );
    }

    if (isHtmlErrorPayload(normalizedPayload)) {
      return undefined;
    }

    return { detail: normalizedPayload };
  }

  if (typeof payload === "object") {
    const typed = decodeAuthErrorPayload(payload);
    return (
      (typed as Record<string, unknown>) ?? (payload as Record<string, unknown>)
    );
  }

  return undefined;
};

/**
 * Извлекает error message.
 * @param data Входные данные операции.
 * @returns Строковое значение результата.
 */
const extractErrorMessage = (
  data?: Record<string, unknown>,
): string | undefined => {
  if (!data) return undefined;

  const typed = decodeAuthErrorPayload(data);
  if (typed?.errors) {
    const values = Object.values(typed.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => typeof value === "string");
    if (values.length) {
      return values.join(" ");
    }
  }

  if (typed?.error) return typed.error;
  if (typed?.message) return typed.message;
  if (typed?.detail) return typed.detail;

  return undefined;
};

/**
 * Нормализует axios error.
 * @param error Объект ошибки, полученный в обработчике.
 * @returns Нормализованное значение после обработки входа.
 */

export const normalizeAxiosError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 0;
    const data = normalizeErrorPayload(axiosError.response?.data);
    const messageFromPayload = normalizeErrorMessageText(
      extractErrorMessage(data),
    );
    const messageFromAxios = normalizeErrorMessageText(axiosError.message);
    const message =
      messageFromPayload ??
      (status === 0 ? messageFromAxios : undefined) ??
      getStatusFallbackMessage(status) ??
      messageFromAxios ??
      "Ошибка сервера";
    return { status, message, data };
  }

  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error
  ) {
    return error as ApiError;
  }

  if (error instanceof DtoDecodeError) {
    return {
      status: 502,
      message: "Некорректный ответ сервера",
      data: {
        source: error.source,
        issues: error.issues,
      },
    };
  }

  return { status: 0, message: "Ошибка сети" };
};

/**
 * Класс ApiService инкапсулирует логику текущего слоя приложения.
 */
class ApiService implements IApiService {
  private apiClient: AxiosInstance;


public constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
      withCredentials: true,
    });

    this.apiClient.interceptors.request.use((config) => {
      const method = (config.method || "get").toLowerCase();
      const headers = AxiosHeaders.from(config.headers);
      const hasBody =
        method !== "get" && method !== "head" && method !== "options";
      const isFormData =
        typeof FormData !== "undefined" && config.data instanceof FormData;

      if (hasBody && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      if (hasBody && !headers.has("X-CSRFToken")) {
        const csrf = getCsrfToken();
        if (csrf) {
          headers.set("X-CSRFToken", csrf);
        }
      }

      if (isFormData) {
        headers.delete("Content-Type");
      }

      config.headers = headers;
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(normalizeAxiosError(error)),
    );
  }

    /**
   * Асинхронно выполняет with decode.
   *
   * @param task Функция, выполняемая с единым обработчиком ошибок.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
private async runWithDecode<T>(task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  }

    /**
     * Гарантирует csrf.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async ensureCsrf(): Promise<{ csrfToken: string }> {
    return this.runWithDecode(async () => {
      const data = await ensureCsrfRequest(this.apiClient);
      writeCsrfToSessionStorage(CSRF_STORAGE_KEY, data.csrfToken || null);
      return data;
    });
  }

    /**
     * Гарантирует presence session.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async ensurePresenceSession(): Promise<{ ok: boolean }> {
    return this.runWithDecode(async () =>
      ensurePresenceSession(this.apiClient),
    );
  }

    /**
   * Асинхронно возвращает client конфиг.
   */
public async getClientConfig() {
    return this.runWithDecode(async () => getClientConfig(this.apiClient));
  }

    /**
   * Асинхронно возвращает сессию.
   */
public async getSession() {
    return this.runWithDecode(async () => getSession(this.apiClient));
  }

    /**
   * Асинхронно авторизует данные.
   *
   * @param identifier Логин или email для аутентификации.
   * @param password Пароль пользователя.
   */
public async login(identifier: string, password: string) {
    return this.runWithDecode(async () =>
      login(this.apiClient, identifier, password),
    );
  }

    /**
   * Асинхронно выполняет OAuth-аутентификацию google.
   *
   * @param token Токен OAuth-провайдера.
   * @param tokenType Тип OAuth-токена.
   * @param username Имя пользователя.
   */
public async oauthGoogle(
    token: string,
    tokenType: "idToken" | "accessToken" = "idToken",
    username?: string,
  ) {
    return this.runWithDecode(async () =>
      oauthGoogle(this.apiClient, token, tokenType, username),
    );
  }

    /**
   * Асинхронно регистрирует данные.
   *
   * @param loginValue Логин или email для регистрации.
   * @param password Пароль пользователя.
   * @param passwordConfirm Подтверждение пароля.
   * @param name Отображаемое имя.
   * @param username Имя пользователя.
   * @param email Email пользователя.
   */
public async register(
    loginValue: string,
    password: string,
    passwordConfirm: string,
    name: string,
    username?: string,
    email?: string,
  ) {
    return this.runWithDecode(async () =>
      register(
        this.apiClient,
        loginValue,
        password,
        passwordConfirm,
        name,
        username,
        email,
      ),
    );
  }

    /**
   * Асинхронно возвращает password rules.
   */
public async getPasswordRules() {
    return this.runWithDecode(async () => getPasswordRules(this.apiClient));
  }

    /**
   * Асинхронно завершает сессию данные.
   */
public async logout() {
    return this.runWithDecode(async () => logout(this.apiClient));
  }

    /**
   * Асинхронно обновляет профиля.
   *
   * @param fields Поля для обновления профиля.
   */
public async updateProfile(fields: UpdateProfileInput) {
    return this.runWithDecode(async () =>
      updateProfile(this.apiClient, fields),
    );
  }

public async resolveChatTarget(target: string) {
    return this.runWithDecode(async () =>
      resolveChatTarget(this.apiClient, target),
    );
  }

    /**
   * Асинхронно возвращает комнаты details.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getRoomDetails(roomId: string) {
    return this.runWithDecode(async () => getRoomDetails(this.apiClient, roomId));
  }

    /**
   * Асинхронно возвращает комнаты сообщений.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   */
public async getRoomMessages(
    roomId: string,
    params?: { limit?: number; beforeId?: number },
  ) {
    return this.runWithDecode(async () =>
      getRoomMessages(this.apiClient, roomId, params),
    );
  }

    /**
   * Асинхронно возвращает direct-чат chats.
   */
public async getDirectChats() {
    return this.runWithDecode(async () => getDirectChats(this.apiClient));
  }

    /**
   * Асинхронно возвращает пользователя профиля.
   *
   * @param publicRef Публичный идентификатор пользователя или комнаты.
   */
public async getUserProfile(publicRef: string) {
    return this.runWithDecode(async () =>
      getUserProfile(this.apiClient, publicRef),
    );
  }

    /**
   * Асинхронно возвращает непрочитанные счетчики.
   */
public async getUnreadCounts() {
    return this.runWithDecode(async () => getUnreadCounts(this.apiClient));
  }

    /**
   * Асинхронно возвращает readers конкретного сообщения.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   */
public async getMessageReaders(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      getMessageReaders(this.apiClient, roomId, messageId),
    );
  }

    /**
   * Асинхронно выполняет сообщения.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   * @param content Текстовое содержимое.
   */
public async editMessage(roomId: string, messageId: number, content: string) {
    return this.runWithDecode(async () =>
      editMessage(this.apiClient, roomId, messageId, content),
    );
  }

    /**
   * Асинхронно удаляет сообщения.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   */
public async deleteMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      deleteMessage(this.apiClient, roomId, messageId),
    );
  }

    /**
   * Асинхронно добавляет реакцию.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   * @param emoji Символ реакции.
   */
public async addReaction(roomId: string, messageId: number, emoji: string) {
    return this.runWithDecode(async () =>
      addReaction(this.apiClient, roomId, messageId, emoji),
    );
  }

    /**
   * Асинхронно удаляет реакцию.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   * @param emoji Символ реакции.
   */
public async removeReaction(roomId: string, messageId: number, emoji: string) {
    return this.runWithDecode(async () =>
      removeReaction(this.apiClient, roomId, messageId, emoji),
    );
  }

    /**
   * Асинхронно ищет сообщений.
   *
   * @param roomId Идентификатор комнаты.
   * @param query Поисковый запрос.
   */
public async searchMessages(roomId: string, query: string) {
    return this.runWithDecode(async () =>
      searchMessages(this.apiClient, roomId, query),
    );
  }

    /**
   * Асинхронно загружает вложения.
   *
   * @param roomId Идентификатор комнаты.
   * @param files Файлы для загрузки.
   * @param options Дополнительные опции выполнения.
   */
public async uploadAttachments(
    roomId: string,
    files: File[],
    options?: {
      onProgress?: (percent: number) => void;
      messageContent?: string;
      replyTo?: number | null;
      signal?: AbortSignal;
    },
  ) {
    return this.runWithDecode(async () =>
      uploadAttachments(this.apiClient, roomId, files, options),
    );
  }

    /**
   * Асинхронно помечает read.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   */
public async markRead(roomId: string, messageId?: number) {
    return this.runWithDecode(async () =>
      markRead(this.apiClient, roomId, messageId),
    );
  }

    /**
   * Асинхронно возвращает друзей.
   */
public async getFriends() {
    return this.runWithDecode(async () => getFriends(this.apiClient));
  }

    /**
   * Асинхронно отправляет друга request.
   *
   * @param publicRef Публичный идентификатор пользователя или комнаты.
   */
public async sendFriendRequest(publicRef: string) {
    return this.runWithDecode(async () =>
      sendFriendRequest(this.apiClient, publicRef),
    );
  }

    /**
   * Асинхронно возвращает incoming requests.
   */
public async getIncomingRequests() {
    return this.runWithDecode(async () => getIncomingRequests(this.apiClient));
  }

    /**
   * Асинхронно возвращает outgoing requests.
   */
public async getOutgoingRequests() {
    return this.runWithDecode(async () => getOutgoingRequests(this.apiClient));
  }

    /**
   * Асинхронно выполняет друга request.
   *
   * @param friendshipId Идентификатор связи дружбы.
   */
public async acceptFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      acceptFriendRequest(this.apiClient, friendshipId),
    );
  }

    /**
   * Асинхронно выполняет друга request.
   *
   * @param friendshipId Идентификатор связи дружбы.
   */
public async declineFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      declineFriendRequest(this.apiClient, friendshipId),
    );
  }

    /**
   * Асинхронно выполняет outgoing друга request.
   *
   * @param friendshipId Идентификатор связи дружбы.
   */
public async cancelOutgoingFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      cancelOutgoingFriendRequest(this.apiClient, friendshipId),
    );
  }

    /**
   * Асинхронно удаляет друга.
   *
   * @param userId Идентификатор пользователя.
   */
public async removeFriend(userId: number) {
    return this.runWithDecode(async () => removeFriend(this.apiClient, userId));
  }

    /**
   * Асинхронно выполняет пользователя.
   *
   * @param publicRef Публичный идентификатор пользователя или комнаты.
   */
public async blockUser(publicRef: string) {
    return this.runWithDecode(async () => blockUser(this.apiClient, publicRef));
  }

    /**
   * Асинхронно выполняет пользователя.
   *
   * @param userId Идентификатор пользователя.
   */
public async unblockUser(userId: number) {
    return this.runWithDecode(async () => unblockUser(this.apiClient, userId));
  }

    /**
   * Асинхронно возвращает заблокированные пользователей.
   */
public async getBlockedUsers() {
    return this.runWithDecode(async () => getBlockedUsers(this.apiClient));
  }

    /**
   * Асинхронно создаёт группы.
   *
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async createGroup(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string | null;
  }) {
    return this.runWithDecode(async () => createGroup(this.apiClient, data));
  }

    /**
   * Асинхронно возвращает public групп.
   *
   * @param params Параметры запроса.
   */
public async getPublicGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }) {
    return this.runWithDecode(async () =>
      getPublicGroups(this.apiClient, params),
    );
  }

    /**
   * Асинхронно возвращает my групп.
   *
   * @param params Параметры запроса.
   */
public async getMyGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }) {
    return this.runWithDecode(async () => getMyGroups(this.apiClient, params));
  }

    /**
   * Асинхронно возвращает группы details.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getGroupDetails(roomId: string) {
    return this.runWithDecode(async () =>
      getGroupDetails(this.apiClient, roomId),
    );
  }

    /**
   * Асинхронно обновляет группы.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async updateGroup(roomId: string, data: UpdateGroupInput) {
    return this.runWithDecode(async () =>
      updateGroup(this.apiClient, roomId, data),
    );
  }

    /**
   * Асинхронно удаляет группы.
   *
   * @param roomId Идентификатор комнаты.
   */
public async deleteGroup(roomId: string) {
    return this.runWithDecode(async () => deleteGroup(this.apiClient, roomId));
  }

    /**
   * Асинхронно присоединяет группы.
   *
   * @param roomId Идентификатор комнаты.
   */
public async joinGroup(roomId: string) {
    return this.runWithDecode(async () => joinGroup(this.apiClient, roomId));
  }

    /**
   * Асинхронно покидает группы.
   *
   * @param roomId Идентификатор комнаты.
   */
public async leaveGroup(roomId: string) {
    return this.runWithDecode(async () => leaveGroup(this.apiClient, roomId));
  }

    /**
   * Асинхронно возвращает группы участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   */
public async getGroupMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getGroupMembers(this.apiClient, roomId, params),
    );
  }

    /**
   * Асинхронно выполняет участника.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   */
public async kickMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      kickMember(this.apiClient, roomId, userId),
    );
  }

    /**
   * Асинхронно блокирует участника.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   * @param reason Причина административного действия.
   */
public async banMember(roomId: string, userId: number, reason?: string) {
    return this.runWithDecode(async () =>
      banMember(this.apiClient, roomId, userId, reason),
    );
  }

    /**
   * Асинхронно снимает блокировку участника.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   */
public async unbanMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      unbanMember(this.apiClient, roomId, userId),
    );
  }

    /**
   * Асинхронно ограничивает участника.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   * @param durationSeconds Длительность ограничения в секундах.
   */
public async muteMember(
    roomId: string,
    userId: number,
    durationSeconds = 3600,
  ) {
    return this.runWithDecode(async () =>
      muteMember(this.apiClient, roomId, userId, durationSeconds),
    );
  }

    /**
   * Асинхронно снимает ограничение участника.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   */
public async unmuteMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      unmuteMember(this.apiClient, roomId, userId),
    );
  }

    /**
   * Асинхронно возвращает заблокированные участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   */
public async getBannedMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getBannedMembers(this.apiClient, roomId, params),
    );
  }

    /**
   * Асинхронно создаёт приглашение.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async createInvite(
    roomId: string,
    data?: { maxUses?: number; expiresInHours?: number },
  ) {
    return this.runWithDecode(async () =>
      createInvite(this.apiClient, roomId, data),
    );
  }

    /**
   * Асинхронно возвращает приглашения.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getInvites(roomId: string) {
    return this.runWithDecode(async () => getInvites(this.apiClient, roomId));
  }

    /**
   * Асинхронно выполняет приглашение.
   *
   * @param roomId Идентификатор комнаты.
   * @param code Код приглашения или операции.
   */
public async revokeInvite(roomId: string, code: string) {
    return this.runWithDecode(async () =>
      revokeInvite(this.apiClient, roomId, code),
    );
  }

    /**
   * Асинхронно возвращает приглашение preview.
   *
   * @param code Код приглашения или операции.
   */
public async getInvitePreview(code: string) {
    return this.runWithDecode(async () =>
      getInvitePreview(this.apiClient, code),
    );
  }

    /**
   * Асинхронно присоединяет via приглашение.
   *
   * @param code Код приглашения или операции.
   */
public async joinViaInvite(code: string) {
    return this.runWithDecode(async () => joinViaInvite(this.apiClient, code));
  }

    /**
   * Асинхронно возвращает join requests.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getJoinRequests(roomId: string) {
    return this.runWithDecode(async () =>
      getJoinRequests(this.apiClient, roomId),
    );
  }

    /**
   * Асинхронно одобряет join request.
   *
   * @param roomId Идентификатор комнаты.
   * @param requestId Идентификатор заявки.
   */
public async approveJoinRequest(roomId: string, requestId: number) {
    return this.runWithDecode(async () =>
      approveJoinRequest(this.apiClient, roomId, requestId),
    );
  }

    /**
   * Асинхронно отклоняет join request.
   *
   * @param roomId Идентификатор комнаты.
   * @param requestId Идентификатор заявки.
   */
public async rejectJoinRequest(roomId: string, requestId: number) {
    return this.runWithDecode(async () =>
      rejectJoinRequest(this.apiClient, roomId, requestId),
    );
  }

    /**
   * Асинхронно возвращает закрепленные сообщений.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getPinnedMessages(roomId: string) {
    return this.runWithDecode(async () =>
      getPinnedMessages(this.apiClient, roomId),
    );
  }

    /**
   * Асинхронно закрепляет сообщения.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   */
public async pinMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      pinMessage(this.apiClient, roomId, messageId),
    );
  }

    /**
   * Асинхронно открепляет сообщения.
   *
   * @param roomId Идентификатор комнаты.
   * @param messageId Идентификатор сообщения.
   */
public async unpinMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      unpinMessage(this.apiClient, roomId, messageId),
    );
  }

    /**
   * Асинхронно выполняет ownership.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   */
public async transferOwnership(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      transferOwnership(this.apiClient, roomId, userId),
    );
  }

    /**
   * Асинхронно возвращает комнаты ролей.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getRoomRoles(roomId: string) {
    return this.runWithDecode(async () => getRoomRoles(this.apiClient, roomId));
  }

    /**
   * Асинхронно создаёт комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async createRoomRole(
    roomId: string,
    data: { name: string; color?: string; permissions?: number },
  ) {
    return this.runWithDecode(async () =>
      createRoomRole(this.apiClient, roomId, data),
    );
  }

    /**
   * Асинхронно обновляет комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param roleId Идентификатор роли.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async updateRoomRole(
    roomId: string,
    roleId: number,
    data: Partial<{
      name: string;
      color: string;
      permissions: number;
      position: number;
    }>,
  ) {
    return this.runWithDecode(async () =>
      updateRoomRole(this.apiClient, roomId, roleId, data),
    );
  }

    /**
   * Асинхронно удаляет комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param roleId Идентификатор роли.
   */
public async deleteRoomRole(roomId: string, roleId: number) {
    return this.runWithDecode(async () =>
      deleteRoomRole(this.apiClient, roomId, roleId),
    );
  }

    /**
   * Асинхронно возвращает участника ролей.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   */
public async getMemberRoles(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      getMemberRoles(this.apiClient, roomId, userId),
    );
  }

    /**
   * Асинхронно устанавливает участника ролей.
   *
   * @param roomId Идентификатор комнаты.
   * @param userId Идентификатор пользователя.
   * @param roleIds Список идентификаторов ролей.
   */
public async setMemberRoles(roomId: string, userId: number, roleIds: number[]) {
    return this.runWithDecode(async () =>
      setMemberRoles(this.apiClient, roomId, userId, roleIds),
    );
  }

    /**
   * Асинхронно возвращает комнаты overrides.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getRoomOverrides(roomId: string) {
    return this.runWithDecode(async () =>
      getRoomOverrides(this.apiClient, roomId),
    );
  }

    /**
   * Асинхронно создаёт комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async createRoomOverride(
    roomId: string,
    data: {
      targetRoleId?: number;
      targetUserId?: number;
      allow?: number;
      deny?: number;
    },
  ) {
    return this.runWithDecode(async () =>
      createRoomOverride(this.apiClient, roomId, data),
    );
  }

    /**
   * Асинхронно обновляет комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param overrideId Идентификатор переопределения прав.
   * @param data Данные запроса или полезная нагрузка операции.
   */
public async updateRoomOverride(
    roomId: string,
    overrideId: number,
    data: Partial<{ allow: number; deny: number }>,
  ) {
    return this.runWithDecode(async () =>
      updateRoomOverride(this.apiClient, roomId, overrideId, data),
    );
  }

    /**
   * Асинхронно удаляет комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param overrideId Идентификатор переопределения прав.
   */
public async deleteRoomOverride(roomId: string, overrideId: number) {
    return this.runWithDecode(async () =>
      deleteRoomOverride(this.apiClient, roomId, overrideId),
    );
  }

    /**
   * Асинхронно возвращает my права.
   *
   * @param roomId Идентификатор комнаты.
   */
public async getMyPermissions(roomId: string) {
    return this.runWithDecode(async () =>
      getMyPermissions(this.apiClient, roomId),
    );
  }

    /**
   * Асинхронно выполняет поиск.
   *
   * @param query Поисковый запрос.
   * @param params Параметры запроса.
   */
public async globalSearch(
    query: string,
    params?: {
      usersLimit?: number;
      groupsLimit?: number;
      messagesLimit?: number;
    },
  ) {
    return this.runWithDecode(async () =>
      globalSearch(this.apiClient, query, params),
    );
  }

    /**
   * Асинхронно возвращает комнаты вложения.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   */
public async getRoomAttachments(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getRoomAttachments(this.apiClient, roomId, params),
    );
  }
}

/**
 * Экспорт `apiService` предоставляет инициализированный экземпляр для повторного использования в модуле.
 */
export const apiService = new ApiService();
