import type { Message } from "../../entities/message/types";
import { isImageAttachment, isVideoAttachment } from "../../shared/lib/attachmentMedia";
import type { ImageLightboxMediaItem } from "../../shared/ui/ImageLightbox";

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
