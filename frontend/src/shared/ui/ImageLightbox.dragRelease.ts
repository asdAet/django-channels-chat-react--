/**
 * Сбрасывает флаг drag-release для desktop lightbox после завершения жеста.
 *
 * Возвращает `true`, только если действительно был drag на desktop-версии
 * изображения или видео. На мобильном layout и без движения указателя
 * функция ничего не меняет и возвращает `false`.
 */
export const consumePendingDesktopMediaDragRelease = ({
  isMobileLayout,
  currentKind,
  pointerMovedRef,
}: {
  isMobileLayout: boolean;
  currentKind: "image" | "video" | undefined;
  pointerMovedRef: { current: boolean };
}): boolean => {
  if (
    isMobileLayout ||
    (currentKind !== "image" && currentKind !== "video") ||
    !pointerMovedRef.current
  ) {
    return false;
  }

  pointerMovedRef.current = false;
  return true;
};
