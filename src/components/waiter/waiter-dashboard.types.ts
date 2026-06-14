import type { MyMenuItemResponse } from "@/types/me";

export type WaiterView = "orders" | "table-map" | "create-order" | "menu" | "profile";

export type WaiterCartItem = {
  menuItem: MyMenuItemResponse;
  qty: number;
};

export type OrderFilter = "all" | "pending" | "preparing" | "ready";
