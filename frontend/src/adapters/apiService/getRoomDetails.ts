import type { AxiosInstance } from 'axios'

import type { RoomDetails } from '../../entities/room/types'

export async function getRoomDetails(apiClient: AxiosInstance, slug: string): Promise<RoomDetails> {
  const encodedSlug = encodeURIComponent(slug)
  const response = await apiClient.get<RoomDetails>(`/chat/rooms/${encodedSlug}/`)
  return response.data
}
