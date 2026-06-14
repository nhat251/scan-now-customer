import { cn } from "@/lib/utils";

type WaiterPillProps = {
  label: string;
  className: string;
};

export const WaiterPill = ({ label, className }: WaiterPillProps) => (
  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", className)}>
    {label}
  </span>
);
