import type { Message, ReplyTo } from "../../entities/message/types";
import type { UserProfile } from "../../entities/user/types";

type CreateOptimisticTextMessageParams = {
  id: number;
  clientMessageId: string;
  content: string;
  user: UserProfile;
  currentActorRef: string;
  replyTo: Message | null;
  createdAt: string;
};

const CLIENT_MESSAGE_ID_PREFIX = "chat";

export const createClientMessageId = (): string => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `${CLIENT_MESSAGE_ID_PREFIX}_${cryptoApi.randomUUID()}`;
  }

  return [
    CLIENT_MESSAGE_ID_PREFIX,
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 10),
  ].join("_");
};

const toReplyQuote = (message: Message | null): ReplyTo | null => {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    publicRef: message.publicRef || null,
    username: message.username || null,
    displayName: message.displayName ?? message.username,
    content: message.content,
  };
};

export const createOptimisticTextMessage = ({
  id,
  clientMessageId,
  content,
  user,
  currentActorRef,
  replyTo,
  createdAt,
}: CreateOptimisticTextMessageParams): Message => ({
  id,
  clientMessageId,
  deliveryStatus: "pending",
  publicRef: user.publicRef || currentActorRef,
  username: user.username,
  displayName: (user.name || "").trim() || user.username,
  content,
  profilePic: user.profileImage,
  avatarCrop: user.avatarCrop ?? null,
  createdAt,
  editedAt: null,
  isDeleted: false,
  replyTo: toReplyQuote(replyTo),
  attachments: [],
  reactions: [],
});

export const isOptimisticMessage = (message: Message): boolean =>
  message.deliveryStatus === "pending";

export const removeOptimisticMessage = (
  messages: Message[],
  clientMessageId: string | null | undefined,
): Message[] => {
  if (!clientMessageId) {
    return messages;
  }

  const nextMessages = messages.filter(
    (message) =>
      !(
        message.clientMessageId === clientMessageId &&
        message.deliveryStatus === "pending"
      ),
  );
  return nextMessages.length === messages.length ? messages : nextMessages;
};

export const reconcileOptimisticMessage = (
  messages: Message[],
  serverMessage: Message,
): Message[] => {
  const clientMessageId = serverMessage.clientMessageId;

  if (clientMessageId) {
    const serverMessageExists = messages.some(
      (message) => message.id === serverMessage.id,
    );
    let replaced = false;

    const nextMessages = messages.flatMap((message) => {
      if (message.clientMessageId !== clientMessageId) {
        return [message];
      }

      replaced = true;
      if (serverMessageExists && message.id !== serverMessage.id) {
        return [];
      }

      return [{ ...serverMessage, deliveryStatus: undefined }];
    });

    if (replaced) {
      return nextMessages;
    }
  }

  if (messages.some((message) => message.id === serverMessage.id)) {
    return messages;
  }

  return [...messages, serverMessage];
};
