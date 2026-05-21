import { create } from "zustand";

import { clearStoredAccessToken, setStoredAccessToken } from "@/lib/auth";
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
};

const initialState: UserState = {
  isLogin: false,
  isAuthInitialized: false,
  user: null,
};

export const useUserStore = create<UserStore>((set) => ({
  ...initialState,

  login: ({ user, accessToken }) => {
    setStoredAccessToken(accessToken);

    set({
      isLogin: Boolean(user),
      isAuthInitialized: true,
      user,
    });
  },
  logout: () => {
    clearStoredAccessToken();
    set({
      ...initialState,
      isAuthInitialized: true,
    });
  },
  setAuthInitialized: (isAuthInitialized) => set({ isAuthInitialized }),
  setUser: (user) =>
    set({
      user,
      isLogin: Boolean(user),
    }),
  setAccessToken: (accessToken) => {
    setStoredAccessToken(accessToken);
  },
}));

export const login = (payload: { user: AuthUser | null; accessToken: string }) =>
  useUserStore.getState().login(payload);
export const logout = () => useUserStore.getState().logout();
export const setAuthInitialized = (isAuthInitialized: boolean) =>
  useUserStore.getState().setAuthInitialized(isAuthInitialized);
export const setUser = (user: AuthUser | null) => useUserStore.getState().setUser(user);
export const setAccessToken = (accessToken: string) => useUserStore.getState().setAccessToken(accessToken);
export const getUser = () => useUserStore.getState().user;
export const getIsLogin = () => useUserStore.getState().isLogin;
export const getIsAuthInitialized = () => useUserStore.getState().isAuthInitialized;
