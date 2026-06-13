import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getCashierOrder, getCashierOrders } from "@/services/cashier";
import type { ApiResponse } from "@/types/api";
import type { CashierOrderQuery, CashierOrdersResult } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";
import type { UseQueryResult } from "@tanstack/react-query";

export const useCashierOrdersQuery = (
  branchId?: string,
  query: CashierOrderQuery = {},
  enabled = true
): UseQueryResult<CashierOrdersResult, Error> => {
  return useQuery<ApiResponse<CashierOrdersResult>, CashierOrdersResult>({
    queryKey: [
      QUERY_KEY.CASHIER_ORDERS,
      branchId ?? "",
      String(query.pageNumber ?? 1),
      String(query.pageSize ?? 10),
      query.search ?? "",
      query.status ?? "active",
      query.sortBy ?? "createdAt",
      query.sortDirection ?? "desc",
    ],
    queryFn: () => getCashierOrders(branchId ?? "", query),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
    refetchInterval: 10000,
  });
};

export const useCashierOrderQuery = (
  branchId?: string,
  orderId?: string,
  enabled = true
): UseQueryResult<OwnerTableOrderHistoryResponse, Error> => {
  return useQuery<ApiResponse<OwnerTableOrderHistoryResponse>, OwnerTableOrderHistoryResponse>({
    queryKey: [QUERY_KEY.CASHIER_ORDER, branchId ?? "", orderId ?? ""],
    queryFn: () => getCashierOrder(branchId ?? "", orderId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId) && Boolean(orderId),
  });
};
