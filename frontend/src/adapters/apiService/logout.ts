import type { AxiosInstance } from 'axios'

export async function logout(apiClient: AxiosInstance): Promise<{ ok: boolean }> {
  const response = await apiClient.post<{ ok: boolean }>('/auth/logout/')
  return response.data
}
