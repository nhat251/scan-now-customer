import { isAxiosError } from "axios";
import { Building2, LayoutList, Soup } from "lucide-react";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { PATH } from "@/constants/path";
import type { MyBranchResponse, MyMenuItemResponse } from "@/types/me";

export const STAFF_MENU_ROLES = ["STAFF", "KITCHEN"] as const;
export const MY_BRANCH_ROLES = ["BRANCH_MANAGER", "STAFF", "KITCHEN"] as const;

export const FALLBACK_MENU_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "-";
  }

  return `${value}%`;
};

export const formatFixedAmount = (value?: number | null) => {
  if (value === undefined || value === null) {
    return "-";
  }

  return formatCurrency(value);
};

export const formatTime = (value?: string | null) => {
  return value || "-";
};

export const getBranchStatusLabel = (branch?: Pick<MyBranchResponse, "isActive"> | null) => {
  if (!branch) {
    return "-";
  }

  return branch.isActive ? "Active" : "Inactive";
};

export const getAvailabilityLabel = (item: Pick<MyMenuItemResponse, "isAvailable">) => {
  return item.isAvailable ? "Available" : "Out of Stock";
};

export const getActiveLabel = (value: boolean) => {
  return value ? "Active" : "Inactive";
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data as { message?: string; detail?: string; title?: string } | undefined;

  return data?.message ?? data?.detail ?? data?.title ?? fallback;
};

export const isForbiddenError = (error: unknown) => {
  return isAxiosError(error) && error.response?.status === 403;
};

export const canManageMenuAvailability = (role?: string | null) => {
  return STAFF_MENU_ROLES.some((allowedRole) => allowedRole === role?.toUpperCase());
};

export const getMyPortalNavItems = ({
  active,
  branchId,
  canSeeMenu,
}: {
  active: "branches" | "branch-detail" | "menu";
  branchId?: string;
  canSeeMenu?: boolean;
}): PortalNavItem[] => {
  const items: PortalNavItem[] = [
    {
      label: "My Branches",
      href: PATH.me.branches,
      icon: <Building2 className="size-4" />,
      active: active === "branches",
    },
  ];

  if (branchId) {
    items.push({
      label: "Branch Detail",
      href: PATH.me.branchDetail(branchId),
      icon: <LayoutList className="size-4" />,
      active: active === "branch-detail",
    });
  }

  if (branchId && canSeeMenu) {
    items.push({
      label: "Menu Availability",
      href: PATH.me.branchMenu(branchId),
      icon: <Soup className="size-4" />,
      active: active === "menu",
    });
  }

  return items;
};
