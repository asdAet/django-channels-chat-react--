import { z } from "zod";

import type { UserProfile } from "../../entities/user/types";
import { decodeOrThrow, safeDecode } from "../core/codec";

const usernameLatinSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]+$/, "Допустимы только латинские буквы (A-Z, a-z).");

const optionalPublicUsernameSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value.length === 0 || /^[A-Za-z]+$/.test(value), {
    message: "Допустимы только латинские буквы (A-Z, a-z).",
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
    username: z.string().nullable().optional(),
    publicUsername: z.string().nullable().optional(),
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
  })
  .passthrough();

const csrfSchema = z.object({ csrfToken: z.string() }).passthrough();
const presenceSessionSchema = z.object({ ok: z.boolean() }).passthrough();
const passwordRulesSchema = z.object({ rules: z.array(z.string()) }).passthrough();
const logoutSchema = z.object({ ok: z.boolean() }).passthrough();

const profileEnvelopeSchema = z
  .object({
    user: rawUserProfileSchema,
  })
  .passthrough();

const errorPayloadSchema = z
  .object({
    error: z.string().optional(),
    detail: z.string().optional(),
    errors: z
      .record(z.string(), z.union([z.string(), z.array(z.string())]))
      .optional(),
  })
  .passthrough();

const loginRequestSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict();

const registerRequestSchema = z
  .object({
    email: z.string().trim().email(),
    password1: z.string().min(1),
    password2: z.string().min(1),
  })
  .strict();

const oauthGoogleRequestSchema = z
  .object({
    idToken: z.string().trim().min(1).optional(),
    accessToken: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => Boolean(value.idToken || value.accessToken),
    "Требуется accessToken или idToken",
  )
  .strict();

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
    last_name: z.string().optional(),
    username: optionalPublicUsernameSchema.optional(),
    email: z.string().optional(),
    image: maybeFileSchema.optional(),
    avatarCrop: avatarCropSchema.nullable().optional(),
    bio: z.string().optional(),
  })
  .strict();

const mapUserProfile = (
  dto: z.infer<typeof rawUserProfileSchema>,
): UserProfile => ({
  name: dto.name ?? "",
  username:
    (dto.publicUsername ??
      (typeof dto.username === "string" ? dto.username : null) ??
      "").trim(),
  email: dto.email ?? "",
  profileImage: dto.profileImage ?? null,
  avatarCrop: dto.avatarCrop ?? null,
  bio: dto.bio ?? "",
  lastSeen: dto.lastSeen ?? null,
  registeredAt: dto.registeredAt ?? null,
});

export type SessionResponseDto = {
  authenticated: boolean;
  user: UserProfile | null;
};

export type ProfileEnvelopeDto = {
  user: UserProfile;
};

export type AuthErrorPayloadDto = z.infer<typeof errorPayloadSchema>;

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type OAuthGoogleRequestDto = z.infer<typeof oauthGoogleRequestSchema>;
export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;

export const decodeCsrfResponse = (input: unknown) =>
  decodeOrThrow(csrfSchema, input, "auth/csrf");

export const decodePresenceSessionResponse = (input: unknown) =>
  decodeOrThrow(presenceSessionSchema, input, "auth/presence-session");

export const decodePasswordRulesResponse = (input: unknown) =>
  decodeOrThrow(passwordRulesSchema, input, "auth/password-rules");

export const decodeLogoutResponse = (input: unknown) =>
  decodeOrThrow(logoutSchema, input, "auth/logout");

export const decodeSessionResponse = (input: unknown): SessionResponseDto => {
  const parsed = decodeOrThrow(sessionResponseSchema, input, "auth/session");
  return {
    authenticated: parsed.authenticated,
    user: parsed.user ? mapUserProfile(parsed.user) : null,
  };
};

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

export const decodeAuthErrorPayload = (
  input: unknown,
): AuthErrorPayloadDto | null => safeDecode(errorPayloadSchema, input);

export const buildLoginRequestDto = (input: unknown): LoginRequestDto =>
  decodeOrThrow(loginRequestSchema, input, "auth/login-request");

export const buildRegisterRequestDto = (input: unknown): RegisterRequestDto =>
  decodeOrThrow(registerRequestSchema, input, "auth/register-request");

export const buildOAuthGoogleRequestDto = (
  input: unknown,
): OAuthGoogleRequestDto =>
  decodeOrThrow(oauthGoogleRequestSchema, input, "auth/oauth-google-request");

export const buildUpdateProfileRequestDto = (
  input: unknown,
): UpdateProfileRequestDto =>
  decodeOrThrow(
    updateProfileRequestSchema,
    input,
    "auth/update-profile-request",
  );

export const validatePublicUsername = (username: string): string =>
  decodeOrThrow(usernameLatinSchema, username, "auth/public-username");
