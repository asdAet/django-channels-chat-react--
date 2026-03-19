import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";

/**
 * Константа `DEFAULT_RUNTIME_CONFIG` содержит значения по умолчанию для модуля.
 */

export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {
  usernameMaxLength: 30,
  chatMessageMaxLength: 1000,
  chatRoomSlugRegex: "^[A-Za-z0-9_-]{3,50}$",
  chatAttachmentMaxSizeMb: 10,
  chatAttachmentMaxPerMessage: 5,
  chatAttachmentAllowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "video/mp4",
    "audio/mp3",
    "audio/mpeg",
    "audio/webm",
  ],
  mediaUrlTtlSeconds: 300,
  mediaMode: "signed_only",
  googleOAuthClientId: "",
};

let currentRuntimeConfig: ClientRuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG };

/**
 * Возвращает runtime config.
 * @returns Данные, полученные из источника или кэша.
 */

export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;

/**
 * Обновляет runtime-конфиг клиента значениями с backend.
 */

export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {
  currentRuntimeConfig = { ...next };
};
