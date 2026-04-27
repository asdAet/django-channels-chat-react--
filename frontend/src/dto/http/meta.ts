import { z } from "zod";

import type { ClientRuntimeConfig } from "../../domain/interfaces/IApiService";
import { decodeOrThrow } from "../core/codec";

const mediaModeSchema = z.literal("signed_only");

const clientConfigSchema = z
  .object({
    usernameMaxLength: z.number().int().min(1).max(150),
    chatMessageMaxLength: z.number().int().min(1),
    chatTargetRegex: z.string().min(1),
    chatAttachmentMaxSizeMb: z.number().int().min(1),
    chatAttachmentMaxPerMessage: z.number().int().min(1),
    chatAttachmentAllowedTypes: z.array(z.string().min(1)),
    mediaUrlTtlSeconds: z.number().int().min(1),
    mediaMode: mediaModeSchema,
    googleOAuthClientId: z.string().optional().transform((value) => value ?? ""),
  })
  .passthrough();

/**
 * Преобразует HTTP-данные для операции decode client config response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeClientConfigResponse = (
  input: unknown,
): ClientRuntimeConfig =>
  decodeOrThrow(clientConfigSchema, input, "meta/client-config");
