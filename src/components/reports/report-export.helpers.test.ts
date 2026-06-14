import { describe, expect, it } from "vitest";

import {
  getReportBranchRows,
  getReportOverviewRows,
  getReportPaymentRows,
  getReportTopItemRows,
} from "@/components/reports/report-export.helpers";
import { createReport } from "@/test/fixtures";

describe("report export row helpers", () => {
  const report = createReport();
  const metrics = { completionRate: 80, paidRevenueRate: 80, pendingOrders: 2 };

  it("builds overview rows with unchanged numeric values", () => {
    const rows = getReportOverviewRows(report, metrics);

    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual([
      "Doanh thu đã thu",
      800_000,
      "Thanh toán thành công",
      0.8,
    ]);
    expect(rows[5]).toEqual(["Đơn còn lại", 2, "Chưa hoàn tất hoặc chưa thu", null]);
  });

  it("maps payment, branch and top-item rows for Excel", () => {
    expect(getReportPaymentRows(report)).toEqual([["Tiền mặt", 4, 400_000, 0.5]]);
    expect(getReportBranchRows(report)).toEqual([["Trung tâm", 8, 800_000, 100_000]]);
    expect(getReportTopItemRows(report)).toEqual([["Phở bò", 5, 250_000, 50_000]]);
  });
});
