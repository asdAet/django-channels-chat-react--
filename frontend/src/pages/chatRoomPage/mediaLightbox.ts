import type { Message } from "../../entities/message/types";
import { isImageAttachment, isVideoAttachment } from "../../shared/lib/attachmentMedia";
import type { ImageLightboxMediaItem } from "../../shared/ui/ImageLightbox";
import { preloadImageLightboxViews } from "../../shared/ui/ImageLightbox.loaders";
import { preloadLightboxVideoPlayerViews } from "../../shared/ui/LightboxVideoPlayer.loaders";

/**
 * Снимок lightbox-сессии, зафиксированный в момент открытия вложения.
 *
 * Открытый медиапросмотр не должен зависеть от последующих ререндеров списка
 * сообщений. Иначе во время прихода новых сообщений, read-receipt и других
 * обновлений чат может пересобрать список вложений, временно размонтировать
 * активный player и оставить stale playback-instance.
 */
export type ChatLightboxSession = {
  /**
   * Идентификатор вложения, с которого пользователь открыл просмотр.
   */
  attachmentId: number;
  /**
   * Зафиксированный плоский список медиаэлементов для текущего просмотра.
   */
  mediaItems: ImageLightboxMediaItem[];
  /**
   * Индекс стартового элемента внутри `mediaItems`.
   */
  initialIndex: number;
};

let chatLightboxRuntimePromise: Promise<void> | null = null;

const isMediaAttachment = (
  contentType: string,
  fileName: string,
): "image" | "video" | null => {
  if (isVideoAttachment(contentType, fileName)) {
    return "video";
  }

  if (isImageAttachment(contentType, fileName)) {
    return "image";
  }

  return null;
};

/**
 * Собирает плоский список медиа-вложений из сообщений комнаты для лайтбокса.
 * Дубликаты по `attachment.id` отбрасываются, чтобы лайтбокс не открывал один и тот же файл
 * несколько раз после дозагрузки истории.
 *
 * @param messages Сообщения текущей комнаты вместе с вложениями.
 * @returns Список изображений и видео в формате, который понимает lightbox-слой.
 */
export const buildChatLightboxMediaItems = (
  messages: Message[],
): ImageLightboxMediaItem[] => {
  const seenAttachmentIds = new Set<number>();

  return messages.flatMap((message) =>
    message.attachments.flatMap((attachment) => {
      const mediaKind = isMediaAttachment(
        attachment.contentType,
        attachment.originalFilename,
      );
      if (!mediaKind || !attachment.url || seenAttachmentIds.has(attachment.id)) {
        return [];
      }

      seenAttachmentIds.add(attachment.id);

      return [
        {
          src: attachment.url,
          previewSrc: attachment.thumbnailUrl,
          kind: mediaKind,
          alt: attachment.originalFilename,
          metadata: {
            attachmentId: attachment.id,
            fileName: attachment.originalFilename,
            contentType: attachment.contentType,
            fileSize: attachment.fileSize,
            sentAt: message.createdAt,
            width: attachment.width,
            height: attachment.height,
          },
        } satisfies ImageLightboxMediaItem,
      ];
    }),
  );
};

/**
 * Находит индекс конкретного вложения в уже подготовленном списке медиа для лайтбокса.
 *
 * @param mediaItems Список элементов, который показывает lightbox.
 * @param attachmentId Идентификатор вложения, с которого нужно открыть просмотр.
 * @returns Индекс элемента в массиве или `-1`, если вложение в списке не найдено.
 */
export const findLightboxMediaIndex = (
  mediaItems: ImageLightboxMediaItem[],
  attachmentId: number | null,
): number => {
  if (attachmentId === null) {
    return -1;
  }

  return mediaItems.findIndex(
    (item) => item.metadata.attachmentId === attachmentId,
  );
};

/**
 * Прогревает весь runtime медиапросмотрщика одним дедуплицированным запросом.
 *
 * Открытие медиа в чате должно идти через единый центральный viewer, как в
 * Telegram-подобной схеме `openInMediaView`. Viewer поднимается только один
 * раз, а его код прогревается заранее или по первому запросу открытия.
 */
export const preloadChatLightboxRuntime = (): Promise<void> => {
  if (!chatLightboxRuntimePromise) {
    chatLightboxRuntimePromise = Promise.all([
      preloadImageLightboxViews(),
      preloadLightboxVideoPlayerViews(),
    ]).then(() => undefined);
  }

  return chatLightboxRuntimePromise;
};

/**
 * Строит snapshot-сессию lightbox по текущему состоянию комнаты.
 *
 * Сессия фиксируется один раз при клике по вложению и дальше живет независимо
 * от live-обновлений списка сообщений. Это предотвращает ререндерные гонки,
 * когда открытый lightbox может пересобраться во время прихода новых данных.
 *
 * @param messages Текущая история комнаты вместе с вложениями.
 * @param attachmentId Идентификатор вложения, с которого начинается просмотр.
 * @returns Готовую snapshot-сессию или `null`, если вложение больше не найдено.
 */
export const buildChatLightboxSession = (
  messages: Message[],
  attachmentId: number,
): ChatLightboxSession | null => {
  const mediaItems = buildChatLightboxMediaItems(messages);
  const initialIndex = findLightboxMediaIndex(mediaItems, attachmentId);

  if (initialIndex < 0) {
    return null;
  }

  return {
    attachmentId,
    mediaItems,
    initialIndex,
  };
};
