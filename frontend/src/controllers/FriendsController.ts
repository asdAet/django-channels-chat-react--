import { apiService } from "../adapters/ApiService";
import type { SendFriendRequestResponse } from "../dto/http/friends";
import type {
  BlockedUser,
  Friend,
  FriendRequest,
} from "../entities/friend/types";


/**
 * Класс FriendsController инкапсулирует логику текущего слоя приложения.
 */
class FriendsController {
    /**
     * Возвращает friends.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getFriends(): Promise<Friend[]> {
    return apiService.getFriends();
  }

    /**
     * Обрабатывает send friend request.
     * @param publicRef Публичный идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async sendFriendRequest(
    publicRef: string,
  ): Promise<SendFriendRequestResponse> {
    return apiService.sendFriendRequest(publicRef);
  }

    /**
     * Возвращает incoming requests.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getIncomingRequests(): Promise<FriendRequest[]> {
    return apiService.getIncomingRequests();
  }

    /**
     * Возвращает outgoing requests.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getOutgoingRequests(): Promise<FriendRequest[]> {
    return apiService.getOutgoingRequests();
  }

    /**
     * Обрабатывает accept friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async acceptFriendRequest(friendshipId: number): Promise<void> {
    return apiService.acceptFriendRequest(friendshipId);
  }

    /**
     * Обрабатывает decline friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async declineFriendRequest(friendshipId: number): Promise<void> {
    return apiService.declineFriendRequest(friendshipId);
  }

    /**
     * Проверяет условие cancel outgoing friend request.
     * @param friendshipId Идентификатор связи дружбы.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async cancelOutgoingFriendRequest(
    friendshipId: number,
  ): Promise<void> {
    return apiService.cancelOutgoingFriendRequest(friendshipId);
  }

    /**
     * Удаляет friend.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async removeFriend(userId: number): Promise<void> {
    return apiService.removeFriend(userId);
  }

    /**
     * Обрабатывает block user.
     * @param publicRef Публичный идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async blockUser(publicRef: string): Promise<void> {
    return apiService.blockUser(publicRef);
  }

    /**
     * Обрабатывает unblock user.
     * @param userId Идентификатор пользователя.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async unblockUser(userId: number): Promise<void> {
    return apiService.unblockUser(userId);
  }

    /**
     * Возвращает blocked users.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getBlockedUsers(): Promise<BlockedUser[]> {
    return apiService.getBlockedUsers();
  }
}

/**
 * Экспорт `friendsController` предоставляет инициализированный экземпляр для повторного использования в модуле.
 */
export const friendsController = new FriendsController();
