import { type FormEvent, useState } from "react";

import { useNotifications } from "../../shared/notifications";
import { Button, Modal } from "../../shared/ui";
import styles from "../../styles/auth/LoginTwoFactorModal.module.css";
import { TotpCodeInput } from "../settings/TotpCodeInput";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
};

export function LoginTwoFactorModal({ open, onClose, onConfirm }: Props) {
  const notifications = useNotifications();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(code);
      setCode("");
      onClose();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Неверный код двухфакторной защиты";
      notifications.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Подтверждение входа">
      <form className={styles.twoFactorModal} onSubmit={handleSubmit}>
        <p className={styles.modalLead}>
          Введите шестизначный код из приложения authenticator.
        </p>
        <TotpCodeInput value={code} onChange={setCode} disabled={submitting} />
        <Button
          type="submit"
          variant="success"
          disabled={submitting || code.length !== 6}
          fullWidth
        >
          {submitting ? "Проверяем..." : "Войти"}
        </Button>
      </form>
    </Modal>
  );
}
