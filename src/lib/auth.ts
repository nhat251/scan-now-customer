import { PATH } from "@/constants/path";
import type { AuthUser } from "@/types/auth";

export const AUTH_TOKEN_STORAGE_KEY = "jwt";

const ROLE_REDIRECTS = {
  ADMIN: PATH.dashboards.admin,
  OWNER: PATH.dashboards.owner,
  MANAGER: PATH.dashboards.manager,
  STAFF: PATH.dashboards.staff,
  KITCHEN: PATH.dashboards.kitchen,
} as const;

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setStoredAccessToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const getRoleRedirectPath = (role?: string | null) => {
  if (!role) {
    return PATH.home;
  }

  return ROLE_REDIRECTS[role.toUpperCase() as keyof typeof ROLE_REDIRECTS] ?? PATH.home;
};

export const isAuthenticated = () => Boolean(getStoredAccessToken());

export const shouldBlockLoginAccess = (user: AuthUser | null) => {
  return Boolean(user && isAuthenticated());
};
