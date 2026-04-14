const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_OAUTH_SCOPE = "openid email profile";
const GOOGLE_PROMPT_TIMEOUT_MS = 25_000;

/**
 * Описывает структуру ответа API `GoogleCredentialResponse`.
 */
type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

/**
 * Описывает параметры конфигурации `GoogleIdClientConfig`.
 */
type GoogleIdClientConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  cancel_on_tap_outside?: boolean;
  auto_select?: boolean;
  use_fedcm_for_prompt?: boolean;
  itp_support?: boolean;
};

/**
 * Описывает структуру ответа API `GoogleTokenResponse`.
 */
type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * Описывает структуру ответа API `GoogleTokenErrorResponse`.
 */
type GoogleTokenErrorResponse = {
  type?: string;
};

/**
 * Описывает структуру данных `GoogleTokenClient`.
 */
type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

/**
 * Описывает параметры конфигурации `GoogleTokenClientConfig`.
 */
type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (response: GoogleTokenErrorResponse) => void;
};

/**
 * Описывает структуру данных `GoogleAccountsOauth2`.
 */
type GoogleAccountsOauth2 = {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
};

/**
 * Описывает структуру данных `GoogleAccountsId`.
 */
type GoogleAccountsId = {
  initialize: (config: GoogleIdClientConfig) => void;
  prompt: () => void;
  cancel?: () => void;
};

/**
 * Описывает структуру данных `GoogleNamespace`.
 */
type GoogleNamespace = {
  accounts?: {
    id?: GoogleAccountsId;
    oauth2?: GoogleAccountsOauth2;
  };
};

declare global {
    /**
     * Интерфейс Window задает публичный контракт модуля.
     */
interface Window {
    google?: GoogleNamespace;
  }
}

/**
 * Описывает структуру данных `GoogleTokenType`.
 */
export type GoogleTokenType = "idToken" | "accessToken";

/**
 * Описывает структуру данных `GoogleOAuthSuccess`.
 */
export type GoogleOAuthSuccess = {
  token: string;
  tokenType: GoogleTokenType;
};

/**
 * Класс GoogleOAuthError инкапсулирует логику текущего слоя приложения.
 */
export class GoogleOAuthError extends Error {
  public readonly code:
    | "oauth_not_configured"
    | "oauth_sdk_load_failed"
    | "oauth_sdk_unavailable"
    | "oauth_popup_closed"
    | "oauth_token_missing"
    | "oauth_request_failed";


public constructor(code: GoogleOAuthError["code"], message: string) {
    /**
     * Инициализирует базовый конструктор и сохраняет параметры ошибки.
     *
     * @param message Текст сообщения.
     */
    super(message);
    this.code = code;
    this.name = "GoogleOAuthError";
  }
}

let sdkLoadPromise: Promise<void> | null = null;

/**
 * Возвращает google id api.
 * @returns Данные, полученные из источника или кэша.
 */
const getGoogleIdApi = (): GoogleAccountsId | null =>
  window.google?.accounts?.id ?? null;

/**
 * Возвращает google oauth2 api.
 * @returns Данные, полученные из источника или кэша.
 */
const getGoogleOauth2Api = (): GoogleAccountsOauth2 | null =>
  window.google?.accounts?.oauth2 ?? null;

/**
 * Обрабатывает load google identity sdk.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
const loadGoogleIdentitySdk = async (): Promise<void> => {
  if (getGoogleIdApi() || getGoogleOauth2Api()) {
    return;
  }
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      GOOGLE_IDENTITY_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(
            new GoogleOAuthError(
              "oauth_sdk_load_failed",
              "Не удалось загрузить Google OAuth SDK.",
            ),
          ),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new GoogleOAuthError(
          "oauth_sdk_load_failed",
          "Не удалось загрузить Google OAuth SDK.",
        ),
      );
    document.head.appendChild(script);
  }).finally(() => {
    sdkLoadPromise = null;
  });

  await sdkLoadPromise;
};

/**
 * Обрабатывает to google auth error.
 * @param message Сообщение, которое нужно обработать.

 */
const toGoogleAuthError = (message: string): GoogleOAuthError =>
  new GoogleOAuthError("oauth_request_failed", message);

/**
 * Обрабатывает request google access token.
 * @param api Экземпляр API-клиента.
 * @param clientId Идентификатор OAuth-клиента.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
const requestGoogleAccessToken = async (
  api: GoogleAccountsOauth2,
  clientId: string,
): Promise<string> =>
  await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(
        new GoogleOAuthError(
          "oauth_popup_closed",
          "Вход через Google отменен или не был завершен.",
        ),
      );
    }, GOOGLE_PROMPT_TIMEOUT_MS);

    /**
     * Обрабатывает finish.
     * @param result Аргумент `result` текущего вызова.
     */
    const finish = (result: { token?: string; error?: GoogleOAuthError }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);

      if (result.error) {
        reject(result.error);
        return;
      }

      const token = (result.token || "").trim();
      if (!token) {
        reject(
          new GoogleOAuthError(
            "oauth_token_missing",
            "Google OAuth не вернул accessToken.",
          ),
        );
        return;
      }
      resolve(token);
    };

    let tokenClient: GoogleTokenClient;
    try {
      tokenClient = api.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_OAUTH_SCOPE,
        callback: (response) => {
          const errorCode = String(response.error || "").trim();
          if (errorCode) {
            if (errorCode === "popup_closed_by_user") {
              finish({
                error: new GoogleOAuthError(
                  "oauth_popup_closed",
                  "Вход через Google отменен.",
                ),
              });
              return;
            }
            finish({
              error: toGoogleAuthError(
                "Не удалось выполнить вход через Google. Проверьте настройки OAuth и блокировщики контента.",
              ),
            });
            return;
          }

          finish({ token: response.access_token || "" });
        },
        error_callback: (response) => {
          const responseType = String(response.type || "").trim();
          if (responseType === "popup_closed") {
            finish({
              error: new GoogleOAuthError(
                "oauth_popup_closed",
                "Вход через Google отменен.",
              ),
            });
            return;
          }
          finish({
            error: toGoogleAuthError(
              "Не удалось выполнить вход через Google. Проверьте настройки OAuth и блокировщики контента.",
            ),
          });
        },
      });
    } catch {
      finish({
        error: toGoogleAuthError("Не удалось инициализировать Google OAuth."),
      });
      return;
    }

    try {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch {
      finish({
        error: new GoogleOAuthError(
          "oauth_popup_closed",
          "Вход через Google отменен.",
        ),
      });
    }
  });

/**
 * Обрабатывает request google id token.
 * @param api Экземпляр API-клиента.
 * @param clientId Идентификатор OAuth-клиента.
 * @returns Промис с данными, возвращаемыми этой функцией.
 */
const requestGoogleIdToken = async (
  api: GoogleAccountsId,
  clientId: string,
): Promise<string> =>
  await new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      api.cancel?.();
      reject(
        new GoogleOAuthError(
          "oauth_popup_closed",
          "Вход через Google отменен или не был завершен.",
        ),
      );
    }, GOOGLE_PROMPT_TIMEOUT_MS);

    /**
     * Обрабатывает finish.
     * @param result Аргумент `result` текущего вызова.
     */
    const finish = (result: { token?: string; error?: GoogleOAuthError }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);

      if (result.error) {
        reject(result.error);
        return;
      }

      const token = (result.token || "").trim();
      if (!token) {
        reject(
          new GoogleOAuthError(
            "oauth_token_missing",
            "Google OAuth не вернул idToken.",
          ),
        );
        return;
      }
      resolve(token);
    };

    api.initialize({
      client_id: clientId,
      callback: (response) => {
        const credential = (response.credential || "").trim();
        if (!credential) {
          finish({
            error: new GoogleOAuthError(
              "oauth_token_missing",
              "Google OAuth не вернул idToken.",
            ),
          });
          return;
        }
        finish({ token: credential });
      },
      cancel_on_tap_outside: true,
      auto_select: false,
      use_fedcm_for_prompt: false,
      itp_support: true,
    });

    try {
      api.prompt();
    } catch {
      finish({
        error: new GoogleOAuthError(
          "oauth_popup_closed",
          "Вход через Google отменен.",
        ),
      });
    }
  });

/**
 * Запускает клиентский сценарий входа через Google OAuth.
 *
 * Функция сама выбирает доступный механизм авторизации:
 * сначала пробует popup OAuth2 для production-сценария, а при необходимости
 * откатывается к Google Identity token flow.
 *
 * @param clientId Идентификатор Google OAuth-клиента, выданный для фронтенда.
 * @returns Данные успешной авторизации, которые затем передаются на backend для обмена на сессию.
 */
export const signInWithGoogle = async (
  clientId: string,
): Promise<GoogleOAuthSuccess> => {
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) {
    throw new GoogleOAuthError("oauth_not_configured", "Google OAuth не настроен.");
  }

  await loadGoogleIdentitySdk();

  const oauth2Api = getGoogleOauth2Api();
  if (oauth2Api) {
    try {
      const accessToken = await requestGoogleAccessToken(
        oauth2Api,
        normalizedClientId,
      );
      return { token: accessToken, tokenType: "accessToken" };
    } catch (error) {
      const oauth2Error =
        error instanceof GoogleOAuthError
          ? error
          : new GoogleOAuthError(
              "oauth_request_failed",
              "Не удалось выполнить вход через Google.",
            );
      throw oauth2Error;
    }
  }

  const idApi = getGoogleIdApi();
  if (!idApi) {
    throw new GoogleOAuthError("oauth_sdk_unavailable", "Google OAuth SDK недоступен.");
  }

  try {
    const idToken = await requestGoogleIdToken(idApi, normalizedClientId);
    return { token: idToken, tokenType: "idToken" };
  } catch (error) {
    const idError =
      error instanceof GoogleOAuthError
        ? error
        : new GoogleOAuthError(
            "oauth_request_failed",
            "Не удалось выполнить вход через Google.",
          );
    throw idError;
  }
};
