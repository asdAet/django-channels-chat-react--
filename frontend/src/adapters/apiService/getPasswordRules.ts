import type { AxiosInstance } from 'axios'

export async function getPasswordRules(
  apiClient: AxiosInstance,
): Promise<{ rules: string[] }> {
  const response = await apiClient.get<{ rules: string[] }>('/auth/password-rules/')
  return response.data
}
