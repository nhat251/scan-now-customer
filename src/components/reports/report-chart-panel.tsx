import type { ReactNode } from "react";

type ReportChartPanelProps = {
  title: string;
  icon: ReactNode;
  subtitle?: string;
  children: ReactNode;
};

export const ReportChartPanel = ({ title, icon, subtitle, children }: ReportChartPanelProps) => (
  <div className="bg-card border-border/60 min-w-0 rounded-xl border p-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-primary shrink-0">{icon}</span>
          <h2 className="truncate text-base font-bold">{title}</h2>
        </div>
        {subtitle ? (
          <p className="text-muted-foreground mt-0.5 truncate text-xs font-semibold">{subtitle}</p>
        ) : null}
      </div>
    </div>
    <div className="mt-3 min-w-0">{children}</div>
  </div>
);
