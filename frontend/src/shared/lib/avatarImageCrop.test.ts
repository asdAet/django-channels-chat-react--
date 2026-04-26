import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cropAvatarImageFile } from "./avatarImageCrop";

const drawImageMock = vi.fn();
const fillRectMock = vi.fn();
const closeMock = vi.fn();
const toBlobMock = vi.fn(
  (callback: BlobCallback, type?: string) =>
    callback(new Blob(["cropped"], { type: type || "image/png" })),
);
const getContextMock = vi.fn(() => ({
  drawImage: drawImageMock,
  fillRect: fillRectMock,
  imageSmoothingEnabled: false,
  imageSmoothingQuality: "low",
}));
const originalCreateElement = document.createElement.bind(document);
let createElementSpy: { mockRestore: () => void };

describe("cropAvatarImageFile", () => {
  beforeEach(() => {
    drawImageMock.mockClear();
    fillRectMock.mockClear();
    toBlobMock.mockClear();
    getContextMock.mockClear();
    closeMock.mockClear();
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName !== "canvas") {
          return originalCreateElement(tagName);
        }

        return {
          width: 0,
          height: 0,
          getContext: getContextMock,
          toBlob: toBlobMock,
        } as unknown as HTMLCanvasElement;
      });
    Object.defineProperty(window, "createImageBitmap", {
      configurable: true,
      writable: true,
      value: vi.fn(async () => ({
        width: 4000,
        height: 2000,
        close: closeMock,
      })),
    });
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    Reflect.deleteProperty(window, "createImageBitmap");
  });

  it("saves the selected crop into a new square avatar file", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    const cropped = await cropAvatarImageFile(file, {
      x: 0.25,
      y: 0,
      width: 0.5,
      height: 1,
    });

    expect(cropped.name).toBe("avatar.png");
    expect(cropped.type).toBe("image/png");
    expect(drawImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ width: 4000, height: 2000 }),
      1000,
      0,
      2000,
      2000,
      0,
      0,
      1024,
      1024,
    );
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the crop inside source bounds near image edges", async () => {
    const file = new File(["avatar"], "avatar.jpg", { type: "image/jpeg" });

    const cropped = await cropAvatarImageFile(file, {
      x: 0.92,
      y: 0.92,
      width: 0.08,
      height: 0.08,
    });

    expect(cropped.name).toBe("avatar.jpg");
    expect(cropped.type).toBe("image/jpeg");
    expect(fillRectMock).toHaveBeenCalledWith(0, 0, 160, 160);
    expect(drawImageMock).toHaveBeenCalledWith(
      expect.anything(),
      3760,
      1840,
      160,
      160,
      0,
      0,
      160,
      160,
    );
  });
});
