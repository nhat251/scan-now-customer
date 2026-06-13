export type UserRole = "ADMIN" | "OWNER" | "MANAGER" | "STAFF" | "KITCHEN" | "CASHIER" | (string & {});

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type AuthPayload = {
  user: AuthUser | null;
  accessToken: string;
};
