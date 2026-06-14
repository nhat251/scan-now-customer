import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ReportPeriodButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

export const ReportPeriodButton = ({ active, onClick, children }: ReportPeriodButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 rounded-md px-2 text-xs font-bold transition-colors sm:px-3 sm:text-sm",
      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);
