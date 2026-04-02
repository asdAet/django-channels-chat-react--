import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "../../../styles/ui/LightboxIconButton.module.css";
import type { LightboxActionTone, LightboxControlsLayout } from "./types";

type Props = {
  layout: LightboxControlsLayout;
  label?: string;
  icon: ReactNode;
  active?: boolean;
  tone?: LightboxActionTone;
  className?: string;
  suppressAriaLabel?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">;

export function LightboxIconButton({
  layout,
  label,
  icon,
  active = false,
  tone = "default",
  className,
  suppressAriaLabel = false,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      aria-label={suppressAriaLabel ? undefined : label}
      className={[
        styles.iconButton,
        layout === "mobile" ? styles.iconButtonMobile : styles.iconButtonDesktop,
        active ? styles.iconButtonActive : "",
        tone === "accent" ? styles.iconButtonAccent : "",
        tone === "danger" ? styles.iconButtonDanger : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon}
    </button>
  );
}
