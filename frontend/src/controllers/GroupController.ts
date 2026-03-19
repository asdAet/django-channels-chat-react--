import { apiService } from "../adapters/ApiService";
import type { UpdateGroupInput } from "../domain/interfaces/IApiService";
import type {
  BannedMember,
  Group,
  GroupInvite,
  GroupListItem,
  GroupMember,
  InvitePreview,
  JoinRequest,
  PinnedMessage,
} from "../entities/group/types";
import { emitConversationListRefresh } from "../shared/conversationList/events";

/**
 * Класс GroupController инкапсулирует логику текущего слоя приложения.
 */
class GroupController {
    /**
   * Асинхронно создаёт группы.
   *
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async createGroup(data: {
    name: string;
    description?: string;
    isPublic?: boolean;
    username?: string | null;
  }): Promise<Group> {
    const group = await apiService.createGroup(data);
    emitConversationListRefresh();
    return group;
  }

    /**
   * Асинхронно возвращает public групп.
   *
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async getPublicGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{ items: GroupListItem[]; total: number }> {
    return apiService.getPublicGroups(params);
  }

    /**
   * Асинхронно возвращает my групп.
   *
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async getMyGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{ items: GroupListItem[]; total: number }> {
    return apiService.getMyGroups(params);
  }

    /**
     * Возвращает group details.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getGroupDetails(roomId: string): Promise<Group> {
    return apiService.getGroupDetails(roomId);
  }

    /**
     * Обновляет group.
     * @param roomId Идентификатор комнаты.
     * @param data Входные данные операции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async updateGroup(
    roomId: string,
    data: UpdateGroupInput,
  ): Promise<Group> {
    const group = await apiService.updateGroup(roomId, data);
    emitConversationListRefresh();
    return group;
  }

    /**
     * Удаляет group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async deleteGroup(roomId: string): Promise<void> {
    await apiService.deleteGroup(roomId);
    emitConversationListRefresh();
  }

    /**
     * Обрабатывает join group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async joinGroup(roomId: string): Promise<void> {
    await apiService.joinGroup(roomId);
    emitConversationListRefresh();
  }

    /**
     * Обрабатывает leave group.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async leaveGroup(roomId: string): Promise<void> {
    await apiService.leaveGroup(roomId);
    emitConversationListRefresh();
  }

    /**
   * Асинхронно возвращает группы участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async getGroupMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{ items: GroupMember[]; total: number }> {
    return apiService.getGroupMembers(roomId, params);
  }

    /**
     * Обрабатывает kick member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async kickMember(roomId: string, userId: number): Promise<void> {
    return apiService.kickMember(roomId, userId);
  }

    /**
     * Обрабатывает ban member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param reason Причина административного действия.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async banMember(
    roomId: string,
    userId: number,
    reason?: string,
  ): Promise<void> {
    return apiService.banMember(roomId, userId, reason);
  }

    /**
     * Обрабатывает unban member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async unbanMember(roomId: string, userId: number): Promise<void> {
    return apiService.unbanMember(roomId, userId);
  }

    /**
     * Обрабатывает mute member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param durationSeconds Длительность действия в секундах.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async muteMember(
    roomId: string,
    userId: number,
    durationSeconds = 3600,
  ): Promise<void> {
    return apiService.muteMember(roomId, userId, durationSeconds);
  }

    /**
     * Обрабатывает unmute member.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async unmuteMember(roomId: string, userId: number): Promise<void> {
    return apiService.unmuteMember(roomId, userId);
  }

    /**
   * Асинхронно возвращает заблокированные участников.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async getBannedMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{ items: BannedMember[]; total: number }> {
    return apiService.getBannedMembers(roomId, params);
  }

    /**
   * Асинхронно создаёт приглашение.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async createInvite(
    roomId: string,
    data?: { maxUses?: number; expiresInHours?: number },
  ): Promise<GroupInvite> {
    return apiService.createInvite(roomId, data);
  }

    /**
     * Возвращает invites.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getInvites(roomId: string): Promise<GroupInvite[]> {
    return apiService.getInvites(roomId);
  }

    /**
     * Обрабатывает revoke invite.
     * @param roomId Идентификатор комнаты.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async revokeInvite(roomId: string, code: string): Promise<void> {
    return apiService.revokeInvite(roomId, code);
  }

    /**
     * Возвращает invite preview.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getInvitePreview(code: string): Promise<InvitePreview> {
    return apiService.getInvitePreview(code);
  }

    /**
     * Обрабатывает join via invite.
     * @param code Код приглашения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async joinViaInvite(code: string): Promise<{ roomId: number }> {
    const result = await apiService.joinViaInvite(code);
    emitConversationListRefresh();
    return result;
  }

    /**
     * Возвращает join requests.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getJoinRequests(roomId: string): Promise<JoinRequest[]> {
    return apiService.getJoinRequests(roomId);
  }

    /**
     * Обрабатывает approve join request.
     * @param roomId Идентификатор комнаты.
     * @param requestId Идентификатор заявки.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async approveJoinRequest(
    roomId: string,
    requestId: number,
  ): Promise<void> {
    return apiService.approveJoinRequest(roomId, requestId);
  }

    /**
     * Обрабатывает reject join request.
     * @param roomId Идентификатор комнаты.
     * @param requestId Идентификатор заявки.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async rejectJoinRequest(
    roomId: string,
    requestId: number,
  ): Promise<void> {
    return apiService.rejectJoinRequest(roomId, requestId);
  }

    /**
     * Возвращает pinned messages.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getPinnedMessages(roomId: string): Promise<PinnedMessage[]> {
    return apiService.getPinnedMessages(roomId);
  }

    /**
     * Обрабатывает pin message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async pinMessage(roomId: string, messageId: number): Promise<void> {
    return apiService.pinMessage(roomId, messageId);
  }

    /**
     * Обрабатывает unpin message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async unpinMessage(roomId: string, messageId: number): Promise<void> {
    return apiService.unpinMessage(roomId, messageId);
  }

    /**
     * Обрабатывает transfer ownership.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async transferOwnership(roomId: string, userId: number): Promise<void> {
    return apiService.transferOwnership(roomId, userId);
  }
}

/**
 * Экспорт `groupController` предоставляет инициализированный экземпляр для повторного использования в модуле.
 */
export const groupController = new GroupController();
