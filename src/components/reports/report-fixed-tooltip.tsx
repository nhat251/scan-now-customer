import type { ReactNode } from "react";

type ReportFixedTooltipProps = {
  x: number;
  y: number;
  children: ReactNode;
};

export const ReportFixedTooltip = ({ x, y, children }: ReportFixedTooltipProps) => (
  <div
    className="pointer-events-none fixed z-50 w-max max-w-60 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-2xl ring-1 ring-white/10 [&_*]:text-white"
    style={{ left: x, top: y + 12 }}
  >
    {children}
  </div>
);
