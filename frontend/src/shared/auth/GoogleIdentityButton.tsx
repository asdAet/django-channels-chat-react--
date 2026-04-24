import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  GoogleOAuthError,
  type GoogleOAuthSuccess,
  renderGoogleSignInButton,
} from "./googleIdentity";

/**
 * Контракт кнопки Google-аутентификации на auth-экранах.
 */
type GoogleIdentityButtonProps = {
  clientId: string;
  disabled?: boolean;
  onSuccess: (payload: GoogleOAuthSuccess) => Promise<void> | void;
  onUnavailable?: () => void;
};

/**
 * Компонент рендерит официальный Google Sign-In button в подготовленный контейнер.
 *
 * Если GIS SDK или сам button недоступны, компонент сообщает родителю о
 * необходимости включить fallback-сценарий. Ошибка в этом случае не
 * показывается пользователю автоматически: fallback должен отработать
 * прозрачно, без лишнего шума.
 *
 * @param props Параметры текущего сценария входа через Google.
 */
export function GoogleIdentityButton({
  clientId,
  disabled = false,
  onSuccess,
  onUnavailable,
}: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const isButtonVisible = ready && !disabled && clientId.trim().length > 0;
  const handleSuccess = useEffectEvent((payload: GoogleOAuthSuccess) => {
    void onSuccess(payload);
  });
  const handleUnavailable = useEffectEvent(() => {
    onUnavailable?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const normalizedClientId = clientId.trim();
    if (!container || disabled || !normalizedClientId) {
      container?.replaceChildren();
      return;
    }

    let cancelled = false;

    void renderGoogleSignInButton({
      clientId: normalizedClientId,
      container,
      onSuccess: (payload) => {
        handleSuccess(payload);
      },
    })
      .then(() => {
        if (cancelled) {
          return;
        }
        setReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const googleError =
          error instanceof GoogleOAuthError
            ? error
            : new GoogleOAuthError(
                "oauth_request_failed",
                "Не удалось подготовить Google OAuth.",
              );

        setReady(false);
        container.replaceChildren();

        if (googleError.code !== "oauth_not_configured") {
          handleUnavailable();
        }
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [clientId, disabled]);

  return (
    <div
      ref={containerRef}
      data-testid="auth-google-button-native"
      aria-hidden={!isButtonVisible}
    />
  );
}
