import { apiService } from "../adapters/ApiService";
import type {
  MemberRoles,
  MyPermissions,
  PermissionOverride,
  Role,
} from "../entities/role/types";

/**
 * Класс RolesController инкапсулирует логику текущего слоя приложения.
 */
class RolesController {
    /**
     * Возвращает room roles.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getRoomRoles(roomId: string): Promise<Role[]> {
    return apiService.getRoomRoles(roomId);
  }

    /**
   * Асинхронно создаёт комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async createRoomRole(
    roomId: string,
    data: { name: string; color?: string; permissions?: number },
  ): Promise<Role> {
    return apiService.createRoomRole(roomId, data);
  }

    /**
   * Асинхронно обновляет комнаты роли.
   *
   * @param roomId Идентификатор комнаты.
   * @param roleId Идентификатор роли.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
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
  ): Promise<Role> {
    return apiService.updateRoomRole(roomId, roleId, data);
  }

    /**
     * Удаляет room role.
     * @param roomId Идентификатор комнаты.
     * @param roleId Идентификатор роли.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async deleteRoomRole(roomId: string, roleId: number): Promise<void> {
    return apiService.deleteRoomRole(roomId, roleId);
  }

    /**
     * Возвращает member roles.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getMemberRoles(
    roomId: string,
    userId: number,
  ): Promise<MemberRoles> {
    return apiService.getMemberRoles(roomId, userId);
  }

    /**
     * Устанавливает member roles.
     * @param roomId Идентификатор комнаты.
     * @param userId Идентификатор пользователя.
     * @param roleIds Список идентификаторов ролей.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async setMemberRoles(
    roomId: string,
    userId: number,
    roleIds: number[],
  ): Promise<MemberRoles> {
    return apiService.setMemberRoles(roomId, userId, roleIds);
  }

    /**
     * Возвращает room overrides.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getRoomOverrides(roomId: string): Promise<PermissionOverride[]> {
    return apiService.getRoomOverrides(roomId);
  }

    /**
   * Асинхронно создаёт комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
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

    /**
   * Асинхронно обновляет комнаты override.
   *
   * @param roomId Идентификатор комнаты.
   * @param overrideId Идентификатор переопределения прав.
   * @param data Данные запроса или полезная нагрузка операции.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async updateRoomOverride(
    roomId: string,
    overrideId: number,
    data: Partial<{ allow: number; deny: number }>,
  ): Promise<PermissionOverride> {
    return apiService.updateRoomOverride(roomId, overrideId, data);
  }

    /**
     * Удаляет room override.
     * @param roomId Идентификатор комнаты.
     * @param overrideId Идентификатор переопределения прав.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async deleteRoomOverride(
    roomId: string,
    overrideId: number,
  ): Promise<void> {
    return apiService.deleteRoomOverride(roomId, overrideId);
  }

    /**
     * Возвращает my permissions.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getMyPermissions(roomId: string): Promise<MyPermissions> {
    return apiService.getMyPermissions(roomId);
  }
}

/**
 * Хранит значение roles controller.
 *

 */

export const rolesController = new RolesController();
