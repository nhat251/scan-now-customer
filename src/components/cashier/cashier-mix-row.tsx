import { cn } from "@/lib/utils";

export function CashierMixRow({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="text-stone-500">
          {value} · {percent}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
