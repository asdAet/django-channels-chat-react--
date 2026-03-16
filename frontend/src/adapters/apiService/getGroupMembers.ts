import type { AxiosInstance } from "axios";

import { decodeGroupMembersResponse } from "../../dto";
import type { GroupMember } from "../../entities/group/types";

export type GroupMembersResult = {
  items: GroupMember[];
  total: number;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextBefore: number | null;
  };
};

export async function getGroupMembers(
  apiClient: AxiosInstance,
  roomId: string,
  params?: { limit?: number; before?: number },
): Promise<GroupMembersResult> {
  const response = await apiClient.get<unknown>(
    `/groups/${encodeURIComponent(roomId)}/members/`,
    { params },
  );
  return decodeGroupMembersResponse(response.data);
}
