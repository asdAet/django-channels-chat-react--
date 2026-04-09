import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";

// Runtime config comes from backend meta API, but Google OAuth needs a public fallback
// for static frontend builds when that endpoint is temporarily unavailable.
const BUILD_TIME_GOOGLE_OAUTH_CLIENT_ID = String(
  import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? "",
).trim();

/**
 * Константа `DEFAULT_RUNTIME_CONFIG`, используемая как default runtime config.
 */
export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {
  usernameMaxLength: 30,
  chatMessageMaxLength: 1000,
  chatTargetRegex: "^[A-Za-z0-9_@-]{1,80}$",
  chatAttachmentMaxSizeMb: 10,
  chatAttachmentMaxPerMessage: 10,
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
  googleOAuthClientId: BUILD_TIME_GOOGLE_OAUTH_CLIENT_ID,
};

let currentRuntimeConfig: ClientRuntimeConfig = { ...DEFAULT_RUNTIME_CONFIG };

/**
 * Возвращает `get runtime config`.
 *
 * @returns Возвращает результат `get runtime config` в формате `ClientRuntimeConfig`.
 */
export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;

/**
 * Обновляет `set runtime config`.
 *
 * @param next Параметр `next` в формате `ClientRuntimeConfig`.
 * @returns Возвращает результат `set runtime config` в формате `void`.
 */
export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {
  currentRuntimeConfig = { ...next };
};
