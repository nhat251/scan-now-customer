import { describe, expect, it, vi } from "vitest";

import {
  getCashierBranchName,
  getCashierListMetrics,
  getCashierOrderCreatedMinutes,
  getCashierOrderStatusMeta,
  getCashierPaymentLabel,
  getCashierPaymentMeta,
  getCashierReportMetrics,
  getCashierTableState,
  getCashierViewTitle,
} from "@/components/cashier/cashier-dashboard.helpers";
import { createOrder, createTable } from "@/test/fixtures";

describe("cashier dashboard helpers", () => {
  it("maps order and payment states to Vietnamese labels", () => {
    expect(getCashierOrderStatusMeta("ReadyToServe").label).toBe("Sẵn sàng phục vụ");
    expect(getCashierOrderStatusMeta("UNKNOWN").label).toBe("Trạng thái đơn không xác định");
    expect(getCashierPaymentMeta(createOrder()).label).toBe("Chưa thanh toán");
    expect(
      getCashierPaymentLabel(
        createOrder({ paymentMethod: "CASH", paymentStatus: "SUCCESS" })
      )
    ).toBe("Tiền mặt - Thanh toán thành công");
  });

  it("derives table state and branch name", () => {
    expect(getCashierTableState(createTable())).toBe("available");
    expect(
      getCashierTableState(
        createTable({
          currentSession: {
            sessionId: "session-1",
            sessionCode: "ABC",
            expiresAt: "2026-06-14T10:00:00.000Z",
            isActive: true,
          },
        })
      )
    ).toBe("occupied");
    expect(getCashierTableState(createTable({ status: "DISABLED" }))).toBe("disabled");
    expect(getCashierBranchName("branch-1", [{ branchId: "branch-1", name: "Trung tâm" }])).toBe(
      "Trung tâm"
    );
  });

  it("calculates non-negative order age", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T04:00:00.000Z"));
    expect(getCashierOrderCreatedMinutes("2026-06-14T03:30:00.000Z")).toBe(30);
    expect(getCashierOrderCreatedMinutes("2026-06-14T05:00:00.000Z")).toBe(0);
    vi.useRealTimers();
  });

  it("derives list, report metrics and view titles", () => {
    const paidOrder = createOrder({
      orderId: "paid",
      paymentStatus: "SUCCESS",
      totalAmount: 200_000,
    });
    const pendingOrder = createOrder({
      orderId: "pending",
      paymentStatus: "PENDING",
      totalAmount: 100_000,
    });

    expect(getCashierListMetrics([paidOrder], [paidOrder, pendingOrder])).toEqual({
      visibleTotal: 200_000,
      needPaymentCount: 1,
    });
    expect(getCashierReportMetrics([paidOrder, pendingOrder])).toEqual({
      paidCount: 1,
      paidRevenue: 200_000,
      pendingRevenue: 100_000,
      averageTicket: 200_000,
    });
    expect(getCashierViewTitle("report")).toBe("Báo cáo ca");
  });
});
