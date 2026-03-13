import { AuthForm } from "../widgets/auth/AuthForm";
import styles from "../styles/pages/RegisterPage.module.css";

type Props = {
  onSubmit: (email: string, password1: string, password2: string) => void;
  onGoogleAuth?: () => Promise<void> | void;
  googleAuthDisabledReason?: string | null;
  onNavigate: (path: string) => void;
  error?: string | null;
  passwordRules?: string[];
};

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
      onSubmit={(email, password, confirm) => onSubmit(email, password, confirm ?? "")}
      onGoogleAuth={onGoogleAuth}
      googleAuthDisabledReason={googleAuthDisabledReason}
      onNavigate={onNavigate}
      error={error}
      requireConfirm
      passwordRules={passwordRules}
      className={styles.page}
    />
  );
}
