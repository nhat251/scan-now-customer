export const ROLE_LABELS = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  BRANCH_MANAGER: "Branch Manager",
  STAFF: "Staff",
  KITCHEN: "Kitchen",
  CASHIER: "Cashier",
} as const;

export const getRoleLabel = (role?: string | null) => {
  if (!role) {
    return "Unknown role";
  }

  return ROLE_LABELS[role.toUpperCase() as keyof typeof ROLE_LABELS] ?? role;
};
