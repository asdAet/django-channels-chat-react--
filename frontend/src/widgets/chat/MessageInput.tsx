import {
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  Fragment,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { UploadProgress } from "../../domain/interfaces/IApiService";
import type { Message } from "../../entities/message/types";
import {
  CUSTOM_EMOJI_CLIPBOARD_MIME,
  CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE,
  type CustomEmoji,
  CustomEmojiNode,
  deleteCustomEmojiDraftSelection,
  getCustomEmojiDraftLength,
  getCustomEmojiDraftSelection,
  hasCustomEmojiPacks,
  parseCustomEmojiClipboardHtml,
  parseCustomEmojiText,
  replaceCustomEmojiDraftSelection,
  serializeCustomEmojiRoot,
  serializeCustomEmojiSelection,
  setCustomEmojiDraftSelection,
  writeCustomEmojiClipboardData,
} from "../../shared/customEmoji";
import { resolveIdentityLabel } from "../../shared/lib/userIdentity";
import styles from "../../styles/chat/MessageInput.module.css";
import { TelegramEmojiPicker } from "./TelegramEmojiPicker";

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

const IconEmoji = () => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

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

const freezeVideoPreviewPlayback = (
  event: SyntheticEvent<HTMLVideoElement>,
): void => {
  const video = event.currentTarget;

  try {
    video.pause();
    video.currentTime = 0;
  } catch {
    // Ignore preview-only media cleanup failures.
  }
};

const DEFAULT_PLACEHOLDER = "Сообщение...";

type DraftSelection = {
  start: number;
  end: number;
};

type DraftDeleteGranularity = "character" | "word";

type DraftPart = ReturnType<typeof parseCustomEmojiText>[number];

type DecoratedDraftPart = {
  index: number;
  part: DraftPart;
  visualEnd: number;
  visualStart: number;
};

const decorateDraftParts = (parts: DraftPart[]): DecoratedDraftPart[] => {
  let visualCursor = 0;

  return parts.map((part, index) => {
    const visualStart = visualCursor;
    visualCursor += part.type === "emoji" ? 1 : part.value.length;

    return {
      index,
      part,
      visualEnd: visualCursor,
      visualStart,
    };
  });
};

const renderTextDraftPart = (value: string, keyPrefix: string) =>
  value.split("\n").flatMap((segment, segmentIndex, segments) => {
    const nodes = [];
    const isTrailingLineBreak =
      segmentIndex === segments.length - 2 && segments.at(-1) === "";

    if (segment.length > 0) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${segmentIndex}`}>{segment}</Fragment>,
      );
    }

    if (segmentIndex < segments.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${segmentIndex}`} />);

      if (isTrailingLineBreak) {
        nodes.push(
          <span
            key={`${keyPrefix}-sentinel-${segmentIndex}`}
            aria-hidden="true"
            className={styles.editorLineBreakSentinel}
            contentEditable={false}
            suppressContentEditableWarning={true}
            {...{ [CUSTOM_EMOJI_EDITOR_SENTINEL_ATTRIBUTE]: "true" }}
          >
            {"\u200B"}
          </span>,
        );
      }
    }

    return nodes;
  });

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
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingSelectionRef = useRef<DraftSelection | null>(null);
  const restoreSelectionRef = useRef(false);
  const focusEditorAfterSyncRef = useRef(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [editorSelection, setEditorSelection] =
    useState<DraftSelection | null>(null);

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
  const composerControlsDisabled = Boolean(
    disabled || uploading || rateLimitActive,
  );
  const customEmojiEnabled = hasCustomEmojiPacks();
  const draftParts = useMemo(() => parseCustomEmojiText(draft), [draft]);

  const getFallbackSelection = useCallback(
    () => {
      const draftLength = getCustomEmojiDraftLength(draft);
      return {
        start: draftLength,
        end: draftLength,
      };
    },
    [draft],
  );

  const syncDraftSelection = useCallback(
    (focusEditor: boolean) => {
      const editor = editorRef.current;
      if (!editor) {
        restoreSelectionRef.current = false;
        focusEditorAfterSyncRef.current = false;
        return;
      }

      const selection = pendingSelectionRef.current ?? getFallbackSelection();

      if (focusEditor) {
        editor.focus();
      }

      setCustomEmojiDraftSelection(editor, selection);
      pendingSelectionRef.current = selection;
      setEditorSelection(selection);
      restoreSelectionRef.current = false;
      focusEditorAfterSyncRef.current = false;
    },
    [getFallbackSelection],
  );

  const captureEditorSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      pendingSelectionRef.current = getFallbackSelection();
      return pendingSelectionRef.current;
    }

    pendingSelectionRef.current =
      getCustomEmojiDraftSelection(editor) ?? getFallbackSelection();
    setEditorSelection(pendingSelectionRef.current);
    return pendingSelectionRef.current;
  }, [getFallbackSelection]);

  const commitDraftChange = useCallback(
    (
      nextDraft: string,
      nextSelection: { start: number; end: number },
      focusEditor: boolean,
    ) => {
      pendingSelectionRef.current = nextSelection;
      setEditorSelection(nextSelection);
      restoreSelectionRef.current = true;
      focusEditorAfterSyncRef.current = focusEditor;
      onDraftChange(nextDraft);
      onTyping?.();
    },
    [onDraftChange, onTyping],
  );

  const replaceEditorSelection = useCallback(
    (insertion: string, focusEditor = true) => {
      const selection =
        captureEditorSelection() ??
        pendingSelectionRef.current ??
        getFallbackSelection();
      const { nextSelection, nextValue } = replaceCustomEmojiDraftSelection(
        draft,
        selection,
        insertion,
      );
      commitDraftChange(nextValue, nextSelection, focusEditor);
    },
    [captureEditorSelection, commitDraftChange, draft, getFallbackSelection],
  );

  const deleteEditorSelection = useCallback(
    (
      direction: "backward" | "forward",
      granularity: DraftDeleteGranularity = "character",
    ) => {
      const selection =
        captureEditorSelection() ??
        pendingSelectionRef.current ??
        getFallbackSelection();
      const { nextSelection, nextValue } = deleteCustomEmojiDraftSelection(
        draft,
        selection,
        direction,
        granularity,
      );
      commitDraftChange(nextValue, nextSelection, true);
    },
    [captureEditorSelection, commitDraftChange, draft, getFallbackSelection],
  );

  useLayoutEffect(() => {
    if (!restoreSelectionRef.current) {
      return;
    }

    syncDraftSelection(focusEditorAfterSyncRef.current);
  }, [draft, syncDraftSelection]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) {
        return;
      }

      const selection = getCustomEmojiDraftSelection(editor);
      if (!selection) {
        return;
      }

      pendingSelectionRef.current = selection;
      setEditorSelection(selection);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    if (!composerControlsDisabled || !emojiPickerOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEmojiPickerOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [composerControlsDisabled, emojiPickerOpen]);

  const openFilePicker = useCallback(() => {
    const input = fileInputRef.current;
    if (!input || composerControlsDisabled) {
      return;
    }

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Fallback to click for browsers with partial showPicker support.
      }
    }

    input.click();
  }, [composerControlsDisabled]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files?.length) {
        return;
      }

      onAttach?.(Array.from(files));
      event.target.value = "";
    },
    [onAttach],
  );

  const handleEmojiToggle = useCallback(() => {
    if (!customEmojiEnabled || composerControlsDisabled) {
      return;
    }

    captureEditorSelection();
    setEmojiPickerOpen((open) => !open);
  }, [captureEditorSelection, composerControlsDisabled, customEmojiEnabled]);

  const writeClipboardPayload = useCallback(
    (event: ClipboardEvent<HTMLElement>, content: string) => {
      writeCustomEmojiClipboardData(event.clipboardData, content);
    },
    [],
  );

  const handleEditorInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      const nextDraft = serializeCustomEmojiRoot(event.currentTarget);
      const normalizedDraft =
        event.currentTarget.childNodes.length === 1 &&
        event.currentTarget.firstChild instanceof HTMLBRElement
          ? ""
          : nextDraft;
      const selection =
        getCustomEmojiDraftSelection(event.currentTarget) ??
        getFallbackSelection();

      commitDraftChange(normalizedDraft, selection, false);
    },
    [commitDraftChange, getFallbackSelection],
  );

  const handleEditorBeforeInput = useCallback(
    (event: FormEvent<HTMLDivElement>) => {
      if (composerControlsDisabled) {
        event.preventDefault();
        return;
      }

      const nativeEvent = event.nativeEvent as InputEvent;
      const inputType = nativeEvent.inputType;

      if (inputType === "insertParagraph" || inputType === "insertLineBreak") {
        event.preventDefault();
        replaceEditorSelection("\n");
        return;
      }

      if (inputType === "deleteContentBackward") {
        event.preventDefault();
        deleteEditorSelection("backward");
        return;
      }

      if (inputType === "deleteWordBackward") {
        event.preventDefault();
        deleteEditorSelection("backward", "word");
        return;
      }

      if (inputType === "deleteContentForward") {
        event.preventDefault();
        deleteEditorSelection("forward");
        return;
      }

      if (inputType === "deleteWordForward") {
        event.preventDefault();
        deleteEditorSelection("forward", "word");
      }
    },
    [composerControlsDisabled, deleteEditorSelection, replaceEditorSelection],
  );

  const handleEditorKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (composerControlsDisabled) {
        event.preventDefault();
        return;
      }

      if (event.nativeEvent.isComposing || event.key === "Process") {
        return;
      }

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        replaceEditorSelection(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteEditorSelection(
          "backward",
          event.ctrlKey || event.metaKey || event.altKey ? "word" : "character",
        );
        return;
      }

      if (event.key === "Delete") {
        event.preventDefault();
        deleteEditorSelection(
          "forward",
          event.ctrlKey || event.metaKey || event.altKey ? "word" : "character",
        );
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSend();
        return;
      }

      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        replaceEditorSelection("\n");
        return;
      }
    },
    [
      composerControlsDisabled,
      deleteEditorSelection,
      onSend,
      replaceEditorSelection,
    ],
  );

  const handleEditorPaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      if (composerControlsDisabled) {
        return;
      }

      const files = extractFilesFromClipboard(event.clipboardData);
      if (files.length > 0 && onAttach) {
        event.preventDefault();
        onAttach(files);
        return;
      }

      const clipboardCustomEmoji =
        event.clipboardData.getData(CUSTOM_EMOJI_CLIPBOARD_MIME) ?? "";
      const clipboardHtml = event.clipboardData.getData("text/html") ?? "";
      const clipboardText = event.clipboardData.getData("text/plain") ?? "";
      const nextContent =
        clipboardCustomEmoji ||
        parseCustomEmojiClipboardHtml(clipboardHtml) ||
        clipboardText;

      if (!nextContent) {
        return;
      }

      event.preventDefault();
      replaceEditorSelection(nextContent);
    },
    [composerControlsDisabled, onAttach, replaceEditorSelection],
  );

  const handleEditorCopy = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const selectedContent = serializeCustomEmojiSelection(event.currentTarget);
      if (!selectedContent) {
        return;
      }

      event.preventDefault();
      writeClipboardPayload(event, selectedContent);
    },
    [writeClipboardPayload],
  );

  const handleEditorCut = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      if (composerControlsDisabled) {
        return;
      }

      const selection = getCustomEmojiDraftSelection(event.currentTarget);
      const selectedContent = serializeCustomEmojiSelection(event.currentTarget);
      if (!selection || !selectedContent) {
        return;
      }

      event.preventDefault();
      writeClipboardPayload(event, selectedContent);

      const { nextSelection, nextValue } = replaceCustomEmojiDraftSelection(
        draft,
        selection,
        "",
      );
      commitDraftChange(nextValue, nextSelection, true);
    },
    [commitDraftChange, composerControlsDisabled, draft, writeClipboardPayload],
  );

  const handleCustomEmojiSelect = useCallback(
    (emoji: CustomEmoji) => {
      replaceEditorSelection(emoji.token);
      setEmojiPickerOpen(false);
    },
    [replaceEditorSelection],
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

  const selectedDraftRange =
    editorSelection && editorSelection.start !== editorSelection.end
      ? {
          start: Math.min(editorSelection.start, editorSelection.end),
          end: Math.max(editorSelection.start, editorSelection.end),
        }
      : null;
  const decoratedDraftParts = useMemo(
    () => decorateDraftParts(draftParts),
    [draftParts],
  );

  return (
    <div
      className={[styles.wrapper, rateLimitActive ? styles.blocked : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {rateLimitActive && (
        <div className={styles.rateLimitBanner} role="status" aria-live="polite">
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

      {emojiPickerOpen && customEmojiEnabled && (
        <TelegramEmojiPicker
          onSelect={handleCustomEmojiSelect}
          onClose={() => setEmojiPickerOpen(false)}
        />
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
                    preload="metadata"
                    muted
                    playsInline
                    disablePictureInPicture
                    disableRemotePlayback
                    aria-hidden="true"
                    tabIndex={-1}
                    onLoadedMetadata={freezeVideoPreviewPlayback}
                    onLoadedData={freezeVideoPreviewPlayback}
                    onCanPlay={freezeVideoPreviewPlayback}
                    onPlay={freezeVideoPreviewPlayback}
                  >
                    <track kind="captions" />
                  </video>
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
              onClick={openFilePicker}
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

        {customEmojiEnabled && (
          <button
            type="button"
            className={[
              styles.emojiToggleBtn,
              emojiPickerOpen ? styles.emojiToggleBtnActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onMouseDown={captureEditorSelection}
            onClick={handleEmojiToggle}
            aria-label="Emoji"
            aria-expanded={emojiPickerOpen}
            data-testid="chat-emoji-button"
            disabled={composerControlsDisabled}
          >
            <IconEmoji />
          </button>
        )}

        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Сообщение"
          aria-placeholder={DEFAULT_PLACEHOLDER}
          data-testid="chat-message-input"
          data-placeholder={DEFAULT_PLACEHOLDER}
          contentEditable={!composerControlsDisabled}
          suppressContentEditableWarning={true}
          spellCheck={true}
          className={[
            styles.editor,
            draft.length === 0 ? styles.editorEmpty : "",
            composerControlsDisabled ? styles.editorDisabled : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onBeforeInput={handleEditorBeforeInput}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onPaste={handleEditorPaste}
          onCopy={handleEditorCopy}
          onCut={handleEditorCut}
          onMouseUp={captureEditorSelection}
          onKeyUp={captureEditorSelection}
          onFocus={captureEditorSelection}
          onBlur={() => setEditorSelection(null)}
        >
          {decoratedDraftParts.map(({ index, part, visualEnd, visualStart }) => {
            if (part.type === "text") {
              return renderTextDraftPart(part.value, `text-${index}`);
            }

            const emojiSelected =
              selectedDraftRange !== null &&
              selectedDraftRange.start < visualEnd &&
              selectedDraftRange.end > visualStart;

            return (
              <CustomEmojiNode
                key={`${part.value.id}-${index}`}
                emoji={part.value}
                atomic={true}
                size={26}
                className={[
                  styles.editorCustomEmojiInline,
                  emojiSelected ? styles.editorCustomEmojiSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            );
          })}
        </div>

        <button
          type="button"
          className={styles.sendBtn}
          data-testid="chat-send-button"
          onClick={onSend}
          disabled={!canSend || composerControlsDisabled}
          aria-label="Отправить сообщение"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}
