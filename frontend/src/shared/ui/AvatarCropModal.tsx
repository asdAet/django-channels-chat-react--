import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";

import styles from "../../styles/ui/AvatarCropModal.module.css";
import type { AvatarCrop } from "../api/users";
import { buildAvatarCropFromArea } from "../lib/avatarCrop";
import { Button } from "./Button";

/**
 * Описывает свойства модального редактора аватарки.
 */
type AvatarCropModalProps = {
  open: boolean;
  image: string | null;
  initialCrop?: AvatarCrop | null;
  applying?: boolean;
  onCancel: () => void;
  onApply: (crop: AvatarCrop) => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;

/**
 * Ограничивает число безопасным диапазоном.
 * @param value Проверяемое значение.
 * @param min Нижняя граница.
 * @param max Верхняя граница.
 * @returns Значение внутри заданных границ.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toInitialAreaPercentages = (crop?: AvatarCrop | null): Area | undefined =>
  crop
    ? {
        x: crop.x * 100,
        y: crop.y * 100,
        width: crop.width * 100,
        height: crop.height * 100,
      }
    : undefined;

/**
 * Рендерит модальное окно выбора круглой области аватарки.
 * @param props Свойства модального окна.
 */
export function AvatarCropModal({
  open,
  image,
  initialCrop = null,
  applying = false,
  onCancel,
  onApply,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<Area | null>(null);
  const mediaSizeRef = useRef<MediaSize | null>(null);

  useEffect(() => {
    croppedAreaPixelsRef.current = null;
    mediaSizeRef.current = null;
  }, [image]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !image) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Редактор аватарки"
    >
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Новая аватарка</h2>
            <p className={styles.subtitle}>
              Перемещайте изображение внутри круглой области.
            </p>
          </div>
        </div>

        <div className={styles.cropStage}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            initialCroppedAreaPercentages={toInitialAreaPercentages(
              initialCrop,
            )}
            objectFit="contain"
            restrictPosition
            onCropChange={setCrop}
            onZoomChange={(value) => setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM))}
            onMediaLoaded={(nextMediaSize) => {
              mediaSizeRef.current = nextMediaSize;
            }}
            onCropComplete={(_, nextCroppedAreaPixels) => {
              croppedAreaPixelsRef.current = nextCroppedAreaPixels;
            }}
          />
        </div>

        <label className={styles.zoomControl}>
          <span>Масштаб</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(event) =>
              setZoom(clamp(Number(event.target.value), MIN_ZOOM, MAX_ZOOM))
            }
          />
        </label>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={applying}
            onClick={() =>
              onApply(
                buildAvatarCropFromArea(
                  croppedAreaPixelsRef.current,
                  mediaSizeRef.current,
                ),
              )
            }
          >
            {applying ? "Применяем..." : "Применить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
