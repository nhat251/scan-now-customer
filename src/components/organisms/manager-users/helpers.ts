import { AxiosError } from "axios";

import { getRoleLabel } from "@/constants/roleLabels";
import type { ManagerScopedUserResponse, UserStatusFilter } from "@/types/user-management";

export const STATUS_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Banned", value: "banned" },
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

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

type ApiErrorPayload = {
  message?: string;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorPayload | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Oops, an error occurred!";
};

export const getScopeErrorBanner = (message: string): string => {
  if (message === "Branch is outside your managed scope.") {
    return `403 ${message}`;
  }

  return message;
};

export const getRoleFilterLabel = (role: string) => {
  return role ? getRoleLabel(role) : "All roles";
};

export const getBranchFilterLabel = (
  branchId: string,
  branches: Array<{ branchId: string; name: string }>
) => {
  const selectedBranchName = branches.find((branch) => branch.branchId === branchId)?.name;

  return branchId ? (selectedBranchName ?? "Selected branch") : "All";
};

export const getStatusFilterLabel = (status: UserStatusFilter) => {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "All";
};
