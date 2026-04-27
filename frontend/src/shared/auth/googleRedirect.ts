type GoogleAuthRedirectOptions = {
  errorReturnTo?: string;
};

export const GOOGLE_AUTH_SUCCESS_RETURN_PATH = "/public";
const GOOGLE_AUTH_ERROR_RETURN_PATH = "/login";

const hasUnsafeReturnPathChars = (value: string): boolean =>
  value.includes("\\") ||
  [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127;
  });

const normalizeReturnPath = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  return trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !hasUnsafeReturnPathChars(trimmed)
    ? trimmed
    : fallback;
};

/**
 * Строит URL backend endpoint, который запускает Google OAuth redirect flow.
 *
 * @param returnTo Путь SPA для успешного входа после callback.
 * @param options Дополнительные безопасные пути возврата.
 * @returns Абсолютно безопасный относительный URL для перехода на backend.
 */
export const buildGoogleAuthRedirectUrl = (
  returnTo: string,
  options: GoogleAuthRedirectOptions = {},
): string => {
  const normalizedReturnTo = normalizeReturnPath(
    returnTo,
    GOOGLE_AUTH_SUCCESS_RETURN_PATH,
  );
  const searchParams = new URLSearchParams({ next: normalizedReturnTo });
  if (options.errorReturnTo) {
    searchParams.set(
      "errorNext",
      normalizeReturnPath(options.errorReturnTo, GOOGLE_AUTH_ERROR_RETURN_PATH),
    );
  }
  const search = searchParams.toString();
  return `/api/auth/oauth/google/start/?${search}`;
};

/**
 * Запускает server-side redirect flow для входа через Google OAuth.
 *
 * Фронтенд не получает OAuth-токены напрямую и не открывает popup-окно.
 * Вместо этого браузер уходит на backend endpoint, который сам начинает
 * Google OAuth, принимает callback и создает серверную сессию.
 *
 * @param returnTo Путь SPA для успешного входа после callback.
 * @param options Дополнительные безопасные пути возврата.
 */
export const startGoogleAuthRedirect = (
  returnTo: string,
  options: GoogleAuthRedirectOptions = {},
): void => {
  window.location.assign(buildGoogleAuthRedirectUrl(returnTo, options));
};
