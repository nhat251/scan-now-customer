import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import useMutation from "@/hooks/useMutation";
import { createPaperVoucher, upsertBranchPaymentConfig } from "@/services/branch-settings";
import { showNotify } from "@/stores/global";
import type { ApiResponse } from "@/types/api";
import type {
  BranchPaymentConfigResponse,
  PaperVoucherRequest,
  PaperVoucherResponse,
  UpsertBranchPaymentConfigRequest,
} from "@/types/branch-settings";

type Portal = "owner" | "manager";

export const useUpsertBranchPaymentConfigMutation = () => {
  return useMutation<
    { portal: Portal; branchId: string; data: UpsertBranchPaymentConfigRequest },
    ApiResponse<BranchPaymentConfigResponse>
  >({
    mutationFn: upsertBranchPaymentConfig,
    hasLoading: true,
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể lưu cấu hình thanh toán."),
      }),
  });
};

export const useCreatePaperVoucherMutation = () => {
  return useMutation<
    { portal: Portal; branchId: string; data: PaperVoucherRequest },
    ApiResponse<PaperVoucherResponse>
  >({
    mutationFn: createPaperVoucher,
    hasLoading: true,
    onError: (error) =>
      showNotify({
        type: "error",
        message: getVietnameseApiErrorMessage(error, "Không thể tạo phiếu giảm giá."),
      }),
  });
};
