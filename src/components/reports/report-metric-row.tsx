type ReportMetricRowProps = {
  color: string;
  label: string;
  value: string;
  percent: number;
};

export const ReportMetricRow = ({ color, label, value, percent }: ReportMetricRowProps) => (
  <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground font-semibold">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  </div>
);
