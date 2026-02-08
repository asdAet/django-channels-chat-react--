import type { AxiosInstance } from 'axios'

import type { SessionResponse } from '../../shared/api/types'

export async function login(
  apiClient: AxiosInstance,
  username: string,
  password: string,
): Promise<SessionResponse> {
  const response = await apiClient.post<SessionResponse>('/auth/login/', { username, password })
  return response.data
}
