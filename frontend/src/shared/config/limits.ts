import { getRuntimeConfig } from "./runtimeConfig";
import { useRuntimeConfig } from "./RuntimeConfigContext";

const DEFAULT_CHAT_TARGET_REGEX = "^[A-Za-z0-9_@-]{1,80}$";

/**
 * Возвращает `get username max length`.
 */
export const getUsernameMaxLength = () => getRuntimeConfig().usernameMaxLength;

/**
 * React-хук `useUsernameMaxLength`.
 */
export const useUsernameMaxLength = () =>
  useRuntimeConfig().config.usernameMaxLength;

/**
 * Возвращает `get chat message max length`.
 */
export const getChatMessageMaxLength = () =>
  getRuntimeConfig().chatMessageMaxLength;

/**
 * React-хук `useChatMessageMaxLength`.
 */
export const useChatMessageMaxLength = () =>
  useRuntimeConfig().config.chatMessageMaxLength;

/**
 * Возвращает `get chat attachment max size mb`.
 */
export const getChatAttachmentMaxSizeMb = () =>
  getRuntimeConfig().chatAttachmentMaxSizeMb;

/**
 * Возвращает `get chat attachment max size bytes`.
 */
export const getChatAttachmentMaxSizeBytes = () =>
  getChatAttachmentMaxSizeMb() * 1024 * 1024;

/**
 * React-хук `useChatAttachmentMaxSizeMb`.
 */
export const useChatAttachmentMaxSizeMb = () =>
  useRuntimeConfig().config.chatAttachmentMaxSizeMb;

/**
 * React-хук `useChatAttachmentMaxPerMessage`.
 */
export const useChatAttachmentMaxPerMessage = () =>
  useRuntimeConfig().config.chatAttachmentMaxPerMessage;

/**
 * React-хук `useChatAttachmentAllowedTypes`.
 */
export const useChatAttachmentAllowedTypes = () =>
  useRuntimeConfig().config.chatAttachmentAllowedTypes;

/**
 * Возвращает `get chat target regex`.
 */
export const getChatTargetRegex = () => {
  const fromBackend = getRuntimeConfig().chatTargetRegex;
  return fromBackend && fromBackend.trim()
    ? fromBackend
    : DEFAULT_CHAT_TARGET_REGEX;
};

/**
 * Возвращает `get chat target reg exp`.
 */
export const getChatTargetRegExp = () => {
  try {
    return new RegExp(getChatTargetRegex());
  } catch {
    return new RegExp(DEFAULT_CHAT_TARGET_REGEX);
  }
};
