import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";

export const DEFAULT_RUNTIME_CONFIG: ClientRuntimeConfig = {
  usernameMaxLength: 30,
  chatMessageMaxLength: 1000,
  chatTargetRegex: "^[A-Za-z0-9_@-]{1,80}$",
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

export const getRuntimeConfig = (): ClientRuntimeConfig => currentRuntimeConfig;

export const setRuntimeConfig = (next: ClientRuntimeConfig): void => {
  currentRuntimeConfig = { ...next };
};
