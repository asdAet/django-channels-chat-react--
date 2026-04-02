import type { ReactNode } from "react";

export type LightboxControlsLayout = "desktop" | "mobile";

export type LightboxDropdownMenuId = "speed" | "more";

export type LightboxDropdownMenuController = {
  activeMenuId: LightboxDropdownMenuId | null;
  onToggleMenu: (menuId: LightboxDropdownMenuId) => void;
  onCloseMenu: () => void;
};

export type LightboxActionTone = "default" | "accent" | "danger";

export type LightboxActionItem = {
  key: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: LightboxActionTone;
  description?: string;
  testId?: string;
};
