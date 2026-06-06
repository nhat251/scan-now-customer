import { LayoutDashboard, Settings, Store, Users } from "lucide-react";

import type { PortalNavItem } from "@/components/auth/portal-shell";
import { PATH } from "@/constants/path";

export type OwnerPortalSection = "dashboard" | "restaurant" | "branches" | "users" | "settings";

export const getOwnerPortalNavItems = (activeSection: OwnerPortalSection): PortalNavItem[] => {
  return [
    {
      label: "Tổng quan",
      href: PATH.dashboards.owner,
      icon: <LayoutDashboard className="size-4" />,
      active: activeSection === "dashboard",
    },
    {
      label: "Nhà hàng",
      href: PATH.owner.restaurant,
      icon: <Store className="size-4" />,
      active: activeSection === "restaurant",
    },
    {
      label: "Chi nhánh",
      href: PATH.owner.branches,
      icon: <Store className="size-4" />,
      active: activeSection === "branches",
    },
    {
      label: "Nhân sự",
      href: PATH.owner.users,
      icon: <Users className="size-4" />,
      active: activeSection === "users",
    },
    {
      label: "Cài đặt",
      href: PATH.owner.settings,
      icon: <Settings className="size-4" />,
      active: activeSection === "settings",
    },
  ];
};
