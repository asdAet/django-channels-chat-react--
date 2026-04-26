import type { AvatarCrop } from "../api/users";

const DEFAULT_AVATAR_OUTPUT_SIZE = 1024;
const JPEG_QUALITY = 0.92;
const JPEG_TYPES = new Set(["image/jpeg", "image/jpg"]);

type DecodedAvatarImage = ImageBitmap | HTMLImageElement;

type AvatarCropSourceRect = {
  x: number;
  y: number;
  size: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getDecodedImageSize = (image: DecodedAvatarImage) => ({
  width: image instanceof HTMLImageElement ? image.naturalWidth : image.width,
  height: image instanceof HTMLImageElement ? image.naturalHeight : image.height,
});

const closeDecodedImage = (image: DecodedAvatarImage) => {
  if ("close" in image) {
    image.close();
  }
};

const decodeAvatarImage = async (file: File): Promise<DecodedAvatarImage> => {
  if ("createImageBitmap" in window) {
    try {
      return await window.createImageBitmap(file, {
        imageOrientation: "from-image",
      });
    } catch {
      // HTMLImageElement остается штатным fallback для форматов,
      // которые конкретный браузер не умеет декодировать через ImageBitmap.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("avatar_crop_canvas_failed"));
      },
      type,
      quality,
    );
  });

const resolveAvatarOutputType = (file: File) =>
  JPEG_TYPES.has(file.type.toLowerCase()) ? "image/jpeg" : "image/png";

const replaceFileExtension = (fileName: string, outputType: string) => {
  const extension = outputType === "image/jpeg" ? "jpg" : "png";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}.${extension}`;
};

/**
 * Переводит нормализованный crop в квадратную область исходного изображения.
 * @param crop Нормализованная область выбора.
 * @param naturalWidth Ширина исходного изображения.
 * @param naturalHeight Высота исходного изображения.
 * @returns Квадратная область, которую можно безопасно отрисовать в canvas.
 */
const resolveAvatarCropSourceRect = (
  crop: AvatarCrop,
  naturalWidth: number,
  naturalHeight: number,
): AvatarCropSourceRect => {
  const cropWidth = clamp(crop.width * naturalWidth, 1, naturalWidth);
  const cropHeight = clamp(crop.height * naturalHeight, 1, naturalHeight);
  const sourceSize = Math.max(1, Math.min(cropWidth, cropHeight));
  const centerX = clamp(
    crop.x * naturalWidth + cropWidth / 2,
    0,
    naturalWidth,
  );
  const centerY = clamp(
    crop.y * naturalHeight + cropHeight / 2,
    0,
    naturalHeight,
  );

  return {
    x: clamp(centerX - sourceSize / 2, 0, Math.max(0, naturalWidth - sourceSize)),
    y: clamp(
      centerY - sourceSize / 2,
      0,
      Math.max(0, naturalHeight - sourceSize),
    ),
    size: sourceSize,
  };
};

/**
 * Создает новый файл аватарки из выбранного пользователем crop-а.
 * @param file Исходный загруженный файл.
 * @param crop Нормализованная область, выбранная в редакторе.
 * @returns Новый квадратный файл, который уже содержит выбранный кадр.
 */
export const cropAvatarImageFile = async (
  file: File,
  crop: AvatarCrop,
): Promise<File> => {
  const decodedImage = await decodeAvatarImage(file);

  try {
    const { width: naturalWidth, height: naturalHeight } =
      getDecodedImageSize(decodedImage);
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      throw new Error("avatar_crop_invalid_image_size");
    }

    const sourceRect = resolveAvatarCropSourceRect(
      crop,
      naturalWidth,
      naturalHeight,
    );
    const outputSize = Math.max(
      1,
      Math.round(Math.min(DEFAULT_AVATAR_OUTPUT_SIZE, sourceRect.size)),
    );
    const outputType = resolveAvatarOutputType(file);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const context = canvas.getContext("2d", {
      alpha: outputType !== "image/jpeg",
    });
    if (!context) {
      throw new Error("avatar_crop_context_failed");
    }

    if (outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, outputSize, outputSize);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      decodedImage,
      sourceRect.x,
      sourceRect.y,
      sourceRect.size,
      sourceRect.size,
      0,
      0,
      outputSize,
      outputSize,
    );

    const blob = await canvasToBlob(canvas, outputType, JPEG_QUALITY);
    return new File([blob], replaceFileExtension(file.name, outputType), {
      type: blob.type || outputType,
      lastModified: Date.now(),
    });
  } finally {
    closeDecodedImage(decodedImage);
  }
};
