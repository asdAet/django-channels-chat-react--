import type { Attachment } from "../../../entities/message/types";
import {
  isImageAttachment,
  resolveImagePreviewUrl,
} from "../../../shared/lib/attachmentMedia";

/**
 * Нормализованное вложение для рендера сообщения.
 */
export type AttachmentRenderItem = {
  attachment: Attachment;
  isImage: boolean;
  imageSrc: string | null;
};

/**
 * Изображение, которое гарантированно можно отрисовать в медиа-сетке.
 */
export type ImageAttachmentRenderItem = {
  attachment: Attachment;
  imageSrc: string;
};

/**
 * Результат разбиения вложений на изображения и остальные типы файлов.
 */
export type AttachmentBuckets = {
  images: ImageAttachmentRenderItem[];
  imageGroups: ImageAttachmentRenderItem[][];
  others: AttachmentRenderItem[];
};

/**
 * Геометрия одной плитки в telegram-подобной медиа-коллаже.
 */
export type MediaTileLayoutItem = {
  attachment: Attachment;
  imageSrc: string;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
};

/**
 * Итоговый layout медиа-коллажа.
 */
export type MediaTileLayout = {
  containerAspectRatio: number;
  items: MediaTileLayoutItem[];
};

type AttachmentSize = {
  width: number;
  height: number;
};

type MediaGeometry = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutAttempt = {
  lineCounts: number[];
  heights: number[];
};

const MAX_VISIBLE_IMAGE_ATTACHMENTS_FALLBACK = 1;
const GROUPED_LAYOUT_MAX_WIDTH = 1000;
const GROUPED_LAYOUT_MIN_WIDTH = 160;
const GROUPED_LAYOUT_SPACING = 3;
const GROUPED_IMAGE_MIN_ASPECT_RATIO = 0.6667;
const GROUPED_IMAGE_MAX_ASPECT_RATIO = 2.75;
const SINGLE_IMAGE_MIN_ASPECT_RATIO = 0.62;
const SINGLE_IMAGE_MAX_ASPECT_RATIO = 1.8;

/**
 * Нормализует лимит видимых изображений в группе.
 */
const normalizeVisibleImageLimit = (value: number): number => {
  if (!Number.isFinite(value)) {
    return MAX_VISIBLE_IMAGE_ATTACHMENTS_FALLBACK;
  }
  return Math.max(MAX_VISIBLE_IMAGE_ATTACHMENTS_FALLBACK, Math.floor(value));
};

/**
 * Возвращает исходный aspect ratio вложения либо безопасный fallback.
 */
const resolveAttachmentAspectRatio = (attachment: Attachment): number => {
  if (
    attachment.width &&
    attachment.height &&
    attachment.width > 0 &&
    attachment.height > 0
  ) {
    return attachment.width / attachment.height;
  }
  return 1;
};

/**
 * Возвращает нормализованный размер вложения для layout-вычислений.
 */
const resolveAttachmentSize = (attachment: Attachment): AttachmentSize => {
  if (
    attachment.width &&
    attachment.height &&
    attachment.width > 0 &&
    attachment.height > 0
  ) {
    return { width: attachment.width, height: attachment.height };
  }
  return { width: 1000, height: 1000 };
};

/**
 * Округляет числовое значение до целого пикселя layout-сетки.
 */
const roundValue = (value: number): number => Math.round(value);

/**
 * Ограничивает aspect ratio одиночного изображения безопасным диапазоном.
 */
export const resolveImageAspectRatio = (attachment: Attachment): number => {
  const ratio = resolveAttachmentAspectRatio(attachment);
  return Math.min(
    SINGLE_IMAGE_MAX_ASPECT_RATIO,
    Math.max(SINGLE_IMAGE_MIN_ASPECT_RATIO, ratio),
  );
};

/**
 * Разбивает длинную последовательность изображений на группы фиксированного размера.
 */
const chunkImageItems = (
  items: ImageAttachmentRenderItem[],
  maxPerGroup: number,
): ImageAttachmentRenderItem[][] => {
  const safeMaxPerGroup = normalizeVisibleImageLimit(maxPerGroup);
  const groups: ImageAttachmentRenderItem[][] = [];

  for (let index = 0; index < items.length; index += safeMaxPerGroup) {
    groups.push(items.slice(index, index + safeMaxPerGroup));
  }

  return groups;
};

/**
 * Готовит вложения для рендера и подбирает preview URL для изображений.
 */
export const buildAttachmentRenderItems = (
  attachments: Attachment[],
): AttachmentRenderItem[] =>
  attachments.map((attachment) => {
    const imageSrc = resolveImagePreviewUrl({
      url: attachment.url,
      thumbnailUrl: attachment.thumbnailUrl,
      contentType: attachment.contentType,
      fileName: attachment.originalFilename,
    });

    return {
      attachment,
      isImage: isImageAttachment(
        attachment.contentType,
        attachment.originalFilename,
      ),
      imageSrc,
    };
  });

/**
 * Делит вложения на группы изображений и остальные файлы.
 */
export const splitAttachmentRenderItems = (
  items: AttachmentRenderItem[],
  maxVisibleImages: number,
): AttachmentBuckets => {
  const images: ImageAttachmentRenderItem[] = [];
  const others: AttachmentRenderItem[] = [];

  for (const item of items) {
    if (item.isImage && item.imageSrc) {
      images.push({
        attachment: item.attachment,
        imageSrc: item.imageSrc,
      });
      continue;
    }
    others.push(item);
  }

  return {
    images,
    imageGroups: chunkImageItems(images, maxVisibleImages),
    others,
  };
};

/**
 * Классифицирует ratios по telegram-подобным типам: wide, narrow, square.
 */
const countProportions = (ratios: number[]): string =>
  ratios.map((ratio) => (ratio > 1.2 ? "w" : ratio < 0.8 ? "n" : "q")).join("");

const createGeometry = (
  index: number,
  x: number,
  y: number,
  width: number,
  height: number,
): MediaGeometry => ({
  index,
  x,
  y,
  width,
  height,
});

const layoutOne = (sizes: AttachmentSize[]): MediaGeometry[] => {
  const width = GROUPED_LAYOUT_MAX_WIDTH;
  const height = roundValue((sizes[0].height * width) / sizes[0].width);
  return [createGeometry(0, 0, 0, width, height)];
};

const layoutTwoTopBottom = (ratios: number[]): MediaGeometry[] => {
  const width = GROUPED_LAYOUT_MAX_WIDTH;
  const height = roundValue(
    Math.min(
      width / ratios[0],
      Math.min(
        width / ratios[1],
        (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) / 2,
      ),
    ),
  );

  return [
    createGeometry(0, 0, 0, width, height),
    createGeometry(1, 0, height + GROUPED_LAYOUT_SPACING, width, height),
  ];
};

const layoutTwoLeftRightEqual = (ratios: number[]): MediaGeometry[] => {
  const width = (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) / 2;
  const height = roundValue(
    Math.min(
      width / ratios[0],
      Math.min(width / ratios[1], GROUPED_LAYOUT_MAX_WIDTH),
    ),
  );

  return [
    createGeometry(0, 0, 0, width, height),
    createGeometry(1, width + GROUPED_LAYOUT_SPACING, 0, width, height),
  ];
};

const layoutTwoLeftRight = (ratios: number[]): MediaGeometry[] => {
  const minimalWidth = roundValue(GROUPED_LAYOUT_MIN_WIDTH * 1.5);
  const secondWidth = Math.min(
    roundValue(
      Math.max(
        0.4 * (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING),
        (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) /
          ratios[0] /
          (1 / ratios[0] + 1 / ratios[1]),
      ),
    ),
    GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING - minimalWidth,
  );
  const firstWidth =
    GROUPED_LAYOUT_MAX_WIDTH - secondWidth - GROUPED_LAYOUT_SPACING;
  const height = Math.min(
    GROUPED_LAYOUT_MAX_WIDTH,
    roundValue(Math.min(firstWidth / ratios[0], secondWidth / ratios[1])),
  );

  return [
    createGeometry(0, 0, 0, firstWidth, height),
    createGeometry(
      1,
      firstWidth + GROUPED_LAYOUT_SPACING,
      0,
      secondWidth,
      height,
    ),
  ];
};

const layoutThreeLeftAndOther = (ratios: number[]): MediaGeometry[] => {
  const firstHeight = GROUPED_LAYOUT_MAX_WIDTH;
  const thirdHeight = roundValue(
    Math.min(
      (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) / 2,
      (ratios[1] * (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING)) /
        (ratios[2] + ratios[1]),
    ),
  );
  const secondHeight = firstHeight - thirdHeight - GROUPED_LAYOUT_SPACING;
  const rightWidth = Math.max(
    GROUPED_LAYOUT_MIN_WIDTH,
    roundValue(
      Math.min(
        (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) / 2,
        Math.min(thirdHeight * ratios[2], secondHeight * ratios[1]),
      ),
    ),
  );
  const leftWidth = Math.min(
    roundValue(firstHeight * ratios[0]),
    GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING - rightWidth,
  );

  return [
    createGeometry(0, 0, 0, leftWidth, firstHeight),
    createGeometry(
      1,
      leftWidth + GROUPED_LAYOUT_SPACING,
      0,
      rightWidth,
      secondHeight,
    ),
    createGeometry(
      2,
      leftWidth + GROUPED_LAYOUT_SPACING,
      secondHeight + GROUPED_LAYOUT_SPACING,
      rightWidth,
      thirdHeight,
    ),
  ];
};

const layoutThreeTopAndOther = (ratios: number[]): MediaGeometry[] => {
  const firstWidth = GROUPED_LAYOUT_MAX_WIDTH;
  const firstHeight = roundValue(
    Math.min(
      firstWidth / ratios[0],
      (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) * 0.66,
    ),
  );
  const secondWidth = (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) / 2;
  const secondHeight = Math.min(
    GROUPED_LAYOUT_MAX_WIDTH - firstHeight - GROUPED_LAYOUT_SPACING,
    roundValue(Math.min(secondWidth / ratios[1], secondWidth / ratios[2])),
  );
  const thirdWidth = firstWidth - secondWidth - GROUPED_LAYOUT_SPACING;

  return [
    createGeometry(0, 0, 0, firstWidth, firstHeight),
    createGeometry(
      1,
      0,
      firstHeight + GROUPED_LAYOUT_SPACING,
      secondWidth,
      secondHeight,
    ),
    createGeometry(
      2,
      secondWidth + GROUPED_LAYOUT_SPACING,
      firstHeight + GROUPED_LAYOUT_SPACING,
      thirdWidth,
      secondHeight,
    ),
  ];
};

const layoutFourTopAndOther = (ratios: number[]): MediaGeometry[] => {
  const width = GROUPED_LAYOUT_MAX_WIDTH;
  const topHeight = roundValue(
    Math.min(
      width / ratios[0],
      (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) * 0.66,
    ),
  );
  const rowHeight = roundValue(
    (GROUPED_LAYOUT_MAX_WIDTH - 2 * GROUPED_LAYOUT_SPACING) /
      (ratios[1] + ratios[2] + ratios[3]),
  );
  const leftWidth = Math.max(
    GROUPED_LAYOUT_MIN_WIDTH,
    roundValue(
      Math.min(
        (GROUPED_LAYOUT_MAX_WIDTH - 2 * GROUPED_LAYOUT_SPACING) * 0.4,
        rowHeight * ratios[1],
      ),
    ),
  );
  const rightWidth = roundValue(
    Math.max(
      Math.max(
        GROUPED_LAYOUT_MIN_WIDTH,
        (GROUPED_LAYOUT_MAX_WIDTH - 2 * GROUPED_LAYOUT_SPACING) * 0.33,
      ),
      rowHeight * ratios[3],
    ),
  );
  const middleWidth =
    width - leftWidth - rightWidth - 2 * GROUPED_LAYOUT_SPACING;
  const bottomHeight = Math.min(
    GROUPED_LAYOUT_MAX_WIDTH - topHeight - GROUPED_LAYOUT_SPACING,
    rowHeight,
  );

  return [
    createGeometry(0, 0, 0, width, topHeight),
    createGeometry(
      1,
      0,
      topHeight + GROUPED_LAYOUT_SPACING,
      leftWidth,
      bottomHeight,
    ),
    createGeometry(
      2,
      leftWidth + GROUPED_LAYOUT_SPACING,
      topHeight + GROUPED_LAYOUT_SPACING,
      middleWidth,
      bottomHeight,
    ),
    createGeometry(
      3,
      leftWidth + middleWidth + 2 * GROUPED_LAYOUT_SPACING,
      topHeight + GROUPED_LAYOUT_SPACING,
      rightWidth,
      bottomHeight,
    ),
  ];
};

const layoutFourLeftAndOther = (ratios: number[]): MediaGeometry[] => {
  const height = GROUPED_LAYOUT_MAX_WIDTH;
  const leftWidth = roundValue(
    Math.min(
      height * ratios[0],
      (GROUPED_LAYOUT_MAX_WIDTH - GROUPED_LAYOUT_SPACING) * 0.6,
    ),
  );
  const rightWidth = roundValue(
    (GROUPED_LAYOUT_MAX_WIDTH - 2 * GROUPED_LAYOUT_SPACING) /
      (1 / ratios[1] + 1 / ratios[2] + 1 / ratios[3]),
  );
  const topHeight = roundValue(rightWidth / ratios[1]);
  const middleHeight = roundValue(rightWidth / ratios[2]);
  const bottomHeight =
    height - topHeight - middleHeight - 2 * GROUPED_LAYOUT_SPACING;
  const stackWidth = Math.max(
    GROUPED_LAYOUT_MIN_WIDTH,
    Math.min(
      GROUPED_LAYOUT_MAX_WIDTH - leftWidth - GROUPED_LAYOUT_SPACING,
      rightWidth,
    ),
  );

  return [
    createGeometry(0, 0, 0, leftWidth, height),
    createGeometry(
      1,
      leftWidth + GROUPED_LAYOUT_SPACING,
      0,
      stackWidth,
      topHeight,
    ),
    createGeometry(
      2,
      leftWidth + GROUPED_LAYOUT_SPACING,
      topHeight + GROUPED_LAYOUT_SPACING,
      stackWidth,
      middleHeight,
    ),
    createGeometry(
      3,
      leftWidth + GROUPED_LAYOUT_SPACING,
      topHeight + middleHeight + 2 * GROUPED_LAYOUT_SPACING,
      stackWidth,
      bottomHeight,
    ),
  ];
};

const cropRatios = (ratios: number[], averageRatio: number): number[] =>
  ratios.map((ratio) => {
    if (averageRatio > 1.1) {
      return Math.min(GROUPED_IMAGE_MAX_ASPECT_RATIO, Math.max(1, ratio));
    }
    return Math.min(1, Math.max(GROUPED_IMAGE_MIN_ASPECT_RATIO, ratio));
  });

const buildComplexLayout = (
  ratios: number[],
  averageRatio: number,
): MediaGeometry[] => {
  const croppedRatios = cropRatios(ratios, averageRatio);
  const count = croppedRatios.length;
  const maxHeight = (GROUPED_LAYOUT_MAX_WIDTH * 4) / 3;
  const attempts: LayoutAttempt[] = [];

  const multiHeight = (offset: number, rowCount: number): number => {
    const sum = croppedRatios
      .slice(offset, offset + rowCount)
      .reduce((value, ratio) => value + ratio, 0);
    return (
      (GROUPED_LAYOUT_MAX_WIDTH - (rowCount - 1) * GROUPED_LAYOUT_SPACING) / sum
    );
  };

  const pushAttempt = (lineCounts: number[]) => {
    let offset = 0;
    const heights = lineCounts.map((lineCount) => {
      const height = multiHeight(offset, lineCount);
      offset += lineCount;
      return height;
    });
    attempts.push({ lineCounts, heights });
  };

  for (let first = 1; first < count; first += 1) {
    const second = count - first;
    if (first > 3 || second > 3) {
      continue;
    }
    pushAttempt([first, second]);
  }

  for (let first = 1; first < count - 1; first += 1) {
    for (let second = 1; second < count - first; second += 1) {
      const third = count - first - second;
      if (first > 3 || second > (averageRatio < 0.85 ? 4 : 3) || third > 3) {
        continue;
      }
      pushAttempt([first, second, third]);
    }
  }

  for (let first = 1; first < count - 1; first += 1) {
    for (let second = 1; second < count - first; second += 1) {
      for (let third = 1; third < count - first - second; third += 1) {
        const fourth = count - first - second - third;
        if (first > 3 || second > 3 || third > 3 || fourth > 3) {
          continue;
        }
        pushAttempt([first, second, third, fourth]);
      }
    }
  }

  let optimalAttempt: LayoutAttempt | null = null;
  let optimalDiff = Number.POSITIVE_INFINITY;

  for (const attempt of attempts) {
    const totalHeight =
      attempt.heights.reduce((value, height) => value + height, 0) +
      GROUPED_LAYOUT_SPACING * (attempt.heights.length - 1);
    const minLineHeight = Math.min(...attempt.heights);
    const bad1 = minLineHeight < GROUPED_LAYOUT_MIN_WIDTH ? 1.5 : 1;
    const bad2 = attempt.lineCounts.some(
      (count, index) => index > 0 && attempt.lineCounts[index - 1] > count,
    )
      ? 1.5
      : 1;
    const diff = Math.abs(totalHeight - maxHeight) * bad1 * bad2;

    if (!optimalAttempt || diff < optimalDiff) {
      optimalAttempt = attempt;
      optimalDiff = diff;
    }
  }

  if (!optimalAttempt) {
    return [];
  }

  const geometries: MediaGeometry[] = Array.from(
    { length: count },
    (_, index) => createGeometry(index, 0, 0, 0, 0),
  );

  let index = 0;
  let y = 0;
  optimalAttempt.lineCounts.forEach((columnCount, rowIndex) => {
    const lineHeight = optimalAttempt!.heights[rowIndex];
    const height = roundValue(lineHeight);
    let x = 0;

    for (let column = 0; column < columnCount; column += 1) {
      const ratio = croppedRatios[index];
      const width =
        column === columnCount - 1
          ? GROUPED_LAYOUT_MAX_WIDTH - x
          : roundValue(ratio * lineHeight);
      geometries[index] = createGeometry(index, x, y, width, height);
      x += width + GROUPED_LAYOUT_SPACING;
      index += 1;
    }

    y += height + GROUPED_LAYOUT_SPACING;
  });

  return geometries;
};

/**
 * Вычисляет геометрию коллажа по модели, близкой к Telegram Desktop grouped layout.
 */
const layoutMediaGroup = (
  items: ImageAttachmentRenderItem[],
): MediaGeometry[] => {
  const sizes = items.map(({ attachment }) =>
    resolveAttachmentSize(attachment),
  );
  const ratios = sizes.map((size) => size.width / size.height);
  const count = ratios.length;
  const proportions = countProportions(ratios);
  const averageRatio = ratios.reduce((sum, ratio) => sum + ratio, 1) / count;
  const maxSizeRatio = 1;

  if (count === 0) {
    return [];
  }
  if (count === 1) {
    return layoutOne(sizes);
  }
  if (count >= 5 || ratios.some((ratio) => ratio > 2)) {
    return buildComplexLayout(ratios, averageRatio);
  }
  if (count === 2) {
    if (
      proportions === "ww" &&
      averageRatio > 1.4 * maxSizeRatio &&
      Math.abs(ratios[1] - ratios[0]) < 0.2
    ) {
      return layoutTwoTopBottom(ratios);
    }
    if (proportions === "ww" || proportions === "qq") {
      return layoutTwoLeftRightEqual(ratios);
    }
    return layoutTwoLeftRight(ratios);
  }
  if (count === 3) {
    return proportions[0] === "n"
      ? layoutThreeLeftAndOther(ratios)
      : layoutThreeTopAndOther(ratios);
  }
  return proportions[0] === "w"
    ? layoutFourTopAndOther(ratios)
    : layoutFourLeftAndOther(ratios);
};

/**
 * Строит итоговую геометрию для grouped media в сообщении.
 *
 * Layout сохраняет порядок изображений и ближе к Telegram, чем обычный CSS grid:
 * portrait и landscape кадры получают разные прямоугольники вместо равных колонок.
 */
export const buildMediaTileLayout = (
  items: ImageAttachmentRenderItem[],
): MediaTileLayout => {
  if (items.length === 0) {
    return {
      containerAspectRatio: 1,
      items: [],
    };
  }

  if (items.length === 1) {
    return {
      containerAspectRatio: resolveImageAspectRatio(items[0].attachment),
      items: [
        {
          attachment: items[0].attachment,
          imageSrc: items[0].imageSrc,
          leftPercent: 0,
          topPercent: 0,
          widthPercent: 100,
          heightPercent: 100,
        },
      ],
    };
  }

  const geometry = layoutMediaGroup(items);
  const containerHeight = Math.max(
    1,
    geometry.reduce(
      (maxValue, item) => Math.max(maxValue, item.y + item.height),
      0,
    ),
  );

  return {
    containerAspectRatio: GROUPED_LAYOUT_MAX_WIDTH / containerHeight,
    items: geometry.map((item) => ({
      attachment: items[item.index].attachment,
      imageSrc: items[item.index].imageSrc,
      leftPercent: (item.x / GROUPED_LAYOUT_MAX_WIDTH) * 100,
      topPercent: (item.y / containerHeight) * 100,
      widthPercent: (item.width / GROUPED_LAYOUT_MAX_WIDTH) * 100,
      heightPercent: (item.height / containerHeight) * 100,
    })),
  };
};
