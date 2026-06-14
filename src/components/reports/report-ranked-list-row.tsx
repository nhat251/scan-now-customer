"use client";

import { useState } from "react";

import type { RankedListItem } from "@/components/reports/report-dashboard.types";
import { ReportFixedTooltip } from "@/components/reports/report-fixed-tooltip";

type ReportRankedListRowProps = {
  item: RankedListItem;
  index: number;
  color: string;
  max: number;
};

export const ReportRankedListRow = ({ item, index, color, max }: ReportRankedListRowProps) => {
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const updateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div
      className="bg-muted/30 relative min-w-0 rounded-lg px-3 py-2"
      onMouseEnter={(event) => updateTooltipPosition(event.currentTarget)}
      onMouseLeave={() => setTooltipPosition(null)}
      onFocus={(event) => updateTooltipPosition(event.currentTarget)}
      onBlur={() => setTooltipPosition(null)}
      tabIndex={0}
    >
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0 overflow-hidden">
          <p className="truncate text-sm font-bold">
            {index + 1}. {item.label}
          </p>
          <p className="text-muted-foreground truncate text-xs">{item.helper}</p>
        </div>
        <span className="max-w-32 text-right text-sm leading-snug font-bold break-words">
          {item.value}
        </span>
      </div>
      <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(4, (item.score / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {tooltipPosition ? (
        <ReportFixedTooltip x={tooltipPosition.x} y={tooltipPosition.y}>
          <p className="font-bold">{item.label}</p>
          <p>{item.helper}</p>
          <p>{item.value}</p>
        </ReportFixedTooltip>
      ) : null}
    </div>
  );
};
