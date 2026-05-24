import { PATH } from "@/constants/path";
import type { AuthUser } from "@/types/auth";

export const AUTH_TOKEN_STORAGE_KEY = "jwt";
export const AUTH_USER_STORAGE_KEY = "auth-user";

const ROLE_REDIRECTS = {
  ADMIN: PATH.dashboards.admin,
  OWNER: PATH.owner.users,
  MANAGER: PATH.manager.users,
  BRANCH_MANAGER: PATH.me.branches,
  STAFF: PATH.me.branches,
  KITCHEN: PATH.me.branches,
} as const;

const isBrowser = () => typeof window !== "undefined";

export const getStoredAccessToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setStoredAccessToken = (token: string) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAccessToken = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const getStoredAuthUser = () => {
  if (!isBrowser()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

export const setStoredAuthUser = (user: AuthUser | null) => {
  if (!isBrowser()) {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredAuthUser = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

export const getRoleRedirectPath = (role?: string | null) => {
  if (!role) {
    return PATH.home;
  }

  return ROLE_REDIRECTS[role.toUpperCase() as keyof typeof ROLE_REDIRECTS] ?? PATH.home;
};

export const hasStoredAccessToken = () => Boolean(getStoredAccessToken());

export const isAuthenticated = () => hasStoredAccessToken();

export const shouldBlockLoginAccess = (user: AuthUser | null) => {
  return Boolean(user && isAuthenticated());
};

export const clearStoredAuthSession = () => {
  clearStoredAccessToken();
  clearStoredAuthUser();
};

export const setStoredAuthSession = ({ accessToken, user }: { accessToken: string; user: AuthUser | null }) => {
  setStoredAccessToken(accessToken);
  setStoredAuthUser(user);
};

export const getStoredAuthSession = () => {
  const accessToken = getStoredAccessToken();
  const user = getStoredAuthUser();

  if (!accessToken || !user) {
    return null;
  }

  return {
    accessToken,
    user,
  };
};
