import type { ReactNode } from "react";

import { WsAuthContext } from "./context";

type WsAuthProviderProps = {
  token: string | null;
  children: ReactNode;
};

export function WsAuthProvider({ token, children }: WsAuthProviderProps) {
  return (
    <WsAuthContext.Provider value={token}>{children}</WsAuthContext.Provider>
  );
}
