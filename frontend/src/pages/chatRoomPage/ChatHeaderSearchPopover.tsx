import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";

const MOBILE_BREAKPOINT_PX = 768;
const VIEWPORT_PADDING_PX = 12;
const MOBILE_SIDE_PADDING_PX = 8;
const VERTICAL_GAP_PX = 8;
const MIN_MAX_HEIGHT_PX = 140;

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  className: string;
  children: ReactNode;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Рендерит fixed-layer поповер поиска, привязанный к кнопке в header.
 *
 * @param props Входные параметры поповера поиска.
 * @returns Верхний слой поиска или `null`, если поиск закрыт.
 */
export function ChatHeaderSearchPopover({
  anchorRef,
  layerRef,
  isOpen,
  className,
  children,
}: Props) {
  const [positionStyle, setPositionStyle] = useState<CSSProperties>();

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined" || !anchorRef.current) {
      return;
    }

    const anchorRect = anchorRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobileViewport = viewportWidth <= MOBILE_BREAKPOINT_PX;
    const width = isMobileViewport
      ? Math.max(0, viewportWidth - MOBILE_SIDE_PADDING_PX * 2)
      : Math.min(420, Math.max(0, viewportWidth - VIEWPORT_PADDING_PX * 2));
    const maxTop = Math.max(
      VIEWPORT_PADDING_PX,
      viewportHeight - MIN_MAX_HEIGHT_PX - VIEWPORT_PADDING_PX,
    );
    const top = clamp(
      anchorRect.bottom + VERTICAL_GAP_PX,
      VIEWPORT_PADDING_PX,
      maxTop,
    );
    const left = isMobileViewport
      ? MOBILE_SIDE_PADDING_PX
      : clamp(
          anchorRect.right - width,
          VIEWPORT_PADDING_PX,
          Math.max(
            VIEWPORT_PADDING_PX,
            viewportWidth - width - VIEWPORT_PADDING_PX,
          ),
        );

    setPositionStyle({
      top,
      left,
      width,
      maxHeight: Math.max(
        MIN_MAX_HEIGHT_PX,
        viewportHeight - top - VIEWPORT_PADDING_PX,
      ),
      transformOrigin: isMobileViewport ? "top center" : "top right",
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={layerRef}
      className={className}
      style={positionStyle}
      data-testid="chat-header-search-layer"
    >
      {children}
    </div>
  );
}
