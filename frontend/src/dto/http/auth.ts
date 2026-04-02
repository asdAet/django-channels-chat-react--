import { z } from "zod";

import type { UserProfile } from "../../entities/user/types";
import { decodeOrThrow, safeDecode } from "../core/codec";

const usernameLatinSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9_]{2,29}$/,
    "Username: a-z, 0-9, _, длина 3-30, начинается с буквы.",
  );

const optionalPublicUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value.length === 0 || /^[a-z][a-z0-9_]{2,29}$/.test(value), {
    message: "Username: a-z, 0-9, _, длина 3-30, начинается с буквы.",
  });

const avatarCropSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .passthrough();

const rawUserProfileSchema = z
  .object({
    name: z.string().optional(),
    handle: z.string().nullable().optional(),
    publicRef: z.string().optional(),
    publicId: z.string().optional(),
    isSuperuser: z.boolean().optional(),
    email: z.string().optional(),
    profileImage: z.string().nullable().optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    bio: z.string().optional(),
    lastSeen: z.string().nullable().optional(),
    registeredAt: z.string().nullable().optional(),
  })
  .passthrough();

const sessionResponseSchema = z
  .object({
    authenticated: z.boolean(),
    user: rawUserProfileSchema.nullable(),
    wsAuthToken: z.string().min(1).nullable().optional(),
  })
  .passthrough();

const csrfSchema = z.object({ csrfToken: z.string() }).passthrough();
const presenceSessionSchema = z
  .object({
    ok: z.boolean(),
    wsAuthToken: z.string().min(1).nullable().optional(),
  })
  .passthrough();
const passwordRulesSchema = z.object({ rules: z.array(z.string()) }).passthrough();
const logoutSchema = z.object({ ok: z.boolean() }).passthrough();

const profileEnvelopeSchema = z
  .object({
    user: rawUserProfileSchema,
  })
  .passthrough();

const errorPayloadSchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
    detail: z.string().optional(),
    errors: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .passthrough();

const loginRequestInputSchema = z
  .object({
    identifier: z.string().trim().min(1),
    password: z.string().min(1),
  })
  .strict()
  .transform((dto) => ({
    identifier: dto.identifier.trim(),
    password: dto.password,
  }));

const registerRequestInputSchema = z
  .object({
    login: z.string().trim().min(1),
    password: z.string().min(1),
    passwordConfirm: z.string().min(1),
    name: z.string().trim().min(1),
    username: z.string().trim().optional(),
    email: z.string().trim().optional(),
  })
  .strict()
  .transform((dto) => {
    const login = dto.login.trim().toLowerCase();
    const password = dto.password.trim();
    const passwordConfirm = dto.passwordConfirm.trim();
    const name = dto.name.trim();
    const emailValue = (dto.email || "").trim().toLowerCase();
    const usernameValue = (dto.username || "").trim().toLowerCase();

    return {
      login,
      password,
      passwordConfirm,
      name,
      username: usernameValue || undefined,
      email: emailValue || undefined,
    };
  })
  .superRefine((dto, ctx) => {
    if (dto.email && !z.string().email().safeParse(dto.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Некорректный email",
      });
    }
  });

const oauthGoogleRequestSchema = z
  .object({
    idToken: z.string().trim().optional(),
    accessToken: z.string().trim().optional(),
    username: optionalPublicUsernameSchema.optional(),
  })
  .strict()
  .superRefine((dto, ctx) => {
    const idToken = (dto.idToken || "").trim();
    const accessToken = (dto.accessToken || "").trim();
    if (!idToken && !accessToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["idToken"],
        message: "Требуется idToken или accessToken",
      });
    }
  })
  .transform((dto) => ({
    idToken: (dto.idToken || "").trim() || undefined,
    accessToken: (dto.accessToken || "").trim() || undefined,
    username: dto.username && dto.username.length > 0 ? dto.username : undefined,
  }));

const maybeFileSchema = z.custom<File | null | undefined>(
  (value) => {
    if (value === null || value === undefined) return true;
    if (typeof File === "undefined") return true;
    return value instanceof File;
  },
  { message: "Expected File" },
);

const updateProfileRequestSchema = z
  .object({
    name: z.string().optional(),
    username: optionalPublicUsernameSchema.optional(),
    image: maybeFileSchema.optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    bio: z.string().optional(),
  })
  .strict();

/**
 * Преобразует HTTP-данные для операции map user profile.
 * @param dto DTO-объект для декодирования данных.
 * @returns Нормализованные данные после декодирования.
 */
const mapUserProfile = (
  dto: z.infer<typeof rawUserProfileSchema>,
): UserProfile => {
  const handle =
    typeof dto.handle === "string" && dto.handle.trim().length > 0
      ? dto.handle.trim()
      : null;
  const publicId =
    typeof dto.publicId === "string" && dto.publicId.trim().length > 0
      ? dto.publicId.trim()
      : null;
  const publicRef =
    (typeof dto.publicRef === "string" ? dto.publicRef.trim() : "") ||
    (handle ? `@${handle}` : "") ||
    (publicId ?? "");

  return {
    name: dto.name ?? "",
    username: handle ?? "",
    handle,
    publicRef,
    publicId,
    ...(dto.isSuperuser === true ? { isSuperuser: true } : {}),
    email: dto.email ?? "",
    profileImage: dto.profileImage ?? null,
    avatarCrop: dto.avatarCrop ?? null,
    bio: dto.bio ?? "",
    lastSeen: dto.lastSeen ?? null,
    registeredAt: dto.registeredAt ?? null,
  };
};

/**
 * Описывает структуру ответа API `SessionResponseDto`.
 */
export type SessionResponseDto = {
  authenticated: boolean;
  user: UserProfile | null;
  wsAuthToken: string | null;
};

/**
 * Описывает структуру данных `ProfileEnvelopeDto`.
 */
export type ProfileEnvelopeDto = {
  user: UserProfile;
};

/**
 * Описывает структуру данных `AuthErrorPayloadDto`.
 */
export type AuthErrorPayloadDto = z.infer<typeof errorPayloadSchema>;

/**
 * Описывает структуру данных `LoginRequestDto`.
 */
export type LoginRequestDto = z.infer<typeof loginRequestInputSchema>;
/**
 * Описывает структуру данных `RegisterRequestDto`.
 */
export type RegisterRequestDto = z.infer<typeof registerRequestInputSchema>;
/**
 * Описывает структуру данных `OAuthGoogleRequestDto`.
 */
export type OAuthGoogleRequestDto = z.infer<typeof oauthGoogleRequestSchema>;
/**
 * Описывает структуру данных `UpdateProfileRequestDto`.
 */
export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;

/**
 * Декодирует csrf response.
 *
 * @param input Входные данные для валидации и преобразования.
 *
 * @returns Нормализованные данные после декодирования.
 */

export const decodeCsrfResponse = (input: unknown) =>
  decodeOrThrow(csrfSchema, input, "auth/csrf");

/**
 * Декодирует presence session response.
 *
 * @param input Входные данные для валидации и преобразования.
 *
 * @returns Нормализованные данные после декодирования.
 */

export const decodePresenceSessionResponse = (
  input: unknown,
): {
  ok: boolean;
  wsAuthToken: string | null;
} => {
  const parsed = decodeOrThrow(
    presenceSessionSchema,
    input,
    "auth/presence-session",
  );
  return {
    ok: parsed.ok,
    wsAuthToken: parsed.wsAuthToken ?? null,
  };
};

/**
 * Декодирует password rules response.
 *
 * @param input Входные данные для валидации и преобразования.
 *
 * @returns Нормализованные данные после декодирования.
 */

export const decodePasswordRulesResponse = (input: unknown) =>
  decodeOrThrow(passwordRulesSchema, input, "auth/password-rules");

/**
 * Декодирует logout response.
 *
 * @param input Входные данные для валидации и преобразования.
 *
 * @returns Нормализованные данные после декодирования.
 */

export const decodeLogoutResponse = (input: unknown) =>
  decodeOrThrow(logoutSchema, input, "auth/logout");

/**
 * Преобразует HTTP-данные для операции decode session response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeSessionResponse = (input: unknown): SessionResponseDto => {
  const parsed = decodeOrThrow(sessionResponseSchema, input, "auth/session");
  return {
    authenticated: parsed.authenticated,
    user: parsed.user ? mapUserProfile(parsed.user) : null,
    wsAuthToken: parsed.wsAuthToken ?? null,
  };
};

/**
 * Преобразует HTTP-данные для операции decode profile envelope response.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeProfileEnvelopeResponse = (
  input: unknown,
): ProfileEnvelopeDto => {
  const parsed = decodeOrThrow(
    profileEnvelopeSchema,
    input,
    "auth/profile-envelope",
  );
  return { user: mapUserProfile(parsed.user) };
};

/**
 * Преобразует HTTP-данные для операции decode auth error payload.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeAuthErrorPayload = (
  input: unknown,
): AuthErrorPayloadDto | null => safeDecode(errorPayloadSchema, input);

/**
 * Преобразует HTTP-данные для операции build login request dto.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const buildLoginRequestDto = (input: unknown): LoginRequestDto =>
  decodeOrThrow(loginRequestInputSchema, input, "auth/login-request");

/**
 * Преобразует HTTP-данные для операции build register request dto.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const buildRegisterRequestDto = (input: unknown): RegisterRequestDto =>
  decodeOrThrow(registerRequestInputSchema, input, "auth/register-request");

/**
 * Преобразует HTTP-данные для операции build oauth google request dto.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const buildOAuthGoogleRequestDto = (
  input: unknown,
): OAuthGoogleRequestDto =>
  decodeOrThrow(oauthGoogleRequestSchema, input, "auth/oauth-google-request");

/**
 * Преобразует HTTP-данные для операции build update profile request dto.
 * @param input Входной объект с параметрами операции.
 * @returns Нормализованные данные после декодирования.
 */

export const buildUpdateProfileRequestDto = (
  input: unknown,
): UpdateProfileRequestDto =>
  decodeOrThrow(
    updateProfileRequestSchema,
    input,
    "auth/update-profile-request",
  );

/**
 * Преобразует HTTP-данные для операции validate public username.
 * @param username Имя пользователя.
 * @returns Нормализованные данные после декодирования.
 */

export const validatePublicUsername = (username: string): string =>
  decodeOrThrow(usernameLatinSchema, username, "auth/public-username");


