import { axiosBasic } from "@/services/axiosBasic";
import type { ApiResponse } from "@/types/api";
import type {
  BranchPaymentConfigResponse,
  PaperVoucherRequest,
  PaperVoucherResponse,
  UpsertBranchPaymentConfigRequest,
} from "@/types/branch-settings";

type Portal = "owner" | "manager";

const basePath = (portal: Portal, branchId: string) => `/api/${portal}/branches/${branchId}`;

export const getBranchPaymentConfig = async (portal: Portal, branchId: string) => {
  return await axiosBasic.get<ApiResponse<BranchPaymentConfigResponse>>(
    `${basePath(portal, branchId)}/payment-config`
  );
};

export const upsertBranchPaymentConfig = async ({
  portal,
  branchId,
  data,
}: {
  portal: Portal;
  branchId: string;
  data: UpsertBranchPaymentConfigRequest;
}) => {
  return await axiosBasic.put<ApiResponse<BranchPaymentConfigResponse>>(
    `${basePath(portal, branchId)}/payment-config`,
    data
  );
};

export const getPaperVouchers = async (portal: Portal, branchId: string) => {
  return await axiosBasic.get<ApiResponse<PaperVoucherResponse[]>>(
    `${basePath(portal, branchId)}/paper-vouchers`
  );
};

export const createPaperVoucher = async ({
  portal,
  branchId,
  data,
}: {
  portal: Portal;
  branchId: string;
  data: PaperVoucherRequest;
}) => {
  return await axiosBasic.post<ApiResponse<PaperVoucherResponse>>(
    `${basePath(portal, branchId)}/paper-vouchers`,
    data
  );
};
