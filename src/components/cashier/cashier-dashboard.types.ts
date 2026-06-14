import type { MyMenuItemResponse } from "@/types/me";

export type CashierView = "orders" | "tables" | "create" | "history" | "report";

export type CashierCartItem = {
  menuItem: MyMenuItemResponse;
  qty: number;
};
