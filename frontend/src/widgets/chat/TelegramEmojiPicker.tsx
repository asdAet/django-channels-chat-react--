import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  type CustomEmoji,
  type CustomEmojiPack,
  type CustomEmojiPackSummary,
  CustomEmojiRenderer,
  getCustomEmojiPackSummaries,
  getRecentCustomEmojiPack,
  loadCustomEmojiPack,
  recordRecentCustomEmoji,
} from "../../shared/customEmoji";
import styles from "../../styles/chat/TelegramEmojiPicker.module.css";
import { useVirtualEmojiGrid } from "./lib/useVirtualEmojiGrid";

type Props = {
  onSelect: (emoji: CustomEmoji) => void;
  onClose: () => void;
  placement?: "composer" | "overlay";
};

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

const toPackSummary = (pack: CustomEmojiPack): CustomEmojiPackSummary => ({
  id: pack.id,
  name: pack.name,
  preview: pack.preview,
  emojiCount: pack.emojis.length,
});

const resolveInitialPackId = (packs: readonly CustomEmojiPackSummary[]): string =>
  packs[0]?.id ?? "";

const resetScrollPosition = (node: HTMLDivElement): void => {
  if (typeof node.scrollTo === "function") {
    node.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  node.scrollTop = 0;
};

const scrollActivePackIntoView = (node: HTMLDivElement): void => {
  const activeButton = node.querySelector<HTMLButtonElement>(
    'button[aria-pressed="true"]',
  );

  activeButton?.scrollIntoView({
    block: "nearest",
    inline: "center",
    behavior: "auto",
  });
};

export function TelegramEmojiPicker({
  onSelect,
  onClose,
  placement = "composer",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const recentPack = useMemo(() => getRecentCustomEmojiPack(), []);
  const packSummaries = useMemo(() => {
    const sourceSummaries = getCustomEmojiPackSummaries();
    return recentPack
      ? [toPackSummary(recentPack), ...sourceSummaries]
      : sourceSummaries;
  }, [recentPack]);
  const [activePackId, setActivePackId] = useState(() =>
    resolveInitialPackId(packSummaries),
  );
  const [loadedPacksById, setLoadedPacksById] = useState<
    Map<string, CustomEmojiPack>
  >(() => {
    const initialPacks = new Map<string, CustomEmojiPack>();
    if (recentPack) {
      initialPacks.set(recentPack.id, recentPack);
    }

    return initialPacks;
  });
  const [gridViewportRoot, setGridViewportRoot] =
    useState<HTMLDivElement | null>(null);
  const [footerViewportRoot, setFooterViewportRoot] =
    useState<HTMLDivElement | null>(null);
  const activePackIdValue = useMemo(() => {
    if (
      activePackId &&
      packSummaries.some((pack) => pack.id === activePackId)
    ) {
      return activePackId;
    }

    return packSummaries[0]?.id ?? "";
  }, [activePackId, packSummaries]);

  const activePackSummary = useMemo(
    () =>
      packSummaries.find((pack) => pack.id === activePackIdValue) ??
      packSummaries[0] ??
      null,
    [activePackIdValue, packSummaries],
  );
  const activePack = activePackSummary
    ? loadedPacksById.get(activePackSummary.id) ?? null
    : null;
  const packLoading = Boolean(activePackSummary && !activePack);
  const virtualGrid = useVirtualEmojiGrid({
    itemCount: activePack?.emojis.length ?? 0,
    scrollRoot: gridViewportRoot,
  });

  useEffect(() => {
    const grid = gridViewportRoot;
    if (!grid) {
      return;
    }

    resetScrollPosition(grid);
  }, [activePackId, gridViewportRoot]);

  useEffect(() => {
    if (!footerViewportRoot) {
      return;
    }

    scrollActivePackIntoView(footerViewportRoot);
  }, [activePackIdValue, footerViewportRoot]);

  useEffect(() => {
    let cancelled = false;

    if (!activePackSummary) {
      return () => {
        cancelled = true;
      };
    }

    if (activePack) {
      return () => {
        cancelled = true;
      };
    }

    void loadCustomEmojiPack(activePackSummary.id)
      .then((pack) => {
        if (cancelled) {
          return;
        }

        if (pack) {
          setLoadedPacksById((currentPacks) => {
            const nextPacks = new Map(currentPacks);
            nextPacks.set(pack.id, pack);
            return nextPacks;
          });
        }
      })
      .catch(() => {
        // Keep the current pack shell if a lazy pack index fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [activePack, activePackSummary]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!panelRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleSelect = (emoji: CustomEmoji) => {
    recordRecentCustomEmoji(emoji);
    onSelect(emoji);
    onClose();
  };

  const handleGridViewportRef = useCallback((node: HTMLDivElement | null) => {
    setGridViewportRoot(node);
  }, []);

  const handleFooterWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      const maxScrollLeft = node.scrollWidth - node.clientWidth;
      if (maxScrollLeft <= 0) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (delta === 0) {
        return;
      }

      const nextScrollLeft = Math.min(
        Math.max(node.scrollLeft + delta, 0),
        maxScrollLeft,
      );
      if (nextScrollLeft === node.scrollLeft) {
        return;
      }

      event.preventDefault();
      node.scrollLeft = nextScrollLeft;
    },
    [],
  );

  if (!activePackSummary && !packLoading) {
    return null;
  }

  return (
    <div
      className={[
        styles.shell,
        placement === "overlay" ? styles.shellOverlay : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-label="Панель кастомных эмоджи"
      >
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <strong className={styles.headerTitle}>
              {activePackSummary?.name ?? ""}
            </strong>
            <span className={styles.headerMeta}>
              {activePackSummary?.emojiCount ?? 0} эмоджи
            </span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть панель эмоджи"
          >
            <IconClose />
          </button>
        </div>

        <div ref={handleGridViewportRef} className={styles.gridScroller}>
          <div
            className={styles.grid}
            style={{ height: virtualGrid.totalHeight }}
          >
            {activePack
              ? virtualGrid.items.map(({ index, style }) => {
                  const emoji = activePack.emojis[index];
                  if (!emoji) {
                    return null;
                  }

                  return (
                    <button
                      key={emoji.id}
                      type="button"
                      className={styles.emojiButton}
                      style={style}
                      onClick={() => handleSelect(emoji)}
                      aria-label={emoji.label}
                      title={emoji.label}
                    >
                      <CustomEmojiRenderer
                        emoji={emoji}
                        size={40}
                        className={styles.emojiAnimation}
                        visibilityRoot={gridViewportRoot}
                        preloadMargin="0px"
                      />
                    </button>
                  );
                })
              : null}
          </div>
        </div>

        <div
          ref={setFooterViewportRoot}
          className={styles.footer}
          onWheel={handleFooterWheel}
          aria-label="Категории эмоджи"
        >
          {packSummaries.map((pack) => {
            const active = pack.id === activePackSummary?.id;
            return (
              <button
                key={pack.id}
                type="button"
                className={[
                  styles.packButton,
                  active ? styles.packButtonActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActivePackId(pack.id)}
                aria-label={`Пак ${pack.name}`}
                aria-pressed={active}
                title={pack.name}
              >
                <CustomEmojiRenderer
                  emoji={pack.preview}
                  size={28}
                  className={styles.packPreview}
                  visibilityRoot={footerViewportRoot}
                  preloadMargin="0px"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
