/**
 * Константа `CONVERSATION_LIST_REFRESH_EVENT` хранит используемое в модуле значение.
 */

export const CONVERSATION_LIST_REFRESH_EVENT = "conversation-list:refresh";

/**
 * Обрабатывает emit conversation list refresh.
 */

export const emitConversationListRefresh = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONVERSATION_LIST_REFRESH_EVENT));
};
