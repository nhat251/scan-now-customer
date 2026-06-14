import { QUERY_KEY } from "@/constants/queryKeys";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { cancelCashierPendingPayment, checkoutCashierOrder } from "@/services/cashier";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type { CashierCheckoutRequest, CashierPaymentResponse } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";
import { useQueryClient } from "@tanstack/react-query";

export const useCashierCheckoutMutation = () => {
  return useMutation<
    { branchId: string; orderId: string; request: CashierCheckoutRequest },
    ApiResponse<CashierPaymentResponse>
  >({
    mutationFn: checkoutCashierOrder,
    onSuccess: (response) => {
      showNotify({
        type: "success",
        message:
          response.result.paymentMethod === "CASH"
            ? "Đã hoàn tất thanh toán tiền mặt."
            : "Đã tạo liên kết thanh toán PayOS.",
      });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể hoàn tất thanh toán."),
      }),
  });
};

export const useCashierCancelPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { branchId: string; orderId: string },
    ApiResponse<OwnerTableOrderHistoryResponse>
  >({
    mutationFn: cancelCashierPendingPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.CASHIER_ORDERS] });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY.CASHIER_ORDER] });
      showNotify({ type: "success", message: "Đã hủy yêu cầu thanh toán đang chờ." });
    },
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể hủy yêu cầu thanh toán đang chờ."),
      }),
  });
};
