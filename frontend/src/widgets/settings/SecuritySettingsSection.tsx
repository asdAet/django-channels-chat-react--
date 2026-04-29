import { useState } from "react";

import { useNotifications } from "../../shared/notifications";
import { useSecuritySettings } from "../../shared/security/useSecuritySettings";
import { Button } from "../../shared/ui";
import styles from "../../styles/settings/SecuritySettings.module.css";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { TwoFactorSetupModal } from "./TwoFactorSetupModal";

type Props = {
  enabled: boolean;
};

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M14.5 9.5 20 4m-2 2 2 2m-4 0 2 2M4 16.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 3.5 18.5 6v5.25c0 4.1-2.55 7.65-6.5 9.25-3.95-1.6-6.5-5.15-6.5-9.25V6L12 3.5Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export function SecuritySettingsSection({ enabled }: Props) {
  const notifications = useNotifications();
  const {
    security,
    loading,
    error,
    changePassword,
    beginTwoFactorSetup,
    confirmTwoFactor,
    disableTwoFactor,
  } = useSecuritySettings(enabled);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorMode, setTwoFactorMode] = useState<
    "setup" | "disable" | null
  >(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<Awaited<
    ReturnType<typeof beginTwoFactorSetup>
  > | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  const twoFactorEnabled = Boolean(security?.twoFactorEnabled);

  const openTwoFactor = async () => {
    if (twoFactorEnabled) {
      setTwoFactorSetup(null);
      setTwoFactorMode("disable");
      return;
    }

    setSetupLoading(true);
    setTwoFactorMode("setup");
    try {
      const setup = await beginTwoFactorSetup();
      setTwoFactorSetup(setup);
    } catch (requestError) {
      setTwoFactorMode(null);
      const message =
        requestError &&
        typeof requestError === "object" &&
        "message" in requestError
          ? String((requestError as { message?: unknown }).message)
          : "Не удалось начать настройку 2FA";
      notifications.error(message);
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <section className={styles.section} aria-label="Безопасность">
      <header className={styles.sectionHeader}>
        <div>
          <h2>Безопасность</h2>
          <p>Пароль и двухфакторная аутентификация.</p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.securityList} aria-busy={loading}>
        <div className={styles.settingRow}>
          <span className={styles.settingIcon}>
            <KeyIcon />
          </span>
          <div className={styles.settingText}>
            <strong>Смена пароля</strong>
            <span>Изменение пароля для доступа к аккаунту.</span>
          </div>
          <Button variant="outline" onClick={() => setPasswordOpen(true)}>
            Сменить пароль
          </Button>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.settingIcon}>
            <ShieldIcon />
          </span>
          <div className={styles.settingText}>
            <strong>Двухфакторная аутентификация (2FA)</strong>
            <span>
              {twoFactorEnabled ? "Сейчас включена" : "Сейчас выключена"}
            </span>
          </div>
          <Button
            variant={twoFactorEnabled ? "outline" : "danger"}
            onClick={() => void openTwoFactor()}
            disabled={setupLoading}
          >
            {twoFactorEnabled ? "Отключить" : "Включить защиту"}
          </Button>
        </div>
      </div>

      <PasswordChangeModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSubmit={async (input) => {
          await changePassword(input);
        }}
      />
      {twoFactorMode && (
        <TwoFactorSetupModal
          open
          mode={twoFactorMode}
          setup={twoFactorSetup}
          loading={setupLoading}
          onClose={() => setTwoFactorMode(null)}
          onConfirm={async (code) => {
            if (twoFactorMode === "setup") {
              await confirmTwoFactor({ code });
            } else {
              await disableTwoFactor({ code });
            }
          }}
        />
      )}
    </section>
  );
}
