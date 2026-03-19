import { type DragEvent, useCallback, useRef, useState } from "react";

import { isFileDragPayload } from "./utils";

/**
 * Описывает настраиваемые опции `Options`.
 */
type Options = {
  enabled: boolean;
  onFilesDrop: (files: File[]) => void;
};

/**
 * Описывает структуру данных `Bindings`.
 */
type Bindings = {
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

/**
 * Описывает результат операции `Result`.
 */
type Result = {
  active: boolean;
  bindings: Bindings;
  reset: () => void;
};

/**
 * Хук useFileDropZone управляет состоянием и побочными эффектами текущего сценария.
 * @returns Публичное состояние хука и его обработчики.
 */

export const useFileDropZone = ({ enabled, onFilesDrop }: Options): Result => {
  const [active, setActive] = useState(false);
  const dragDepthRef = useRef(0);

  const resetState = useCallback(() => {
    dragDepthRef.current = 0;
    setActive(false);
  }, []);

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled || !isFileDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current += 1;
      setActive(true);
    },
    [enabled],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled || !isFileDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      setActive(true);
    },
    [enabled],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled || !isFileDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setActive(false);
      }
    },
    [enabled],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!enabled || !isFileDragPayload(event.dataTransfer)) return;
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer?.files;
      resetState();
      if (!files || files.length === 0) return;
      onFilesDrop(Array.from(files));
    },
    [enabled, onFilesDrop, resetState],
  );

  return {
    active,
    bindings: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    reset: resetState,
  };
};
