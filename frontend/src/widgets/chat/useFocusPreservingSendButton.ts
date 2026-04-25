import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useRef,
} from "react";

type FocusableEditor = HTMLElement & {
  focus(options?: FocusOptions): void;
};

type UseFocusPreservingSendButtonOptions = {
  canSend: boolean;
  disabled: boolean;
  editorRef: RefObject<FocusableEditor | null>;
  onSend: () => void;
};

type SendButtonBindings = {
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerLeave: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onClick: () => void;
};

const isTouchPointer = (pointerType: string): boolean =>
  pointerType === "touch";

/**
 * Сохраняет фокус активного rich-text редактора во время touch-нажатия на
 * кнопку отправки. Мобильные браузеры закрывают клавиатуру, когда фокус уходит
 * с редактора на кнопку; отменяем только touch pointerdown и оставляем
 * стандартную click-активацию единственным путём отправки.
 */
export function useFocusPreservingSendButton({
  canSend,
  disabled,
  editorRef,
  onSend,
}: UseFocusPreservingSendButtonOptions): SendButtonBindings {
  const preservedTouchPointerIdRef = useRef<number | null>(null);
  const restoreEditorFocusOnClickRef = useRef(false);

  const resetPreservedTouch = useCallback(() => {
    preservedTouchPointerIdRef.current = null;
    restoreEditorFocusOnClickRef.current = false;
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const editor = editorRef.current;
      const shouldPreserveEditorFocus =
        isTouchPointer(event.pointerType) &&
        canSend &&
        !disabled &&
        editor !== null &&
        document.activeElement === editor;

      if (!shouldPreserveEditorFocus) {
        resetPreservedTouch();
        return;
      }

      preservedTouchPointerIdRef.current = event.pointerId;
      restoreEditorFocusOnClickRef.current = true;
      event.preventDefault();
    },
    [canSend, disabled, editorRef, resetPreservedTouch],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (preservedTouchPointerIdRef.current === event.pointerId) {
        resetPreservedTouch();
      }
    },
    [resetPreservedTouch],
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (preservedTouchPointerIdRef.current === event.pointerId) {
        resetPreservedTouch();
      }
    },
    [resetPreservedTouch],
  );

  const handleClick = useCallback(() => {
    const shouldRestoreEditorFocus = restoreEditorFocusOnClickRef.current;
    resetPreservedTouch();

    if (!canSend || disabled) {
      return;
    }

    onSend();

    if (shouldRestoreEditorFocus) {
      editorRef.current?.focus({ preventScroll: true });
    }
  }, [canSend, disabled, editorRef, onSend, resetPreservedTouch]);

  return {
    onPointerCancel: handlePointerCancel,
    onPointerDown: handlePointerDown,
    onPointerLeave: handlePointerLeave,
    onClick: handleClick,
  };
}
