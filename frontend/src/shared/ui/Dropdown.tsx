import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  offset?: number;
  wrapperClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  closeOnContentClick?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  marginTop: 4,
  zIndex: 50,
};

/**
 * React-компонент Dropdown отвечает за отрисовку и обработку UI-сценария.
 */
export function Dropdown({
  trigger,
  children,
  align = "left",
  offset = 4,
  wrapperClassName,
  triggerClassName,
  menuClassName,
  closeOnContentClick = true,
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        setOpen(false);
        return;
      }
      if (ref.current && !ref.current.contains(target)) {
        setOpen(false);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    const supportsPointer =
      typeof window !== "undefined" && "PointerEvent" in window;
    if (supportsPointer) {
      document.addEventListener("pointerdown", handlePointerDown);
    } else {
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("mousedown", handlePointerDown);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      if (supportsPointer) {
        document.removeEventListener("pointerdown", handlePointerDown);
      } else {
        document.removeEventListener("touchstart", handlePointerDown);
        document.removeEventListener("mousedown", handlePointerDown);
      }
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown, handlePointerDown]);

  return (
    <div
      ref={ref}
      className={wrapperClassName}
      data-open={open ? "true" : "false"}
      style={{ position: "relative", display: "inline-block" }}
    >
      <div
        className={triggerClassName}
        onClick={() => setOpen((prevOpen) => !prevOpen)}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={menuClassName}
          style={{
            ...menuStyle,
            marginTop: offset,
            [align === "right" ? "right" : "left"]: 0,
          }}
          onClick={closeOnContentClick ? () => setOpen(false) : undefined}
        >
          {children}
        </div>
      )}
    </div>
  );
}
