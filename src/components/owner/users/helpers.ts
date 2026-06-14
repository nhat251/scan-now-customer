import { AxiosError } from "axios";

import { getRoleLabel } from "@/constants/roleLabels";
import { getVietnameseApiErrorMessage } from "@/helpers/presentation";
import type {
  BranchResponse,
  OwnerScopedUserResponse,
  UserStatusFilter,
} from "@/types/user-management";

export const STATUS_FILTER_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Tạm tắt", value: "inactive" },
  { label: "Bị khóa", value: "banned" },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const SORT_OPTIONS = [
  { label: "Mới nhất trước", sortBy: "createdAt", sortDirection: "desc" as const },
  { label: "Cũ nhất trước", sortBy: "createdAt", sortDirection: "asc" as const },
  { label: "Tên A-Z", sortBy: "fullName", sortDirection: "asc" as const },
  { label: "Tên Z-A", sortBy: "fullName", sortDirection: "desc" as const },
  { label: "Vai trò A-Z", sortBy: "role", sortDirection: "asc" as const },
  { label: "Vai trò Z-A", sortBy: "role", sortDirection: "desc" as const },
];

export const statusFilterToQuery = (status: UserStatusFilter) => {
  if (status === "active") {
    return { isActive: true, isBanned: false };
  }

  if (status === "inactive") {
    return { isActive: false, isBanned: false };
  }

  if (status === "banned") {
    return { isBanned: true };
  }

  return {};
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const getStatusBadge = (user: OwnerScopedUserResponse) => {
  if (user.isBanned) {
    return "Bị khóa";
  }

  return user.isActive ? "Hoạt động" : "Tạm tắt";
};

export const formatOwnerUserDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

export const getSortOptionLabel = (sortBy: string, sortDirection: "asc" | "desc") => {
  return (
    SORT_OPTIONS.find(
      (option) => option.sortBy === sortBy && option.sortDirection === sortDirection
    )?.label ?? "Sắp xếp"
  );
};

export const getRoleFilterLabel = (role: string) => {
  return role === "all" ? "Tất cả vai trò" : getRoleLabel(role);
};

export const getBranchFilterLabel = (branchId: string, branches: BranchResponse[]) => {
  if (branchId === "all") {
    return "Tất cả chi nhánh";
  }

  return branches.find((branch) => branch.branchId === branchId)?.name ?? "Chọn chi nhánh";
};

export const getStatusFilterLabel = (status: UserStatusFilter) => {
  return (
    STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ?? "Tất cả trạng thái"
  );
};

export const isAuthorizationError = (error: unknown) => {
  return error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);
};

export const getQueryErrorMessage = (error: unknown) => {
  return getVietnameseApiErrorMessage(error, "Đã có lỗi xảy ra.");
};

export const getOwnerPortalErrorState = (usersError: unknown, branchesError: unknown) => {
  const hasAccessFailure = isAuthorizationError(usersError) || isAuthorizationError(branchesError);

  if (hasAccessFailure) {
    return {
      heading: "Không xác minh được quyền truy cập",
      description: "Phiên đăng nhập có thể đã hết hạn hoặc bạn không còn quyền xem nhà hàng này.",
      primaryActionLabel: "Về trang đăng nhập",
      retryLabel: "Thử lại",
      shouldRouteToLogin: true,
    };
  }

  return {
    heading: "Không tải được dữ liệu nhân sự",
    description: `Vui lòng thử lại. ${getQueryErrorMessage(usersError) || getQueryErrorMessage(branchesError)}`,
    primaryActionLabel: "Ở lại trang",
    retryLabel: "Thử lại",
    shouldRouteToLogin: false,
  };
};
