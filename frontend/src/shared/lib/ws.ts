/**
 * Возвращает базовый websocket origin для текущего окружения.
 *
 * В dev подключаемся напрямую к backend (`:8000`), чтобы не зависеть от
 * Vite WS-proxy и не получать `ws proxy ECONNABORTED` в терминале.
 */

const resolveDevWsOrigin = (scheme: "ws" | "wss"): string => {
  const raw = String(import.meta.env.VITE_WS_BACKEND_ORIGIN ?? "").trim();
  if (!raw) {
    const backendOrigin = String(
      import.meta.env.VITE_BACKEND_ORIGIN ?? "",
    ).trim();
    if (backendOrigin) {
      return coerceWsOrigin(backendOrigin, scheme);
    }

    return `${scheme}://${window.location.hostname}:8000`;
  }

  return coerceWsOrigin(raw, scheme);
};

const coerceWsOrigin = (rawOrigin: string, scheme: "ws" | "wss"): string => {
  const raw = rawOrigin.trim();
  if (/^wss?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.origin;
  }

  return `${scheme}://${raw.replace(/\/+$/, "")}`;
};

type WebSocketQueryValue = string | number | boolean | null | undefined;

/**
 * Возвращает web socket base.
 */

export const getWebSocketBase = () => {
  const scheme: "ws" | "wss" =
    window.location.protocol === "https:" ? "wss" : "ws";

  if (import.meta.env.DEV) {
    return resolveDevWsOrigin(scheme);
  }

  return `${scheme}://${window.location.host}`;
};

/**
 * Добавляет `append web socket params`.
 *
 * @param url Параметр `url` в формате `string`.
 * @param params Параметр `params` в формате `Record<string, WebSocketQueryValue>`.
 */
export const appendWebSocketParams = (
  url: string,
  params: Record<string, WebSocketQueryValue>,
) => {
  const nextUrl = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    nextUrl.searchParams.set(key, String(value));
  }

  return nextUrl.toString();
};

/**
 * Добавляет `append web socket auth token`.
 *
 * @param url Параметр `url` в формате `string`.
 * @param token Параметр `token` в формате `string | null | undefined`.
 */
export const appendWebSocketAuthToken = (
  url: string,
  token: string | null | undefined,
) => appendWebSocketParams(url, { wst: token?.trim() || undefined });
