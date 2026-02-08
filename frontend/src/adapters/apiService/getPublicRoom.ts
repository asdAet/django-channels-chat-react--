import type { AxiosInstance } from 'axios'

import type { RoomDetails } from '../../entities/room/types'

export async function getPublicRoom(apiClient: AxiosInstance): Promise<RoomDetails> {
  const response = await apiClient.get<RoomDetails>('/chat/public-room/')
  return response.data
}
