import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getMyBranch, getMyBranches, getMyBranchMenu, getMyMenuItem } from "@/services/me";
import type { ApiResponse, PagedResult } from "@/types/api";
import type { MyBranchResponse, MyMenuCategoryResponse, MyMenuItemResponse, MyMenuQuery } from "@/types/me";
import type { UseQueryResult } from "@tanstack/react-query";

export const useMyBranchesListQuery = (enabled = true): UseQueryResult<MyBranchResponse[], Error> => {
  return useQuery<ApiResponse<MyBranchResponse[]>, MyBranchResponse[]>({
    queryKey: [QUERY_KEY.MY_BRANCHES],
    queryFn: getMyBranches,
    select: (res) => res.data.result,
    enabled,
  });
};

export const useMyBranchDetailQuery = (
  branchId?: string,
  enabled = true
): UseQueryResult<MyBranchResponse, Error> => {
  return useQuery<ApiResponse<MyBranchResponse>, MyBranchResponse>({
    queryKey: [QUERY_KEY.MY_BRANCH, branchId ?? ""],
    queryFn: () => getMyBranch(branchId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const useMyBranchMenuQuery = (
  branchId: string | undefined,
  query: MyMenuQuery,
  enabled = true
): UseQueryResult<PagedResult<MyMenuCategoryResponse>, Error> => {
  return useQuery<ApiResponse<PagedResult<MyMenuCategoryResponse>>, PagedResult<MyMenuCategoryResponse>>({
    queryKey: [
      QUERY_KEY.MY_BRANCH_MENU,
      branchId ?? "",
      String(query.pageNumber ?? 1),
      String(query.pageSize ?? 10),
      query.search ?? "",
      String(query.isActive ?? ""),
      String(query.isAvailable ?? ""),
      String(query.isFeatured ?? ""),
      query.categoryId ?? "",
      query.sortBy ?? "",
      query.sortDirection ?? "asc",
    ],
    queryFn: () => getMyBranchMenu(branchId ?? "", query),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const useMyMenuItemQuery = (
  menuItemId?: string,
  enabled = true
): UseQueryResult<MyMenuItemResponse, Error> => {
  return useQuery<ApiResponse<MyMenuItemResponse>, MyMenuItemResponse>({
    queryKey: [QUERY_KEY.MY_MENU_ITEM, menuItemId ?? ""],
    queryFn: () => getMyMenuItem(menuItemId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(menuItemId),
  });
};
