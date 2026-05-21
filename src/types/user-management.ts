export type UserRole = "OWNER" | "BRANCH_MANAGER" | "STAFF" | "KITCHEN";

export type ManagedUserRole = Exclude<UserRole, "OWNER">;
export type ManagerUserRoleOption = Extract<ManagedUserRole, "STAFF" | "KITCHEN">;

export type BranchResponse = {
  branchId: string;
  restaurantId: string;
  managerId?: string | null;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  isActive: boolean;
  vatPercent: number;
  serviceChargePercent: number;
  serviceChargeFixed: number;
  createdAt: string;
  updatedAt?: string | null;
};

export type OwnerScopedUserResponse = {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: ManagedUserRole;
  restaurantId: string;
  restaurantName: string;
  branchIds: string[];
  branchNames: string[];
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
};

export type ManagerScopedUserResponse = {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: ManagerUserRoleOption;
  branchIds: string[];
  branchNames: string[];
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
};

export type UserListQuery = {
  pageNumber: number;
  pageSize: number;
  search?: string;
  role?: string;
  branchId?: string;
  isActive?: boolean;
  isBanned?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CreateManagedUserRequest = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role: ManagedUserRole;
  branchIds: string[];
};

export type UpdateManagedUserRequest = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  role: ManagedUserRole;
  branchIds: string[];
};

export type UserStatusFilter = "all" | "active" | "inactive" | "banned";

export type UserFormValues = {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: ManagedUserRole;
  branchIds: string[];
};
