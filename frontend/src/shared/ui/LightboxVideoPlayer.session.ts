const AUDIO_STATE_STORAGE_KEY = "lightbox.video.audio.v1";

type LightboxVideoAudioState = {
  volume: number;
  muted: boolean;
};

const DEFAULT_AUDIO_STATE: LightboxVideoAudioState = {
  volume: 1,
  muted: false,
};

export const LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE = "data-lightbox-video-player";

let activeLightboxVideo: HTMLVideoElement | null = null;
const registeredLightboxVideos = new Set<HTMLVideoElement>();
let activeLightboxPlaybackOwnerId: string | null = null;
const playbackOwnerListeners = new Set<() => void>();

const collectLiveLightboxVideos = (): HTMLVideoElement[] => {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(
    document.querySelectorAll<HTMLVideoElement>(
      `video[${LIGHTBOX_VIDEO_PLAYER_ATTRIBUTE}="true"]`,
    ),
  );
};

const collectKnownLightboxVideos = (
  preferredVideo?: HTMLVideoElement,
): HTMLVideoElement[] => {
  const knownVideos = new Set<HTMLVideoElement>([
    ...registeredLightboxVideos,
    ...collectLiveLightboxVideos(),
  ]);

  if (preferredVideo) {
    knownVideos.add(preferredVideo);
  }

  return Array.from(knownVideos);
};

const clampVolume = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_AUDIO_STATE.volume;
  }

  return Math.min(1, Math.max(0, value));
};

const normalizeAudioState = (
  value: Partial<LightboxVideoAudioState> | null | undefined,
): LightboxVideoAudioState => ({
  volume: clampVolume(value?.volume),
  muted: Boolean(value?.muted),
});

const notifyPlaybackOwnerListeners = (): void => {
  for (const listener of playbackOwnerListeners) {
    listener();
  }
};

/**
 * Читает последнее сохраненное состояние громкости lightbox-видео.
 */
export const readLightboxVideoAudioState = (): LightboxVideoAudioState => {
  if (typeof window === "undefined") {
    return DEFAULT_AUDIO_STATE;
  }

  try {
    const raw = window.localStorage.getItem(AUDIO_STATE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AUDIO_STATE;
    }

    return normalizeAudioState(
      JSON.parse(raw) as Partial<LightboxVideoAudioState>,
    );
  } catch {
    return DEFAULT_AUDIO_STATE;
  }
};

/**
 * Сохраняет громкость и mute-состояние, чтобы следующий ролик открывался
 * с теми же пользовательскими настройками.
 */
export const writeLightboxVideoAudioState = (
  nextState: LightboxVideoAudioState,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      AUDIO_STATE_STORAGE_KEY,
      JSON.stringify(normalizeAudioState(nextState)),
    );
  } catch {
    // Игнорируем storage quota/private mode: плеер должен продолжить работу.
  }
};

/**
 * Регистрирует video-элемент в общей lightbox-session.
 */
export const registerLightboxVideo = (video: HTMLVideoElement): void => {
  registeredLightboxVideos.add(video);
};

/**
 * Удаляет video-элемент из общей lightbox-session.
 */
export const unregisterLightboxVideo = (video: HTMLVideoElement): void => {
  registeredLightboxVideos.delete(video);
  releaseActiveLightboxVideo(video);
};

/**
 * Подписывает UI на смену владельца активного lightbox-playback.
 *
 * В каждый момент времени только один lightbox-video player может быть
 * владельцем реального `<video>`-элемента. Остальные экземпляры должны
 * оставаться poster-only preview и не запускать декодер/звук.
 */
export const subscribeLightboxPlaybackOwner = (
  listener: () => void,
): (() => void) => {
  playbackOwnerListeners.add(listener);
  return () => {
    playbackOwnerListeners.delete(listener);
  };
};

/**
 * Проверяет, принадлежит ли playback-конвейер указанному owner.
 */
export const isActiveLightboxPlaybackOwner = (ownerId: string): boolean =>
  activeLightboxPlaybackOwnerId === ownerId;

/**
 * Передает право владения реальным video-player новому owner.
 *
 * Перед захватом останавливает все уже известные lightbox-видео, чтобы
 * даже при ошибочном двойном mount в DOM не оставалось второго звучащего
 * playback-инстанса.
 */
export const claimLightboxPlaybackOwner = (ownerId: string): void => {
  if (activeLightboxPlaybackOwnerId === ownerId) {
    return;
  }

  stopAllLightboxVideos({ detachSource: true });
  activeLightboxPlaybackOwnerId = ownerId;
  notifyPlaybackOwnerListeners();
};

/**
 * Освобождает владельца playback, если закрывается именно он.
 */
export const releaseLightboxPlaybackOwner = (ownerId: string): void => {
  if (activeLightboxPlaybackOwnerId !== ownerId) {
    return;
  }

  activeLightboxPlaybackOwnerId = null;
  notifyPlaybackOwnerListeners();
};

/**
 * Гарантирует, что звук может воспроизводить только один активный lightbox-video.
 */
export const claimActiveLightboxVideo = (video: HTMLVideoElement): void => {
  for (const knownVideo of collectKnownLightboxVideos(video)) {
    if (knownVideo === video) {
      continue;
    }

    try {
      knownVideo.pause();
    } catch {
      // Соседний stale-инстанс не должен пережить захват аудио новым player.
    }
  }

  activeLightboxVideo = video;
};

/**
 * Освобождает ссылку на активное видео, если она принадлежит текущему инстансу.
 */
export const releaseActiveLightboxVideo = (video: HTMLVideoElement): void => {
  if (activeLightboxVideo === video) {
    activeLightboxVideo = null;
  }
};

/**
 * Жестко останавливает воспроизведение и при необходимости отвязывает media src.
 * Это нужно для exit-анимации и гарантированного завершения звука при unmount.
 */
export const stopLightboxVideoPlayback = (
  video: HTMLVideoElement,
  options?: { detachSource?: boolean },
): void => {
  try {
    video.pause();
  } catch {
    // Игнорируем: cleanup не должен ломать close-flow.
  }

  releaseActiveLightboxVideo(video);

  if (!options?.detachSource) {
    return;
  }

  try {
    video.removeAttribute("src");
    video.load();
  } catch {
    // Некоторые браузеры бросают ошибку на load() в teardown; это безопасно.
  }
};

/**
 * Останавливает все зарегистрированные lightbox-видео.
 */
export const stopAllLightboxVideos = (
  options?: { detachSource?: boolean },
): void => {
  for (const video of collectKnownLightboxVideos()) {
    stopLightboxVideoPlayback(video, options);
  }
};
