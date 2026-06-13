export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export type PublicTableResponse = {
  tableId: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  status: TableStatus | number;
};

export type JoinSessionRequest = {
  sessionCode: string;
};

export type JoinSessionResponse = {
  sessionId: string;
  tableId: string;
  branchId: string;
  tableNumber: string;
  branchName: string;
  expiresAt: string;
};

export type PublicCategoryResponse = {
  categoryId: string;
  branchId: string;
  branchName?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type PublicMenuItemResponse = {
  menuItemId: string;
  branchId: string;
  branchName?: string | null;
  categoryId: string;
  categoryName?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  costPrice: number;
  preparationTime: number;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type PublicMenuCategoryResponse = {
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  items: PublicMenuItemResponse[];
};

export type SessionMenuResponse = {
  session: JoinSessionResponse;
  menu: {
    items: PublicMenuCategoryResponse[];
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages?: number;
  };
};

export type SessionMenuQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isFeatured?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type PersistedCustomerSession = {
  sessionCode: string;
  sessionId: string;
  branchId: string;
  tableId: string;
  tableNumber: string;
  branchName: string;
  expiresAt: string;
};

export type ApiProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
  message?: string;
};
