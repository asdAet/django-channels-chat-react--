/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useDevice } from "../lib/device";

type MobileShellState = {
  isMobileViewport: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const MobileShellContext = createContext<MobileShellState>({
  isMobileViewport: false,
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
});

export function MobileShellProvider({ children }: { children: ReactNode }) {
  const { isMobileViewport } = useDevice();
  return (
    <MobileShellStateProvider
      key={isMobileViewport ? "mobile" : "desktop"}
      isMobileViewport={isMobileViewport}
    >
      {children}
    </MobileShellStateProvider>
  );
}

function MobileShellStateProvider({
  children,
  isMobileViewport,
}: {
  children: ReactNode;
  isMobileViewport: boolean;
}) {
  const [isDrawerRequestedOpen, setIsDrawerRequestedOpen] = useState(false);

  const openDrawer = useCallback(() => {
    if (!isMobileViewport) {
      return;
    }

    setIsDrawerRequestedOpen(true);
  }, [isMobileViewport]);

  const closeDrawer = useCallback(() => {
    setIsDrawerRequestedOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (!isMobileViewport) {
      return;
    }

    setIsDrawerRequestedOpen((prev) => !prev);
  }, [isMobileViewport]);

  const isDrawerOpen = isMobileViewport && isDrawerRequestedOpen;

  const value = useMemo<MobileShellState>(
    () => ({
      isMobileViewport,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [closeDrawer, isDrawerOpen, isMobileViewport, openDrawer, toggleDrawer],
  );

  return (
    <MobileShellContext.Provider value={value}>
      {children}
    </MobileShellContext.Provider>
  );
}

export function useMobileShell() {
  return useContext(MobileShellContext);
}

