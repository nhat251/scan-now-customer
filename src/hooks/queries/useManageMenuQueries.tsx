import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import {
  getManageCategories,
  getManageCategory,
  getManageMenuItem,
  getManageMenuItems,
  getManagePriceHistory,
} from "@/services/manage-menu";
import type { ApiResponse, PagedResult } from "@/types/api";
import type {
  ManageCategoryQuery,
  ManageCategoryResponse,
  ManageMenuItemResponse,
  ManageMenuQuery,
  PriceHistoryResponse,
} from "@/types/manage-menu";
import type { UseQueryResult } from "@tanstack/react-query";

export const useManageCategoriesQuery = (
  branchId?: string,
  query: ManageCategoryQuery = {},
  enabled = true
): UseQueryResult<PagedResult<ManageCategoryResponse>, Error> => {
  return useQuery<ApiResponse<PagedResult<ManageCategoryResponse>>, PagedResult<ManageCategoryResponse>>({
    queryKey: [
      QUERY_KEY.MANAGE_CATEGORIES,
      branchId ?? "",
      String(query.pageNumber ?? 1),
      String(query.pageSize ?? 10),
      query.search ?? "",
      String(query.isActive ?? ""),
      query.sortBy ?? "",
      query.sortDirection ?? "asc",
    ],
    queryFn: () => getManageCategories(branchId ?? "", query),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const useManageCategoryQuery = (
  branchId?: string,
  categoryId?: string,
  enabled = true
): UseQueryResult<ManageCategoryResponse, Error> => {
  return useQuery<ApiResponse<ManageCategoryResponse>, ManageCategoryResponse>({
    queryKey: [QUERY_KEY.MANAGE_CATEGORY, branchId ?? "", categoryId ?? ""],
    queryFn: () => getManageCategory(branchId ?? "", categoryId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId) && Boolean(categoryId),
  });
};

export const useManageMenuItemsQuery = (
  branchId?: string,
  query: ManageMenuQuery = {},
  enabled = true
): UseQueryResult<PagedResult<ManageMenuItemResponse>, Error> => {
  return useQuery<ApiResponse<PagedResult<ManageMenuItemResponse>>, PagedResult<ManageMenuItemResponse>>({
    queryKey: [
      QUERY_KEY.MANAGE_MENU_ITEMS,
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
    queryFn: () => getManageMenuItems(branchId ?? "", query),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const useManageMenuItemQuery = (
  menuItemId?: string,
  enabled = true
): UseQueryResult<ManageMenuItemResponse, Error> => {
  return useQuery<ApiResponse<ManageMenuItemResponse>, ManageMenuItemResponse>({
    queryKey: [QUERY_KEY.MANAGE_MENU_ITEM, menuItemId ?? ""],
    queryFn: () => getManageMenuItem(menuItemId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(menuItemId),
  });
};

export const useManagePriceHistoryQuery = (
  menuItemId?: string,
  enabled = true
): UseQueryResult<PriceHistoryResponse[], Error> => {
  return useQuery<ApiResponse<PriceHistoryResponse[]>, PriceHistoryResponse[]>({
    queryKey: [QUERY_KEY.MANAGE_PRICE_HISTORY, menuItemId ?? ""],
    queryFn: () => getManagePriceHistory(menuItemId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(menuItemId),
  });
};
