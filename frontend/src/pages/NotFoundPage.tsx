import { Button, PageState } from "../shared/ui";

type Props = {
  onNavigate: (path: string) => void;
};

/**
 * Отображает fallback-экран для неизвестных или невалидных маршрутов.
 */
export function NotFoundPage({ onNavigate }: Props) {
  return (
    <PageState
      tone="warning"
      eyebrow="404"
      title="Страница не найдена"
      description="Такого адреса нет или он больше недоступен. Можно вернуться в общий чат или на главную."
      icon={
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 5.5h14v9.5H9.5L5 19.5v-14Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M9 9h6M9 12h3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      }
      className="not-found-page"
    >
      <Button variant="primary" onClick={() => onNavigate("/public")}>
        В публичный чат
      </Button>
      <Button variant="ghost" onClick={() => onNavigate("/")}>
        На главную
      </Button>
    </PageState>
  );
}
