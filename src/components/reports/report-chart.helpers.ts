export const REPORT_CHART_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be123c",
];

export const maxReportValue = (values: number[]) => Math.max(...values, 1);

export const formatReportPercent = (value: number) => `${Math.round(value)}%`;
