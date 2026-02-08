import type { AxiosInstance } from 'axios'

import type { SessionResponse } from '../../shared/api/types'

export async function getSession(apiClient: AxiosInstance): Promise<SessionResponse> {
  const response = await apiClient.get<SessionResponse>('/auth/session/')
  return response.data
}
