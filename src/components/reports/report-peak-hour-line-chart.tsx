import { formatCurrency } from "@/components/manage-menu/helpers";
import { maxReportValue } from "@/components/reports/report-chart.helpers";

type ReportPeakHourLineChartProps = {
  data: Array<{ label: string; value: number; revenue: number }>;
};

export const ReportPeakHourLineChart = ({ data }: ReportPeakHourLineChartProps) => {
  const width = 640;
  const height = 180;
  const paddingX = 28;
  const paddingY = 20;
  const max = maxReportValue(data.map((item) => item.value));
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const points = data.map((item, index) => {
    const x = paddingX + (index / Math.max(1, data.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - (item.value / max) * plotHeight;
    return { ...item, x, y };
  });
  const path = points.reduce(
    (current, point, index) => `${current}${index === 0 ? "M" : "L"} ${point.x} ${point.y} `,
    ""
  );
  const areaPath = `${path}L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="relative min-w-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible">
        <defs>
          <linearGradient id="peak-hour-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = paddingY + (plotHeight / 3) * line;
          return (
            <line
              key={line}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              className="stroke-border/70"
              strokeWidth="1"
            />
          );
        })}
        <path d={areaPath} fill="url(#peak-hour-line)" />
        <path
          d={path}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point) => (
          <g key={point.label} className="group">
            <circle
              cx={point.x}
              cy={point.y}
              r="4.5"
              fill="#2563eb"
              stroke="white"
              strokeWidth="2"
            />
            <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
              <rect
                x={Math.min(point.x + 8, width - 168)}
                y={Math.max(8, point.y - 50)}
                width="160"
                height="44"
                rx="8"
                fill="#111827"
              />
              <text
                x={Math.min(point.x + 18, width - 158)}
                y={Math.max(27, point.y - 31)}
                fill="white"
                className="text-[12px] font-bold"
              >
                {point.label}
              </text>
              <text
                x={Math.min(point.x + 18, width - 158)}
                y={Math.max(43, point.y - 15)}
                fill="#d1d5db"
                className="text-[11px]"
              >
                {`${point.value} đơn - ${formatCurrency(point.revenue)}`}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
};
