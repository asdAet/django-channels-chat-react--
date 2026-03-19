import { z } from "zod";

import type { OnlineUser } from "../../shared/api/users";
import { parseJson, safeDecode } from "../core/codec";

const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const onlineUserSchema = z
  .object({
    publicRef: z.string().min(1),
    username: z.string().min(1),
    profileImage: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
  })
  .passthrough();

const presenceStateSchema = z
  .object({
    online: z.array(onlineUserSchema).optional(),
    guests: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

const pingSchema = z.object({ type: z.literal("ping") }).passthrough();

/**
 * Преобразует WebSocket-данные для операции to guests.
 * @param value Входное значение для преобразования.
 * @returns Числовое значение результата.
 */
const toGuests = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Описывает полезную нагрузку события `PresenceWsEvent`.
 */
export type PresenceWsEvent =
  | {
      type: "state";
      online: OnlineUser[] | null;
      guests: number | null;
    }
  | { type: "ping" }
  | { type: "unknown" };

/**
 * Преобразует WebSocket-данные для операции decode presence ws event.
 * @param raw Сырые входные данные до нормализации.
 * @returns Нормализованные данные после декодирования.
 */

export const decodePresenceWsEvent = (raw: string): PresenceWsEvent => {
  const payload = parseJson(raw);
  if (!payload || typeof payload !== "object") {
    return { type: "unknown" };
  }

  if (safeDecode(pingSchema, payload)) {
    return { type: "ping" };
  }

  const state = safeDecode(presenceStateSchema, payload);
  if (!state) {
    return { type: "unknown" };
  }

  return {
    type: "state",
    online: state.online
      ? state.online.map((entry) => ({
          publicRef: entry.publicRef,
          username: entry.username,
          profileImage: entry.profileImage ?? null,
          avatarCrop: entry.avatarCrop ?? null,
        }))
      : null,
    guests: toGuests(state.guests),
  };
};
