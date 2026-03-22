import type { AxiosInstance } from "axios";

import { resolveChatTarget } from "./resolveChatTarget";

const POSITIVE_ROOM_ID_RE = /^\d+$/;

export async function resolveRoomId(
  apiClient: AxiosInstance,
  roomTarget: string,
): Promise<string> {
  // Normalize an external chat target to the numeric room id required by
  // room-scoped API endpoints.
  const normalized = roomTarget.trim();
  if (POSITIVE_ROOM_ID_RE.test(normalized)) {
    return String(Number.parseInt(normalized, 10));
  }

  const resolved = await resolveChatTarget(apiClient, normalized);
  return String(resolved.roomId);
}
