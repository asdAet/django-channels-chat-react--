import type { AxiosInstance } from 'axios'

import type { Message } from '../../entities/message/types'

export async function getRoomMessages(
  apiClient: AxiosInstance,
  slug: string,
): Promise<{ messages: Message[] }> {
  const encodedSlug = encodeURIComponent(slug)
  const response = await apiClient.get<{ messages: Message[] }>(
    `/chat/rooms/${encodedSlug}/messages/`,
  )
  return response.data
}
