import { isAxiosError } from "axios";
import { Building2, ChefHat, ClipboardList, LayoutList, Soup, Table2 } from "lucide-react";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { PATH } from "@/constants/path";
import type { MyBranchResponse, MyMenuItemResponse, MyTableStatus } from "@/types/me";

export const STAFF_MENU_ROLES = ["STAFF", "KITCHEN"] as const;
export const STAFF_TABLE_ROLES = ["STAFF", "KITCHEN"] as const;
export const WAITER_ORDER_ROLES = ["STAFF", "BRANCH_MANAGER"] as const;
export const KITCHEN_ORDER_ROLES = ["KITCHEN", "BRANCH_MANAGER"] as const;
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

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

const TABLE_STATUS_BY_CODE: Record<number, MyTableStatus> = {
  0: "AVAILABLE",
  1: "OCCUPIED",
  2: "RESERVED",
  3: "DISABLED",
};

export const normalizeTableStatus = (status?: MyTableStatus | number | null): MyTableStatus | undefined => {
  if (typeof status === "number") {
    return TABLE_STATUS_BY_CODE[status];
  }

  return status ?? undefined;
};

export const getTableStatusLabel = (status?: MyTableStatus | number | null) => {
  const normalizedStatus = normalizeTableStatus(status);

  if (!normalizedStatus) {
    return "-";
  }

  return normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase();
};

export const getTableStatusTone = (status?: MyTableStatus | number | null) => {
  const normalizedStatus = normalizeTableStatus(status);

  if (normalizedStatus === "AVAILABLE") {
    return "bg-success text-success-foreground";
  }

  if (normalizedStatus === "OCCUPIED") {
    return "bg-primary/10 text-primary";
  }

  if (normalizedStatus === "RESERVED") {
    return "bg-warning text-warning-foreground";
  }

  return "bg-surface-container text-muted-foreground";
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

export const canManageTableSessions = (role?: string | null) => {
  return STAFF_TABLE_ROLES.some((allowedRole) => allowedRole === role?.toUpperCase());
};

export const canHandleWaiterOrders = (role?: string | null) => {
  return WAITER_ORDER_ROLES.some((allowedRole) => allowedRole === role?.toUpperCase());
};

export const canHandleKitchenOrders = (role?: string | null) => {
  return KITCHEN_ORDER_ROLES.some((allowedRole) => allowedRole === role?.toUpperCase());
};

export const getMyPortalNavItems = ({
  active,
  branchId,
  canSeeMenu,
  canSeeTables,
  canSeeOrders,
  canSeeKitchen,
}: {
  active: "branches" | "branch-detail" | "menu" | "tables" | "orders" | "kitchen";
  branchId?: string;
  canSeeMenu?: boolean;
  canSeeTables?: boolean;
  canSeeOrders?: boolean;
  canSeeKitchen?: boolean;
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

  if (branchId && canSeeTables) {
    items.push({
      label: "Table Sessions",
      href: PATH.me.branchTables(branchId),
      icon: <Table2 className="size-4" />,
      active: active === "tables",
    });
  }

  if (branchId && canSeeOrders) {
    items.push({
      label: "Order Service",
      href: PATH.me.branchOrders(branchId),
      icon: <ClipboardList className="size-4" />,
      active: active === "orders",
    });
  }

  if (branchId && canSeeKitchen) {
    items.push({
      label: "Kitchen Queue",
      href: PATH.me.branchKitchen(branchId),
      icon: <ChefHat className="size-4" />,
      active: active === "kitchen",
    });
  }

  return items;
};
