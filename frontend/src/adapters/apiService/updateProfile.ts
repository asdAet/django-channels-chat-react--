import type { AxiosInstance } from "axios";

import type { UpdateProfileInput } from "../../domain/interfaces/IApiService";
import {
  buildUpdateProfileRequestDto,
  decodeProfileEnvelopeResponse,
} from "../../dto";
import type { UserProfile } from "../../entities/user/types";

/**
 * Обновляет profile.
 * @param apiClient Сконфигурированный HTTP-клиент для выполнения запроса.
 * @param fields Набор полей для обновления.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
export async function updateProfile(
  apiClient: AxiosInstance,
  fields: UpdateProfileInput,
): Promise<{ user: UserProfile }> {
  const dto = buildUpdateProfileRequestDto(fields);

  let latest: { user: UserProfile } | null = null;

  const profileForm = new FormData();
  let hasProfileFields = false;

  if (dto.name !== undefined) {
    profileForm.append("name", dto.name);
    hasProfileFields = true;
  }
  if (dto.image) {
    profileForm.append("image", dto.image);
    hasProfileFields = true;
  }
  if (dto.avatarCrop) {
    profileForm.append("avatarCropX", String(dto.avatarCrop.x));
    profileForm.append("avatarCropY", String(dto.avatarCrop.y));
    profileForm.append("avatarCropWidth", String(dto.avatarCrop.width));
    profileForm.append("avatarCropHeight", String(dto.avatarCrop.height));
    hasProfileFields = true;
  }
  if (dto.bio !== undefined) {
    profileForm.append("bio", dto.bio);
    hasProfileFields = true;
  }

  if (hasProfileFields) {
    const profileResponse = await apiClient.patch<unknown>(
      "/profile/",
      profileForm,
    );
    latest = decodeProfileEnvelopeResponse(profileResponse.data);
  }

  if (dto.username !== undefined) {
    const handleResponse = await apiClient.patch<unknown>(
      "/profile/handle/",
      {
        username: dto.username,
      },
    );
    latest = decodeProfileEnvelopeResponse(handleResponse.data);
  }

  if (latest) {
    return latest;
  }

  const fallbackResponse = await apiClient.get<unknown>("/profile/");
  return decodeProfileEnvelopeResponse(fallbackResponse.data);
}
