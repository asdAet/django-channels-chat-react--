import { encodeSwCacheMessage, type SwCacheMessage } from "../../dto";

/**
 * Отправляет service worker команду управления API-кэшем. Если контроллер еще не захватил
 * страницу, сообщение уходит в активный worker после `navigator.serviceWorker.ready`.
 *
 * @param message Команда инвалидации или очистки кэша в формате `SwCacheMessage`.
 */
const postMessage = (message: SwCacheMessage): void => {
  if (typeof navigator === "undefined") return;
  if (!navigator.serviceWorker) return;

  const payload = encodeSwCacheMessage(message);
  const controller = navigator.serviceWorker.controller;
  if (controller) {
    controller.postMessage(payload);
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.active?.postMessage(payload);
    })
    .catch(() => {});
};

/**
 * Инвалидирует кэш сообщений конкретной комнаты, чтобы следующий запрос забрал свежую историю.
 *
 * @param roomRef Публичный идентификатор комнаты или строковый `roomId`.
 */
export const invalidateRoomMessages = (roomRef: string): void => {
  if (!roomRef) return;
  postMessage({ type: "invalidate", key: "roomMessages", roomRef });
};

/**
 * Инвалидирует кэш сведений о комнате, например после смены названия или состава участников.
 *
 * @param roomRef Публичный идентификатор комнаты или строковый `roomId`.
 */
export const invalidateRoomDetails = (roomRef: string): void => {
  if (!roomRef) return;
  postMessage({ type: "invalidate", key: "roomDetails", roomRef });
};

/**
 * Инвалидирует кэш списка direct-чатов.
 */
export const invalidateDirectChats = (): void => {
  postMessage({ type: "invalidate", key: "directChats" });
};

/**
 * Инвалидирует кэш публичного профиля пользователя после обновления карточки или аватара.
 *
 * @param publicRef Публичный идентификатор пользователя.
 */
export const invalidateUserProfile = (publicRef: string): void => {
  if (!publicRef) return;
  postMessage({ type: "invalidate", key: "userProfile", publicRef });
};

/**
 * Инвалидирует кэш собственного профиля текущего пользователя.
 */
export const invalidateSelfProfile = (): void => {
  postMessage({ type: "invalidate", key: "selfProfile" });
};

/**
 * Полностью очищает пользовательские API-кэши, когда локальное состояние больше нельзя
 * считать достоверным, например после logout.
 */
export const clearAllUserCaches = (): void => {
  postMessage({ type: "clearUserCaches" });
};
