import { type FormEvent, useEffect, useState } from "react";

import type { TwoFactorSetup } from "../../domain/interfaces/IApiService";
import { useNotifications } from "../../shared/notifications";
import { Button, Modal } from "../../shared/ui";
import styles from "../../styles/settings/TwoFactorSetupModal.module.css";
import { TotpCodeInput } from "./TotpCodeInput";

type Props = {
  open: boolean;
  mode: "setup" | "disable";
  setup: TwoFactorSetup | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
};

export function TwoFactorSetupModal({
  open,
  mode,
  setup,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const notifications = useNotifications();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setCode("");
  }, [open, mode]);

  const title = mode === "setup" ? "Двухфакторная защита" : "Отключить 2FA";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(code);
      notifications.success(
        mode === "setup" ? "2FA включена" : "2FA отключена",
      );
      onClose();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Не удалось подтвердить код";
      notifications.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className={styles.twoFactorModal} onSubmit={handleSubmit}>
        {mode === "setup" ? (
          <>
            <p className={styles.modalLead}>
              Отсканируйте QR-код в приложении authenticator и введите
              одноразовый код.
            </p>
            <div className={styles.qrFrame}>
              {setup?.qrSvg ? (
                <img src={setup.qrSvg} alt="QR-код для подключения 2FA" />
              ) : (
                <span>Готовим QR-код...</span>
              )}
            </div>
            {setup?.manualKey && (
              <div className={styles.manualKeyRow}>
                <code>{setup.manualKey}</code>
                <button
                  type="button"
                  className={styles.copyButton}
                  aria-label="Скопировать ключ"
                  onClick={() => {
                    void navigator.clipboard?.writeText(setup.manualKey);
                    notifications.info("Ключ скопирован");
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 8h10v12H8zM6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <p className={styles.modalLead}>
            Введите текущий код из authenticator, чтобы отключить защиту.
          </p>
        )}

        <TotpCodeInput
          value={code}
          onChange={setCode}
          disabled={loading || submitting}
        />
        <Button
          type="submit"
          variant={mode === "setup" ? "success" : "danger"}
          disabled={loading || submitting || code.length !== 6}
          fullWidth
        >
          {submitting
            ? "Проверяем..."
            : mode === "setup"
              ? "Подтвердить"
              : "Отключить защиту"}
        </Button>
      </form>
    </Modal>
  );
}
