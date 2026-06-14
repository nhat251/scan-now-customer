import type { ReactNode } from "react";

type ReportInsightCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  color: string;
};

export const ReportInsightCard = ({
  label,
  value,
  helper,
  icon,
  color,
}: ReportInsightCardProps) => (
  <div className="bg-card border-border/60 min-w-0 rounded-xl border p-3 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground truncate text-xs font-bold uppercase">{label}</p>
      <span className="shrink-0 rounded-md p-1.5 text-white" style={{ backgroundColor: color }}>
        {icon}
      </span>
    </div>
    <p className="mt-2 truncate text-lg font-black">{value}</p>
    <p className="text-muted-foreground truncate text-xs">{helper}</p>
  </div>
);
