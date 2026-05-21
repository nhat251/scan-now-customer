export type ApiResponse<T> = {
  code?: number;
  message: string;
  result: T;
  statusCode?: number;
};

export type ApiErrorResponse = {
  code?: number;
  message?: string;
  result?: unknown;
  statusCode?: number;
};

export type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
