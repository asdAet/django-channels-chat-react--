import type { AxiosInstance } from "axios";

import { decodePinnedMessagesResponse } from "../../dto";
import type { PinnedMessage } from "../../entities/group/types";

export async function getPinnedMessages(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<PinnedMessage[]> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/pins/`,
  );
  return decodePinnedMessagesResponse(response.data);
}
