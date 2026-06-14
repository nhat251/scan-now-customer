const ORDER_SOURCE_LABELS: Record<string, string> = {
  CASHIER: "Thu ngân tạo",
  CUSTOMER: "Khách hàng tự đặt",
  STAFF: "Nhân viên phục vụ tạo",
  WAITER: "Nhân viên phục vụ tạo",
};

export const getOrderSourceLabel = (source?: string | null) => {
  if (!source) {
    return "Nguồn đơn không xác định";
  }

  return ORDER_SOURCE_LABELS[source.toUpperCase()] ?? "Nguồn đơn không xác định";
};
