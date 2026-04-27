import { z } from "zod";

import { DtoDecodeError } from "./errors";

/**
 * Форматирует path.
 * @param path Путь до поля внутри входной структуры.
 */
const formatPath = (path: PropertyKey[]) =>
  path.length ? path.map(String).join(".") : "<root>";

/**
 * Форматирует issues.
 * @param error Объект ошибки, полученный в обработчике.
 * @returns Строковое значение результата.
 */
const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`);

/**
 * Проверяет входное значение по схеме и бросает DtoDecodeError при невалидном payload.
 * @param schema Схема валидации входных данных.
 * @param input Входные данные для валидации и преобразования.
 * @param source DOM-событие, вызвавшее обработчик.
 * @returns Нормализованные данные после декодирования.
 */

export const decodeOrThrow = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
  source: string,
): z.infer<TSchema> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new DtoDecodeError(source, formatIssues(parsed.error));
  }
  return parsed.data;
};

/**
 * Проверяет входное значение по схеме без броска исключения.
 * @param schema Схема валидации входных данных.
 * @param input Входные данные для валидации и преобразования.
 * @returns Нормализованные данные после декодирования.
 */

export const safeDecode = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> | null => {
  const parsed = schema.safeParse(input);
  return parsed.success ? parsed.data : null;
};

/**
 * Разбирает JSON-строку в unknown-объект без падения.
 * @param raw Сырые входные данные до нормализации.
 * @returns Нормализованные данные после декодирования.
 */

export const parseJson = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
