import styles from "../styles/pages/RegisterPage.module.css";
import { AuthForm } from "../widgets/auth/AuthForm";

/**
 * Описывает входные props компонента `Props`.
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
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
  passwordRules?: string[];
};

/**
 * Компонент RegisterPage рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function RegisterPage({
  onSubmit,
  onGoogleAuth,
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
        if ("identifier" in payload) return;
        onSubmit(payload);
      }}
      onGoogleAuth={onGoogleAuth}
      googleAuthDisabledReason={googleAuthDisabledReason}
      onNavigate={onNavigate}
      error={error}
      passwordRules={passwordRules}
      className={styles.page}
    />
  );
}
