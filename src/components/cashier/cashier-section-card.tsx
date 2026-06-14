import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CashierSectionCardProps = {
  className?: string;
  children: ReactNode;
};

export const CashierSectionCard = ({ className, children }: CashierSectionCardProps) => (
  <section className={cn("rounded-2xl border border-[#e8e4dc] bg-white shadow-sm", className)}>
    {children}
  </section>
);
