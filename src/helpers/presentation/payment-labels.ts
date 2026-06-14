const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  PAYOS: "PayOS",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "MoMo",
  VNPAY: "VNPay",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  NO_PAYMENT: "Chưa thanh toán",
  PENDING: "Đang chờ thanh toán",
  SUCCESS: "Thanh toán thành công",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

export const getPaymentMethodLabel = (method?: string | null) => {
  if (!method) {
    return "Phương thức thanh toán không xác định";
  }

  return PAYMENT_METHOD_LABELS[method.toUpperCase()] ?? "Phương thức thanh toán không xác định";
};

export const getPaymentStatusLabel = (status?: string | null) => {
  if (!status) {
    return "Chưa thanh toán";
  }

  return PAYMENT_STATUS_LABELS[status.toUpperCase()] ?? "Trạng thái thanh toán không xác định";
};
