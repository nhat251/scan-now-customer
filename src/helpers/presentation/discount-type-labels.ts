const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  FIXED_AMOUNT: "Giảm số tiền cố định",
  PERCENT: "Giảm theo phần trăm",
};

export const getDiscountTypeLabel = (type?: string | null) => {
  if (!type) {
    return "Loại giảm giá không xác định";
  }

  return DISCOUNT_TYPE_LABELS[type.toUpperCase()] ?? "Loại giảm giá không xác định";
};
