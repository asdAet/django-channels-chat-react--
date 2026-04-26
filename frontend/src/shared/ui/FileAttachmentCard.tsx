import styles from "../../styles/ui/FileAttachmentCard.module.css";

type Props = {
  fileName: string;
  fileTypeLabel: string;
  fileSizeLabel: string;
  sentAtLabel: string;
  sentAtIso?: string;
  href?: string | null;
  downloadName?: string;
  compact?: boolean;
  className?: string;
};

/**
 * Рендерит компактную карточку файла с постоянной видимостью типа, размера и даты отправки.
 * @param props Свойства карточки загружаемого файла.
 */
export function FileAttachmentCard({
  fileName,
  fileTypeLabel,
  fileSizeLabel,
  sentAtLabel,
  sentAtIso,
  href,
  downloadName,
  compact = false,
  className,
}: Props) {
  const rootClassName = [
    styles.root,
    compact ? styles.compact : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className={styles.icon} aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </span>

      <span className={styles.info}>
        <span className={styles.titleRow}>
          <span className={styles.name} title={fileName}>
            {fileName.slice(
              0,
              fileName.lastIndexOf(".") > 0
                ? fileName.lastIndexOf(".")
                : fileName.length,
            )}
          </span>
          {/* <span className={styles.typeBadge} title={fileTypeLabel}>
            {fileTypeLabel}
          </span> */}
        </span>

        <span className={styles.metaRow}>
          <span className={styles.metaItem}>{fileSizeLabel}</span>
          {fileTypeLabel && (
            <>
              <span className={styles.metaSeparator} aria-hidden="true">
                •
              </span>
              <time className={styles.typeBadge} dateTime={sentAtIso}>
                {fileTypeLabel}
              </time>
            </>
          )}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        download={downloadName}
        className={rootClassName}
        data-message-menu-ignore="true"
        data-testid="file-attachment-card"
        aria-label={`Открыть файл ${fileName}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={rootClassName}
      data-message-menu-ignore="true"
      data-testid="file-attachment-card"
      aria-label={`Файл ${fileName}`}
    >
      {content}
    </div>
  );
}
