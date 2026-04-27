/// <reference lib="webworker" />

import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies";

import { decodeSwCacheMessage } from "./dto";
import {
  CACHE_LIMITS,
  CACHE_NAMES,
  CACHE_TTLS,
} from "./shared/cache/cacheConfig";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

/**
 * Проверяет условие is same origin.
 * @param url URL-адрес ресурса.
 */
const isSameOrigin = (url: URL) => url.origin === self.location.origin;
/**
 * Проверяет условие is get request.
 * @param request Объект HTTP-запроса.
 */
const isGetRequest = (request: Request) => request.method === "GET";

/**
 * Обрабатывает match signed media.
 * @param url URL-адрес ресурса.
 */
const matchSignedMedia = (url: URL) =>
  url.pathname.startsWith("/api/auth/media/");
/**
 * Обрабатывает match room messages.
 * @param url URL-адрес ресурса.
 */
const matchRoomMessages = (url: URL) =>
  /^\/api\/chat\/\d+\/messages\/$/.test(url.pathname);
/**
 * Обрабатывает match room details.
 * @param url URL-адрес ресурса.
 */
const matchRoomDetails = (url: URL) =>
  /^\/api\/chat\/\d+\/$/.test(url.pathname);
/**
 * Обрабатывает match direct chats.
 * @param url URL-адрес ресурса.
 */
const matchDirectChats = (url: URL) =>
  url.pathname === "/api/chat/inbox/";
/**
 * Обрабатывает match user profile.
 * @param url URL-адрес ресурса.
 */
const matchUserProfile = (url: URL) =>
  url.pathname.startsWith("/api/public/resolve/");
/**
 * Обрабатывает match self profile.
 * @param url URL-адрес ресурса.
 */
const matchSelfProfile = (url: URL) => url.pathname === "/api/profile/";
/**
 * Обрабатывает match auth no cache.
 * @param url URL-адрес ресурса.
 */
const matchAuthNoCache = (url: URL) =>
  url.pathname === "/api/auth/login/" ||
  url.pathname === "/api/auth/register/" ||
  url.pathname === "/api/auth/logout/" ||
  url.pathname === "/api/auth/csrf/";

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) &&
    isGetRequest(request) &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/static/") ||
      ["script", "style", "font"].includes(request.destination)),
  new CacheFirst({
    cacheName: CACHE_NAMES.assets,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.assets,
        maxAgeSeconds: CACHE_TTLS.assets,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) && isGetRequest(request) && matchSignedMedia(url),
  new NetworkOnly(),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) &&
    isGetRequest(request) &&
    !matchSignedMedia(url) &&
    (url.pathname.startsWith("/media/") || request.destination === "image"),
  new CacheFirst({
    cacheName: CACHE_NAMES.media,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.media,
        maxAgeSeconds: CACHE_TTLS.media,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) && isGetRequest(request) && matchAuthNoCache(url),
  new NetworkOnly(),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) && isGetRequest(request) && matchRoomMessages(url),
  new NetworkFirst({
    cacheName: CACHE_NAMES.apiMessages,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.messages,
        maxAgeSeconds: CACHE_TTLS.messages,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) &&
    isGetRequest(request) &&
    matchRoomDetails(url),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.apiRooms,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.rooms,
        maxAgeSeconds: CACHE_TTLS.rooms,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) && isGetRequest(request) && matchDirectChats(url),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.apiDirect,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.direct,
        maxAgeSeconds: CACHE_TTLS.direct,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) =>
    isSameOrigin(url) &&
    isGetRequest(request) &&
    (matchUserProfile(url) || matchSelfProfile(url)),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.apiProfiles,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: CACHE_LIMITS.profiles,
        maxAgeSeconds: CACHE_TTLS.profiles,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

/**
 * Удаляет matching.
 * @param cacheName Имя параметра или ключа, который используется в операции.
 * @param predicate Функция-предикат для фильтрации записей.
 */
const deleteMatching = async (
  cacheName: string,
  predicate: (url: URL) => boolean,
) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  await Promise.all(
    keys.map((request) => {
      const url = new URL(request.url);
      if (!predicate(url)) return Promise.resolve(false);
      return cache.delete(request);
    }),
  );
};

/**
 * Обрабатывает clear user caches.
 */
const clearUserCaches = async () => {
  await Promise.all([
    caches.delete(CACHE_NAMES.apiMessages),
    caches.delete(CACHE_NAMES.apiRooms),
    caches.delete(CACHE_NAMES.apiDirect),
    caches.delete(CACHE_NAMES.apiProfiles),
  ]);
};

self.addEventListener("message", (event) => {
  const payload = decodeSwCacheMessage(event.data);
  if (!payload) return;

  if (payload.type === "clearUserCaches") {
    event.waitUntil(clearUserCaches());
    return;
  }

  if (payload.type !== "invalidate") return;

  switch (payload.key) {
    case "roomMessages": {
      const roomRef = payload.roomRef?.trim();
      if (!roomRef) return;

      event.waitUntil(
        deleteMatching(
          CACHE_NAMES.apiMessages,
          (url) => url.pathname === `/api/chat/${roomRef}/messages/`,
        ),
      );
      return;
    }

    case "roomDetails": {
      const roomRef = payload.roomRef?.trim();
      if (!roomRef) return;

      event.waitUntil(
        deleteMatching(
          CACHE_NAMES.apiRooms,
          (url) => url.pathname === `/api/chat/${roomRef}/`,
        ),
      );
      return;
    }

    case "directChats": {
      event.waitUntil(
        deleteMatching(
          CACHE_NAMES.apiDirect,
          (url) => url.pathname === "/api/chat/inbox/",
        ),
      );
      return;
    }

    case "userProfile": {
      const ref = payload.publicRef?.trim();
      if (!ref) return;

      event.waitUntil(
        deleteMatching(
          CACHE_NAMES.apiProfiles,
          (url) => {
            const base = `/api/public/resolve/${encodeURIComponent(ref)}`;
            return url.pathname === base || url.pathname === `${base}/`;
          },
        ),
      );
      return;
    }

    case "selfProfile": {
      event.waitUntil(
        deleteMatching(
          CACHE_NAMES.apiProfiles,
          (url) => url.pathname === "/api/profile/",
        ),
      );
      return;
    }

    default:
      return;
  }
});
