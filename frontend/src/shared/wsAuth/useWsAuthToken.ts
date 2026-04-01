import { useContext } from "react";

import { WsAuthContext } from "./context";

export function useWsAuthToken() {
  return useContext(WsAuthContext);
}
