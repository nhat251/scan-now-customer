import { describe, expect, it } from "vitest";

import {
  getWaiterOrderFilterGroup,
  getWaiterOrderStatusMeta,
  getWaiterTableState,
} from "@/components/waiter/waiter-dashboard.helpers";
import { createOrder, createTable } from "@/test/fixtures";

describe("waiter dashboard helpers", () => {
  it("groups order statuses without changing backend values", () => {
    expect(getWaiterOrderFilterGroup(createOrder({ status: "PendingConfirmation" }))).toBe(
      "pending"
    );
    expect(getWaiterOrderFilterGroup(createOrder({ status: "PartiallyReady" }))).toBe("ready");
    expect(getWaiterOrderFilterGroup(createOrder({ status: "ReadyToServe" }))).toBe("ready");
    expect(getWaiterOrderFilterGroup(createOrder({ status: "Preparing" }))).toBe("preparing");
  });

  it("maps status labels and table states", () => {
    expect(getWaiterOrderStatusMeta("Confirmed").label).toBe("Đã xác nhận");
    expect(getWaiterOrderStatusMeta("UNKNOWN").label).toBe("Trạng thái đơn không xác định");
    expect(getWaiterTableState(createTable())).toBe("available");
    expect(getWaiterTableState(createTable({ status: "DISABLED" }))).toBe("disabled");
  });
});
