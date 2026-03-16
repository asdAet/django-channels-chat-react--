import { apiService } from "../adapters/ApiService";
import type {
  Role,
  MemberRoles,
  PermissionOverride,
  MyPermissions,
} from "../entities/role/types";

class RolesController {
  public async getRoomRoles(roomId: string): Promise<Role[]> {
    return apiService.getRoomRoles(roomId);
  }

  public async createRoomRole(
    roomId: string,
    data: { name: string; color?: string; permissions?: number },
  ): Promise<Role> {
    return apiService.createRoomRole(roomId, data);
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
  ): Promise<Role> {
    return apiService.updateRoomRole(roomId, roleId, data);
  }

  public async deleteRoomRole(roomId: string, roleId: number): Promise<void> {
    return apiService.deleteRoomRole(roomId, roleId);
  }

  public async getMemberRoles(
    roomId: string,
    userId: number,
  ): Promise<MemberRoles> {
    return apiService.getMemberRoles(roomId, userId);
  }

  public async setMemberRoles(
    roomId: string,
    userId: number,
    roleIds: number[],
  ): Promise<MemberRoles> {
    return apiService.setMemberRoles(roomId, userId, roleIds);
  }

  public async getRoomOverrides(roomId: string): Promise<PermissionOverride[]> {
    return apiService.getRoomOverrides(roomId);
  }

  public async createRoomOverride(
    roomId: string,
    data: {
      targetRoleId?: number;
      targetUserId?: number;
      allow?: number;
      deny?: number;
    },
  ): Promise<PermissionOverride> {
    return apiService.createRoomOverride(roomId, data);
  }

  public async updateRoomOverride(
    roomId: string,
    overrideId: number,
    data: Partial<{ allow: number; deny: number }>,
  ): Promise<PermissionOverride> {
    return apiService.updateRoomOverride(roomId, overrideId, data);
  }

  public async deleteRoomOverride(
    roomId: string,
    overrideId: number,
  ): Promise<void> {
    return apiService.deleteRoomOverride(roomId, overrideId);
  }

  public async getMyPermissions(roomId: string): Promise<MyPermissions> {
    return apiService.getMyPermissions(roomId);
  }
}

export const rolesController = new RolesController();
