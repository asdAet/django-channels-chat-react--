import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type { UploadProgress } from "../../domain/interfaces/IApiService";
import type { Message } from "../../entities/message/types";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import styles from "../../styles/chat/MessageInput.module.css";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  disabled?: boolean;
  rateLimitActive?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  onAttach?: (files: File[]) => void;
  pendingFiles?: File[];
  onRemovePendingFile?: (index: number) => void;
  onClearPendingFiles?: () => void;
  uploadProgress?: UploadProgress | null;
  onCancelUpload?: () => void;
};

const formatUploadBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
};

const formatUploadPercent = (percent: number): string => {
  if (percent >= 100) {
    return "100";
  }
  if (percent < 10) {
    return percent.toFixed(2);
  }
  return percent.toFixed(1);
};

/**
 * React-компонент IconAttach отвечает за отрисовку и обработку UI-сценария.
 */
const IconAttach = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

/**
 * React-компонент IconSend отвечает за отрисовку и обработку UI-сценария.
 */
const IconSend = () => (
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
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

/**
 * React-компонент IconClose отвечает за отрисовку и обработку UI-сценария.
 */
const IconClose = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Извлекает files from clipboard.
 * @param clipboardData Аргумент `clipboardData` текущего вызова.
 * @returns Извлеченное значение из входных данных.
 */
const extractFilesFromClipboard = (
  clipboardData: DataTransfer | null,
): File[] => {
  if (!clipboardData) return [];

  const filesFromItems: File[] = [];
  const clipboardItems = clipboardData.items;
  if (clipboardItems && clipboardItems.length > 0) {
    for (let index = 0; index < clipboardItems.length; index += 1) {
      const item = clipboardItems[index];
      if (!item || item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) filesFromItems.push(file);
    }
  }

  if (filesFromItems.length > 0) return filesFromItems;
  if (!clipboardData.files || clipboardData.files.length === 0) return [];
  return Array.from(clipboardData.files);
};

/**
 * Компонент MessageInput рендерит UI текущего раздела и связывает действия пользователя с обработчиками.
 *
 * @param props Свойства компонента.
 */
export function MessageInput({
  draft,
  onDraftChange,
  onSend,
  onTyping,
  disabled,
  rateLimitActive,
  replyTo,
  onCancelReply,
  onAttach,
  pendingFiles = [],
  onRemovePendingFile,
  onClearPendingFiles,
  uploadProgress,
  onCancelUpload,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Автоматически подстраивает высоту поля ввода до 3x от базовой высоты.
   */
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const computed = window.getComputedStyle(textarea);
    const minHeight = Number.parseFloat(computed.minHeight) || 44;
    const maxHeight = minHeight * 3;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onDraftChange(e.target.value);
      onTyping?.();
    },
    [onDraftChange, onTyping],
  );

  useEffect(() => {
    resizeTextarea();
  }, [draft, resizeTextarea]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      onAttach?.(Array.from(files));
      e.target.value = "";
    },
    [onAttach],
  );

  const uploading = uploadProgress !== null && uploadProgress !== undefined;
  const uploadPercent = uploading
    ? Math.max(0, Math.min(100, uploadProgress?.percent ?? 0))
    : null;
  const uploadPhase = uploadProgress?.phase ?? "uploading";
  const uploadLoadedBytes = uploadProgress?.uploadedBytes ?? 0;
  const uploadTotalBytes = uploadProgress?.totalBytes ?? 0;
  const uploadStageLabel =
    uploadPhase === "processing"
      ? "Публикуем сообщение"
      : uploadPercent !== null && uploadPercent > 0
        ? `Загрузка файлов: ${formatUploadPercent(uploadPercent)}%`
        : "Подготовка загрузки...";
  const uploadMetaLabel =
    uploadTotalBytes > 0
      ? `${formatUploadBytes(uploadLoadedBytes)} / ${formatUploadBytes(uploadTotalBytes)}`
      : "";
  const uploadLabel = [uploadStageLabel, uploadMetaLabel]
    .filter(Boolean)
    .join(" • ");
  const uploadIsIndeterminate =
    uploading && (uploadPhase === "processing" || (uploadPercent ?? 0) <= 0);
  const hasQueuedFiles = pendingFiles.length > 0;
  const canSend = Boolean(draft.trim() || hasQueuedFiles);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!onAttach || disabled || rateLimitActive || uploading) return;
      const files = extractFilesFromClipboard(e.clipboardData);
      if (!files.length) return;
      e.preventDefault();
      onAttach(files);
    },
    [disabled, onAttach, rateLimitActive, uploading],
  );

  const previewItems = useMemo(
    () =>
      pendingFiles.map((file) => ({
        file,
        url:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : null,
      })),
    [pendingFiles],
  );

  useEffect(
    () => () => {
      for (const item of previewItems) {
        if (item.url) URL.revokeObjectURL(item.url);
      }
    },
    [previewItems],
  );

  return (
    <div
      className={[styles.wrapper, rateLimitActive ? styles.blocked : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {rateLimitActive && (
        <div
          className={styles.rateLimitBanner}
          role="status"
          aria-live="polite"
        >
          Йоу, не так быстро, Вы отправляете сообщения слишком быстро!
        </div>
      )}

      {uploading && (
        <div className={styles.uploadBar}>
          <div className={styles.uploadBarBody}>
            <span className={styles.uploadBarLabel}>{uploadLabel}</span>
            <div
              className={styles.uploadBarTrack}
              role="progressbar"
              aria-valuenow={uploadPercent ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={uploadLabel}
            >
              <div
                className={[
                  styles.uploadBarFill,
                  uploadIsIndeterminate ? styles.uploadBarFillIndeterminate : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  uploadIsIndeterminate
                    ? undefined
                    : {
                        width:
                          uploadPercent && uploadPercent > 0
                            ? `max(${uploadPercent}%, 4px)`
                            : "0%",
                      }
                }
              />
            </div>
          </div>
          {onCancelUpload && (
            <button
              type="button"
              className={styles.uploadCancelBtn}
              onClick={onCancelUpload}
            >
              Отменить загрузку
            </button>
          )}
        </div>
      )}

      {replyTo && (
        <div className={styles.replyBar}>
          <div className={styles.replyBarAccent} />
          <div className={styles.replyBarBody}>
            <div className={styles.replyBarUser}>
              {resolveIdentityLabel(replyTo, "user")}
            </div>
            <div className={styles.replyBarText}>{replyTo.content}</div>
          </div>
          <button
            type="button"
            className={styles.replyBarClose}
            onClick={onCancelReply}
            aria-label="Отменить ответ"
          >
            <IconClose />
          </button>
        </div>
      )}

      {hasQueuedFiles && (
        <div className={styles.previewWrap}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>
              Вложения: {pendingFiles.length}
            </span>
            {onClearPendingFiles && !uploading && (
              <button
                type="button"
                className={styles.previewClearBtn}
                onClick={onClearPendingFiles}
              >
                Очистить
              </button>
            )}
          </div>
          <div className={styles.previewList}>
            {previewItems.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className={styles.previewItem}
              >
                {item.url && item.file.type.startsWith("image/") && (
                  <img
                    className={styles.previewThumb}
                    src={item.url}
                    alt={item.file.name}
                  />
                )}
                {item.url && item.file.type.startsWith("video/") && (
                  <video
                    className={styles.previewThumb}
                    src={item.url}
                    controls
                    preload="metadata"
                    playsInline
                  />
                )}
                {!item.url && (
                  <div className={styles.previewFileBadge}>
                    {item.file.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className={styles.previewFileName} title={item.file.name}>
                  {item.file.name}
                </span>
                {onRemovePendingFile && !uploading && (
                  <button
                    type="button"
                    className={styles.previewRemoveBtn}
                    onClick={() => onRemovePendingFile(index)}
                    aria-label={`Удалить ${item.file.name}`}
                  >
                    <IconClose />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.inputRow}>
        {onAttach && (
          <>
            <button
              type="button"
              className={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Прикрепить файл"
              data-testid="chat-attach-button"
              disabled={disabled || uploading || rateLimitActive}
            >
              <IconAttach />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className={styles.fileInput}
              multiple
              onChange={handleFileChange}
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          className={styles.textArea}
          data-testid="chat-message-input"
          value={draft}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение..."
          aria-label="Сообщение"
          rows={1}
          disabled={disabled || rateLimitActive || uploading}
        />

        <button
          type="button"
          className={styles.sendBtn}
          data-testid="chat-send-button"
          onClick={onSend}
          disabled={!canSend || disabled || rateLimitActive || uploading}
          aria-label="Отправить сообщение"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}
