import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  BulkAvailabilityRequest,
  MyBranchResponse,
  MyMenuCategoryResponse,
  MyMenuItemResponse,
  MyMenuQuery,
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
