import type {
  ChartPoint,
  PeriodPreset,
} from "@/components/reports/report-dashboard.types";
import type {
  OwnerReportResponse,
  ReportPointResponse,
} from "@/types/reports";

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;

const getVietnamDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "1970"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "1"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
  };
};

const toDateInput = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
};

const daysBetween = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((to - from) / DAY_MS) + 1);
};

export const getReportPresetRange = (
  preset: Exclude<PeriodPreset, "custom">,
  now = new Date()
) => {
  const todayParts = getVietnamDateParts(now);
  const today = toDateInput(todayParts.year, todayParts.month, todayParts.day);
  const todayUtc = new Date(Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day));

  if (preset === "today") {
    return { fromDate: today, toDate: today };
  }

  if (preset === "week") {
    const weekday = todayUtc.getUTCDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const fromDate = addDays(today, mondayOffset);
    return { fromDate, toDate: addDays(fromDate, 6) };
  }

  if (preset === "month") {
    const fromDate = toDateInput(todayParts.year, todayParts.month, 1);
    const lastDay = new Date(Date.UTC(todayParts.year, todayParts.month, 0)).getUTCDate();
    return { fromDate, toDate: toDateInput(todayParts.year, todayParts.month, lastDay) };
  }

  if (preset === "quarter") {
    const quarterStartMonth = Math.floor((todayParts.month - 1) / 3) * 3 + 1;
    const quarterEndMonth = quarterStartMonth + 2;
    const lastDay = new Date(Date.UTC(todayParts.year, quarterEndMonth, 0)).getUTCDate();
    return {
      fromDate: toDateInput(todayParts.year, quarterStartMonth, 1),
      toDate: toDateInput(todayParts.year, quarterEndMonth, lastDay),
    };
  }

  return {
    fromDate: toDateInput(todayParts.year, 1, 1),
    toDate: toDateInput(todayParts.year, 12, 31),
  };
};

const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(value);

const getMonthKey = (dateValue?: string | null, fallbackLabel?: string) => {
  if (dateValue) {
    const date = new Date(dateValue);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  return fallbackLabel ?? "-";
};

export const aggregateReportPointsByMonth = (
  points: ReportPointResponse[]
): ChartPoint[] => {
  const map = new Map<string, ChartPoint>();

  for (const point of points) {
    const key = getMonthKey(point.date, point.label);
    const current = map.get(key) ?? { label: key.slice(5), revenue: 0, orders: 0 };
    current.revenue += point.revenue;
    current.orders += point.orders;
    map.set(key, current);
  }

  return Array.from(map.values());
};

export const aggregateReportPointsByWeek = (
  points: ReportPointResponse[]
): ChartPoint[] => {
  const result: ChartPoint[] = [];

  for (let index = 0; index < points.length; index += 7) {
    const weekPoints = points.slice(index, index + 7);
    const firstDate = weekPoints[0]?.date ? new Date(weekPoints[0].date) : null;
    const lastDate = weekPoints[weekPoints.length - 1]?.date
      ? new Date(weekPoints[weekPoints.length - 1].date ?? "")
      : null;
    const label =
      firstDate &&
      lastDate &&
      !Number.isNaN(firstDate.getTime()) &&
      !Number.isNaN(lastDate.getTime())
        ? `${formatShortDate(firstDate)}-${formatShortDate(lastDate)}`
        : `Tuần ${Math.floor(index / 7) + 1}`;

    result.push({
      label,
      revenue: weekPoints.reduce((sum, point) => sum + point.revenue, 0),
      orders: weekPoints.reduce((sum, point) => sum + point.orders, 0),
    });
  }

  return result;
};

export const getReportRevenueSeries = ({
  preset,
  fromDate,
  toDate,
  revenueByDay,
  peakHours,
}: {
  preset: PeriodPreset;
  fromDate: string;
  toDate: string;
  revenueByDay: ReportPointResponse[];
  peakHours: ReportPointResponse[];
}) => {
  const rangeDays = daysBetween(fromDate, toDate);

  if (preset === "today" || (preset === "custom" && rangeDays <= 1)) {
    return {
      subtitle: "Đang hiển thị theo giờ",
      points: peakHours.map((point) => ({
        label: point.label.slice(0, 2),
        revenue: point.revenue,
        orders: point.orders,
      })),
    };
  }

  if (preset === "quarter") {
    return {
      subtitle: "Đang hiển thị theo tuần trong quý",
      points: aggregateReportPointsByWeek(revenueByDay),
    };
  }

  if (preset === "year" || (preset === "custom" && rangeDays > 92)) {
    return {
      subtitle: "Đang hiển thị theo tháng",
      points: aggregateReportPointsByMonth(revenueByDay),
    };
  }

  return {
    subtitle:
      preset === "week"
        ? "Đang hiển thị theo ngày trong tuần"
        : "Đang hiển thị theo ngày",
    points: revenueByDay.map((point) => ({
      label: preset === "week" ? point.label : point.label.split("/")[0],
      revenue: point.revenue,
      orders: point.orders,
    })),
  };
};

export const getReportDerivedMetrics = (report?: OwnerReportResponse) => {
  const completionRate = report?.totalOrders
    ? (report.completedOrders / report.totalOrders) * 100
    : 0;
  const pendingOrders = Math.max(
    (report?.totalOrders ?? 0) - (report?.completedOrders ?? 0),
    0
  );
  const paidRevenueRate = report?.totalRevenue
    ? (report.paidRevenue / report.totalRevenue) * 100
    : 0;
  const bestRevenueDay =
    report?.revenueByDay.reduce<ReportPointResponse | null>(
      (best, item) => (!best || item.revenue > best.revenue ? item : best),
      null
    ) ?? null;
  const busiestHour =
    report?.peakHours.reduce<ReportPointResponse | null>(
      (best, item) => (!best || item.orders > best.orders ? item : best),
      null
    ) ?? null;

  return {
    completionRate,
    pendingOrders,
    paidRevenueRate,
    bestRevenueDay,
    busiestHour,
  };
};
