import { describe, expect, it } from "vitest";

import type { Attachment } from "../../../entities/message/types";
import {
  buildAttachmentRenderItems,
  buildMediaTileLayout,
  resolveImageAspectRatio,
  splitAttachmentRenderItems,
} from "./attachmentLayout";

const MAX_VISIBLE_IMAGE_ATTACHMENTS = 10;

const makeAttachment = (overrides: Partial<Attachment>): Attachment => ({
  id: overrides.id ?? 1,
  originalFilename: overrides.originalFilename ?? "file.bin",
  contentType: overrides.contentType ?? "application/octet-stream",
  fileSize: overrides.fileSize ?? 1,
  url: overrides.url ?? null,
  thumbnailUrl: overrides.thumbnailUrl ?? null,
  width: overrides.width ?? null,
  height: overrides.height ?? null,
});

describe("attachmentLayout", () => {
  it("keeps original attachment order when building image and non-image buckets", () => {
    const attachments: Attachment[] = [
      makeAttachment({
        id: 1,
        originalFilename: "first.png",
        contentType: "image/png",
        url: "/media/first.png",
      }),
      makeAttachment({
        id: 2,
        originalFilename: "voice.mp3",
        contentType: "audio/mpeg",
        url: "/media/voice.mp3",
      }),
      makeAttachment({
        id: 3,
        originalFilename: "second.png",
        contentType: "image/png",
        url: "/media/second.png",
      }),
      makeAttachment({
        id: 4,
        originalFilename: "doc.pdf",
        contentType: "application/pdf",
        url: "/media/doc.pdf",
      }),
    ];

    const buckets = splitAttachmentRenderItems(
      buildAttachmentRenderItems(attachments),
      MAX_VISIBLE_IMAGE_ATTACHMENTS,
    );

    expect(buckets.images.map((item) => item.attachment.id)).toEqual([1, 3]);
    expect(buckets.others.map((item) => item.attachment.id)).toEqual([2, 4]);
  });

  it("splits large image sets into consecutive groups without overflow tiles", () => {
    const attachments: Attachment[] = Array.from({
      length: MAX_VISIBLE_IMAGE_ATTACHMENTS + 2,
    }).map((_, index) =>
      makeAttachment({
        id: index + 1,
        originalFilename: `${index + 1}.png`,
        contentType: "image/png",
        url: `/media/${index + 1}.png`,
      }),
    );

    const buckets = splitAttachmentRenderItems(
      buildAttachmentRenderItems(attachments),
      MAX_VISIBLE_IMAGE_ATTACHMENTS,
    );

    expect(buckets.imageGroups).toHaveLength(2);
    expect(buckets.imageGroups[0]).toHaveLength(MAX_VISIBLE_IMAGE_ATTACHMENTS);
    expect(buckets.imageGroups[1]).toHaveLength(2);
  });

  it("clamps single-image aspect ratio to safe bounds", () => {
    expect(
      resolveImageAspectRatio(makeAttachment({ width: 4000, height: 600 })),
    ).toBeCloseTo(1.8, 5);
    expect(
      resolveImageAspectRatio(makeAttachment({ width: 200, height: 2000 })),
    ).toBeCloseTo(0.62, 5);
  });

  it("builds telegram-like collage geometry inside container bounds", () => {
    const attachments = buildAttachmentRenderItems([
      makeAttachment({
        id: 1,
        originalFilename: "1.png",
        contentType: "image/png",
        url: "/1.png",
        width: 720,
        height: 1280,
      }),
      makeAttachment({
        id: 2,
        originalFilename: "2.png",
        contentType: "image/png",
        url: "/2.png",
        width: 720,
        height: 1280,
      }),
      makeAttachment({
        id: 3,
        originalFilename: "3.png",
        contentType: "image/png",
        url: "/3.png",
        width: 1280,
        height: 720,
      }),
      makeAttachment({
        id: 4,
        originalFilename: "4.png",
        contentType: "image/png",
        url: "/4.png",
        width: 1280,
        height: 720,
      }),
      makeAttachment({
        id: 5,
        originalFilename: "5.png",
        contentType: "image/png",
        url: "/5.png",
        width: 1024,
        height: 1024,
      }),
    ])
      .filter((item) => item.isImage && item.imageSrc)
      .map((item) => ({
        attachment: item.attachment,
        imageSrc: item.imageSrc!,
      }));

    const layout = buildMediaTileLayout(attachments);

    expect(layout.items).toHaveLength(5);
    for (const item of layout.items) {
      expect(item.leftPercent).toBeGreaterThanOrEqual(0);
      expect(item.topPercent).toBeGreaterThanOrEqual(0);
      expect(item.widthPercent).toBeGreaterThan(0);
      expect(item.heightPercent).toBeGreaterThan(0);
      expect(item.leftPercent + item.widthPercent).toBeLessThanOrEqual(100.01);
      expect(item.topPercent + item.heightPercent).toBeLessThanOrEqual(100.01);
    }
  });

  it("keeps original image order in collage output", () => {
    const images = buildAttachmentRenderItems([
      makeAttachment({
        id: 1,
        originalFilename: "a.png",
        contentType: "image/png",
        url: "/a.png",
        width: 800,
        height: 600,
      }),
      makeAttachment({
        id: 2,
        originalFilename: "b.png",
        contentType: "image/png",
        url: "/b.png",
        width: 800,
        height: 600,
      }),
      makeAttachment({
        id: 3,
        originalFilename: "c.png",
        contentType: "image/png",
        url: "/c.png",
        width: 800,
        height: 600,
      }),
    ])
      .filter((item) => item.isImage && item.imageSrc)
      .map((item) => ({
        attachment: item.attachment,
        imageSrc: item.imageSrc!,
      }));

    const layout = buildMediaTileLayout(images);
    expect(layout.items.map((item) => item.attachment.id)).toEqual([1, 2, 3]);
  });
});
