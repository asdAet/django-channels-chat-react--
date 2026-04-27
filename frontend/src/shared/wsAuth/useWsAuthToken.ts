import { useContext } from "react";

import { WsAuthContext } from "./context";

/**
 * Возвращает токен, который должен быть отправлен при авторизации WebSocket.
 *
 * Хук читает значение из `WsAuthContext` и не создает побочных эффектов.
 * Если токен еще не получен или пользователь не авторизован, вернет `null`.
 */
export function useWsAuthToken() {
  return useContext(WsAuthContext);
}
