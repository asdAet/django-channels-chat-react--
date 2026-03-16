import type { AxiosInstance } from "axios";

import { decodeSendFriendRequestResponse } from "../../dto";
import type { SendFriendRequestResponse } from "../../dto/http/friends";

export async function sendFriendRequest(
  apiClient: AxiosInstance,
  publicRef: string,
): Promise<SendFriendRequestResponse> {
  const response = await apiClient.post<unknown>("/friends/requests/", {
    ref: publicRef,
  });
  return decodeSendFriendRequestResponse(response.data);
}
