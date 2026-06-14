import { cn } from "@/lib/utils";

export function CashierMetricCard({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: string;
  helper: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#e8e4dc] bg-stone-50 px-4 py-3", className)}>
      <p className="text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">{label}</p>
      <p className="mt-2 text-lg font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{helper}</p>
    </div>
  );
}
