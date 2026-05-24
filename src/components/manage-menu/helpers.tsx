import { isAxiosError } from "axios";
import { LayoutDashboard, ListOrdered, Settings, Soup, Store, Table2, Tags, Users } from "lucide-react";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { PATH } from "@/constants/path";
import type {
  ManageCategoryFormValues,
  ManageCategoryResponse,
  ManageMenuItemFormValues,
  ManageMenuItemResponse,
} from "@/types/manage-menu";

export type ManagePortal = "owner" | "manager";
export type StatusFilter = "all" | "active" | "inactive";
export type AvailabilityFilter = "all" | "available" | "out-of-stock";
export type FeaturedFilter = "all" | "featured" | "not-featured";

export const MANAGE_MENU_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const FALLBACK_MENU_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getStatusLabel = (isActive: boolean) => (isActive ? "Active" : "Inactive");
export const getAvailabilityLabel = (isAvailable: boolean) => (isAvailable ? "Available" : "Out of Stock");
export const getFeaturedLabel = (isFeatured: boolean) => (isFeatured ? "Featured" : "Normal");

export const statusFilterToQuery = (status: StatusFilter) => {
  if (status === "active") return true;
  if (status === "inactive") return false;
  return undefined;
};

export const availabilityFilterToQuery = (status: AvailabilityFilter) => {
  if (status === "available") return true;
  if (status === "out-of-stock") return false;
  return undefined;
};

export const featuredFilterToQuery = (status: FeaturedFilter) => {
  if (status === "featured") return true;
  if (status === "not-featured") return false;
  return undefined;
};

export const getManageApiErrorMessage = (error: unknown, fallback = "Please try again.") => {
  if (!isAxiosError(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? error.response?.data?.detail ?? error.message ?? fallback;
};

export const isForbiddenError = (error: unknown) => isAxiosError(error) && error.response?.status === 403;

export const getPortalCopy = (portal: ManagePortal) => {
  if (portal === "manager") {
    return {
      label: "Branch Portal",
      name: "Branch Manager Console",
      topbar: "Branch Manager Console",
      role: "BRANCH_MANAGER" as const,
    };
  }

  return {
    label: "Management Suite",
    name: "Owner Portal",
    topbar: "Owner Portal",
    role: "OWNER" as const,
  };
};

export const getManageMenuNavItems = (
  portal: ManagePortal,
  active: "dashboard" | "branches" | "categories" | "menu-items" | "tables" | "users" | "settings",
  branchId?: string
): PortalNavItem[] => {
  if (portal === "manager") {
    return [
      { label: "Staff Management", href: PATH.manager.users, icon: <Users className="size-4" />, active: active === "users" },
      ...(branchId
        ? [
            {
              label: "Categories",
              href: PATH.manager.branchCategories(branchId),
              icon: <Tags className="size-4" />,
              active: active === "categories",
            },
            {
              label: "Menu Items",
              href: PATH.manager.branchMenuItems(branchId),
              icon: <Soup className="size-4" />,
              active: active === "menu-items",
            },
            {
              label: "Tables & QR",
              href: PATH.manager.branchTables(branchId),
              icon: <Table2 className="size-4" />,
              active: active === "tables",
            },
          ]
        : []),
      { label: "Orders", href: PATH.manager.orders, icon: <ListOrdered className="size-4" /> },
      { label: "Settings", href: PATH.manager.settings, icon: <Settings className="size-4" />, active: active === "settings" },
    ];
  }

  return [
    { label: "Dashboard", href: PATH.dashboards.owner, icon: <LayoutDashboard className="size-4" />, active: active === "dashboard" },
    { label: "My Restaurant", href: PATH.owner.restaurant, icon: <Store className="size-4" /> },
    { label: "Branches", href: PATH.owner.branches, icon: <Store className="size-4" />, active: active === "branches" },
    ...(branchId
      ? [
          {
            label: "Categories",
            href: PATH.owner.branchCategories(branchId),
            icon: <Tags className="size-4" />,
            active: active === "categories",
          },
          {
            label: "Menu Items",
            href: PATH.owner.branchMenuItems(branchId),
            icon: <Soup className="size-4" />,
            active: active === "menu-items",
          },
          {
            label: "Tables & QR",
            href: PATH.owner.branchTables(branchId),
            icon: <Table2 className="size-4" />,
            active: active === "tables",
          },
        ]
      : []),
    { label: "User Management", href: PATH.owner.users, icon: <Users className="size-4" />, active: active === "users" },
    { label: "Settings", href: PATH.owner.settings, icon: <Settings className="size-4" />, active: active === "settings" },
  ];
};

export const getCategoryListPath = (portal: ManagePortal, branchId: string) =>
  portal === "owner" ? PATH.owner.branchCategories(branchId) : PATH.manager.branchCategories(branchId);

export const getCategoryCreatePath = (portal: ManagePortal, branchId: string) =>
  portal === "owner" ? PATH.owner.branchCategoryCreate(branchId) : PATH.manager.branchCategoryCreate(branchId);

export const getCategoryDetailPath = (portal: ManagePortal, branchId: string, categoryId: string) =>
  portal === "owner"
    ? PATH.owner.branchCategoryDetail(branchId, categoryId)
    : PATH.manager.branchCategoryDetail(branchId, categoryId);

export const getMenuItemListPath = (portal: ManagePortal, branchId: string) =>
  portal === "owner" ? PATH.owner.branchMenuItems(branchId) : PATH.manager.branchMenuItems(branchId);

export const getMenuItemCreatePath = (portal: ManagePortal, branchId: string) =>
  portal === "owner" ? PATH.owner.branchMenuItemCreate(branchId) : PATH.manager.branchMenuItemCreate(branchId);

export const getMenuItemDetailPath = (portal: ManagePortal, menuItemId: string) =>
  portal === "owner" ? PATH.owner.menuItemDetail(menuItemId) : PATH.manager.menuItemDetail(menuItemId);

export const getPriceHistoryPath = (portal: ManagePortal, menuItemId: string) =>
  portal === "owner" ? PATH.owner.menuItemPriceHistory(menuItemId) : PATH.manager.menuItemPriceHistory(menuItemId);

export const emptyCategoryForm: ManageCategoryFormValues = {
  name: "",
  description: "",
  imageUrl: "",
  displayOrder: "0",
};

export const toCategoryFormValues = (category?: ManageCategoryResponse | null): ManageCategoryFormValues => ({
  name: category?.name ?? "",
  description: category?.description ?? "",
  imageUrl: category?.imageUrl ?? "",
  displayOrder: category?.displayOrder === undefined ? "0" : String(category.displayOrder),
});

export const emptyMenuItemForm: ManageMenuItemFormValues = {
  categoryId: "",
  name: "",
  description: "",
  imageUrl: "",
  price: "0",
  costPrice: "0",
  preparationTime: "0",
  displayOrder: "0",
  isAvailable: true,
  isFeatured: false,
};

export const toMenuItemFormValues = (item?: ManageMenuItemResponse | null): ManageMenuItemFormValues => ({
  categoryId: item?.categoryId ?? "",
  name: item?.name ?? "",
  description: item?.description ?? "",
  imageUrl: item?.imageUrl ?? "",
  price: item?.price === undefined ? "0" : String(item.price),
  costPrice: item?.costPrice === undefined ? "0" : String(item.costPrice),
  preparationTime: item?.preparationTime === undefined ? "0" : String(item.preparationTime),
  displayOrder: item?.displayOrder === undefined ? "0" : String(item.displayOrder),
  isAvailable: item?.isAvailable ?? true,
  isFeatured: item?.isFeatured ?? false,
});

export const isValidOptionalUrl = (value: string) => {
  if (!value.trim()) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
