const AUDIO_STATE_STORAGE_KEY = "lightbox.video.audio.v1";

type LightboxVideoAudioState = {
  volume: number;
  muted: boolean;
};

const DEFAULT_AUDIO_STATE: LightboxVideoAudioState = {
  volume: 1,
  muted: false,
};

let activeLightboxVideo: HTMLVideoElement | null = null;

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
 * Гарантирует, что звук может воспроизводить только один активный lightbox-video.
 */
export const claimActiveLightboxVideo = (video: HTMLVideoElement): void => {
  if (activeLightboxVideo && activeLightboxVideo !== video) {
    try {
      activeLightboxVideo.pause();
    } catch {
      // Ничего: старый инстанс все равно должен потерять владение аудио.
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
