import { describe, expect, it } from "vitest";

import {
  aggregateReportPointsByMonth,
  aggregateReportPointsByWeek,
  getReportDerivedMetrics,
  getReportPresetRange,
  getReportRevenueSeries,
} from "@/components/reports/report-dashboard.helpers";
import { createReport } from "@/test/fixtures";

describe("report dashboard helpers", () => {
  const now = new Date("2026-06-14T05:00:00.000Z");

  it("creates deterministic preset ranges in Vietnam time", () => {
    expect(getReportPresetRange("today", now)).toEqual({
      fromDate: "2026-06-14",
      toDate: "2026-06-14",
    });
    expect(getReportPresetRange("week", now)).toEqual({
      fromDate: "2026-06-08",
      toDate: "2026-06-14",
    });
    expect(getReportPresetRange("month", now)).toEqual({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });
    expect(getReportPresetRange("quarter", now)).toEqual({
      fromDate: "2026-04-01",
      toDate: "2026-06-30",
    });
    expect(getReportPresetRange("year", now)).toEqual({
      fromDate: "2026-01-01",
      toDate: "2026-12-31",
    });
  });

  it("aggregates report points by week and month without losing totals", () => {
    const points = Array.from({ length: 8 }, (_, index) => ({
      label: String(index + 1),
      date: `2026-0${index < 7 ? 6 : 7}-${String((index % 7) + 1).padStart(2, "0")}T00:00:00.000Z`,
      revenue: 100,
      orders: 1,
    }));

    expect(aggregateReportPointsByWeek(points)).toEqual([
      { label: "01-06-07-06", revenue: 700, orders: 7 },
      { label: "01-07-01-07", revenue: 100, orders: 1 },
    ]);
    expect(aggregateReportPointsByMonth(points)).toEqual([
      { label: "06", revenue: 700, orders: 7 },
      { label: "07", revenue: 100, orders: 1 },
    ]);
  });

  it("selects the correct chart granularity", () => {
    const report = createReport();

    expect(
      getReportRevenueSeries({
        preset: "today",
        fromDate: "2026-06-14",
        toDate: "2026-06-14",
        revenueByDay: report.revenueByDay,
        peakHours: report.peakHours,
      })
    ).toEqual({
      subtitle: "Đang hiển thị theo giờ",
      points: [
        { label: "10", revenue: 100_000, orders: 2 },
        { label: "12", revenue: 300_000, orders: 4 },
      ],
    });

    expect(
      getReportRevenueSeries({
        preset: "year",
        fromDate: "2026-01-01",
        toDate: "2026-12-31",
        revenueByDay: report.revenueByDay,
        peakHours: report.peakHours,
      }).subtitle
    ).toBe("Đang hiển thị theo tháng");
  });

  it("derives rates and best-performing points safely", () => {
    expect(getReportDerivedMetrics(createReport())).toMatchObject({
      completionRate: 80,
      pendingOrders: 2,
      paidRevenueRate: 80,
      bestRevenueDay: expect.objectContaining({ label: "02/06" }),
      busiestHour: expect.objectContaining({ label: "12:00" }),
    });

    expect(getReportDerivedMetrics()).toEqual({
      completionRate: 0,
      pendingOrders: 0,
      paidRevenueRate: 0,
      bestRevenueDay: null,
      busiestHour: null,
    });
  });
});
