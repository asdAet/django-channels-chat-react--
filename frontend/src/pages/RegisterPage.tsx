import type { GoogleOAuthSuccess } from "../shared/auth/googleIdentity";
import styles from "../styles/pages/RegisterPage.module.css";
import { AuthForm } from "../widgets/auth/AuthForm";

/**
 * Контракт страницы регистрации.
 */
type Props = {
  onSubmit: (payload: {
    login: string;
    password: string;
    passwordConfirm: string;
    name: string;
    username?: string;
    email?: string;
  }) => void;
  onGoogleAuth?: () => Promise<void> | void;
  onGoogleAuthSuccess?: (payload: GoogleOAuthSuccess) => Promise<void> | void;
  googleOAuthClientId?: string | null;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
  passwordRules?: string[];
};

/**
 * Рендерит экран регистрации и передает действия пользователя в auth-форму.
 *
 * @param props Параметры текущего сценария регистрации.
 */
export function RegisterPage({
  onSubmit,
  onGoogleAuth,
  onGoogleAuthSuccess,
  googleOAuthClientId = null,
  googleAuthDisabledReason = null,
  onNavigate,
  error = null,
  passwordRules = [],
}: Props) {
  return (
    <AuthForm
      mode="register"
      title="Регистрация"
      submitLabel="Создать аккаунт"
      onSubmit={(payload) => {
        if ("identifier" in payload) {
          return;
        }

        onSubmit(payload);
      }}
      onGoogleAuth={onGoogleAuth}
      onGoogleAuthSuccess={onGoogleAuthSuccess}
      googleOAuthClientId={googleOAuthClientId}
      googleAuthDisabledReason={googleAuthDisabledReason}
      onNavigate={onNavigate}
      error={error}
      passwordRules={passwordRules}
      className={styles.page}
    />
  );
}
