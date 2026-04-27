/**
 * Имя DOM-события, которое сообщает ConversationListProvider о необходимости
 * перечитать серверный снимок списка комнат и unread-count.
 */
export const CONVERSATION_LIST_REFRESH_EVENT = "conversation-list:refresh";

/**
 * Немедленно уведомляет sidebar-провайдер о необходимости обновить данные.
 */
export const emitConversationListRefresh = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONVERSATION_LIST_REFRESH_EVENT));
};
