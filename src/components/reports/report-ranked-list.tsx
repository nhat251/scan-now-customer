import { maxReportValue, REPORT_CHART_COLORS } from "@/components/reports/report-chart.helpers";
import type { RankedListItem } from "@/components/reports/report-dashboard.types";
import { ReportRankedListRow } from "@/components/reports/report-ranked-list-row";
import { cn } from "@/lib/utils";

type ReportRankedListProps = {
  items: RankedListItem[];
  emptyText: string;
  compact?: boolean;
};

export const ReportRankedList = ({ items, emptyText, compact = false }: ReportRankedListProps) => {
  const max = maxReportValue(items.map((item) => item.score));

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <div
      className={cn(
        "min-w-0 space-y-2 overflow-x-hidden overflow-y-auto pr-1",
        compact ? "max-h-72" : "max-h-80"
      )}
    >
      {items.map((item, index) => {
        const color = REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length];

        return (
          <ReportRankedListRow key={item.id} item={item} index={index} color={color} max={max} />
        );
      })}
    </div>
  );
};
