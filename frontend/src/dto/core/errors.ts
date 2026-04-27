/**
 * Класс DtoDecodeError инкапсулирует логику текущего слоя приложения.
 */
export class DtoDecodeError extends Error {
  public readonly source: string;

  public readonly issues: string[];


public constructor(source: string, issues: string[]) {
    /**
     * Инициализирует базовый конструктор и сохраняет параметры ошибки.
     *
     * @param value Входное значение для обработки.
     */
    super(`Ошибка декодирования DTO для ${source}`);
    this.name = "DtoDecodeError";
    this.source = source;
    this.issues = issues;
  }
}
