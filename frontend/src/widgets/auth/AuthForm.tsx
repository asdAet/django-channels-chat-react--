import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { Button, Card, Toast } from "../../shared/ui";
import styles from "./AuthForm.module.css";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  title: string;
  submitLabel: string;
  onSubmit: (email: string, password: string, confirm?: string) => void;
  onGoogleAuth?: () => Promise<void> | void;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  requireConfirm?: boolean;
  error?: string | null;
  passwordRules?: string[];
  className?: string;
};

export function AuthForm({
  mode,
  title,
  submitLabel,
  onSubmit,
  onGoogleAuth,
  googleAuthDisabledReason = null,
  onNavigate,
  requireConfirm = false,
  error = null,
  passwordRules = [],
  className,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [googleAuthPending, setGoogleAuthPending] = useState(false);

  const normalizedEmail = email.trim();
  const canSubmit = useMemo(() => {
    if (!normalizedEmail || !password) return false;
    if (!requireConfirm) return true;
    return confirm.length > 0;
  }, [confirm.length, normalizedEmail, password, requireConfirm]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(normalizedEmail, password, requireConfirm ? confirm : undefined);
  };

  const canUseGoogleAuth = Boolean(onGoogleAuth) && !googleAuthDisabledReason;

  const handleGoogleAuth = async () => {
    if (!onGoogleAuth || !canUseGoogleAuth || googleAuthPending) return;
    setGoogleAuthPending(true);
    try {
      await onGoogleAuth();
    } finally {
      setGoogleAuthPending(false);
    }
  };

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
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              data-testid="auth-email-input"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Пароль</span>
            <input
              type="password"
              data-testid="auth-password-input"
              autoComplete={requireConfirm ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {requireConfirm && (
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

          {requireConfirm && passwordRules.length > 0 && (
            <div className={styles.passwordRules}>
              <p className={styles.note}>Пароль должен соответствовать требованиям:</p>
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

        <div className={styles.oauthSection}>
          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleAuth}
            disabled={!canUseGoogleAuth || googleAuthPending}
            data-testid="auth-google-button"
          >
            {googleAuthPending ? "Подключение к Google..." : "Продолжить с Google"}
          </Button>
          {googleAuthDisabledReason && (
            <p className={styles.oauthHint}>{googleAuthDisabledReason}</p>
          )}
        </div>

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
