import { cn } from "@/lib/utils";

export function CashierLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", color)} />
      <span className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
        {label}
      </span>
    </div>
  );
}
