import { Button, Panel } from "../shared/ui";

type Props = {
  onNavigate: (path: string) => void;
};

/**
 * Отображает fallback-экран для неизвестных или невалидных маршрутов.
 *
 * Страница не пытается восстановить контекст автоматически: она явно сообщает
 * пользователю, что путь не найден, и предлагает вернуться на главную.
 */
export function NotFoundPage({ onNavigate }: Props) {
  return (
    <Panel>
      <div data-testid="not-found-page">
        <p>Страница не найдена.</p>
      </div>
      <Button variant="ghost" onClick={() => onNavigate("/public")}>
        Вернуться в чат
      </Button>
    </Panel>
  );
}
