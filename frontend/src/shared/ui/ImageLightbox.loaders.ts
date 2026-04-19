/**
 * Загружает `load image lightbox desktop view`.
 */
export const loadImageLightboxDesktopView = () =>
  import("./ImageLightboxDesktopView");

/**
 * Загружает `load image lightbox mobile view`.
 */
export const loadImageLightboxMobileView = () =>
  import("./ImageLightboxMobileView");

/**
 * Прогревает оба варианта lightbox-представления до первого открытия.
 *
 * Холодное открытие сразу после reload может приходиться на момент, когда чанки
 * desktop/mobile view еще не загружены. Принудительный preload убирает эту
 * гонку из пути открытия медиа.
 */
export const preloadImageLightboxViews = async (): Promise<void> => {
  await Promise.all([
    loadImageLightboxDesktopView(),
    loadImageLightboxMobileView(),
  ]);
};
