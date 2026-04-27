import type { FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";

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
 *
 * @property mode Режим формы: вход или регистрация.
 * @property title Короткий заголовок карточки.
 * @property submitLabel Подпись основной кнопки действия.
 * @property onSubmit Единый обработчик отправки формы.
 * @property onGoogleAuth Запускает вход через Google через redirect-сценарий.
 * @property googleAuthDisabledReason Сообщение, почему Google-вход сейчас отключен.
 * @property onNavigate Переход между `/login` и `/register`.
 * @property error Текст auth-ошибки, который нужно показать пользователю.
 * @property passwordRules Список правил пароля для экрана регистрации.
 * @property className Дополнительный CSS-класс контейнера.
 */
type AuthFormProps = {
  mode: AuthMode;
  title: string;
  submitLabel: string;
  onSubmit: (payload: LoginSubmitPayload | RegisterSubmitPayload) => void;
  onGoogleAuth?: () => Promise<void> | void;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
  passwordRules?: string[];
  className?: string;
};

/**
 * Рендерит auth-форму и связывает поля ввода с auth-сценарием верхнего уровня.
 *
 * Google-вход здесь намеренно не использует popup. Кнопка запускает
 * server-side redirect flow: браузер уходит на backend endpoint, backend сам
 * завершает Google OAuth и затем возвращает пользователя обратно уже с готовой
 * серверной сессией.
 *
 * @param props Настройки экрана входа или регистрации.
 */
export function AuthForm({
  mode,
  title,
  submitLabel,
  onSubmit,
  onGoogleAuth,
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
  const canUseGoogleAuth = Boolean(onGoogleAuth) && !googleAuthDisabledReason;
  const shouldRenderGoogleAuth =
    Boolean(onGoogleAuth) || Boolean(googleAuthDisabledReason);

  const canSubmit = useMemo(() => {
    if (isRegister) {
      return Boolean(login.trim() && name.trim() && password && confirm);
    }

    return Boolean(identifier.trim() && password);
  }, [confirm, identifier, isRegister, login, name, password]);

  /**
   * Отправляет данные формы в родительский auth-сценарий.
   *
   * @param event Браузерное событие `submit`.
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
   * Запускает redirect-flow для входа через Google.
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
