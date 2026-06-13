export type ManageCategoryQuery = {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type ManageMenuQuery = ManageCategoryQuery & {
  isAvailable?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
};

export type ManageCategoryResponse = {
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

export type ManageMenuItemResponse = {
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

export type ManageCategoryFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: string;
};

export type ManageMenuItemFormValues = {
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  costPrice: string;
  preparationTime: string;
  displayOrder: string;
  isAvailable: boolean;
  isFeatured: boolean;
};

export type CreateCategoryRequest = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
};

export type UpdateCategoryRequest = CreateCategoryRequest;

export type CreateMenuItemRequest = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  costPrice: number;
  preparationTime: number;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

export type UpdateMenuItemRequest = Omit<CreateMenuItemRequest, "price"> & {
  categoryId: string;
};

export type ReorderItemRequest = {
  id: string;
  displayOrder: number;
};

export type ReorderRequest = {
  items: ReorderItemRequest[];
};

export type BulkAvailabilityRequest = {
  isAvailable: boolean;
  menuItemIds: string[];
};

export type UpdatePriceRequest = {
  price: number;
  note?: string | null;
};

export type PriceHistoryResponse = {
  priceHistoryId: string;
  menuItemId: string;
  oldPrice: number;
  newPrice: number;
  changedById: string;
  changedByName?: string | null;
  changedAt: string;
  note?: string | null;
};
