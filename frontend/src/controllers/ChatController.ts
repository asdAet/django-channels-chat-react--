import { apiService } from "../adapters/ApiService";
import type {
  ChatResolveResult,
  EditMessageResult,
  GlobalSearchResult,
  MessageReadersResult,
  ReactionResult,
  ReadStateResult,
  RoomAttachmentsResult,
  SearchResult,
  UnreadCountItem,
  UploadAttachmentsOptions,
  UploadResult,
} from "../domain/interfaces/IApiService";
import type {
  DirectChatsResponseDto,
  RoomMessagesDto,
  RoomMessagesParams,
} from "../dto";
import type { RoomDetails as RoomDetailsDto } from "../entities/room/types";

let directChatsInFlight: Promise<DirectChatsResponseDto> | null = null;

const roomDetailsInFlight = new Map<string, Promise<RoomDetailsDto>>();
const roomMessagesInFlight = new Map<string, Promise<RoomMessagesDto>>();


/**
 * Формирует room messages key.
 * @param roomId Идентификатор комнаты.
 * @param params Параметры запроса.
 */
const buildRoomMessagesKey = (roomId: string, params?: RoomMessagesParams) => {
  const limit = params?.limit ?? "";
  const beforeId = params?.beforeId ?? "";
  return `${roomId}|limit=${limit}|before=${beforeId}`;
};


/**
 * Класс ChatController инкапсулирует логику текущего слоя приложения.
 */
class ChatController {
public async resolveChatTarget(target: string): Promise<ChatResolveResult> {
    return apiService.resolveChatTarget(target);
  }

    /**
     * Возвращает room details.
     * @param roomId Идентификатор комнаты.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getRoomDetails(roomId: string): Promise<RoomDetailsDto> {
    const inFlight = roomDetailsInFlight.get(roomId);
    if (inFlight) {
      return inFlight;
    }

    const request = apiService.getRoomDetails(roomId).finally(() => {
      roomDetailsInFlight.delete(roomId);
    });

    roomDetailsInFlight.set(roomId, request);
    return request;
  }

    /**
     * Возвращает room messages.
     * @param roomId Идентификатор комнаты.
     * @param params Параметры запроса.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getRoomMessages(
    roomId: string,
    params?: RoomMessagesParams,
  ): Promise<RoomMessagesDto> {
    const cacheKey = buildRoomMessagesKey(roomId, params);
    const inFlight = roomMessagesInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const request = apiService.getRoomMessages(roomId, params).finally(() => {
      roomMessagesInFlight.delete(cacheKey);
    });

    roomMessagesInFlight.set(cacheKey, request);
    return request;
  }

    /**
     * Возвращает direct chats.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getDirectChats(): Promise<DirectChatsResponseDto> {
    if (directChatsInFlight) {
      return directChatsInFlight;
    }

    directChatsInFlight = apiService.getDirectChats().finally(() => {
      directChatsInFlight = null;
    });

    return directChatsInFlight;
  }

    /**
     * Возвращает unread counts.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getUnreadCounts(): Promise<UnreadCountItem[]> {
    return apiService.getUnreadCounts();
  }

    /**
     * Обрабатывает edit message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param content Текст сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async editMessage(
    roomId: string,
    messageId: number,
    content: string,
  ): Promise<EditMessageResult> {
    return apiService.editMessage(roomId, messageId, content);
  }

    /**
     * Удаляет message.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async deleteMessage(roomId: string, messageId: number): Promise<void> {
    return apiService.deleteMessage(roomId, messageId);
  }

    /**
     * Добавляет reaction.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param emoji Эмодзи реакции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async addReaction(
    roomId: string,
    messageId: number,
    emoji: string,
  ): Promise<ReactionResult> {
    return apiService.addReaction(roomId, messageId, emoji);
  }

    /**
     * Удаляет reaction.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @param emoji Эмодзи реакции.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async removeReaction(
    roomId: string,
    messageId: number,
    emoji: string,
  ): Promise<void> {
    return apiService.removeReaction(roomId, messageId, emoji);
  }

    /**
     * Обрабатывает search messages.
     * @param roomId Идентификатор комнаты.
     * @param query Поисковый запрос.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async searchMessages(
    roomId: string,
    query: string,
  ): Promise<SearchResult> {
    return apiService.searchMessages(roomId, query);
  }

    /**
     * Обрабатывает upload attachments.
     * @param roomId Идентификатор комнаты.
     * @param files Список файлов для загрузки.
     * @param options Опциональные параметры поведения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async uploadAttachments(
    roomId: string,
    files: File[],
    options?: UploadAttachmentsOptions,
  ): Promise<UploadResult> {
    return apiService.uploadAttachments(roomId, files, options);
  }

    /**
     * Обрабатывает mark read.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async markRead(
    roomId: string,
    messageId?: number,
  ): Promise<ReadStateResult> {
    return apiService.markRead(roomId, messageId);
  }

    /**
     * Возвращает exact readers конкретного сообщения.
     * @param roomId Идентификатор комнаты.
     * @param messageId Идентификатор сообщения.
     * @returns Промис с данными, возвращаемыми этой функцией.
     */
public async getMessageReaders(
    roomId: string,
    messageId: number,
  ): Promise<MessageReadersResult> {
    return apiService.getMessageReaders(roomId, messageId);
  }

    /**
   * Асинхронно выполняет поиск.
   *
   * @param query Поисковый запрос.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async globalSearch(
    query: string,
    params?: {
      usersLimit?: number;
      groupsLimit?: number;
      messagesLimit?: number;
    },
  ): Promise<GlobalSearchResult> {
    return apiService.globalSearch(query, params);
  }

    /**
   * Асинхронно возвращает комнаты вложения.
   *
   * @param roomId Идентификатор комнаты.
   * @param params Параметры запроса.
   *
   * @returns Промис с данными, возвращаемыми этой функцией.
   */
public async getRoomAttachments(
    roomId: string,
    params?: { limit?: number; before?: number },
  ): Promise<RoomAttachmentsResult> {
    return apiService.getRoomAttachments(roomId, params);
  }
}

/**
 * Экспорт `chatController` предоставляет инициализированный экземпляр для повторного использования в модуле.
 */
export const chatController = new ChatController();
