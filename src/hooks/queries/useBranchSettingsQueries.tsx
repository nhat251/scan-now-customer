import { QUERY_KEY } from "@/constants/queryKeys";
import useQuery from "@/hooks/useQuery";
import { getBranchPaymentConfig, getPaperVouchers } from "@/services/branch-settings";
import type { ApiResponse } from "@/types/api";
import type { BranchPaymentConfigResponse, PaperVoucherResponse } from "@/types/branch-settings";
import type { UseQueryResult } from "@tanstack/react-query";

type Portal = "owner" | "manager";

export const useBranchPaymentConfigQuery = (
  portal: Portal,
  branchId?: string,
  enabled = true
): UseQueryResult<BranchPaymentConfigResponse, Error> => {
  return useQuery<ApiResponse<BranchPaymentConfigResponse>, BranchPaymentConfigResponse>({
    queryKey: [QUERY_KEY.BRANCH_PAYMENT_CONFIG, portal, branchId ?? ""],
    queryFn: () => getBranchPaymentConfig(portal, branchId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};

export const usePaperVouchersQuery = (
  portal: Portal,
  branchId?: string,
  enabled = true
): UseQueryResult<PaperVoucherResponse[], Error> => {
  return useQuery<ApiResponse<PaperVoucherResponse[]>, PaperVoucherResponse[]>({
    queryKey: [QUERY_KEY.PAPER_VOUCHERS, portal, branchId ?? ""],
    queryFn: () => getPaperVouchers(portal, branchId ?? ""),
    select: (res) => res.data.result,
    enabled: enabled && Boolean(branchId),
  });
};
