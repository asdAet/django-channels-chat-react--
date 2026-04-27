import { createContext } from "react";

/**
 * Хранит текущий токен авторизации для WebSocket-подключений.
 *
 * В `null` находится состояние до логина или после явного сброса
 * авторизации, когда клиенту нечего отправлять в handshake.
 */
export const WsAuthContext = createContext<string | null>(null);
