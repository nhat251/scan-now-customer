import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  BulkAvailabilityRequest,
  MyActiveTableOrderResponse,
  MyBranchResponse,
  MyMenuCategoryResponse,
  MyMenuItemResponse,
  MyMenuQuery,
  MyTableResponse,
  MyTablesQuery,
  OpenTableSessionResponse,
} from "@/types/me";

export const getMyBranches = async () => {
  return await axiosBasic.get<ApiResponse<MyBranchResponse[]>>("/api/me/branches");
};

export const getMyBranch = async (branchId: string) => {
  return await axiosBasic.get<ApiResponse<MyBranchResponse>>(`/api/me/branches/${branchId}`);
};

export const getMyBranchMenu = async (branchId: string, query: MyMenuQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<MyMenuCategoryResponse>>>(
    `/api/me/branches/${branchId}/menu`,
    {
      params: query,
    }
  );
};

export const getMyMenuItem = async (menuItemId: string) => {
  return await axiosBasic.get<ApiResponse<MyMenuItemResponse>>(`/api/me/menu-items/${menuItemId}`);
};

export const toggleMyMenuItemAvailable = async (menuItemId: string) => {
  return await axiosBasic.patch<ApiResponse<MyMenuItemResponse>>(
    `/api/me/menu-items/${menuItemId}/toggle-available`
  );
};

export const bulkUpdateMyMenuAvailability = async ({
  branchId,
  request,
}: {
  branchId: string;
  request: BulkAvailabilityRequest;
}) => {
  return await axiosBasic.patch<ApiResponse<MyMenuItemResponse[]>>(
    `/api/me/branches/${branchId}/menu-items/bulk-availability`,
    request
  );
};

export const getMyBranchTables = async (branchId: string, query: MyTablesQuery) => {
  return await axiosBasic.get<ApiResponse<PagedResult<MyTableResponse>>>(
    `/api/me/branches/${branchId}/tables`,
    {
      params: query,
    }
  );
};

export const getMyTable = async (tableId: string) => {
  return await axiosBasic.get<ApiResponse<MyTableResponse>>(`/api/me/tables/${tableId}`);
};

export const getMyTableActiveOrders = async (tableId: string) => {
  return await axiosBasic.get<ApiResponse<MyActiveTableOrderResponse[]>>(`/api/me/tables/${tableId}/orders`);
};

export const openMyTableSession = async ({ branchId, tableId }: { branchId: string; tableId: string }) => {
  return await axiosBasic.post<ApiResponse<OpenTableSessionResponse>>(
    `/api/me/branches/${branchId}/tables/${tableId}/open`
  );
};

export const closeMyTableSession = async (sessionId: string) => {
  return await axiosBasic.patch<ApiResponse<unknown>>(`/api/me/sessions/${sessionId}/close`);
};
