import { create } from "zustand";

import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAccessToken,
  setStoredAuthSession,
  setStoredAuthUser,
} from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

type UserState = {
  isLogin: boolean;
  isAuthInitialized: boolean;
  user: AuthUser | null;
};

type UserStore = UserState & {
  login: (payload: { user: AuthUser | null; accessToken: string }) => void;
  logout: () => void;
  setAuthInitialized: (isAuthInitialized: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (accessToken: string) => void;
  hydrateFromStorage: () => void;
};

const getInitialState = (): UserState => {
  const storedSession = getStoredAuthSession();

  return {
    isLogin: Boolean(storedSession?.user),
    isAuthInitialized: false,
    user: storedSession?.user ?? null,
  };
};

export const useUserStore = create<UserStore>((set) => ({
  ...getInitialState(),

  login: ({ user, accessToken }) => {
    setStoredAuthSession({ user, accessToken });
    set({
      isLogin: Boolean(user),
      isAuthInitialized: true,
      user,
    });
  },
  logout: () => {
    clearStoredAuthSession();
    set({
      isLogin: false,
      isAuthInitialized: true,
      user: null,
    });
  },
  setAuthInitialized: (isAuthInitialized) => set({ isAuthInitialized }),
  setUser: (user) => {
    setStoredAuthUser(user);
    set({
      user,
      isLogin: Boolean(user),
    });
  },
  setAccessToken: (accessToken) => {
    setStoredAccessToken(accessToken);
  },
  hydrateFromStorage: () => {
    const storedSession = getStoredAuthSession();

    set({
      isLogin: Boolean(storedSession?.user),
      user: storedSession?.user ?? null,
    });
  },
}));

export const login = (payload: { user: AuthUser | null; accessToken: string }) =>
  useUserStore.getState().login(payload);
export const logout = () => useUserStore.getState().logout();
export const setAuthInitialized = (isAuthInitialized: boolean) =>
  useUserStore.getState().setAuthInitialized(isAuthInitialized);
export const setUser = (user: AuthUser | null) => useUserStore.getState().setUser(user);
export const setAccessToken = (accessToken: string) =>
  useUserStore.getState().setAccessToken(accessToken);
export const hydrateUserSession = () => useUserStore.getState().hydrateFromStorage();
export const getUser = () => useUserStore.getState().user;
export const getIsLogin = () => useUserStore.getState().isLogin;
export const getIsAuthInitialized = () => useUserStore.getState().isAuthInitialized;
