import { useEffect } from "react";

import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import {
  getPublicBranchCategories,
  getPublicMenuItem,
  getPublicSessionMenu,
  getPublicTable,
} from "@/services/public-customer";
import type { ApiResponse } from "@/types/api";
import type {
  PublicCategoryResponse,
  PublicMenuItemResponse,
  PublicTableResponse,
  SessionMenuQuery,
  SessionMenuResponse,
} from "@/types/customer-session";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

const PUBLIC_TABLE_STALE_TIME = 60 * 1000;
const PUBLIC_MENU_STALE_TIME = 2 * 60 * 1000;
const PUBLIC_CATEGORIES_STALE_TIME = 10 * 60 * 1000;
const PUBLIC_CUSTOMER_GC_TIME = 30 * 60 * 1000;

type PublicMenuItemQueryData = {
  data: ApiResponse<PublicMenuItemResponse>;
};

export const usePublicTableQuery = (
  qrCodeToken: string
): UseQueryResult<PublicTableResponse, Error> => {
  return useQuery<ApiResponse<PublicTableResponse>, PublicTableResponse>({
    queryKey: [QUERY_KEY.PUBLIC_TABLE, qrCodeToken],
    queryFn: () => getPublicTable(qrCodeToken),
    select: (res) => res.data.result,
    enabled: Boolean(qrCodeToken),
    staleTime: PUBLIC_TABLE_STALE_TIME,
    gcTime: PUBLIC_CUSTOMER_GC_TIME,
  });
};

export const usePublicSessionMenuQuery = (
  sessionCode: string,
  query: SessionMenuQuery
): UseQueryResult<SessionMenuResponse, Error> => {
  const queryClient = useQueryClient();

  const queryInfo = useQuery<ApiResponse<SessionMenuResponse>, SessionMenuResponse>({
    queryKey: [
      QUERY_KEY.PUBLIC_SESSION_MENU,
      sessionCode,
      String(query.pageNumber ?? 1),
      String(query.pageSize ?? 20),
      query.search ?? "",
      query.categoryId ?? "all",
      String(query.isFeatured ?? false),
      query.sortBy ?? "",
      query.sortDirection ?? "asc",
    ],
    queryFn: () => getPublicSessionMenu(sessionCode, query),
    select: (res) => res.data.result,
    enabled: Boolean(sessionCode),
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_CUSTOMER_GC_TIME,
  });

  useEffect(() => {
    if (queryInfo.data) {
      queryInfo.data.menu.items.forEach((category) => {
        category.items.forEach((item) => {
          queryClient.setQueryData<PublicMenuItemQueryData>(
            [QUERY_KEY.PUBLIC_MENU_ITEM, item.branchId, item.menuItemId],
            {
              data: {
                message: "Cached public menu item from session menu.",
                result: item,
              },
            }
          );
        });
      });
    }
  }, [queryClient, queryInfo.data]);

  return queryInfo;
};

export const usePublicBranchCategoriesQuery = (
  branchId?: string
): UseQueryResult<PublicCategoryResponse[], Error> => {
  return useQuery<ApiResponse<PublicCategoryResponse[]>, PublicCategoryResponse[]>({
    queryKey: [QUERY_KEY.PUBLIC_BRANCH_CATEGORIES, branchId ?? ""],
    queryFn: () => getPublicBranchCategories(branchId ?? ""),
    select: (res) => res.data.result,
    enabled: Boolean(branchId),
    staleTime: PUBLIC_CATEGORIES_STALE_TIME,
    gcTime: PUBLIC_CUSTOMER_GC_TIME,
  });
};

export const usePublicMenuItemQuery = (
  branchId: string | undefined,
  menuItemId: string
): UseQueryResult<PublicMenuItemResponse, Error> => {
  return useQuery<ApiResponse<PublicMenuItemResponse>, PublicMenuItemResponse>({
    queryKey: [QUERY_KEY.PUBLIC_MENU_ITEM, branchId ?? "", menuItemId],
    queryFn: () => getPublicMenuItem(branchId ?? "", menuItemId),
    select: (res) => res.data.result,
    enabled: Boolean(branchId) && Boolean(menuItemId),
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_CUSTOMER_GC_TIME,
  });
};
