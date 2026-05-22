/* eslint-disable @typescript-eslint/no-explicit-any */
export type TypeFunction = (...args: any[]) => void | any;

export type TypeFunctionPromise = (...args: any[]) => Promise<any>;

export type IconProps = {
  width?: string | number;
  height?: string | number;
  otherProps?: { [key: string]: unknown };
  className?: string;
  color?: string;
  style?: { [key: string]: string };
};

export type ApiResponse<T = null> = {
  code: number;
  message: string;
  result: T;
};

export type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
