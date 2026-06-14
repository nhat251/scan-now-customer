import type { OrderItemStatus, OrderStatus } from "@/types/order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PendingConfirmation: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Preparing: "Đang chuẩn bị",
  PartiallyReady: "Một phần món đã sẵn sàng",
  ReadyToServe: "Sẵn sàng phục vụ",
  PartiallyServed: "Đã phục vụ một phần",
  Served: "Đã phục vụ",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Cooking: "Đang chế biến",
  Ready: "Sẵn sàng phục vụ",
  Served: "Đã phục vụ",
  Cancelled: "Đã hủy",
};

export const getOrderStatusLabel = (status?: string | null) => {
  if (!status) {
    return "Trạng thái đơn không xác định";
  }

  return ORDER_STATUS_LABELS[status as OrderStatus] ?? "Trạng thái đơn không xác định";
};

export const getOrderItemStatusLabel = (status?: string | null) => {
  if (!status) {
    return "Trạng thái món không xác định";
  }

  return ORDER_ITEM_STATUS_LABELS[status as OrderItemStatus] ?? "Trạng thái món không xác định";
};
