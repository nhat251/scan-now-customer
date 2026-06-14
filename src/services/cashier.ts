import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type {
  CashierCheckoutRequest,
  CashierOrderQuery,
  CashierOrdersResult,
  CashierPaymentResponse,
} from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

export const getCashierOrders = async (branchId: string, query: CashierOrderQuery) => {
  return await axiosBasic.get<ApiResponse<CashierOrdersResult>>(
    `/api/cashier/branches/${branchId}/orders`,
    {
      params: query,
    }
  );
};

export const getCashierOrder = async (branchId: string, orderId: string) => {
  return await axiosBasic.get<ApiResponse<OwnerTableOrderHistoryResponse>>(
    `/api/cashier/branches/${branchId}/orders/${orderId}`
  );
};

export const checkoutCashierOrder = async ({
  branchId,
  orderId,
  request,
}: {
  branchId: string;
  orderId: string;
  request: CashierCheckoutRequest;
}) => {
  const response = await axiosBasic.post<ApiResponse<CashierPaymentResponse>>(
    `/api/cashier/branches/${branchId}/orders/${orderId}/checkout`,
    request
  );

  return response.data;
};

export const cancelCashierPendingPayment = async ({
  branchId,
  orderId,
}: {
  branchId: string;
  orderId: string;
}) => {
  const response = await axiosBasic.post<ApiResponse<OwnerTableOrderHistoryResponse>>(
    `/api/cashier/branches/${branchId}/orders/${orderId}/payment-cancel`
  );

  return response.data;
};
