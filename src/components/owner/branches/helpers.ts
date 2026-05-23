import { AxiosError } from "axios";

import type { BranchResponse, OwnerBranchFormValues } from "@/types/user-management";

export type BranchStatusFilter = "all" | "active" | "inactive";

export const BRANCH_STATUS_FILTER_OPTIONS: Array<{ label: string; value: BranchStatusFilter }> = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const BRANCH_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const BRANCH_SORT_OPTIONS = [
  { label: "Newest first", sortBy: "createdAt", sortDirection: "desc" as const },
  { label: "Oldest first", sortBy: "createdAt", sortDirection: "asc" as const },
  { label: "Name A-Z", sortBy: "name", sortDirection: "asc" as const },
  { label: "Name Z-A", sortBy: "name", sortDirection: "desc" as const },
];

export const getBranchStatusFilterLabel = (status: BranchStatusFilter) => {
  return BRANCH_STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label ?? "All statuses";
};

export const getBranchSortOptionLabel = (sortBy: string, sortDirection: "asc" | "desc") => {
  return (
    BRANCH_SORT_OPTIONS.find((option) => option.sortBy === sortBy && option.sortDirection === sortDirection)?.label ??
    "Sort"
  );
};

export const getBranchStatusLabel = (branch: Pick<BranchResponse, "isActive">) => {
  return branch.isActive ? "Active" : "Inactive";
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
  const hasAccessFailure = error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0);

  if (hasAccessFailure) {
    return {
      heading: "Your access could not be verified",
      description: "Your session may be expired or you may no longer have permission to manage branches.",
      shouldRouteToLogin: true,
      retryLabel: "Try again",
    };
  }

  return {
    heading: "We could not load branch data",
    description: error instanceof AxiosError ? error.response?.data?.message ?? error.message : "Please try again.",
    shouldRouteToLogin: false,
    retryLabel: "Try again",
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
  serviceChargePercent: branch?.serviceChargePercent === undefined ? "" : String(branch.serviceChargePercent),
  serviceChargeFixed: branch?.serviceChargeFixed === undefined ? "" : String(branch.serviceChargeFixed),
});
