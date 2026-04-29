import type { UserProfile } from "../entities/user/types";
import { SettingsContent } from "../widgets/settings/SettingsContent";

/**
 * Описывает входные props компонента `Props`.
 */
type Props = {
  user: UserProfile | null;
  onProfileSave: (fields: {
    name?: string;
    username?: string;
    image?: File | null;
    bio?: string;
  }) => Promise<
    | { ok: true }
    | { ok: false; errors?: Record<string, string[]>; message?: string }
  >;
};

/**
 * React-компонент SettingsPage отвечает за отрисовку и обработку UI-сценария.
 */
export function SettingsPage({ user, onProfileSave }: Props) {
  return (
    <SettingsContent
      user={user}
      onProfileSave={onProfileSave}
      showTitle={true}
    />
  );
}
