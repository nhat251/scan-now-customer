export type UserRole = "OWNER" | "BRANCH_MANAGER" | "STAFF" | "KITCHEN";

export type ManagedUserRole = Exclude<UserRole, "OWNER">;

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

export type BranchResponse = {
  branchId: string;
  restaurantId: string;
  managerId?: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  openTime?: string;
  closeTime?: string;
  isActive: boolean;
  vatPercent: number;
  serviceChargePercent: number;
  serviceChargeFixed: number;
  createdAt: string;
  updatedAt?: string;
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
