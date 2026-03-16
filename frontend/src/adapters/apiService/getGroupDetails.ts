import type { AxiosInstance } from "axios";

import { decodeGroupResponse } from "../../dto";
import type { Group } from "../../entities/group/types";

export async function getGroupDetails(
  apiClient: AxiosInstance,
  roomId: string,
): Promise<Group> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/`,
  );
  return decodeGroupResponse(response.data);
}
