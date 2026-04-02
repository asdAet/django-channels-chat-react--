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
