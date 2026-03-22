import type { AxiosInstance } from "axios";

import type { ChatResolveResult } from "../../domain/interfaces/IApiService";
import { decodeChatResolveResponse } from "../../dto";

export const resolveChatTarget = async (
  apiClient: AxiosInstance,
  target: string,
): Promise<ChatResolveResult> => {
  const response = await apiClient.post<unknown>("/chat/resolve/", {
    target,
  });
  return decodeChatResolveResponse(response.data);
};
