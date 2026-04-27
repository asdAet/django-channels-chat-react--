import type { AxiosInstance } from "axios";

import type { ReactionResult } from "../../domain/interfaces/IApiService";
import { decodeReactionResponse } from "../../dto";
import { resolveRoomId } from "./resolveRoomId";

/**
 * Adds a reaction to a message.
 * @param apiClient Configured HTTP client.
 * @param roomId Room identifier.
 * @param messageId Message identifier.
 * @param emoji Reaction emoji.
 * @returns Updated reaction state.
 */
export async function addReaction(
  apiClient: AxiosInstance,
  roomId: string,
  messageId: number,
  emoji: string,
): Promise<ReactionResult> {
  const apiRoomId = await resolveRoomId(apiClient, roomId);
  const encodedRoomId = encodeURIComponent(apiRoomId);
  const response = await apiClient.post<unknown>(
    `/chat/${encodedRoomId}/messages/${messageId}/reactions/`,
    { emoji },
  );
  return decodeReactionResponse(response.data);
}

