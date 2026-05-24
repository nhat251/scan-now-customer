import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getOwnerBranchTables, getOwnerTable } from "@/services/owner-table";
import type { ApiResponse, PagedResult } from "@/types/api";
import type { OwnerTableResponse, OwnerTablesQuery } from "@/types/owner-table";
import type { UseQueryResult } from "@tanstack/react-query";

export const useOwnerBranchTablesQuery = (
  branchId?: string,
  query: OwnerTablesQuery = {},
  enabled = true
): UseQueryResult<PagedResult<OwnerTableResponse>, Error> => {
  return useQuery<ApiResponse<PagedResult<OwnerTableResponse>>, PagedResult<OwnerTableResponse>>({
    queryKey: [
      QUERY_KEY.OWNER_BRANCH_TABLES,
      branchId ?? "",
      String(query.pageNumber ?? 1),
      String(query.pageSize ?? 10),
      query.search ?? "",
      query.status ?? "all",
      String(query.capacity ?? ""),
      String(query.isActive ?? ""),
      query.sortBy ?? "",
      query.sortDirection ?? "asc",
    ],
    queryFn: () => getOwnerBranchTables(branchId ?? "", query),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const useOwnerTableQuery = (
  branchId?: string,
  tableId?: string,
  enabled = true
): UseQueryResult<OwnerTableResponse, Error> => {
  return useQuery<ApiResponse<OwnerTableResponse>, OwnerTableResponse>({
    queryKey: [QUERY_KEY.OWNER_TABLE, branchId ?? "", tableId ?? ""],
    queryFn: () => getOwnerTable(branchId ?? "", tableId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId) && Boolean(tableId),
  });
};
