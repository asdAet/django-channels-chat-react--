import type { Attachment } from "../../../entities/message/types";
import {
  isImageAttachment,
  resolveImagePreviewUrl,
} from "../../../shared/lib/attachmentMedia";

/**
 * Нормализованное вложение для рендера в сообщении.
 */
export type AttachmentRenderItem = {
  attachment: Attachment;
  isImage: boolean;
  imageSrc: string | null;
};

/**
 * Изображение, которое точно можно отрисовать в медиа-сетке.
 */
export type ImageAttachmentRenderItem = {
  attachment: Attachment;
  imageSrc: string;
};

/**
 * Результат разбиения вложений:
 * - `images`: все картинки в исходном порядке
 * - `imageGroups`: картинки, разбитые на независимые группы по лимиту
 * - `others`: аудио, видео, документы и остальные файлы
 */
export type AttachmentBuckets = {
  images: ImageAttachmentRenderItem[];
  imageGroups: ImageAttachmentRenderItem[][];
  others: AttachmentRenderItem[];
};

/**
 * Вариант CSS-сетки для конкретного числа изображений внутри одной группы.
 */
export type MediaGridVariant = "single" | "two" | "three" | "four" | "many";

/**
 * Точечные правки placement для отдельных плиток в grid.
 */
export type MediaTilePlacement = {
  gridColumn?: string;
};

/**
 * Гарантирует, что лимит отображаемых изображений остаётся валидным числом >= 1.
 */
const normalizeVisibleImageLimit = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
};

/**
 * Разбивает длинную последовательность изображений на группы фиксированного размера.
 * Это позволяет показывать 11+ файлов как несколько отдельных сообщений-сеток,
 * а не прятать хвост в overflow-плитку.
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
 * Готовит вложения к рендеру:
 * определяет, является ли файл изображением, и подбирает preview URL.
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
 * Делит вложения на медиа-сетки и остальные файлы.
 * Большие пачки изображений режутся на группы, чтобы UI не оставлял
 * пустую нижнюю правую ячейку и не рисовал `+N` поверх последней картинки.
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
 * Выбирает шаблон сетки по размеру текущей группы изображений.
 */
export const resolveMediaGridVariant = (count: number): MediaGridVariant => {
  if (count <= 1) return "single";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  return "many";
};

/**
 * Для отдельных размеров группы расширяет последнюю плитку,
 * чтобы не оставлять пустой угол в правом нижнем углу сетки.
 */
export const resolveMediaTilePlacement = (
  count: number,
  index: number,
): MediaTilePlacement => {
  if (index !== count - 1) return {};

  switch (count) {
    case 5:
    case 8:
      return { gridColumn: "span 2" };
    case 7:
    case 10:
      return { gridColumn: "1 / -1" };
    default:
      return {};
  }
};

/**
 * Ограничивает aspect ratio одиночного изображения безопасным диапазоном,
 * чтобы очень узкие или очень широкие файлы не ломали bubble по высоте.
 */
export const resolveImageAspectRatio = (attachment: Attachment): number => {
  if (
    attachment.width &&
    attachment.height &&
    attachment.width > 0 &&
    attachment.height > 0
  ) {
    const ratio = attachment.width / attachment.height;
    return Math.min(1.8, Math.max(0.62, ratio));
  }
  return 1;
};
