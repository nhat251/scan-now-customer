import type { RankedListItem } from "@/components/reports/report-dashboard.types";
import { ReportRankedList } from "@/components/reports/report-ranked-list";

type ReportPaymentMethodChartProps = {
  items: RankedListItem[];
};

export const ReportPaymentMethodChart = ({ items }: ReportPaymentMethodChartProps) => {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có thanh toán thành công.</p>;
  }

  return <ReportRankedList items={items} emptyText="Chưa có thanh toán thành công." />;
};
