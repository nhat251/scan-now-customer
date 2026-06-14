import { getOrderStatusLabel } from "@/helpers/presentation";
import type { MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

import type { OrderFilter } from "./waiter-dashboard.types";

const ORDER_STATUS_CLASS_NAMES: Record<string, string> = {
  PendingConfirmation: "bg-amber-100 text-amber-700",
  Confirmed: "bg-primary-container/20 text-primary-container",
  Preparing: "bg-orange-100 text-orange-700",
  PartiallyReady: "bg-lime-100 text-lime-700",
  ReadyToServe: "bg-emerald-100 text-emerald-700",
  PartiallyServed: "bg-slate-100 text-slate-700",
  Served: "bg-slate-100 text-slate-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

export const getWaiterOrderStatusMeta = (status: string) => ({
  label: getOrderStatusLabel(status),
  className: ORDER_STATUS_CLASS_NAMES[status] ?? "bg-slate-100 text-slate-700",
});

export const getWaiterOrderFilterGroup = (order: OwnerTableOrderHistoryResponse): OrderFilter => {
  if (order.status === "PendingConfirmation") {
    return "pending";
  }

  if (order.status === "PartiallyReady" || order.status === "ReadyToServe") {
    return "ready";
  }

  return "preparing";
};

export const getWaiterTableState = (table: MyTableResponse) => {
  if (table.status === "DISABLED") {
    return "disabled";
  }

  return table.currentSession ? "occupied" : "available";
};
