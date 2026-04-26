import type { CSSProperties } from "react";

import type { AvatarCrop } from "../api/users";

const EPSILON = 0.000001;
const ROUND_FACTOR = 1_000_000;

export const FULL_AVATAR_CROP: AvatarCrop = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

type AvatarCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AvatarCropMediaSize = {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToSix = (value: number) =>
  Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;

const resolveNaturalSize = (mediaSize: AvatarCropMediaSize | null) => {
  if (!mediaSize) return null;

  const naturalWidth = mediaSize.naturalWidth || mediaSize.width;
  const naturalHeight = mediaSize.naturalHeight || mediaSize.height;
  if (naturalWidth <= 0 || naturalHeight <= 0) return null;

  return { naturalWidth, naturalHeight };
};

const toRoundedNormalizedCrop = (
  areaPixels: AvatarCropArea,
  naturalWidth: number,
  naturalHeight: number,
): AvatarCrop => {
  let width = clamp(areaPixels.width / naturalWidth, EPSILON, 1);
  let height = clamp(areaPixels.height / naturalHeight, EPSILON, 1);
  let x = clamp(areaPixels.x / naturalWidth, 0, Math.max(0, 1 - width));
  let y = clamp(areaPixels.y / naturalHeight, 0, Math.max(0, 1 - height));

  width = clamp(roundToSix(width), EPSILON, 1);
  height = clamp(roundToSix(height), EPSILON, 1);
  x = clamp(roundToSix(x), 0, Math.max(0, 1 - width));
  y = clamp(roundToSix(y), 0, Math.max(0, 1 - height));

  if (x + width > 1) {
    x = Math.max(0, roundToSix(1 - width));
  }
  if (y + height > 1) {
    y = Math.max(0, roundToSix(1 - height));
  }

  return { x, y, width, height };
};

/**
 * Создает центральный квадратный crop для изображения.
 * @param mediaSize Размеры изображения из cropper-а.
 * @returns Нормализованная квадратная область без растяжения исходника.
 */
const buildCenteredAvatarCrop = (
  mediaSize: AvatarCropMediaSize | null,
): AvatarCrop => {
  const naturalSize = resolveNaturalSize(mediaSize);
  if (!naturalSize) return { ...FULL_AVATAR_CROP };

  const { naturalWidth, naturalHeight } = naturalSize;
  const side = Math.min(naturalWidth, naturalHeight);
  return toRoundedNormalizedCrop(
    {
      x: (naturalWidth - side) / 2,
      y: (naturalHeight - side) / 2,
      width: side,
      height: side,
    },
    naturalWidth,
    naturalHeight,
  );
};

/**
 * Преобразует пиксельную область cropper-а в нормализованный crop аватарки.
 * @param areaPixels Выбранная область в пикселях исходного изображения.
 * @param mediaSize Размеры изображения из cropper-а.
 * @returns Нормализованный crop с квадратной областью в пикселях исходника.
 */
export const buildAvatarCropFromArea = (
  areaPixels: AvatarCropArea | null,
  mediaSize: AvatarCropMediaSize | null,
): AvatarCrop => {
  const naturalSize = resolveNaturalSize(mediaSize);
  if (!naturalSize) return { ...FULL_AVATAR_CROP };
  if (!areaPixels) return buildCenteredAvatarCrop(mediaSize);

  const { naturalWidth, naturalHeight } = naturalSize;
  const safeWidth = clamp(areaPixels.width, EPSILON, naturalWidth);
  const safeHeight = clamp(areaPixels.height, EPSILON, naturalHeight);
  const side = Math.min(safeWidth, safeHeight, naturalWidth, naturalHeight);
  const centerX = clamp(areaPixels.x + safeWidth / 2, 0, naturalWidth);
  const centerY = clamp(areaPixels.y + safeHeight / 2, 0, naturalHeight);

  return toRoundedNormalizedCrop(
    {
      x: clamp(centerX - side / 2, 0, Math.max(0, naturalWidth - side)),
      y: clamp(centerY - side / 2, 0, Math.max(0, naturalHeight - side)),
      width: side,
      height: side,
    },
    naturalWidth,
    naturalHeight,
  );
};

/**
 * Нормализует avatar crop.
 * @param value Входное значение для преобразования.
 * @returns Нормализованное значение после обработки входа.
 */

export const normalizeAvatarCrop = (
  value?: AvatarCrop | null,
): AvatarCrop | null => {
  if (!value) return null;

  const { x, y, width, height } = value;
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }

  if (x < 0 || y < 0 || width <= 0 || height <= 0) {
    return null;
  }

  if (x >= 1 || y >= 1 || width > 1 || height > 1) {
    return null;
  }

  if (x + width > 1 + EPSILON || y + height > 1 + EPSILON) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

/**
 * Формирует avatar crop image style.
 *
 * @param crop Параметры обрезки изображения.
 *
 * @returns Сформированная структура данных.
 */

export const buildAvatarCropImageStyle = (crop: AvatarCrop): CSSProperties => ({
  width: `${100 / crop.width}%`,
  height: `${100 / crop.height}%`,
  left: `-${(crop.x / crop.width) * 100}%`,
  top: `-${(crop.y / crop.height) * 100}%`,
  objectFit: "fill",
  borderRadius: 0,
  maxWidth: "none",
});
