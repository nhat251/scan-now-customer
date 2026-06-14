"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, LogOut, Store } from "lucide-react";

import { PortalIconButton } from "@/components/auth/portal-icon-button";
import { PortalNavLink } from "@/components/auth/portal-nav-link";
import { getPortalInitials } from "@/components/auth/portal-shell.helpers";
import type { PortalShellProps } from "@/components/auth/portal-shell.types";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { getRoleLabel } from "@/constants/roleLabels";
import { useLogoutMutation } from "@/hooks/mutations/useLogoutMutation";

export type { PortalNavItem } from "@/components/auth/portal-shell.types";
export { PortalStatCard } from "@/components/auth/portal-stat-card";

export const PortalShell = ({
  children,
  title,
  description,
  portalLabel,
  portalName,
  navItems,
  topbarTitle,
  currentUser,
  headerAction,
  stats,
  branchName,
  branchId,
}: PortalShellProps) => {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const mainNavItems = navItems.filter((item) => item.section !== "branch");
  const branchNavItems = navItems.filter((item) => item.section === "branch");

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Client auth state is cleared by the mutation error handler.
    } finally {
      router.replace(PATH.auth.login);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <aside className="bg-card border-border/60 fixed top-0 left-0 hidden h-screen w-64 flex-col border-r lg:flex">
        <div className="px-6 pt-8 pb-6">
          <h2 className="text-primary text-3xl font-black tracking-tight">ScanNow</h2>
          <p className="text-muted-foreground mt-1 text-sm">{portalLabel}</p>
        </div>

        {branchName ? (
          <div className="border-border/60 from-primary/5 to-primary/10 mx-3 mb-2 rounded-xl border bg-gradient-to-br px-4 py-3">
            <p className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
              Chi nhánh hiện tại
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Store className="text-primary size-4 shrink-0" />
              <p className="truncate text-sm font-bold">{branchName}</p>
            </div>
            {branchId ? (
              <Link
                href={PATH.owner.branchDetail(branchId)}
                className="text-primary/80 hover:text-primary mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-colors"
              >
                <ChevronLeft className="size-3" />
                Chi tiết chi nhánh
              </Link>
            ) : null}
          </div>
        ) : null}

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <PortalNavLink key={`${item.href}-${item.label}`} item={item} />
            ))}
          </div>

          {branchNavItems.length > 0 ? (
            <div className="border-border/60 border-t pt-4">
              <p className="text-muted-foreground px-4 pb-2 text-[10px] font-bold tracking-[0.2em] uppercase">
                Công cụ chi nhánh
              </p>
              <div className="space-y-1">
                {branchNavItems.map((item) => (
                  <PortalNavLink key={`${item.href}-${item.label}`} item={item} />
                ))}
              </div>
            </div>
          ) : null}
        </nav>

        <div className="border-border/60 mt-auto border-t p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold">
              {getPortalInitials(currentUser?.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {currentUser?.fullName ?? portalName}
              </p>
              <p className="text-muted-foreground truncate text-xs tracking-[0.18em] uppercase">
                {currentUser?.role ? getRoleLabel(currentUser.role) : portalLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="bg-card border-border/60 sticky top-0 z-30 border-b shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-end lg:px-8">
            <div className="flex items-center gap-4 self-end lg:self-auto">
              <PortalIconButton>
                <Bell className="size-4" />
              </PortalIconButton>
              <div className="bg-border hidden h-8 w-px md:block" />
              <span className="text-primary hidden text-lg font-bold md:inline">{topbarTitle}</span>
              <Button variant="outline" onClick={handleLogout} disabled={logoutMutation.isPending}>
                <LogOut className="size-4" />
                {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase">
                  {portalName}
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
                  {description}
                </p>
              </div>
              {headerAction}
            </section>

            {stats ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats}</section>
            ) : null}

            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
