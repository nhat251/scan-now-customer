export type UserRole = "OWNER" | "BRANCH_MANAGER" | "STAFF" | "KITCHEN" | "CASHIER";

export type ManagedUserRole = Exclude<UserRole, "OWNER">;
export type ManagerUserRoleOption = Extract<ManagedUserRole, "KITCHEN" | "STAFF">;

export type RestaurantResponse = {
  restaurantId?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string | null;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  description?: string | null;
  totalBranches?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
};

export type UpdateRestaurantRequest = {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  description?: string | null;
};

export type BranchResponse = {
  branchId: string;
  restaurantId: string;
  managerId?: string | null;
  managerName?: string | null;
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

export type OwnerBranchListQuery = {
  pageNumber: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type CreateBranchRequest = {
  name?: string;
  slug?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  vatPercent?: number;
  serviceChargePercent?: number;
  serviceChargeFixed?: number;
};

export type UpdateBranchRequest = CreateBranchRequest;

export type OwnerBranchFormValues = {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  vatPercent: string;
  serviceChargePercent: string;
  serviceChargeFixed: string;
};

export type OwnerRestaurantFormValues = {
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
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

export type CreateManagerUserRequest = Omit<CreateManagedUserRequest, "role"> & {
  role: ManagerUserRoleOption;
};

export type UpdateManagerUserRequest = Omit<UpdateManagedUserRequest, "role"> & {
  role: ManagerUserRoleOption;
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

export type ManagerUserFormValues = Omit<UserFormValues, "role"> & {
  role: ManagerUserRoleOption;
};
