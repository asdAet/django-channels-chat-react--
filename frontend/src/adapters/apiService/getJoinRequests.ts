import type { AxiosInstance } from "axios";

import { decodeJoinRequestsResponse } from "../../dto";
import type { JoinRequest } from "../../entities/group/types";

export async function getJoinRequests(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<JoinRequest[]> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/requests/`,
  );
  return decodeJoinRequestsResponse(response.data);
}
