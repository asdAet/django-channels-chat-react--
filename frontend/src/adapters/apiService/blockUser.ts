import type { AxiosInstance } from "axios";

export async function blockUser(
  apiClient: AxiosInstance,
  publicRef: string,
): Promise<void> {
  await apiClient.post("/friends/block/", { ref: publicRef });
}
