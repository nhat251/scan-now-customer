"use client";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { PortalShell } from "@/components/auth/portal-shell";
import type { AuthUser } from "@/types/auth";

import { WaiterMobileShell } from "./waiter-mobile-shell";

type MeRoleShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  portalLabel: string;
  portalName: string;
  navItems: PortalNavItem[];
  topbarTitle: string;
  currentUser?: Pick<AuthUser, "fullName" | "role" | "avatarUrl"> | null;
  headerAction?: React.ReactNode;
  stats?: React.ReactNode;
  branchName?: string;
  branchId?: string;
};

type WaiterActive = "orders" | "tables" | "create" | "menu" | "profile" | "kitchen";

const getWaiterActive = (navItems: PortalNavItem[]): WaiterActive => {
  const activeHref = navItems.find((item) => item.active)?.href ?? "";

  if (activeHref.includes("/orders")) {
    return "orders";
  }

  if (activeHref.includes("/tables")) {
    return "tables";
  }

  if (activeHref.includes("/menu")) {
    return "menu";
  }

  if (activeHref.includes("/kitchen")) {
    return "kitchen";
  }

  return "profile";
};

export const MeRoleShell = ({
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
}: MeRoleShellProps) => {
  if (!branchId) {
    return (
      <PortalShell
        title={title}
        description={description}
        portalLabel={portalLabel}
        portalName={portalName}
        navItems={navItems}
        topbarTitle={topbarTitle}
        currentUser={currentUser}
        headerAction={headerAction}
        stats={stats}
        branchName={branchName}
        branchId={branchId}
      >
        {children}
      </PortalShell>
    );
  }

  return (
    <WaiterMobileShell
      title={title}
      branchId={branchId}
      branchName={branchName ?? topbarTitle}
      active={getWaiterActive(navItems)}
      currentUser={currentUser}
      actions={headerAction}
      stats={stats}
    >
      {children}
    </WaiterMobileShell>
  );
};
