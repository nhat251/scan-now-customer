import { isAxiosError } from "axios";

import { QUERY_KEY } from "@/constants/queryKeys";
import useMutation from "@/hooks/useMutation";
import { cancelCashierPendingPayment, checkoutCashierOrder } from "@/services/cashier";
import { showNotify } from "@/stores/global";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { CashierCheckoutRequest, CashierPaymentResponse } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";
import { useQueryClient } from "@tanstack/react-query";

const getCashierErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? error.response?.data?.detail ?? error.response?.data?.title ?? fallback;
};

export const useCashierCheckoutMutation = () => {
  return useMutation<
    { branchId: string; orderId: string; request: CashierCheckoutRequest },
    ApiResponse<CashierPaymentResponse>
  >({
    mutationFn: checkoutCashierOrder,
    onSuccess: (response) => {
      showNotify({
        type: "success",
        message: response.result.paymentMethod === "CASH" ? "Cash payment completed." : "PayOS payment link created.",
      });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getCashierErrorMessage(error, "Unable to complete cashier checkout."),
      }),
  });
};

export const useCashierCancelPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ branchId: string; orderId: string }, ApiResponse<OwnerTableOrderHistoryResponse>>({
    mutationFn: cancelCashierPendingPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.CASHIER_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.CASHIER_ORDER] });
      showNotify({ type: "success", message: "Pending payment cancelled." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getCashierErrorMessage(error, "Unable to cancel pending payment."),
      }),
  });
};
