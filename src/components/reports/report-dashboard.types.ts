export type PeriodPreset = "today" | "week" | "month" | "quarter" | "year" | "custom";

export type ChartPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type SingleMetricPoint = {
  label: string;
  value: number;
  detail: string;
};

export type RankedListItem = {
  id: string;
  label: string;
  helper: string;
  value: string;
  score: number;
};
