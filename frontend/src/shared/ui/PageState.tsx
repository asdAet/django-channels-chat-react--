import type { ReactNode } from "react";

import styles from "../../styles/ui/PageState.module.css";

export type PageStateTone =
  | "neutral"
  | "info"
  | "warning"
  | "danger"
  | "success";

type PageStateProps = {
  tone?: PageStateTone;
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

const toneClassMap: Record<PageStateTone, string> = {
  danger: styles.danger,
  info: styles.info,
  neutral: styles.neutral,
  success: styles.success,
  warning: styles.warning,
};

export function PageState({
  tone = "neutral",
  icon,
  eyebrow,
  title,
  description,
  children,
  className,
}: PageStateProps) {
  return (
    <section
      className={[styles.root, toneClassMap[tone], className]
        .filter(Boolean)
        .join(" ")}
      data-tone={tone}
    >
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </section>
  );
}
