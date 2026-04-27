/**
 * Описывает формат ошибки `ApiError`.
 */
export type ApiError = {
  status: number;
  message: string;
  data?: Record<string, unknown>;
};
