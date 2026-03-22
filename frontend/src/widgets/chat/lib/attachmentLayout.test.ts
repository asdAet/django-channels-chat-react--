import { describe, expect, it } from "vitest";

import type { Attachment } from "../../../entities/message/types";
import {
  buildAttachmentRenderItems,
  resolveImageAspectRatio,
  resolveMediaGridVariant,
  resolveMediaTilePlacement,
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

    expect(buckets.images.map((item) => item.attachment.id)).toEqual([
      1, 3,
    ]);
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

  it("resolves media grid variants by image count", () => {
    expect(resolveMediaGridVariant(1)).toBe("single");
    expect(resolveMediaGridVariant(2)).toBe("two");
    expect(resolveMediaGridVariant(3)).toBe("three");
    expect(resolveMediaGridVariant(4)).toBe("four");
    expect(resolveMediaGridVariant(7)).toBe("many");
  });

  it("clamps single-image aspect ratio to safe bounds", () => {
    expect(
      resolveImageAspectRatio(makeAttachment({ width: 4000, height: 600 })),
    ).toBeCloseTo(1.8, 5);
    expect(
      resolveImageAspectRatio(makeAttachment({ width: 200, height: 2000 })),
    ).toBeCloseTo(0.62, 5);
  });

  it("expands the last tile for counts that would otherwise leave the bottom-right corner empty", () => {
    expect(resolveMediaTilePlacement(5, 4)).toEqual({ gridColumn: "span 2" });
    expect(resolveMediaTilePlacement(7, 6)).toEqual({ gridColumn: "1 / -1" });
    expect(resolveMediaTilePlacement(8, 7)).toEqual({ gridColumn: "span 2" });
    expect(resolveMediaTilePlacement(10, 9)).toEqual({ gridColumn: "1 / -1" });
    expect(resolveMediaTilePlacement(6, 5)).toEqual({});
  });
});
