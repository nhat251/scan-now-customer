"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PATH } from "@/constants/path";
import { getRoleRedirectPath } from "@/lib/auth";
import { useUserStore } from "@/stores/user";
import type { UserRole } from "@/types/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
};

export const ProtectedRoute = ({
  children,
  allowedRoles,
  fallbackPath = PATH.auth.login,
}: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const isLogin = useUserStore((state) => state.isLogin);
  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const normalizedRoles = useMemo(
    () => allowedRoles?.map((role) => role.toUpperCase()),
    [allowedRoles]
  );

  useEffect(() => {
    if (!isAuthInitialized) {
      return;
    }

    if (!isLogin || !user) {
      router.replace(fallbackPath);
      return;
    }

    if (!normalizedRoles?.length) {
      return;
    }

    const currentRole = user.role.toUpperCase();

    if (!normalizedRoles.includes(currentRole)) {
      const redirectPath = getRoleRedirectPath(user.role);

      if (redirectPath !== pathname) {
        router.replace(redirectPath);
      }
    }
  }, [fallbackPath, isAuthInitialized, isLogin, normalizedRoles, pathname, router, user]);

  if (!isAuthInitialized) {
    return null;
  }

  if (!isLogin || !user) {
    return null;
  }

  if (normalizedRoles?.length && !normalizedRoles.includes(user.role.toUpperCase())) {
    return null;
  }

  return children;
};
