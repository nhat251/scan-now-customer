import { AxiosError } from "axios";

import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import type { BranchResponse, OwnerBranchFormValues } from "@/types/user-management";

export type BranchStatusFilter = "all" | "active" | "inactive";

export const BRANCH_STATUS_FILTER_OPTIONS: Array<{ label: string; value: BranchStatusFilter }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Tạm tắt", value: "inactive" },
];

export const BRANCH_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const BRANCH_SORT_OPTIONS = [
  { label: "Mới nhất trước", sortBy: "createdAt", sortDirection: "desc" as const },
  { label: "Cũ nhất trước", sortBy: "createdAt", sortDirection: "asc" as const },
  { label: "Tên A-Z", sortBy: "name", sortDirection: "asc" as const },
  { label: "Tên Z-A", sortBy: "name", sortDirection: "desc" as const },
];

export const getBranchStatusFilterLabel = (status: BranchStatusFilter) => {
  return (
    BRANCH_STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ??
    "Tất cả trạng thái"
  );
};

export const getBranchSortOptionLabel = (sortBy: string, sortDirection: "asc" | "desc") => {
  return (
    BRANCH_SORT_OPTIONS.find(
      (option) => option.sortBy === sortBy && option.sortDirection === sortDirection
    )?.label ?? "Sắp xếp"
  );
};

export const getBranchStatusLabel = (branch: Pick<BranchResponse, "isActive">) => {
  return branch.isActive ? "Hoạt động" : "Tạm tắt";
};

export const branchStatusFilterToQuery = (status: BranchStatusFilter) => {
  if (status === "active") {
    return { isActive: true };
  }

  if (status === "inactive") {
    return { isActive: false };
  }

  return {};
};

export const getOwnerBranchErrorState = (error: unknown) => {
  const hasAccessFailure =
    error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);

  if (hasAccessFailure) {
    return {
      heading: "Không xác minh được quyền truy cập",
      description: "Phiên đăng nhập có thể đã hết hạn hoặc bạn không còn quyền quản lý chi nhánh.",
      shouldRouteToLogin: true,
      retryLabel: "Thử lại",
    };
  }

  return {
    heading: "Không tải được dữ liệu chi nhánh",
    description: getVietnameseApiErrorMessage(error, "Vui lòng thử lại."),
    shouldRouteToLogin: false,
    retryLabel: "Thử lại",
  };
};

export const getDefaultOwnerBranchFormValues = (): OwnerBranchFormValues => ({
  name: "",
  slug: "",
  address: "",
  phone: "",
  email: "",
  openTime: "",
  closeTime: "",
  vatPercent: "",
  serviceChargePercent: "",
  serviceChargeFixed: "",
});

export const toOwnerBranchFormValues = (branch?: BranchResponse | null): OwnerBranchFormValues => ({
  name: branch?.name ?? "",
  slug: branch?.slug ?? "",
  address: branch?.address ?? "",
  phone: branch?.phone ?? "",
  email: branch?.email ?? "",
  openTime: branch?.openTime ?? "",
  closeTime: branch?.closeTime ?? "",
  vatPercent: branch?.vatPercent === undefined ? "" : String(branch.vatPercent),
  serviceChargePercent:
    branch?.serviceChargePercent === undefined ? "" : String(branch.serviceChargePercent),
  serviceChargeFixed:
    branch?.serviceChargeFixed === undefined ? "" : String(branch.serviceChargeFixed),
});
