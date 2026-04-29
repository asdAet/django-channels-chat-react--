import { type FormEvent, useState } from "react";

import { useNotifications } from "../../shared/notifications";
import { Button, Modal } from "../../shared/ui";
import styles from "../../styles/settings/PasswordChangeModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    oldPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }) => Promise<void>;
};

export function PasswordChangeModal({ open, onClose, onSubmit }: Props) {
  const notifications = useNotifications();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ oldPassword: "", newPassword: "", newPasswordConfirm: "" });
      notifications.success("Пароль обновлен");
      onClose();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Не удалось сменить пароль";
      notifications.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Смена пароля">
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Текущий пароль</span>
          <input
            type="password"
            value={form.oldPassword}
            autoComplete="current-password"
            onChange={(event) =>
              setForm({ ...form, oldPassword: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Новый пароль</span>
          <input
            type="password"
            value={form.newPassword}
            autoComplete="new-password"
            onChange={(event) =>
              setForm({ ...form, newPassword: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Повторите новый пароль</span>
          <input
            type="password"
            value={form.newPasswordConfirm}
            autoComplete="new-password"
            onChange={(event) =>
              setForm({ ...form, newPasswordConfirm: event.target.value })
            }
          />
        </label>
        <Button type="submit" variant="success" disabled={submitting} fullWidth>
          {submitting ? "Сохраняем..." : "Сменить пароль"}
        </Button>
      </form>
    </Modal>
  );
}
