import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  BulkAvailabilityRequest,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  ManageCategoryQuery,
  ManageCategoryResponse,
  ManageMenuItemResponse,
  ManageMenuQuery,
  PriceHistoryResponse,
  ReorderRequest,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
  UpdatePriceRequest,
} from "@/types/manage-menu";

export const getManageCategories = async (branchId: string, query: ManageCategoryQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<ManageCategoryResponse>>>(
    `/api/owner/branches/${branchId}/categories`,
    { params: query }
  );
};

export const getManageCategory = async (branchId: string, categoryId: string) => {
  return await axiosBasic.get<ApiResponse<ManageCategoryResponse>>(
    `/api/owner/branches/${branchId}/categories/${categoryId}`
  );
};

export const createManageCategory = async ({
  branchId,
  data,
}: {
  branchId: string;
  data: CreateCategoryRequest;
}) => {
  return await axiosBasic.post<ApiResponse<ManageCategoryResponse>>(
    `/api/owner/branches/${branchId}/categories`,
    data
  );
};

export const updateManageCategory = async ({
  branchId,
  categoryId,
  data,
}: {
  branchId: string;
  categoryId: string;
  data: UpdateCategoryRequest;
}) => {
  return await axiosBasic.put<ApiResponse<ManageCategoryResponse>>(
    `/api/owner/branches/${branchId}/categories/${categoryId}`,
    data
  );
};

export const reorderManageCategories = async ({
  branchId,
  data,
}: {
  branchId: string;
  data: ReorderRequest;
}) => {
  return await axiosBasic.patch<ApiResponse<ManageCategoryResponse[]>>(
    `/api/owner/branches/${branchId}/categories/reorder`,
    data
  );
};

export const setManageCategoryActive = async ({
  branchId,
  categoryId,
  isActive,
}: {
  branchId: string;
  categoryId: string;
  isActive: boolean;
}) => {
  return await axiosBasic.patch<ApiResponse<ManageCategoryResponse>>(
    `/api/owner/branches/${branchId}/categories/${categoryId}/${isActive ? "active" : "inactive"}`
  );
};

export const getManageMenuItems = async (branchId: string, query: ManageMenuQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<ManageMenuItemResponse>>>(
    `/api/owner/branches/${branchId}/menu-items`,
    { params: query }
  );
};

export const getManageMenuItem = async (menuItemId: string) => {
  return await axiosBasic.get<ApiResponse<ManageMenuItemResponse>>(`/api/owner/menu-items/${menuItemId}`);
};

export const uploadManageMenuItemImages = async (files: File[]) => {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));

  return await axiosBasic.post<ApiResponse<string[]>>("/api/owner/menu-items/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const createManageMenuItem = async ({
  branchId,
  categoryId,
  data,
}: {
  branchId: string;
  categoryId: string;
  data: CreateMenuItemRequest;
}) => {
  return await axiosBasic.post<ApiResponse<ManageMenuItemResponse>>(
    `/api/owner/branches/${branchId}/categories/${categoryId}/menu-items`,
    data
  );
};

export const updateManageMenuItem = async ({
  menuItemId,
  data,
}: {
  menuItemId: string;
  data: UpdateMenuItemRequest;
}) => {
  return await axiosBasic.put<ApiResponse<ManageMenuItemResponse>>(`/api/owner/menu-items/${menuItemId}`, data);
};

export const setManageMenuItemActive = async ({
  menuItemId,
  isActive,
}: {
  menuItemId: string;
  isActive: boolean;
}) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse>>(
    `/api/owner/menu-items/${menuItemId}/${isActive ? "active" : "inactive"}`
  );
};

export const reorderManageMenuItems = async ({ branchId, data }: { branchId: string; data: ReorderRequest }) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse[]>>(
    `/api/owner/branches/${branchId}/menu-items/reorder`,
    data
  );
};

export const toggleManageMenuItemAvailable = async (menuItemId: string) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse>>(
    `/api/owner/menu-items/${menuItemId}/toggle-available`
  );
};

export const bulkManageAvailability = async ({
  branchId,
  data,
}: {
  branchId: string;
  data: BulkAvailabilityRequest;
}) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse[]>>(
    `/api/owner/branches/${branchId}/menu-items/bulk-availability`,
    data
  );
};

export const toggleManageMenuItemFeatured = async (menuItemId: string) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse>>(
    `/api/owner/menu-items/${menuItemId}/toggle-featured`
  );
};

export const updateManageMenuItemPrice = async ({
  menuItemId,
  data,
}: {
  menuItemId: string;
  data: UpdatePriceRequest;
}) => {
  return await axiosBasic.patch<ApiResponse<ManageMenuItemResponse>>(`/api/owner/menu-items/${menuItemId}/price`, data);
};

export const getManagePriceHistory = async (menuItemId: string) => {
  return await axiosBasic.get<ApiResponse<PriceHistoryResponse[]>>(
    `/api/owner/menu-items/${menuItemId}/price-history`
  );
};
