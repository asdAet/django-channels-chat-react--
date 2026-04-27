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

/**
 * Инициализирует mobile-shell состояние и выбирает мобильный или desktop-режим.
 *
 * Наружу этот провайдер отдает флаги viewport и управление боковым drawer,
 * чтобы layout-компоненты не дублировали одну и ту же логику.
 */
export function MobileShellProvider({ children }: { children: ReactNode }) {
  const { isMobileViewport } = useDevice();
  return (
    <MobileShellStateProvider isMobileViewport={isMobileViewport}>
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

  if (!isMobileViewport && isDrawerRequestedOpen) {
    setIsDrawerRequestedOpen(false);
  }

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

/**
 * Возвращает состояние мобильной оболочки и методы управления drawer.
 *
 * Используется виджетами layout, когда им нужно узнать, открыт ли mobile drawer
 * и можно ли программно его открыть, закрыть или переключить.
 */
export function useMobileShell() {
  return useContext(MobileShellContext);
}
