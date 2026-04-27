import { type KeyboardEvent, useCallback, useState } from "react";

import styles from "../../styles/friends/AddFriendDialog.module.css";

const HANDLE_PUBLIC_REF_RE = /^@[a-z][a-z0-9_]{2,29}$/i;
const USER_PUBLIC_ID_RE = /^[1-9]\d{9}$/;

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  onSubmit: (publicRef: string) => Promise<void>;
  onClose: () => void;
};

/**
 * React-компонент AddFriendDialog отвечает за отрисовку и обработку UI-сценария.
 */
export function AddFriendDialog({ onSubmit, onClose }: Props) {
  const [publicRef, setPublicRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = publicRef.trim();
    if (!trimmed) return;
    if (
      !HANDLE_PUBLIC_REF_RE.test(trimmed) &&
      !USER_PUBLIC_ID_RE.test(trimmed)
    ) {
      setError("Укажите @username или публичный id");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Не удалось отправить запрос";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [publicRef, onSubmit, onClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleSubmit();
      }
      if (event.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  return (
    <div className={styles.dialog} role="dialog" aria-label="Добавить друга">
      <div className={styles.dialogBackdrop} onClick={onClose} />
      <div className={styles.dialogCard}>
        <div className={styles.dialogTitle}>Добавить друга</div>
        <input
          className={styles.dialogInput}
          value={publicRef}
          onChange={(event) => setPublicRef(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите @username"
          autoFocus
          disabled={sending}
        />
        {error && <div className={styles.dialogError}>{error}</div>}
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancelBtn}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            type="button"
            className={styles.dialogSubmitBtn}
            onClick={handleSubmit}
            disabled={!publicRef.trim() || sending}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
