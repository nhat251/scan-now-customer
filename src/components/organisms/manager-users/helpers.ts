import { getRoleLabel } from "@/constants/roleLabels";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import type { ManagerScopedUserResponse, UserStatusFilter } from "@/types/user-management";

export const STATUS_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Ngừng hoạt động", value: "inactive" },
  { label: "Đã khóa", value: "banned" },
];

export const PAGE_SIZES = [10, 25, 50] as const;

export const getStatusFilterPayload = (
  status: UserStatusFilter
): Partial<Pick<ManagerScopedUserResponse, "isActive" | "isBanned">> => {
  switch (status) {
    case "active":
      return { isActive: true, isBanned: false };
    case "inactive":
      return { isActive: false, isBanned: false };
    case "banned":
      return { isBanned: true };
    default:
      return {};
  }
};

export const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const getErrorMessage = (error: unknown): string => {
  return getVietnameseApiErrorMessage(error, "Không thể tải dữ liệu.");
};

export const getScopeErrorBanner = (message: string): string => {
  if (message === "Chi nhánh nằm ngoài phạm vi quản lý của bạn.") {
    return `403 - ${message}`;
  }

  return message;
};

export const getRoleFilterLabel = (role: string) => {
  return role ? getRoleLabel(role) : "Tất cả vai trò";
};

export const getBranchFilterLabel = (
  branchId: string,
  branches: Array<{ branchId: string; name: string }>
) => {
  const selectedBranchName = branches.find((branch) => branch.branchId === branchId)?.name;

  return branchId ? (selectedBranchName ?? "Chi nhánh đã chọn") : "Tất cả";
};

export const getStatusFilterLabel = (status: UserStatusFilter) => {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "Tất cả";
};
