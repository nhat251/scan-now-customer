import Link from "next/link";

import type { PortalNavItem } from "@/components/auth/portal-shell.types";
import { cn } from "@/lib/utils";

type PortalNavLinkProps = {
  item: PortalNavItem;
};

export const PortalNavLink = ({ item }: PortalNavLinkProps) => (
  <Link
    href={item.href}
    className={cn(
      "text-muted-foreground hover:bg-muted/70 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
      item.active && "bg-primary/10 text-primary border-primary rounded-r-none border-r-4"
    )}
  >
    <span className="size-4">{item.icon}</span>
    <span>{item.label}</span>
  </Link>
);
