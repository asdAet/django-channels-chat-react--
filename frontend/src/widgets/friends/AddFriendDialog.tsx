import { useCallback, useState, type KeyboardEvent } from "react";

import styles from "../../styles/friends/FriendsPage.module.css";

const HANDLE_PUBLIC_REF_RE = /^@[a-z][a-z0-9_]{2,29}$/i;
const USER_PUBLIC_ID_RE = /^[1-9]\d{9}$/;

type Props = {
  onSubmit: (publicRef: string) => Promise<void>;
  onClose: () => void;
};

export function AddFriendDialog({ onSubmit, onClose }: Props) {
  const [publicRef, setPublicRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = publicRef.trim();
    if (!trimmed) return;
    if (!HANDLE_PUBLIC_REF_RE.test(trimmed) && !USER_PUBLIC_ID_RE.test(trimmed)) {
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
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSubmit();
      }
      if (e.key === "Escape") {
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
          onChange={(e) => setPublicRef(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введи @username"
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

