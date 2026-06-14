import Link from "next/link";

import type { MobileNavItem } from "@/components/me/waiter-mobile-shell.types";
import { cn } from "@/lib/utils";

type WaiterNavItemProps = {
  item: MobileNavItem;
  active: boolean;
};

export const WaiterNavItem = ({ item, active }: WaiterNavItemProps) => {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-w-[68px] flex-col items-center gap-1 py-2 text-[10px] transition-colors",
        active ? "text-primary-container" : "text-stone-400"
      )}
    >
      {item.icon}
      <span className={cn("font-medium", active && "font-bold")}>{item.label}</span>
    </Link>
  );
};
