import { z } from "zod";

const csrfTokenSchema = z.string().trim().min(1);

const cookieNameSchema = z.string().trim().min(1);

/**
 * Извлекает значение cookie по имени и возвращает только валидные непустые токены.
 *
 * @param cookie Строка `document.cookie` или ее часть.
 * @param name Имя cookie, которое нужно найти.
 * @returns Значение cookie либо `null`, если ключ отсутствует или значение не прошло проверку.
 */
export const readCookieValue = (
  cookie: string | null | undefined,
  name: string,
): string | null => {
  const cookieName = cookieNameSchema.safeParse(name);
  if (!cookieName.success) return null;
  if (!cookie) return null;

  const chunks = cookie.split(";").map((entry) => entry.trim());
  const match = chunks.find((entry) => entry.startsWith(`${cookieName.data}=`));
  if (!match) return null;

  const value = match.slice(cookieName.data.length + 1);
  const parsed = csrfTokenSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/**
 * Читает CSRF-токен из `document.cookie`, если код выполняется в браузере.
 *
 * @returns Нормализованное значение CSRF-токена или `null`, если токен недоступен.
 */
export const readCsrfFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  return readCookieValue(document.cookie, "csrftoken");
};

/**
 * Читает ранее сохраненный CSRF-токен из `sessionStorage`.
 *
 * @param storageKey Ключ, под которым токен хранится в браузерной сессии.
 * @returns Нормализованный токен или `null`, если запись отсутствует либо повреждена.
 */
export const readCsrfFromSessionStorage = (
  storageKey: string,
): string | null => {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey);
  const parsed = csrfTokenSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

/**
 * Сохраняет CSRF-токен в `sessionStorage` и удаляет запись, если токен отсутствует
 * или не проходит локальную валидацию.
 *
 * @param storageKey Ключ, под которым токен хранится в `sessionStorage`.
 * @param token Новый CSRF-токен или `null`, если сохраненное значение нужно удалить.
 */
export const writeCsrfToSessionStorage = (
  storageKey: string,
  token: string | null,
): void => {
  if (typeof sessionStorage === "undefined") return;

  if (!token) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  const parsed = csrfTokenSchema.safeParse(token);
  if (!parsed.success) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  sessionStorage.setItem(storageKey, parsed.data);
};
