import type { AxiosInstance } from 'axios'

export async function ensureCsrf(apiClient: AxiosInstance): Promise<{ csrfToken: string }> {
  const response = await apiClient.get<{ csrfToken: string }>('/auth/csrf/')
  return response.data
}
