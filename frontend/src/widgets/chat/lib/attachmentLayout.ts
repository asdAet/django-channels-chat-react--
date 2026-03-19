import type { Attachment } from "../../../entities/message/types";
import {
  isImageAttachment,
  resolveImagePreviewUrl,
} from "../../../shared/lib/attachmentMedia";

/**
 * Описывает структуру данных `AttachmentRenderItem`.
 */
export type AttachmentRenderItem = {
  attachment: Attachment;
  isImage: boolean;
  imageSrc: string | null;
};

/**
 * Описывает структуру данных `ImageAttachmentRenderItem`.
 */
export type ImageAttachmentRenderItem = {
  attachment: Attachment;
  imageSrc: string;
};

/**
 * Описывает структуру данных `AttachmentBuckets`.
 */
export type AttachmentBuckets = {
  images: ImageAttachmentRenderItem[];
  visibleImages: ImageAttachmentRenderItem[];
  hiddenImageCount: number;
  others: AttachmentRenderItem[];
};

/**
 * Описывает структуру данных `MediaGridVariant`.
 */
export type MediaGridVariant = "single" | "two" | "three" | "four" | "many";

/**
 * Нормализует visible image limit.
 * @param value Входное значение для преобразования.
 * @returns Нормализованное значение после обработки входа.
 */

const normalizeVisibleImageLimit = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
};

/**
 * Формирует attachment render items.
 * @param attachments Список вложений, переданных в текущую операцию.
 * @returns Сформированное значение для дальнейшего использования.
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
 * Делит вложения на изображения и прочие файлы.
 * @param items Список элементов для обработки.
 * @param maxVisibleImages Список `maxVisibleImages`, который обрабатывается функцией.

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

  const visibleImages = images.slice(
    0,
    normalizeVisibleImageLimit(maxVisibleImages),
  );

  return {
    images,
    visibleImages,
    hiddenImageCount: images.length - visibleImages.length,
    others,
  };
};

/**
 * Определяет вариант сетки изображений по количеству элементов.
 * @param count Числовой параметр `count`, ограничивающий объем данных.
 * @returns Разрешенное значение с учетом fallback-логики.
 */

export const resolveMediaGridVariant = (count: number): MediaGridVariant => {
  if (count <= 1) return "single";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  return "many";
};

/**
 * Вычисляет ограниченное соотношение сторон изображения.
 * @param attachment Аргумент `attachment` текущего вызова.
 * @returns Разрешенное значение с учетом fallback-логики.
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