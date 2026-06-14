import type { ReactNode } from "react";

type VoucherMetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export const VoucherMetric = ({ icon, label, value }: VoucherMetricProps) => (
  <div className="bg-muted/40 rounded-lg p-3">
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
      {icon}
      {label}
    </div>
    <p className="mt-1 truncate text-sm font-bold">{value}</p>
  </div>
);
