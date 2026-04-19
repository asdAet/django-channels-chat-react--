import type { CSSProperties, ReactNode, RefObject, SyntheticEvent } from "react";

import type { LightboxDropdownMenuId } from "./lightboxControls/types";

/**
 * Вариант раскладки плеера в зависимости от форм-фактора устройства.
 */
export type LightboxVideoPlayerLayout = "desktop" | "mobile";

/**
 * Методы, которые родитель может вызвать через `ref` для управления плеером.
 */
export type LightboxVideoPlayerHandle = {
  togglePlayback: () => void;
  pausePlayback: () => void;
};

/**
 * Один вариант выбора скорости воспроизведения в меню плеера.
 */
export type PlaybackRateOption = {
  value: number;
  label: string;
};

/**
 * Общий контракт пропсов для desktop- и mobile-представлений видеоплеера.
 *
 * @property rootRef Ссылка на корневой контейнер плеера для управления фокусом
 *   и полноэкранным режимом.
 * @property mediaViewport Узел с самим видео или медиаповерхностью.
 * @property isReady Флаг, что видео загружено достаточно для управления.
 * @property isPlaying Текущее состояние воспроизведения.
 * @property isControlsVisible Флаг видимости элементов управления.
 * @property duration Полная длительность видео в секундах.
 * @property displayTime Текущее отображаемое время на таймлайне.
 * @property volume Текущая громкость от 0 до 1.
 * @property isMuted Флаг принудительного отключения звука.
 * @property playbackRate Активная скорость воспроизведения.
 * @property activeMenuId Идентификатор открытого выпадающего меню, если оно есть.
 * @property canUsePictureInPicture Признак доступности режима Picture-in-Picture.
 * @property isInPictureInPicture Признак, что плеер уже находится в Picture-in-Picture.
 * @property progressStyle Инлайн-стили для заполнения полосы прогресса.
 * @property volumeStyle Инлайн-стили для ползунка громкости.
 * @property remainingLabel Подпись оставшегося времени в уже отформатированном виде.
 * @property onTogglePlayback Переключает play/pause.
 * @property onSeekPreview Обновляет предварительный просмотр позиции во время перетаскивания.
 * @property onSeekCommit Фиксирует новую позицию после завершения перемотки.
 * @property onSeekInteractionStart Помечает начало взаимодействия с таймлайном.
 * @property onSeekInteractionEnd Помечает завершение взаимодействия с таймлайном.
 * @property onVolumeChange Обновляет громкость при движении ползунка.
 * @property onToggleMute Переключает muted/unmuted.
 * @property onSetPlaybackRate Выбирает новую скорость воспроизведения.
 * @property onToggleMenu Открывает или закрывает одно из меню управления.
 * @property onCloseMenu Закрывает активное меню.
 * @property onTogglePictureInPicture Переключает режим Picture-in-Picture.
 * @property onRequestFullscreen Переводит плеер в полноэкранный режим.
 * @property onControlsInteraction Продлевает жизнь controls при взаимодействии с ними.
 * @property onSurfaceInteraction Реагирует на жесты и указатель по медиаповерхности.
 * @property onViewReady Сообщает родительской сессии, что player-shell уже смонтирован
 *   и можно безопасно передавать ему реальный playback-элемент.
 */
export type LightboxVideoPlayerViewProps = {
  rootRef: RefObject<HTMLDivElement | null>;
  mediaViewport: ReactNode;
  isReady: boolean;
  isPlaying: boolean;
  isControlsVisible: boolean;
  duration: number;
  displayTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  activeMenuId: LightboxDropdownMenuId | null;
  canUsePictureInPicture: boolean;
  isInPictureInPicture: boolean;
  progressStyle: CSSProperties;
  volumeStyle: CSSProperties;
  remainingLabel: string;
  onTogglePlayback: () => void;
  onSeekPreview: (nextValue: number) => void;
  onSeekCommit: (nextValue: number) => void;
  onSeekInteractionStart: () => void;
  onSeekInteractionEnd: () => void;
  onVolumeChange: (nextValue: number) => void;
  onToggleMute: () => void;
  onSetPlaybackRate: (nextRate: number) => void;
  onToggleMenu: (menuId: LightboxDropdownMenuId) => void;
  onCloseMenu: () => void;
  onTogglePictureInPicture: () => void;
  onRequestFullscreen: () => void;
  onControlsInteraction: (event: SyntheticEvent<HTMLElement>) => void;
  onSurfaceInteraction: () => void;
  onViewReady: () => void;
};
