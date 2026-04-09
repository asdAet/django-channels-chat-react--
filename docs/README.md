# Документация Проекта

В этой директории находится сгенерированная справочная документация по коду.

## Содержимое

- [Справочник Backend](generated/backend-reference.md) (138 модулей)
- [Справочник Frontend](generated/frontend-reference.md) (258 модулей)

## Что Входит

- Backend: Python-модули из `backend/**/*.py` и `backend/**/*.pyi` без тестов и медиа-артефактов.
- Frontend: экспортируемые TypeScript-модули из `frontend/src/**/*.ts` и `frontend/src/**/*.tsx` без тестов.
- Исключаются кеши, виртуальные окружения, build-вывод, миграции и vendor-каталоги.

## Как Перегенерировать

```bash
python tools/generate_project_docs.py
```
