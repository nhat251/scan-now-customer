import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getPublicBranchCategories, getPublicSessionMenu, getPublicTable } from "@/services/public-customer";
import type { ApiResponse } from "@/types/api";
import type {
  PublicCategoryResponse,
  PublicTableResponse,
  SessionMenuQuery,
  SessionMenuResponse,
} from "@/types/customer-session";
import type { UseQueryResult } from "@tanstack/react-query";

export const usePublicTableQuery = (qrCodeToken: string): UseQueryResult<PublicTableResponse, Error> => {
  return useQuery<ApiResponse<PublicTableResponse>, PublicTableResponse>({
    queryKey: [QUERY_KEY.PUBLIC_TABLE, qrCodeToken],
    queryFn: () => getPublicTable(qrCodeToken),
    select: (res) => res.data.result,
    enabled: Boolean(qrCodeToken),
  });
};

export const usePublicSessionMenuQuery = (
  sessionCode: string,
  query: SessionMenuQuery
): UseQueryResult<SessionMenuResponse, Error> => {
  return useQuery<ApiResponse<SessionMenuResponse>, SessionMenuResponse>({
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
  });
};

export const usePublicBranchCategoriesQuery = (branchId?: string): UseQueryResult<PublicCategoryResponse[], Error> => {
  return useQuery<ApiResponse<PublicCategoryResponse[]>, PublicCategoryResponse[]>({
    queryKey: [QUERY_KEY.PUBLIC_BRANCH_CATEGORIES, branchId ?? ""],
    queryFn: () => getPublicBranchCategories(branchId ?? ""),
    select: (res) => res.data.result,
    enabled: Boolean(branchId),
  });
};
