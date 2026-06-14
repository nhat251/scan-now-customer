const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  ALL: "Tất cả",
  BANNED: "Đã khóa",
  INACTIVE: "Ngừng hoạt động",
};

export const getUserStatusLabel = (status?: string | null) => {
  if (!status) {
    return "Trạng thái tài khoản không xác định";
  }

  return USER_STATUS_LABELS[status.toUpperCase()] ?? "Trạng thái tài khoản không xác định";
};
