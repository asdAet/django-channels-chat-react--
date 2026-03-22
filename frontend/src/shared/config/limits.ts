import { getRuntimeConfig } from "./runtimeConfig";
import { useRuntimeConfig } from "./RuntimeConfigContext";

const DEFAULT_CHAT_TARGET_REGEX = "^[A-Za-z0-9_@-]{1,80}$";

export const getUsernameMaxLength = () => getRuntimeConfig().usernameMaxLength;

export const useUsernameMaxLength = () =>
  useRuntimeConfig().config.usernameMaxLength;

export const getChatMessageMaxLength = () =>
  getRuntimeConfig().chatMessageMaxLength;

export const useChatMessageMaxLength = () =>
  useRuntimeConfig().config.chatMessageMaxLength;

export const getChatAttachmentMaxSizeMb = () =>
  getRuntimeConfig().chatAttachmentMaxSizeMb;

export const getChatAttachmentMaxSizeBytes = () =>
  getChatAttachmentMaxSizeMb() * 1024 * 1024;

export const useChatAttachmentMaxSizeMb = () =>
  useRuntimeConfig().config.chatAttachmentMaxSizeMb;

export const useChatAttachmentMaxPerMessage = () =>
  useRuntimeConfig().config.chatAttachmentMaxPerMessage;

export const useChatAttachmentAllowedTypes = () =>
  useRuntimeConfig().config.chatAttachmentAllowedTypes;

export const getChatTargetRegex = () => {
  const fromBackend = getRuntimeConfig().chatTargetRegex;
  return fromBackend && fromBackend.trim()
    ? fromBackend
    : DEFAULT_CHAT_TARGET_REGEX;
};

export const getChatTargetRegExp = () => {
  try {
    return new RegExp(getChatTargetRegex());
  } catch {
    return new RegExp(DEFAULT_CHAT_TARGET_REGEX);
  }
};
