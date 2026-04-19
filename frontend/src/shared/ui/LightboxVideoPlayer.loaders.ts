/**
 * Загружает `load lightbox video player desktop view`.
 */
export const loadLightboxVideoPlayerDesktopView = () =>
  import("./LightboxVideoPlayerDesktopView");

/**
 * Загружает `load lightbox video player mobile view`.
 */
export const loadLightboxVideoPlayerMobileView = () =>
  import("./LightboxVideoPlayerMobileView");

/**
 * Прогревает оба варианта video-player до первого открытия lightbox.
 *
 * Player живет в отдельных чанках. Если пользователь открывает видео сразу
 * после reload, preload позволяет избежать холодного mount-path и связанных с
 * ним гонок первого открытия.
 */
export const preloadLightboxVideoPlayerViews = async (): Promise<void> => {
  await Promise.all([
    loadLightboxVideoPlayerDesktopView(),
    loadLightboxVideoPlayerMobileView(),
  ]);
};
