import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";
import type { BranchResponse } from "@/types/user-management";

export type MyBranchResponse = BranchResponse;

export type MyMenuQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type MyMenuItemResponse = {
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

export type MyMenuCategoryResponse = {
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  items: MyMenuItemResponse[];
};

export type BulkAvailabilityRequest = {
  isAvailable: boolean;
  menuItemIds: string[];
};

export type MyTableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "DISABLED";

export type MyTableSessionResponse = {
  sessionId: string;
  sessionCode: string;
  openedAt?: string | null;
  createdAt?: string | null;
  expiresAt: string;
  isActive: boolean;
};

export type MyTableResponse = {
  tableId: string;
  branchId: string;
  branchName: string;
  tableNumber: string;
  capacity: number;
  status: MyTableStatus | number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  currentSession: MyTableSessionResponse | null;
};

export type MyActiveTableOrderResponse = OwnerTableOrderHistoryResponse;

export type MyTablesQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  status?: MyTableStatus;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type OpenTableSessionResponse = {
  sessionId: string;
  tableId: string;
  branchId: string;
  sessionCode: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
};
