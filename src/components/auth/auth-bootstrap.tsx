"use client";

import { useEffect } from "react";

import { refreshTokenRequest } from "@/services/auth";
import { login, setAuthInitialized, useUserStore } from "@/stores/user";

export const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (isAuthInitialized || user) {
      if (!isAuthInitialized) {
        setAuthInitialized(true);
      }

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
  }, [isAuthInitialized, user]);

  return children;
};
