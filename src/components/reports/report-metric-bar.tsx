"use client";

import { useState } from "react";

import type { SingleMetricPoint } from "@/components/reports/report-dashboard.types";
import { ReportFixedTooltip } from "@/components/reports/report-fixed-tooltip";

type ReportMetricBarProps = {
  item: SingleMetricPoint;
  color: string;
  max: number;
  formatValue: (value: number) => string;
};

export const ReportMetricBar = ({ item, color, max, formatValue }: ReportMetricBarProps) => {
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div
      className="relative flex min-w-0 flex-col items-center gap-1.5"
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => setTooltipPosition(null)}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => setTooltipPosition(null)}
      tabIndex={0}
    >
      <div className="bg-muted/35 flex h-36 w-full items-end rounded-md px-1">
        <div
          className="w-full rounded-t-sm"
          style={{
            height: `${Math.max(4, (item.value / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-muted-foreground w-full truncate text-center text-[10px] leading-tight">
        {item.label}
      </span>
      {tooltipPosition ? (
        <ReportFixedTooltip x={tooltipPosition.x} y={tooltipPosition.y}>
          <p className="font-bold">{item.label}</p>
          <p>{formatValue(item.value)}</p>
          <p>{item.detail}</p>
        </ReportFixedTooltip>
      ) : null}
    </div>
  );
};
