import axios, { AxiosHeaders } from "axios";
import type { AxiosError, AxiosInstance } from "axios";

import type { ApiError } from "../shared/api/types";
import { decodeAuthErrorPayload } from "../dto";
import { parseJson, DtoDecodeError } from "../dto";
import {
  readCsrfFromCookie,
  readCsrfFromSessionStorage,
  writeCsrfToSessionStorage,
} from "../dto";
import type {
  IApiService,
  UpdateGroupInput,
  UpdateProfileInput,
} from "../domain/interfaces/IApiService";

import { ensureCsrf as ensureCsrfRequest } from "./apiService/ensureCsrf";
import { ensurePresenceSession } from "./apiService/ensurePresenceSession";
import { getClientConfig } from "./apiService/getClientConfig";
import { getSession } from "./apiService/getSession";
import { login } from "./apiService/login";
import { oauthGoogle } from "./apiService/oauthGoogle";
import { register } from "./apiService/register";
import { logout } from "./apiService/logout";
import { updateProfile } from "./apiService/updateProfile";
import { getPasswordRules } from "./apiService/getPasswordRules";
import { getPublicRoom } from "./apiService/getPublicRoom";
import { getRoomDetails } from "./apiService/getRoomDetails";
import { getRoomMessages } from "./apiService/getRoomMessages";
import { getUserProfile } from "./apiService/getUserProfile";
import { startDirectChat } from "./apiService/startDirectChat";
import { getDirectChats } from "./apiService/getDirectChats";
import { getUnreadCounts } from "./apiService/getUnreadCounts";
import { editMessage } from "./apiService/editMessage";
import { deleteMessage } from "./apiService/deleteMessage";
import { addReaction } from "./apiService/addReaction";
import { removeReaction } from "./apiService/removeReaction";
import { searchMessages } from "./apiService/searchMessages";
import { uploadAttachments } from "./apiService/uploadAttachments";
import { markRead } from "./apiService/markRead";
import { getFriends } from "./apiService/getFriends";
import { sendFriendRequest } from "./apiService/sendFriendRequest";
import { getIncomingRequests } from "./apiService/getIncomingRequests";
import { getOutgoingRequests } from "./apiService/getOutgoingRequests";
import { acceptFriendRequest } from "./apiService/acceptFriendRequest";
import { declineFriendRequest } from "./apiService/declineFriendRequest";
import { cancelOutgoingFriendRequest } from "./apiService/cancelOutgoingFriendRequest";
import { removeFriend } from "./apiService/removeFriend";
import { blockUser } from "./apiService/blockUser";
import { unblockUser } from "./apiService/unblockUser";
import { getBlockedUsers } from "./apiService/getBlockedUsers";
import { createGroup } from "./apiService/createGroup";
import { getPublicGroups } from "./apiService/getPublicGroups";
import { getMyGroups } from "./apiService/getMyGroups";
import { getGroupDetails } from "./apiService/getGroupDetails";
import { updateGroup } from "./apiService/updateGroup";
import { deleteGroup } from "./apiService/deleteGroup";
import { joinGroup } from "./apiService/joinGroup";
import { leaveGroup } from "./apiService/leaveGroup";
import { getGroupMembers } from "./apiService/getGroupMembers";
import { kickMember } from "./apiService/kickMember";
import { banMember } from "./apiService/banMember";
import { unbanMember } from "./apiService/unbanMember";
import { muteMember } from "./apiService/muteMember";
import { unmuteMember } from "./apiService/unmuteMember";
import { getBannedMembers } from "./apiService/getBannedMembers";
import { createInvite } from "./apiService/createInvite";
import { getInvites } from "./apiService/getInvites";
import { revokeInvite } from "./apiService/revokeInvite";
import { getInvitePreview } from "./apiService/getInvitePreview";
import { joinViaInvite } from "./apiService/joinViaInvite";
import { getJoinRequests } from "./apiService/getJoinRequests";
import { approveJoinRequest } from "./apiService/approveJoinRequest";
import { rejectJoinRequest } from "./apiService/rejectJoinRequest";
import { getPinnedMessages } from "./apiService/getPinnedMessages";
import { pinMessage } from "./apiService/pinMessage";
import { unpinMessage } from "./apiService/unpinMessage";
import { transferOwnership } from "./apiService/transferOwnership";
import { getRoomRoles } from "./apiService/getRoomRoles";
import { createRoomRole } from "./apiService/createRoomRole";
import { updateRoomRole } from "./apiService/updateRoomRole";
import { deleteRoomRole } from "./apiService/deleteRoomRole";
import { getMemberRoles } from "./apiService/getMemberRoles";
import { setMemberRoles } from "./apiService/setMemberRoles";
import { getRoomOverrides } from "./apiService/getRoomOverrides";
import { createRoomOverride } from "./apiService/createRoomOverride";
import { updateRoomOverride } from "./apiService/updateRoomOverride";
import { deleteRoomOverride } from "./apiService/deleteRoomOverride";
import { getMyPermissions } from "./apiService/getMyPermissions";
import { globalSearch } from "./apiService/globalSearch";
import { getRoomAttachments } from "./apiService/getRoomAttachments";

const API_BASE = "/api";
const CSRF_STORAGE_KEY = "csrfToken";

const getCsrfToken = () =>
  readCsrfFromCookie() || readCsrfFromSessionStorage(CSRF_STORAGE_KEY);

const normalizeErrorPayload = (
  payload: unknown,
): Record<string, unknown> | undefined => {
  if (!payload) return undefined;

  if (typeof payload === "string") {
    const parsed = parseJson(payload);
    if (parsed && typeof parsed === "object") {
      const typed = decodeAuthErrorPayload(parsed);
      return (
        (typed as Record<string, unknown>) ??
        (parsed as Record<string, unknown>)
      );
    }
    return { detail: payload };
  }

  if (typeof payload === "object") {
    const typed = decodeAuthErrorPayload(payload);
    return (
      (typed as Record<string, unknown>) ?? (payload as Record<string, unknown>)
    );
  }

  return undefined;
};

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

export const normalizeAxiosError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 0;
    const data = normalizeErrorPayload(axiosError.response?.data);
    const message =
      extractErrorMessage(data) || axiosError.message || "Ошибка запроса";
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

  return { status: 0, message: "Ошибка запроса" };
};

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

  private async runWithDecode<T>(task: () => Promise<T>): Promise<T> {
    try {
      return await task();
    } catch (error) {
      throw normalizeAxiosError(error);
    }
  }

  public async ensureCsrf(): Promise<{ csrfToken: string }> {
    return this.runWithDecode(async () => {
      const data = await ensureCsrfRequest(this.apiClient);
      writeCsrfToSessionStorage(CSRF_STORAGE_KEY, data.csrfToken || null);
      return data;
    });
  }

  public async ensurePresenceSession(): Promise<{ ok: boolean }> {
    return this.runWithDecode(async () =>
      ensurePresenceSession(this.apiClient),
    );
  }

  public async getClientConfig() {
    return this.runWithDecode(async () => getClientConfig(this.apiClient));
  }

  public async getSession() {
    return this.runWithDecode(async () => getSession(this.apiClient));
  }

  public async login(identifier: string, password: string) {
    return this.runWithDecode(async () =>
      login(this.apiClient, identifier, password),
    );
  }

  public async oauthGoogle(
    token: string,
    tokenType: "idToken" | "accessToken" = "idToken",
    username?: string,
  ) {
    return this.runWithDecode(async () =>
      oauthGoogle(this.apiClient, token, tokenType, username),
    );
  }

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

  public async getPasswordRules() {
    return this.runWithDecode(async () => getPasswordRules(this.apiClient));
  }

  public async logout() {
    return this.runWithDecode(async () => logout(this.apiClient));
  }

  public async updateProfile(fields: UpdateProfileInput) {
    return this.runWithDecode(async () =>
      updateProfile(this.apiClient, fields),
    );
  }

  public async getPublicRoom() {
    return this.runWithDecode(async () => getPublicRoom(this.apiClient));
  }

  public async getRoomDetails(roomId: string) {
    return this.runWithDecode(async () => getRoomDetails(this.apiClient, roomId));
  }

  public async getRoomMessages(
    roomId: string,
    params?: { limit?: number; beforeId?: number },
  ) {
    return this.runWithDecode(async () =>
      getRoomMessages(this.apiClient, roomId, params),
    );
  }

  public async startDirectChat(publicRef: string) {
    return this.runWithDecode(async () =>
      startDirectChat(this.apiClient, publicRef),
    );
  }

  public async getDirectChats() {
    return this.runWithDecode(async () => getDirectChats(this.apiClient));
  }

  public async getUserProfile(publicRef: string) {
    return this.runWithDecode(async () =>
      getUserProfile(this.apiClient, publicRef),
    );
  }

  public async getUnreadCounts() {
    return this.runWithDecode(async () => getUnreadCounts(this.apiClient));
  }

  public async editMessage(roomId: string, messageId: number, content: string) {
    return this.runWithDecode(async () =>
      editMessage(this.apiClient, roomId, messageId, content),
    );
  }

  public async deleteMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      deleteMessage(this.apiClient, roomId, messageId),
    );
  }

  public async addReaction(roomId: string, messageId: number, emoji: string) {
    return this.runWithDecode(async () =>
      addReaction(this.apiClient, roomId, messageId, emoji),
    );
  }

  public async removeReaction(roomId: string, messageId: number, emoji: string) {
    return this.runWithDecode(async () =>
      removeReaction(this.apiClient, roomId, messageId, emoji),
    );
  }

  public async searchMessages(roomId: string, query: string) {
    return this.runWithDecode(async () =>
      searchMessages(this.apiClient, roomId, query),
    );
  }

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

  public async markRead(roomId: string, messageId?: number) {
    return this.runWithDecode(async () =>
      markRead(this.apiClient, roomId, messageId),
    );
  }

  public async getFriends() {
    return this.runWithDecode(async () => getFriends(this.apiClient));
  }

  public async sendFriendRequest(publicRef: string) {
    return this.runWithDecode(async () =>
      sendFriendRequest(this.apiClient, publicRef),
    );
  }

  public async getIncomingRequests() {
    return this.runWithDecode(async () => getIncomingRequests(this.apiClient));
  }

  public async getOutgoingRequests() {
    return this.runWithDecode(async () => getOutgoingRequests(this.apiClient));
  }

  public async acceptFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      acceptFriendRequest(this.apiClient, friendshipId),
    );
  }

  public async declineFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      declineFriendRequest(this.apiClient, friendshipId),
    );
  }

  public async cancelOutgoingFriendRequest(friendshipId: number) {
    return this.runWithDecode(async () =>
      cancelOutgoingFriendRequest(this.apiClient, friendshipId),
    );
  }

  public async removeFriend(userId: number) {
    return this.runWithDecode(async () => removeFriend(this.apiClient, userId));
  }

  public async blockUser(publicRef: string) {
    return this.runWithDecode(async () => blockUser(this.apiClient, publicRef));
  }

  public async unblockUser(userId: number) {
    return this.runWithDecode(async () => unblockUser(this.apiClient, userId));
  }

  public async getBlockedUsers() {
    return this.runWithDecode(async () => getBlockedUsers(this.apiClient));
  }

  // --- Groups ---
  public async createGroup(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string | null;
  }) {
    return this.runWithDecode(async () => createGroup(this.apiClient, data));
  }

  public async getPublicGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }) {
    return this.runWithDecode(async () =>
      getPublicGroups(this.apiClient, params),
    );
  }

  public async getMyGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }) {
    return this.runWithDecode(async () => getMyGroups(this.apiClient, params));
  }

  public async getGroupDetails(roomId: string) {
    return this.runWithDecode(async () =>
      getGroupDetails(this.apiClient, roomId),
    );
  }

  public async updateGroup(roomId: string, data: UpdateGroupInput) {
    return this.runWithDecode(async () =>
      updateGroup(this.apiClient, roomId, data),
    );
  }

  public async deleteGroup(roomId: string) {
    return this.runWithDecode(async () => deleteGroup(this.apiClient, roomId));
  }

  public async joinGroup(roomId: string) {
    return this.runWithDecode(async () => joinGroup(this.apiClient, roomId));
  }

  public async leaveGroup(roomId: string) {
    return this.runWithDecode(async () => leaveGroup(this.apiClient, roomId));
  }

  public async getGroupMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getGroupMembers(this.apiClient, roomId, params),
    );
  }

  public async kickMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      kickMember(this.apiClient, roomId, userId),
    );
  }

  public async banMember(roomId: string, userId: number, reason?: string) {
    return this.runWithDecode(async () =>
      banMember(this.apiClient, roomId, userId, reason),
    );
  }

  public async unbanMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      unbanMember(this.apiClient, roomId, userId),
    );
  }

  public async muteMember(
    roomId: string,
    userId: number,
    durationSeconds = 3600,
  ) {
    return this.runWithDecode(async () =>
      muteMember(this.apiClient, roomId, userId, durationSeconds),
    );
  }

  public async unmuteMember(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      unmuteMember(this.apiClient, roomId, userId),
    );
  }

  public async getBannedMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getBannedMembers(this.apiClient, roomId, params),
    );
  }

  public async createInvite(
    roomId: string,
    data?: { maxUses?: number; expiresInHours?: number },
  ) {
    return this.runWithDecode(async () =>
      createInvite(this.apiClient, roomId, data),
    );
  }

  public async getInvites(roomId: string) {
    return this.runWithDecode(async () => getInvites(this.apiClient, roomId));
  }

  public async revokeInvite(roomId: string, code: string) {
    return this.runWithDecode(async () =>
      revokeInvite(this.apiClient, roomId, code),
    );
  }

  public async getInvitePreview(code: string) {
    return this.runWithDecode(async () =>
      getInvitePreview(this.apiClient, code),
    );
  }

  public async joinViaInvite(code: string) {
    return this.runWithDecode(async () => joinViaInvite(this.apiClient, code));
  }

  public async getJoinRequests(roomId: string) {
    return this.runWithDecode(async () =>
      getJoinRequests(this.apiClient, roomId),
    );
  }

  public async approveJoinRequest(roomId: string, requestId: number) {
    return this.runWithDecode(async () =>
      approveJoinRequest(this.apiClient, roomId, requestId),
    );
  }

  public async rejectJoinRequest(roomId: string, requestId: number) {
    return this.runWithDecode(async () =>
      rejectJoinRequest(this.apiClient, roomId, requestId),
    );
  }

  public async getPinnedMessages(roomId: string) {
    return this.runWithDecode(async () =>
      getPinnedMessages(this.apiClient, roomId),
    );
  }

  public async pinMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      pinMessage(this.apiClient, roomId, messageId),
    );
  }

  public async unpinMessage(roomId: string, messageId: number) {
    return this.runWithDecode(async () =>
      unpinMessage(this.apiClient, roomId, messageId),
    );
  }

  public async transferOwnership(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      transferOwnership(this.apiClient, roomId, userId),
    );
  }

  // --- Roles & Permissions ---
  public async getRoomRoles(roomId: string) {
    return this.runWithDecode(async () => getRoomRoles(this.apiClient, roomId));
  }

  public async createRoomRole(
    roomId: string,
    data: { name: string; color?: string; permissions?: number },
  ) {
    return this.runWithDecode(async () =>
      createRoomRole(this.apiClient, roomId, data),
    );
  }

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

  public async deleteRoomRole(roomId: string, roleId: number) {
    return this.runWithDecode(async () =>
      deleteRoomRole(this.apiClient, roomId, roleId),
    );
  }

  public async getMemberRoles(roomId: string, userId: number) {
    return this.runWithDecode(async () =>
      getMemberRoles(this.apiClient, roomId, userId),
    );
  }

  public async setMemberRoles(roomId: string, userId: number, roleIds: number[]) {
    return this.runWithDecode(async () =>
      setMemberRoles(this.apiClient, roomId, userId, roleIds),
    );
  }

  public async getRoomOverrides(roomId: string) {
    return this.runWithDecode(async () =>
      getRoomOverrides(this.apiClient, roomId),
    );
  }

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

  public async updateRoomOverride(
    roomId: string,
    overrideId: number,
    data: Partial<{ allow: number; deny: number }>,
  ) {
    return this.runWithDecode(async () =>
      updateRoomOverride(this.apiClient, roomId, overrideId, data),
    );
  }

  public async deleteRoomOverride(roomId: string, overrideId: number) {
    return this.runWithDecode(async () =>
      deleteRoomOverride(this.apiClient, roomId, overrideId),
    );
  }

  public async getMyPermissions(roomId: string) {
    return this.runWithDecode(async () =>
      getMyPermissions(this.apiClient, roomId),
    );
  }

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

  public async getRoomAttachments(
    roomId: string,
    params?: { limit?: number; before?: number },
  ) {
    return this.runWithDecode(async () =>
      getRoomAttachments(this.apiClient, roomId, params),
    );
  }
}

export const apiService = new ApiService();



