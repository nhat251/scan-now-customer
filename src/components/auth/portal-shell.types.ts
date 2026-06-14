import type { ReactNode } from "react";

import type { AuthUser } from "@/types/auth";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
  section?: "main" | "branch";
};

export type PortalShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  portalLabel: string;
  portalName: string;
  navItems: PortalNavItem[];
  topbarTitle: string;
  currentUser?: Pick<AuthUser, "fullName" | "role" | "avatarUrl"> | null;
  headerAction?: ReactNode;
  stats?: ReactNode;
  branchName?: string;
  branchId?: string;
};
