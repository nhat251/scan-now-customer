"use client";

import { useEffect } from "react";

import { hasStoredAccessToken } from "@/lib/auth";
import { refreshTokenRequest } from "@/services/auth";
import { hydrateUserSession, login, setAuthInitialized, useUserStore } from "@/stores/user";

export const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const user = useUserStore((state) => state.user);
  const isLogin = useUserStore((state) => state.isLogin);

  useEffect(() => {
    hydrateUserSession();
  }, []);

  useEffect(() => {
    if (isAuthInitialized) {
      return;
    }

    if (user || isLogin) {
      setAuthInitialized(true);
      return;
    }

    if (!hasStoredAccessToken()) {
      setAuthInitialized(true);
      return;
    }

    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const response = await refreshTokenRequest();

        if (!isMounted) {
          return;
        }

        login(response.result);
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthInitialized(true);
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [isAuthInitialized, isLogin, user]);

  return children;
};
