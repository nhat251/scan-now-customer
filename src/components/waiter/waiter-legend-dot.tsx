import { cn } from "@/lib/utils";

export function WaiterLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}
