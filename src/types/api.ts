export type ApiResponse<T> = {
  code: number;
  message: string;
  result: T;
};

export type ApiErrorResponse = {
  code?: number;
  message?: string;
  result?: unknown;
};
