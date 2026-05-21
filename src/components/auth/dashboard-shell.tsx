"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useLogoutMutation } from "@/hooks/mutations/useLogoutMutation";
import { useUserStore } from "@/stores/user";
import type { UserRole } from "@/types/auth";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  allowedRole: UserRole;
};

export const DashboardShell = ({ children, title, description, allowedRole }: DashboardShellProps) => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace(PATH.auth.login);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[allowedRole]}>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="bg-card flex flex-col gap-6 rounded-3xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">Protected dashboard</p>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>

            <Button disabled={logoutMutation.isPending} onClick={handleLogout} type="button" variant="outline">
              <LogOut className="size-4" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>

          <div className="grid gap-4 rounded-2xl border border-dashed p-5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">Current user</p>
              <p className="text-base font-semibold">{user?.fullName ?? user?.username ?? "Unknown user"}</p>
              <p className="text-muted-foreground text-sm">{user?.email ?? "No email available"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">Role</p>
              <p className="text-base font-semibold">{user?.role ?? allowedRole}</p>
              <p className="text-muted-foreground text-sm">Only the matching role can stay on this route after auth bootstrap.</p>
            </div>
          </div>

          {children}
        </section>
      </main>
    </ProtectedRoute>
  );
};
