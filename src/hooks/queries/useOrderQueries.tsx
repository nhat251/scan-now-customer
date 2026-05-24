import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import {
  getGroupedKitchenItems,
  getOrderDetail,
  getPendingWaiterOrders,
  getPublicPaymentStatus,
  getReadyToServeItems,
} from "@/services/order";
import type { ApiResponse } from "@/types/api";
import type {
  CustomerOrderResponse,
  GroupedKitchenItem,
  PaymentStatusResponse,
  PendingOrderResponse,
  ReadyToServeTableGroup,
} from "@/types/order";
import type { UseQueryResult } from "@tanstack/react-query";

export const usePublicOrderDetailQuery = (
  sessionCode?: string,
  orderId?: string,
  useFallbackPolling = false
): UseQueryResult<CustomerOrderResponse, Error> => {
  return useQuery<ApiResponse<CustomerOrderResponse>, CustomerOrderResponse>({
    queryKey: [QUERY_KEY.PUBLIC_ORDER, sessionCode ?? "", orderId ?? ""],
    queryFn: () => getOrderDetail(sessionCode ?? "", orderId ?? ""),
    select: (response) => response.data.result,
    enabled: Boolean(sessionCode) && Boolean(orderId),
    refetchInterval: useFallbackPolling ? 10000 : false,
  });
};

export const usePublicPaymentStatusQuery = (
  sessionCode: string,
  enabled = false
): UseQueryResult<PaymentStatusResponse, Error> => {
  return useQuery<ApiResponse<PaymentStatusResponse>, PaymentStatusResponse>({
    queryKey: [QUERY_KEY.PUBLIC_PAYMENT_STATUS, sessionCode],
    queryFn: () => getPublicPaymentStatus(sessionCode),
    select: (response) => response.data.result,
    enabled: enabled && Boolean(sessionCode),
    refetchInterval: 5000,
  });
};

export const usePendingWaiterOrdersQuery = (
  branchId?: string,
  enabled = true
): UseQueryResult<PendingOrderResponse[], Error> => {
  return useQuery<ApiResponse<PendingOrderResponse[]>, PendingOrderResponse[]>({
    queryKey: [QUERY_KEY.WAITER_PENDING_ORDERS, branchId ?? ""],
    queryFn: () => getPendingWaiterOrders(branchId ?? ""),
    select: (response) => response.data.result,
    enabled: enabled && Boolean(branchId),
    refetchInterval: 10000,
  });
};

export const useReadyToServeItemsQuery = (
  branchId?: string,
  enabled = true
): UseQueryResult<ReadyToServeTableGroup[], Error> => {
  return useQuery<ApiResponse<ReadyToServeTableGroup[]>, ReadyToServeTableGroup[]>({
    queryKey: [QUERY_KEY.WAITER_READY_ITEMS, branchId ?? ""],
    queryFn: () => getReadyToServeItems(branchId ?? ""),
    select: (response) => response.data.result,
    enabled: enabled && Boolean(branchId),
    refetchInterval: 10000,
  });
};

export const useGroupedKitchenItemsQuery = (
  branchId: string | undefined,
  status?: "Confirmed" | "Cooking",
  enabled = true
): UseQueryResult<GroupedKitchenItem[], Error> => {
  return useQuery<ApiResponse<GroupedKitchenItem[]>, GroupedKitchenItem[]>({
    queryKey: [QUERY_KEY.KITCHEN_GROUPED_ITEMS, branchId ?? "", status ?? "all"],
    queryFn: () => getGroupedKitchenItems({ branchId: branchId ?? "", status }),
    select: (response) => response.data.result,
    enabled: enabled && Boolean(branchId),
    refetchInterval: 10000,
  });
};
