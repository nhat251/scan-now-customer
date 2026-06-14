export const ROLE_LABELS = {
  ADMIN: "Quản trị viên hệ thống",
  OWNER: "Chủ nhà hàng",
  MANAGER: "Quản lý",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  STAFF: "Nhân viên phục vụ",
  KITCHEN: "Nhân viên bếp",
  CASHIER: "Thu ngân",
} as const;

export const getRoleLabel = (role?: string | null) => {
  if (!role) {
    return "Vai trò không xác định";
  }

  return ROLE_LABELS[role.toUpperCase() as keyof typeof ROLE_LABELS] ?? "Vai trò không xác định";
};
