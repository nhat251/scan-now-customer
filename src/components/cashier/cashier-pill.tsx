import { cn } from "@/lib/utils";

type CashierPillProps = {
  label: string;
  className: string;
};

export const CashierPill = ({ label, className }: CashierPillProps) => (
  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", className)}>
    {label}
  </span>
);
