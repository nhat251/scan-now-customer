import type { ReactNode } from "react";

export type MobileNavItem = {
  key: string;
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
};
