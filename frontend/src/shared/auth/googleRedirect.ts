/**
 * Строит URL backend endpoint, который запускает Google OAuth redirect flow.
 *
 * @param returnTo Путь SPA, к которому backend может вернуть пользователя при ошибке.
 * @returns Абсолютно безопасный относительный URL для перехода на backend.
 */
export const buildGoogleAuthRedirectUrl = (returnTo: string): string => {
  const normalizedReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/login";
  const search = new URLSearchParams({ next: normalizedReturnTo }).toString();
  return `/api/auth/oauth/google/start/?${search}`;
};

/**
 * Запускает server-side redirect flow для входа через Google OAuth.
 *
 * Фронтенд не получает OAuth-токены напрямую и не открывает popup-окно.
 * Вместо этого браузер уходит на backend endpoint, который сам начинает
 * Google OAuth, принимает callback и создает серверную сессию.
 *
 * @param returnTo Путь SPA, к которому backend может вернуть пользователя при ошибке.
 */
export const startGoogleAuthRedirect = (returnTo: string): void => {
  window.location.assign(buildGoogleAuthRedirectUrl(returnTo));
};
