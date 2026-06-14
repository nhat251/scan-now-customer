import { formatReportPercent } from "@/components/reports/report-chart.helpers";
import { ReportDonutChart } from "@/components/reports/report-donut-chart";
import { ReportMetricRow } from "@/components/reports/report-metric-row";

type ReportOrderStatusSummaryProps = {
  completionRate: number;
  completedOrders: number;
  pendingOrders: number;
};

export const ReportOrderStatusSummary = ({
  completionRate,
  completedOrders,
  pendingOrders,
}: ReportOrderStatusSummaryProps) => (
  <div className="grid gap-3 sm:grid-cols-[108px_1fr] sm:items-center xl:grid-cols-1 2xl:grid-cols-[108px_1fr]">
    <ReportDonutChart
      value={completionRate}
      label={formatReportPercent(completionRate)}
      caption="Hoàn tất"
      color="#059669"
    />
    <div className="space-y-2.5">
      <ReportMetricRow
        color="#059669"
        label="Hoàn tất"
        value={`${completedOrders} đơn`}
        percent={completionRate}
      />
      <ReportMetricRow
        color="#d97706"
        label="Chờ xử lý"
        value={`${pendingOrders} đơn`}
        percent={100 - completionRate}
      />
    </div>
  </div>
);
