# UML-диаграммы

Главная точка входа: [index.html](index.html).

## Набор для защиты

В презентации используется компактный набор из пяти диаграмм. Этого достаточно,
чтобы показать продукт, архитектуру, ключевой поток и модель данных без перегруза.

1. `system-context.puml` - границы системы, внешние участники и интеграции.
2. `use-cases.puml` - основные пользовательские сценарии.
3. `backend-architecture.puml` - компонентная архитектура серверного контура.
4. `sequence-send-message.puml` - основной end-to-end поток отправки сообщения.
5. `domain-core.puml` - ключевые доменные сущности и связи.

## Готовые SVG

- `rendered/system-context.svg`
- `rendered/use-cases.svg`
- `rendered/backend-architecture.svg`
- `rendered/sequence-send-message.svg`
- `rendered/domain-core.svg`

## Служебные файлы

- `_theme.puml` - общая визуальная тема PlantUML.
- `index.html` - статический просмотрщик защитного набора.
