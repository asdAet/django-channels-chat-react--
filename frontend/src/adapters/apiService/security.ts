import type { AxiosInstance } from "axios";

import type {
  ChangePasswordInput,
  SecuritySettings,
  TwoFactorLoginInput,
  TwoFactorSetup,
} from "../../domain/interfaces/IApiService";
import {
  buildChangePasswordRequestDto,
  buildTwoFactorCodeRequestDto,
  decodeSecuritySettingsResponse,
  decodeTwoFactorSetupResponse,
} from "../../dto";

export async function getSecuritySettings(
  apiClient: AxiosInstance,
): Promise<{ security: SecuritySettings }> {
  const response = await apiClient.get<unknown>("/settings/security/");
  return decodeSecuritySettingsResponse(response.data);
}

export async function changePassword(
  apiClient: AxiosInstance,
  input: ChangePasswordInput,
): Promise<{ security: SecuritySettings }> {
  const body = buildChangePasswordRequestDto(input);
  const response = await apiClient.post<unknown>(
    "/settings/security/password/",
    body,
  );
  return decodeSecuritySettingsResponse(response.data);
}

export async function beginTwoFactorSetup(
  apiClient: AxiosInstance,
): Promise<{ setup: TwoFactorSetup }> {
  const response = await apiClient.post<unknown>(
    "/settings/security/2fa/setup/",
    {},
  );
  return decodeTwoFactorSetupResponse(response.data);
}

export async function confirmTwoFactor(
  apiClient: AxiosInstance,
  input: TwoFactorLoginInput,
): Promise<{ security: SecuritySettings }> {
  const body = buildTwoFactorCodeRequestDto(input);
  const response = await apiClient.post<unknown>(
    "/settings/security/2fa/confirm/",
    body,
  );
  return decodeSecuritySettingsResponse(response.data);
}

export async function disableTwoFactor(
  apiClient: AxiosInstance,
  input: TwoFactorLoginInput,
): Promise<{ security: SecuritySettings }> {
  const body = buildTwoFactorCodeRequestDto(input);
  const response = await apiClient.post<unknown>(
    "/settings/security/2fa/disable/",
    body,
  );
  return decodeSecuritySettingsResponse(response.data);
}
