import { useEffect } from "react";

import { useInfoPanel } from "../shared/layout/useInfoPanel";

/**
 * Описывает настраиваемые опции `Options`.
 */
type Options = {
  roomId?: string | null;
};

/**
 * Хук useKeyboardShortcuts управляет состоянием и побочными эффектами текущего сценария.
 */
export function useKeyboardShortcuts({ roomId }: Options = {}) {
  const { toggle, close, isOpen } = useInfoPanel();

  useEffect(() => {
    /**
     * Обрабатывает handler.
     * @param e DOM-событие, вызвавшее обработчик.
     */
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K → toggle search panel
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (roomId) {
          toggle("search", roomId);
        }
      }

      // Escape → close info panel
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [roomId, toggle, close, isOpen]);
}
