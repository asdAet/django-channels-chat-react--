import type { Message } from "../../entities/message/types";
import { isImageAttachment, isVideoAttachment } from "../../shared/lib/attachmentMedia";
import type { ImageLightboxMediaItem } from "../../shared/ui/ImageLightbox.types";

/**
 * Snapshot of the chat media gallery captured at the moment the user opens a
 * media attachment. The viewer keeps this snapshot stable across live rerenders.
 */
export type ChatLightboxSession = {
  attachmentId: number;
  mediaItems: ImageLightboxMediaItem[];
  initialIndex: number;
};

const resolveMediaKind = (
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

export const buildChatLightboxMediaItems = (
  messages: Message[],
): ImageLightboxMediaItem[] => {
  const seenAttachmentIds = new Set<number>();

  return messages.flatMap((message) =>
    message.attachments.flatMap((attachment) => {
      const kind = resolveMediaKind(
        attachment.contentType,
        attachment.originalFilename,
      );
      if (!kind || !attachment.url || seenAttachmentIds.has(attachment.id)) {
        return [];
      }

      seenAttachmentIds.add(attachment.id);

      return [
        {
          src: attachment.url,
          previewSrc: attachment.thumbnailUrl,
          downloadUrl: attachment.url,
          kind,
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
