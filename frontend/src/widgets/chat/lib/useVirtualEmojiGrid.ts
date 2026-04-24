import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type VirtualEmojiGridOptions = {
  gap?: number;
  itemCount: number;
  minCellSize?: number;
  overscanRows?: number;
  scrollRoot: HTMLElement | null;
};

type VirtualEmojiGridItem = {
  index: number;
  style: CSSProperties;
};

type VirtualEmojiGridState = {
  height: number;
  scrollTop: number;
  width: number;
};

const readPadding = (
  node: HTMLElement,
): {
  bottom: number;
  left: number;
  right: number;
  top: number;
} => {
  const style = window.getComputedStyle(node);

  return {
    bottom: Number.parseFloat(style.paddingBottom) || 0,
    left: Number.parseFloat(style.paddingLeft) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
    top: Number.parseFloat(style.paddingTop) || 0,
  };
};

const readGridState = (node: HTMLElement): VirtualEmojiGridState => {
  const padding = readPadding(node);

  return {
    height: Math.max(0, node.clientHeight - padding.top - padding.bottom),
    scrollTop: Math.max(0, node.scrollTop - padding.top),
    width: Math.max(0, node.clientWidth - padding.left - padding.right),
  };
};

export const useVirtualEmojiGrid = ({
  gap = 8,
  itemCount,
  minCellSize = 52,
  overscanRows = 1,
  scrollRoot,
}: VirtualEmojiGridOptions): {
  columnCount: number;
  items: VirtualEmojiGridItem[];
  totalHeight: number;
} => {
  const [gridState, setGridState] = useState<VirtualEmojiGridState>({
    height: 0,
    scrollTop: 0,
    width: 0,
  });

  useEffect(() => {
    const node = scrollRoot;
    if (!node) {
      return;
    }

    let animationFrame = 0;

    const update = () => {
      animationFrame = 0;
      setGridState(readGridState(node));
    };

    const scheduleUpdate = () => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(update);
    };

    update();
    node.addEventListener("scroll", scheduleUpdate, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(node);
    } else {
      window.addEventListener("resize", scheduleUpdate);
    }

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      node.removeEventListener("scroll", scheduleUpdate);
      resizeObserver?.disconnect();
      if (typeof ResizeObserver === "undefined") {
        window.removeEventListener("resize", scheduleUpdate);
      }
    };
  }, [scrollRoot]);

  return useMemo(() => {
    const width = gridState.width;
    const columnCount =
      width > 0
        ? Math.max(1, Math.floor((width + gap) / (minCellSize + gap)))
        : 1;
    const cellSize =
      width > 0
        ? (width - gap * (columnCount - 1)) / columnCount
        : minCellSize;
    const rowStride = cellSize + gap;
    const rowCount = Math.ceil(itemCount / columnCount);
    const totalHeight =
      rowCount > 0 ? rowCount * cellSize + (rowCount - 1) * gap : 0;

    if (itemCount === 0 || rowCount === 0) {
      return {
        columnCount,
        items: [],
        totalHeight,
      };
    }

    const firstVisibleRow = Math.floor(gridState.scrollTop / rowStride);
    const lastVisibleRow = Math.floor(
      (gridState.scrollTop + gridState.height) / rowStride,
    );
    const startRow = Math.max(0, firstVisibleRow - overscanRows);
    const endRow = Math.min(rowCount - 1, lastVisibleRow + overscanRows);
    const startIndex = startRow * columnCount;
    const endIndex = Math.min(itemCount, (endRow + 1) * columnCount);
    const items: VirtualEmojiGridItem[] = [];

    for (let index = startIndex; index < endIndex; index += 1) {
      const row = Math.floor(index / columnCount);
      const column = index % columnCount;

      items.push({
        index,
        style: {
          height: cellSize,
          left: column * rowStride,
          position: "absolute",
          top: row * rowStride,
          width: cellSize,
        },
      });
    }

    return {
      columnCount,
      items,
      totalHeight,
    };
  }, [
    gap,
    gridState.height,
    gridState.scrollTop,
    gridState.width,
    itemCount,
    minCellSize,
    overscanRows,
  ]);
};
