/**
 * Возвращает базовый websocket origin для текущего окружения.
 *
 * В dev подключаемся напрямую к backend (`:8000`), чтобы не зависеть от
 * Vite WS-proxy и не получать `ws proxy ECONNABORTED` в терминале.
 */
const resolveDevWsOrigin = (scheme: "ws" | "wss"): string => {
  const raw = String(import.meta.env.VITE_WS_BACKEND_ORIGIN ?? "").trim();
  if (!raw) {
    return `${scheme}://${window.location.hostname}:8000`;
  }

  if (/^wss?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  return `${scheme}://${raw.replace(/\/+$/, "")}`;
};

export const getWebSocketBase = () => {
  const scheme: "ws" | "wss" =
    window.location.protocol === "https:" ? "wss" : "ws";

  if (import.meta.env.DEV) {
    return resolveDevWsOrigin(scheme);
  }

  return `${scheme}://${window.location.host}`;
};
