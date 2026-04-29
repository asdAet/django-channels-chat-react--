import { useMemo } from "react";

import styles from "../../styles/settings/TotpCodeInput.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const CODE_LENGTH = 6;

export function TotpCodeInput({ value, onChange, disabled = false }: Props) {
  const normalized = useMemo(
    () => value.replace(/\D/g, "").slice(0, CODE_LENGTH),
    [value],
  );

  return (
    <label className={styles.codeInputLabel}>
      <span>Код подтверждения</span>
      <input
        className={styles.codeInput}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={normalized}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
        }
        aria-label="Шестизначный код двухфакторной защиты"
      />
      <span className={styles.codeSlots} aria-hidden="true">
        {Array.from({ length: CODE_LENGTH }).map((_, index) => (
          <span key={index} className={styles.codeSlot}>
            {normalized[index] ?? ""}
          </span>
        ))}
      </span>
    </label>
  );
}
