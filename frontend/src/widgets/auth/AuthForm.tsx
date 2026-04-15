import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { GoogleIdentityButton } from "../../shared/auth/GoogleIdentityButton";
import type { GoogleOAuthSuccess } from "../../shared/auth/googleIdentity";
import { Button, Card, Toast } from "../../shared/ui";
import styles from "./AuthForm.module.css";

type AuthMode = "login" | "register";

/**
 * Полезная нагрузка формы входа.
 */
export type LoginSubmitPayload = {
  identifier: string;
  password: string;
};

/**
 * Полезная нагрузка формы регистрации.
 */
export type RegisterSubmitPayload = {
  login: string;
  password: string;
  passwordConfirm: string;
  name: string;
  username?: string;
  email?: string;
};

/**
 * Контракт auth-формы для экранов входа и регистрации.
 */
type AuthFormProps = {
  mode: AuthMode;
  title: string;
  submitLabel: string;
  onSubmit: (payload: LoginSubmitPayload | RegisterSubmitPayload) => void;
  onGoogleAuth?: () => Promise<void> | void;
  onGoogleAuthSuccess?: (payload: GoogleOAuthSuccess) => Promise<void> | void;
  googleOAuthClientId?: string | null;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
  passwordRules?: string[];
  className?: string;
};

/**
 * Рендерит auth-форму и связывает поля с обработчиками входа.
 *
 * Компонент поддерживает два варианта Google-входа:
 * 1. основной production-путь через официальный GIS button;
 * 2. резервный fallback через ручной popup flow, если GIS button не смог
 *    подготовиться в текущем браузере.
 *
 * @param props Настройки экрана входа или регистрации.
 */
export function AuthForm({
  mode,
  title,
  submitLabel,
  onSubmit,
  onGoogleAuth,
  onGoogleAuthSuccess,
  googleOAuthClientId = null,
  googleAuthDisabledReason = null,
  onNavigate,
  error = null,
  passwordRules = [],
  className,
}: AuthFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [googleAuthPending, setGoogleAuthPending] = useState(false);

  const isRegister = mode === "register";
  const normalizedGoogleClientId = (googleOAuthClientId || "").trim();
  const canUseGoogleAuth = Boolean(onGoogleAuth) && !googleAuthDisabledReason;
  const canUseNativeGoogleButton =
    Boolean(onGoogleAuthSuccess) &&
    normalizedGoogleClientId.length > 0 &&
    !googleAuthDisabledReason;
  const shouldRenderGoogleAuth =
    Boolean(onGoogleAuth) ||
    Boolean(onGoogleAuthSuccess) ||
    Boolean(googleAuthDisabledReason);

  const [useGoogleFallback, setUseGoogleFallback] = useState(
    !canUseNativeGoogleButton,
  );

  useEffect(() => {
    setUseGoogleFallback(!canUseNativeGoogleButton);
  }, [canUseNativeGoogleButton]);

  const canSubmit = useMemo(() => {
    if (isRegister) {
      return Boolean(login.trim() && name.trim() && password && confirm);
    }

    return Boolean(identifier.trim() && password);
  }, [confirm, identifier, isRegister, login, name, password]);

  /**
   * Отправляет данные формы входа или регистрации в родительский сценарий.
   *
   * @param event Браузерное событие submit.
   */
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (isRegister) {
      onSubmit({
        login: login.trim(),
        password,
        passwordConfirm: confirm,
        name: name.trim(),
      });
      return;
    }

    onSubmit({
      identifier: identifier.trim(),
      password,
    });
  };

  /**
   * Запускает резервный popup-flow для Google-входа.
   */
  const handleGoogleAuth = useCallback(async () => {
    if (!onGoogleAuth || !canUseGoogleAuth || googleAuthPending) {
      return;
    }

    setGoogleAuthPending(true);
    try {
      await onGoogleAuth();
    } finally {
      setGoogleAuthPending(false);
    }
  }, [canUseGoogleAuth, googleAuthPending, onGoogleAuth]);

  /**
   * Завершает вход после получения Google токена от официального GIS button.
   *
   * @param payload Результат Google Identity Services с токеном пользователя.
   */
  const handleGoogleAuthSuccess = useCallback(async (payload: GoogleOAuthSuccess) => {
    if (!onGoogleAuthSuccess || googleAuthPending) {
      return;
    }

    setGoogleAuthPending(true);
    try {
      await onGoogleAuthSuccess(payload);
    } finally {
      setGoogleAuthPending(false);
    }
  }, [googleAuthPending, onGoogleAuthSuccess]);

  /**
   * Переключает форму на резервный popup-flow, если нативная GIS-кнопка
   * недоступна в текущем окружении.
   */
  const handleGoogleUnavailable = useCallback(() => {
    setUseGoogleFallback(true);
  }, []);

  return (
    <div className={[styles.auth, className].filter(Boolean).join(" ")}>
      <Card wide className={styles.card}>
        <p className={styles.eyebrow}>{title}</p>
        <h2 className={styles.title}>{submitLabel}</h2>
        {error && (
          <Toast variant="danger" role="alert">
            {error}
          </Toast>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <label className={styles.field}>
                <span>Ваше имя</span>
                <input
                  type="text"
                  data-testid="auth-name-input"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Логин</span>
                <input
                  type="text"
                  data-testid="auth-login-input"
                  autoComplete="username"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                />
              </label>
            </>
          ) : (
            <label className={styles.field}>
              <span>Логин или email</span>
              <input
                type="text"
                data-testid="auth-identifier-input"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>
          )}

          <label className={styles.field}>
            <span>Пароль</span>
            <input
              type="password"
              data-testid="auth-password-input"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {isRegister && (
            <label className={styles.field}>
              <span>Повторите пароль</span>
              <input
                type="password"
                data-testid="auth-confirm-input"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
          )}

          {isRegister && passwordRules.length > 0 && (
            <div className={styles.passwordRules}>
              <p className={styles.note}>
                Пароль должен соответствовать требованиям:
              </p>
              <ul className={styles.ticks}>
                {passwordRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            data-testid="auth-submit-button"
            disabled={!canSubmit}
          >
            {submitLabel}
          </Button>
        </form>

        {shouldRenderGoogleAuth && (
          <div className={styles.oauthSection}>
            {canUseNativeGoogleButton && !useGoogleFallback && (
              <GoogleIdentityButton
                clientId={normalizedGoogleClientId}
                disabled={googleAuthPending}
                onSuccess={handleGoogleAuthSuccess}
                onUnavailable={handleGoogleUnavailable}
              />
            )}

            {(useGoogleFallback || !canUseNativeGoogleButton) && (
              <Button
                variant="outline"
                type="button"
                onClick={handleGoogleAuth}
                disabled={!canUseGoogleAuth || googleAuthPending}
                data-testid="auth-google-button"
              >
                {googleAuthPending
                  ? "Подключение к Google..."
                  : "Продолжить с Google"}
              </Button>
            )}

            {canUseNativeGoogleButton && !useGoogleFallback && googleAuthPending && (
              <p className={styles.oauthHint}>Завершаем вход через Google...</p>
            )}

            {googleAuthDisabledReason && (
              <p className={styles.oauthHint}>{googleAuthDisabledReason}</p>
            )}
          </div>
        )}

        <div className={styles.authSwitch}>
          {mode === "login" ? (
            <p>
              Нет аккаунта?{" "}
              <Button
                variant="link"
                onClick={() => onNavigate("/register")}
                className={styles.switchButton}
              >
                Зарегистрироваться
              </Button>
            </p>
          ) : (
            <p>
              Уже есть аккаунт?{" "}
              <Button
                variant="link"
                onClick={() => onNavigate("/login")}
                className={styles.switchButton}
              >
                Войти
              </Button>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
