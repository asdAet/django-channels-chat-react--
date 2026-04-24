import type { ReactNode } from "react";

import { WsAuthContext } from "./context";

/**
 * Свойства провайдера токена для WebSocket-соединений.
 *
 * @property token Актуальный токен, который должен быть доступен всем
 *   вложенным хукам и компонентам при открытии WebSocket.
 * @property children Дочернее дерево React, использующее контекст авторизации.
 */
type WsAuthProviderProps = {
  token: string | null;
  children: ReactNode;
};

/**
 * Передает текущий WebSocket-токен в React-контекст.
 *
 * Провайдер ничего не вычисляет сам: он лишь публикует токен, полученный
 * извне, чтобы нижележащие части приложения могли брать его через
 * `useWsAuthToken` и использовать в handshake при открытии сокета.
 */
export function WsAuthProvider({ token, children }: WsAuthProviderProps) {
  return (
    <WsAuthContext.Provider value={token}>{children}</WsAuthContext.Provider>
  );
}
