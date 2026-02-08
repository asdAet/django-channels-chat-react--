import type { AxiosInstance } from 'axios'

import type { SessionResponse } from '../../shared/api/types'

export async function register(
  apiClient: AxiosInstance,
  username: string,
  password1: string,
  password2: string,
): Promise<SessionResponse> {
  const response = await apiClient.post<SessionResponse>('/auth/register/', {
    username,
    password1,
    password2,
  })
  return response.data
}
