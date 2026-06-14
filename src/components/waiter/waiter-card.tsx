import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WaiterCardProps = {
  className?: string;
  children: ReactNode;
};

export const WaiterCard = ({ className, children }: WaiterCardProps) => (
  <section className={cn("rounded-2xl border border-[#e8e4dc] bg-white shadow-sm", className)}>
    {children}
  </section>
);
