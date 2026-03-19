/**
 * Константа `CACHE_NAMES` описывает параметры кэширования.
 */

export const CACHE_NAMES = {
  assets: "assets-cache",
  media: "media-cache",
  apiMessages: "api-messages",
  apiRooms: "api-rooms",
  apiDirect: "api-direct",
  apiProfiles: "api-profiles",
} as const;

/**
 * Константа `CACHE_TTLS` описывает параметры кэширования.
 */

export const CACHE_TTLS = {
  assets: 60 * 60 * 24 * 365,
  media: 60 * 60 * 24 * 365,
  messages: 120,
  rooms: 120,
  direct: 60,
  profiles: 300,
} as const;

/**
 * Константа `CACHE_LIMITS` описывает параметры кэширования.
 */

export const CACHE_LIMITS = {
  assets: 1000,
  media: 1000,
  messages: 200,
  rooms: 100,
  direct: 50,
  profiles: 200,
} as const;
