import type { AxiosInstance } from "axios";

import type {
  SessionResponse,
  TwoFactorLoginInput,
} from "../../domain/interfaces/IApiService";
import {
  buildTwoFactorLoginRequestDto,
  decodeSessionResponse,
} from "../../dto";

export async function confirmLoginTwoFactor(
  apiClient: AxiosInstance,
  input: TwoFactorLoginInput,
): Promise<SessionResponse> {
  const body = buildTwoFactorLoginRequestDto(input);
  const response = await apiClient.post<unknown>("/auth/login/2fa/", body);
  return decodeSessionResponse(response.data);
}
