import type { AxiosInstance } from "axios";

import { decodeClientConfigResponse } from "../../dto";

/**
 * Возвращает client config.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 */

export const getClientConfig = async (apiClient: AxiosInstance) => {
  const response = await apiClient.get("/meta/client-config/");
  return decodeClientConfigResponse(response.data);
};
