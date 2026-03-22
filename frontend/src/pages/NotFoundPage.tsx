import { Button, Panel } from "../shared/ui";

type Props = {
  onNavigate: (path: string) => void;
};

export function NotFoundPage({ onNavigate }: Props) {
  return (
    <Panel>
      <div data-testid="not-found-page">
        <p>Страница не найдена.</p>
      </div>
      <Button variant="ghost" onClick={() => onNavigate("/")}>
        На главную
      </Button>
    </Panel>
  );
}
