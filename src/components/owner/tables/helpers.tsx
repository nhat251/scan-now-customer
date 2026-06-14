import { AxiosError } from "axios";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import {
  getManageMenuNavItems,
  getPortalCopy,
  type ManagePortal,
} from "@/components/manage-menu/helpers";
import { PATH } from "@/constants/path";
import { getTableStatusLabel, getVietnameseApiErrorMessage } from "@/helpers/presentation";
import type {
  OwnerTableFormValues,
  OwnerTableResponse,
  OwnerTableStatus,
} from "@/types/owner-table";

export type OwnerTableStatusFilter = "all" | OwnerTableStatus;
export type OwnerTableActiveFilter = "all" | "active" | "inactive";

export const OWNER_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export const OWNER_TABLE_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: OwnerTableStatusFilter;
}> = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Còn trống", value: "AVAILABLE" },
  { label: "Đang có khách", value: "OCCUPIED" },
  { label: "Đã đặt trước", value: "RESERVED" },
  { label: "Ngừng sử dụng", value: "DISABLED" },
];

export const OWNER_TABLE_STATUS_UPDATE_OPTIONS: Array<{
  label: string;
  value: Exclude<OwnerTableStatus, "OCCUPIED">;
}> = [
  { label: "Còn trống", value: "AVAILABLE" },
  { label: "Đã đặt trước", value: "RESERVED" },
  { label: "Ngừng sử dụng", value: "DISABLED" },
];

const OWNER_TABLE_STATUS_BY_CODE: Record<number, OwnerTableStatus> = {
  0: "AVAILABLE",
  1: "OCCUPIED",
  2: "RESERVED",
  3: "DISABLED",
};

export const normalizeOwnerTableStatus = (
  status?: OwnerTableStatus | number | null
): OwnerTableStatus | undefined => {
  if (typeof status === "number") {
    return OWNER_TABLE_STATUS_BY_CODE[status];
  }

  return status ?? undefined;
};

export const getOwnerTableStatusLabel = (status?: OwnerTableStatus | number | null) => {
  const normalizedStatus = normalizeOwnerTableStatus(status);

  if (!normalizedStatus) {
    return "-";
  }

  return getTableStatusLabel(normalizedStatus);
};

export const getOwnerTableStatusTone = (status?: OwnerTableStatus | number | null) => {
  const normalizedStatus = normalizeOwnerTableStatus(status);

  if (normalizedStatus === "AVAILABLE") {
    return "success" as const;
  }

  if (normalizedStatus === "RESERVED") {
    return "warning" as const;
  }

  if (normalizedStatus === "DISABLED") {
    return "default" as const;
  }

  return "destructive" as const;
};

export const activeFilterToQuery = (filter: OwnerTableActiveFilter) => {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
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

export const getActiveLabel = (value?: boolean | null) => {
  if (value === undefined || value === null) {
    return "-";
  }

  return value ? "Đang hoạt động" : "Ngừng hoạt động";
};

export const getOwnerTableErrorMessage = (error: unknown, fallback: string) => {
  return getVietnameseApiErrorMessage(error, fallback);
};

export const isForbiddenError = (error: unknown) => {
  return error instanceof AxiosError && error.response?.status === 403;
};

export const emptyOwnerTableForm: OwnerTableFormValues = {
  tableNumber: "",
  capacity: "2",
};

export const toOwnerTableFormValues = (
  table?: OwnerTableResponse | null
): OwnerTableFormValues => ({
  tableNumber: table?.tableNumber ?? "",
  capacity: table?.capacity === undefined ? "2" : String(table.capacity),
});

export const getOwnerTablePayload = (form: OwnerTableFormValues) => ({
  tableNumber: form.tableNumber.trim(),
  capacity: Number(form.capacity),
});

export type TableManagementPortal = ManagePortal;

export const getTablePortalCopy = (portal: TableManagementPortal) => getPortalCopy(portal);

export const getTablePortalNavItems = (
  portal: TableManagementPortal,
  branchId: string
): PortalNavItem[] => getManageMenuNavItems(portal, "tables", branchId);

export const getOwnerTableListPath = (branchId: string, portal: TableManagementPortal = "owner") =>
  portal === "owner" ? PATH.owner.branchTables(branchId) : PATH.manager.branchTables(branchId);

export const getOwnerTableCreatePath = (
  branchId: string,
  portal: TableManagementPortal = "owner"
) =>
  portal === "owner"
    ? PATH.owner.branchTableCreate(branchId)
    : PATH.manager.branchTableCreate(branchId);

export const getOwnerTableDetailPath = (
  branchId: string,
  tableId: string,
  portal: TableManagementPortal = "owner"
) =>
  portal === "owner"
    ? PATH.owner.branchTableDetail(branchId, tableId)
    : PATH.manager.branchTableDetail(branchId, tableId);

export const downloadQrBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const getQrFileName = (
  table?: Pick<OwnerTableResponse, "tableNumber" | "tableId"> | null
) => {
  const suffix = table?.tableNumber || table?.tableId || "table";

  return `scannow-table-${suffix}-qr.png`;
};
