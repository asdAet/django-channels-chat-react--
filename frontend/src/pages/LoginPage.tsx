import styles from "../styles/pages/LoginPage.module.css";
import { AuthForm } from "../widgets/auth/AuthForm";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  onSubmit: (identifier: string, password: string) => void;
  onGoogleAuth?: () => Promise<void> | void;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
};

/**
 * Компонент LoginPage рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function LoginPage({
  onSubmit,
  onGoogleAuth,
  googleAuthDisabledReason = null,
  onNavigate,
  error = null,
}: Props) {
  return (
    <AuthForm
      mode="login"
      title="Вход"
      submitLabel="Войти"
      onSubmit={(payload) => {
        if (!("identifier" in payload)) return;
        onSubmit(payload.identifier, payload.password);
      }}
      onGoogleAuth={onGoogleAuth}
      googleAuthDisabledReason={googleAuthDisabledReason}
      onNavigate={onNavigate}
      error={error}
      className={styles.page}
    />
  );
}
