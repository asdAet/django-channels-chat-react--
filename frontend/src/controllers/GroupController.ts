import { apiService } from "../adapters/ApiService";
import type {
  Group,
  GroupListItem,
  GroupMember,
  GroupInvite,
  InvitePreview,
  JoinRequest,
  PinnedMessage,
  BannedMember,
} from "../entities/group/types";
import type { UpdateGroupInput } from "../domain/interfaces/IApiService";
import { emitConversationListRefresh } from "../shared/conversationList/events";

class GroupController {
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

  public async getPublicGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{ items: GroupListItem[]; total: number }> {
    return apiService.getPublicGroups(params);
  }

  public async getMyGroups(params?: {
    search?: string;
    limit?: number;
    before?: number;
  }): Promise<{ items: GroupListItem[]; total: number }> {
    return apiService.getMyGroups(params);
  }

  public async getGroupDetails(roomId: string): Promise<Group> {
    return apiService.getGroupDetails(roomId);
  }

  public async updateGroup(
    roomId: string,
    data: UpdateGroupInput,
  ): Promise<Group> {
    const group = await apiService.updateGroup(roomId, data);
    emitConversationListRefresh();
    return group;
  }

  public async deleteGroup(roomId: string): Promise<void> {
    await apiService.deleteGroup(roomId);
    emitConversationListRefresh();
  }

  public async joinGroup(roomId: string): Promise<void> {
    await apiService.joinGroup(roomId);
    emitConversationListRefresh();
  }

  public async leaveGroup(roomId: string): Promise<void> {
    await apiService.leaveGroup(roomId);
    emitConversationListRefresh();
  }

  public async getGroupMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{ items: GroupMember[]; total: number }> {
    return apiService.getGroupMembers(roomId, params);
  }

  public async kickMember(roomId: string, userId: number): Promise<void> {
    return apiService.kickMember(roomId, userId);
  }

  public async banMember(
    roomId: string,
    userId: number,
    reason?: string,
  ): Promise<void> {
    return apiService.banMember(roomId, userId, reason);
  }

  public async unbanMember(roomId: string, userId: number): Promise<void> {
    return apiService.unbanMember(roomId, userId);
  }

  public async muteMember(
    roomId: string,
    userId: number,
    durationSeconds = 3600,
  ): Promise<void> {
    return apiService.muteMember(roomId, userId, durationSeconds);
  }

  public async unmuteMember(roomId: string, userId: number): Promise<void> {
    return apiService.unmuteMember(roomId, userId);
  }

  public async getBannedMembers(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<{ items: BannedMember[]; total: number }> {
    return apiService.getBannedMembers(roomId, params);
  }

  public async createInvite(
    roomId: string,
    data?: { maxUses?: number; expiresInHours?: number },
  ): Promise<GroupInvite> {
    return apiService.createInvite(roomId, data);
  }

  public async getInvites(roomId: string): Promise<GroupInvite[]> {
    return apiService.getInvites(roomId);
  }

  public async revokeInvite(roomId: string, code: string): Promise<void> {
    return apiService.revokeInvite(roomId, code);
  }

  public async getInvitePreview(code: string): Promise<InvitePreview> {
    return apiService.getInvitePreview(code);
  }

  public async joinViaInvite(code: string): Promise<{ roomId: number }> {
    const result = await apiService.joinViaInvite(code);
    emitConversationListRefresh();
    return result;
  }

  public async getJoinRequests(roomId: string): Promise<JoinRequest[]> {
    return apiService.getJoinRequests(roomId);
  }

  public async approveJoinRequest(
    roomId: string,
    requestId: number,
  ): Promise<void> {
    return apiService.approveJoinRequest(roomId, requestId);
  }

  public async rejectJoinRequest(
    roomId: string,
    requestId: number,
  ): Promise<void> {
    return apiService.rejectJoinRequest(roomId, requestId);
  }

  public async getPinnedMessages(roomId: string): Promise<PinnedMessage[]> {
    return apiService.getPinnedMessages(roomId);
  }

  public async pinMessage(roomId: string, messageId: number): Promise<void> {
    return apiService.pinMessage(roomId, messageId);
  }

  public async unpinMessage(roomId: string, messageId: number): Promise<void> {
    return apiService.unpinMessage(roomId, messageId);
  }

  public async transferOwnership(roomId: string, userId: number): Promise<void> {
    return apiService.transferOwnership(roomId, userId);
  }
}

export const groupController = new GroupController();
