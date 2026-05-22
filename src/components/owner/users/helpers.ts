import { AxiosError } from "axios";

import { getRoleLabel } from "@/constants/roleLabels";
import type { BranchResponse, OwnerScopedUserResponse, UserStatusFilter } from "@/types/user-management";

export const STATUS_FILTER_OPTIONS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Banned", value: "banned" },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", sortDirection: "desc" as const },
  { label: "Oldest first", sortBy: "createdAt", sortDirection: "asc" as const },
  { label: "Name A-Z", sortBy: "fullName", sortDirection: "asc" as const },
  { label: "Name Z-A", sortBy: "fullName", sortDirection: "desc" as const },
  { label: "Role A-Z", sortBy: "role", sortDirection: "asc" as const },
  { label: "Role Z-A", sortBy: "role", sortDirection: "desc" as const },
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
    return "Banned";
  }

  return user.isActive ? "Active" : "Inactive";
};

export const getSortOptionLabel = (sortBy: string, sortDirection: "asc" | "desc") => {
  return (
    SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.sortDirection === sortDirection)?.label ??
    "Sort"
  );
};

export const getRoleFilterLabel = (role: string) => {
  return role === "all" ? "All roles" : getRoleLabel(role);
};

export const getBranchFilterLabel = (branchId: string, branches: BranchResponse[]) => {
  if (branchId === "all") {
    return "All branches";
  }

  return branches.find((branch) => branch.branchId === branchId)?.name ?? "Select branch";
};

export const getStatusFilterLabel = (status: UserStatusFilter) => {
  return STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ?? "All statuses";
};

export const isAuthorizationError = (error: unknown) => {
  return error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);
};

export const getQueryErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Oops, an error occurred!";
};

export const getOwnerPortalErrorState = (usersError: unknown, branchesError: unknown) => {
  const hasAccessFailure = isAuthorizationError(usersError) || isAuthorizationError(branchesError);

  if (hasAccessFailure) {
    return {
      heading: "Your access could not be verified",
      description: "Your session may be expired or you may no longer have permission to view this restaurant.",
      primaryActionLabel: "Go to login",
      retryLabel: "Try again",
      shouldRouteToLogin: true,
    };
  }

  return {
    heading: "We could not load your restaurant data",
    description: `Please try again. ${getQueryErrorMessage(usersError) || getQueryErrorMessage(branchesError)}`,
    primaryActionLabel: "Stay on page",
    retryLabel: "Try again",
    shouldRouteToLogin: false,
  };
};
