import type { UserProfile } from "../entities/user/types";
import { SettingsContent } from "../widgets/settings/SettingsContent";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>;
};

/**
 * React-компонент SettingsPage отвечает за отрисовку и обработку UI-сценария.
 */
export function SettingsPage({ user, onNavigate, onLogout }: Props) {
  return (
    <SettingsContent
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      showTitle={true}
    />
  );
}

