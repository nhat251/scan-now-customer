const TABLE_STATUS_BY_CODE: Record<number, string> = {
  0: "AVAILABLE",
  1: "OCCUPIED",
  2: "RESERVED",
  3: "DISABLED",
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Còn trống",
  OCCUPIED: "Đang có khách",
  RESERVED: "Đã đặt trước",
  DISABLED: "Ngừng sử dụng",
};

export const normalizeTableStatus = (status?: string | number | null): string | undefined => {
  if (typeof status === "number") {
    return TABLE_STATUS_BY_CODE[status];
  }

  return status?.toUpperCase() || undefined;
};

export const getTableStatusLabel = (status?: string | number | null) => {
  const normalizedStatus = normalizeTableStatus(status);

  if (!normalizedStatus) {
    return "Trạng thái bàn không xác định";
  }

  return TABLE_STATUS_LABELS[normalizedStatus] ?? "Trạng thái bàn không xác định";
};
