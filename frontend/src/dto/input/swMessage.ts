import { z } from "zod";

import { decodeOrThrow, safeDecode } from "../core/codec";

const invalidateMessageSchema = z
  .object({
    type: z.literal("invalidate"),
    key: z.enum([
      "roomMessages",
      "roomDetails",
      "directChats",
      "userProfile",
      "selfProfile",
    ]),
    roomRef: z.string().trim().min(1).optional(),
    publicRef: z.string().trim().min(1).optional(),
  })
  .strict();

const clearMessageSchema = z
  .object({
    type: z.literal("clearUserCaches"),
  })
  .strict();

const swMessageSchema = z.union([invalidateMessageSchema, clearMessageSchema]);

/**
 * Проверяет условие has required discriminator fields.
 * @param message Сообщение, которое нужно обработать.
 * @returns Нормализованные данные после декодирования.
 */
const hasRequiredDiscriminatorFields = (
  message: z.infer<typeof swMessageSchema>,
): message is z.infer<typeof swMessageSchema> => {
  if (message.type !== "invalidate") return true;
  if (message.key === "roomMessages" || message.key === "roomDetails") {
    return Boolean(message.roomRef);
  }
  if (message.key === "userProfile") {
    return Boolean(message.publicRef);
  }
  return true;
};

/**
 * Описывает структуру данных `SwCacheMessage`.
 */
export type SwCacheMessage = z.infer<typeof swMessageSchema>;

/**
 * Валидирует исходящее сообщение в Service Worker.
 * @param input Входные данные для валидации и преобразования.
 * @returns Нормализованные данные после декодирования.
 */

export const encodeSwCacheMessage = (input: unknown): SwCacheMessage => {
  const message = decodeOrThrow(swMessageSchema, input, "sw/cache-message");
  if (!hasRequiredDiscriminatorFields(message)) {
    throw new Error("Invalid sw cache message payload");
  }
  return message;
};

/**
 * Безопасно декодирует входящее сообщение в Service Worker.
 * @param input Входные данные для валидации и преобразования.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeSwCacheMessage = (input: unknown): SwCacheMessage | null => {
  const message = safeDecode(swMessageSchema, input);
  if (!message) return null;
  return hasRequiredDiscriminatorFields(message) ? message : null;
};
