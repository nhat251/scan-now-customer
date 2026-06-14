import { maxReportValue } from "@/components/reports/report-chart.helpers";
import type { SingleMetricPoint } from "@/components/reports/report-dashboard.types";
import { ReportMetricBar } from "@/components/reports/report-metric-bar";

type ReportMetricBarChartProps = {
  data: SingleMetricPoint[];
  color: string;
  formatValue: (value: number) => string;
};

export const ReportMetricBarChart = ({ data, color, formatValue }: ReportMetricBarChartProps) => {
  const max = maxReportValue(data.map((item) => item.value));

  return (
    <div
      className="grid h-48 min-w-0 items-end gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
      }}
    >
      {data.map((item) => (
        <ReportMetricBar
          key={item.label}
          item={item}
          color={color}
          max={max}
          formatValue={formatValue}
        />
      ))}
    </div>
  );
};
