const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
export const GOOGLE_OAUTH_SCOPE = "openid profile email";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  scope?: string;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (response: { type?: string }) => void;
};

type GoogleTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleAccountsOAuth2 = {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
};

type GoogleNamespace = {
  accounts?: {
    oauth2?: GoogleAccountsOAuth2;
  };
};

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

export class GoogleOAuthError extends Error {
  public readonly code:
    | "oauth_not_configured"
    | "oauth_sdk_load_failed"
    | "oauth_sdk_unavailable"
    | "oauth_popup_closed"
    | "oauth_token_missing";

  public constructor(
    code: GoogleOAuthError["code"],
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "GoogleOAuthError";
  }
}

let sdkLoadPromise: Promise<void> | null = null;

const getGoogleOAuthApi = (): GoogleAccountsOAuth2 | null =>
  window.google?.accounts?.oauth2 ?? null;

const loadGoogleIdentitySdk = async (): Promise<void> => {
  if (getGoogleOAuthApi()) {
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

export const signInWithGoogle = async (clientId: string): Promise<string> => {
  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) {
    throw new GoogleOAuthError(
      "oauth_not_configured",
      "Google OAuth не настроен.",
    );
  }

  await loadGoogleIdentitySdk();

  const api = getGoogleOAuthApi();
  if (!api) {
    throw new GoogleOAuthError(
      "oauth_sdk_unavailable",
      "Google OAuth SDK недоступен.",
    );
  }

  return await new Promise<string>((resolve, reject) => {
    let settled = false;

    const fail = (error: GoogleOAuthError) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const tokenClient = api.initTokenClient({
      client_id: normalizedClientId,
      scope: GOOGLE_OAUTH_SCOPE,
      callback: (response) => {
        if (settled) return;

        if (response.error) {
          const reason = response.error_description || response.error;
          fail(
            new GoogleOAuthError(
              "oauth_popup_closed",
              `Вход через Google отменен (${reason}).`,
            ),
          );
          return;
        }

        const token = (response.access_token || "").trim();
        if (!token) {
          fail(
            new GoogleOAuthError(
              "oauth_token_missing",
              "Google OAuth не вернул accessToken.",
            ),
          );
          return;
        }

        settled = true;
        resolve(token);
      },
      error_callback: (response) => {
        if (settled) return;
        const reason = (response?.type || "unknown").trim();
        fail(
          new GoogleOAuthError(
            "oauth_popup_closed",
            `Вход через Google отменен (${reason}).`,
          ),
        );
      },
    });

    try {
      // Explicitly request user identity scopes.
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch {
      fail(
        new GoogleOAuthError(
          "oauth_popup_closed",
          "Вход через Google отменен.",
        ),
      );
    }
  });
};
