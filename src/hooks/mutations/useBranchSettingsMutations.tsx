import { isAxiosError } from "axios";

import useMutation from "@/hooks/useMutation";
import { createPaperVoucher, upsertBranchPaymentConfig } from "@/services/branch-settings";
import { showNotify } from "@/stores/global";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type {
  BranchPaymentConfigResponse,
  PaperVoucherRequest,
  PaperVoucherResponse,
  UpsertBranchPaymentConfigRequest,
} from "@/types/branch-settings";

type Portal = "owner" | "manager";

const getSettingsErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? error.response?.data?.detail ?? error.response?.data?.title ?? fallback;
};

export const useUpsertBranchPaymentConfigMutation = () => {
  return useMutation<
    { portal: Portal; branchId: string; data: UpsertBranchPaymentConfigRequest },
    ApiResponse<BranchPaymentConfigResponse>
  >({
    mutationFn: upsertBranchPaymentConfig,
    hasLoading: true,
    onError: (error) =>
      showNotify({ type: "error", message: getSettingsErrorMessage(error, "Unable to save payment config.") }),
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
      showNotify({ type: "error", message: getSettingsErrorMessage(error, "Unable to create paper voucher.") }),
  });
};
