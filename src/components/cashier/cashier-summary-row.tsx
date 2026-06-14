import { cn } from "@/lib/utils";

export function CashierSummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className={cn("font-bold text-stone-900", valueClassName)}>{value}</span>
    </div>
  );
}
