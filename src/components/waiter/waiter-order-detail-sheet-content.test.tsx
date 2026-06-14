import { describe, expect, it, vi } from "vitest";

import { WaiterOrderDetailSheetContent } from "@/components/waiter/waiter-order-detail-sheet-content";
import { createOrder, createOrderItem } from "@/test/fixtures";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("WaiterOrderDetailSheetContent", () => {
  it("renders a Vietnamese empty state", () => {
    render(
      <WaiterOrderDetailSheetContent
        order={null}
        onConfirm={vi.fn()}
        confirmPending={false}
        onMarkServed={vi.fn()}
        markServedPending={false}
        onAddItems={vi.fn()}
      />
    );

    expect(screen.getByText("Chọn một đơn hàng")).toBeInTheDocument();
  });

  it("confirms a pending order and preserves the backend order id", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onAddItems = vi.fn();

    render(
      <WaiterOrderDetailSheetContent
        order={createOrder()}
        onConfirm={onConfirm}
        confirmPending={false}
        onMarkServed={vi.fn()}
        markServedPending={false}
        onAddItems={onAddItems}
      />
    );

    expect(screen.getAllByText("Chờ xác nhận")).toHaveLength(2);
    expect(screen.queryByText("Trạng thái món không xác định")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn hàng" }));
    await user.click(screen.getByRole("button", { name: "Thêm món" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledWith("order-1");
    expect(onAddItems).toHaveBeenCalledOnce();
  });

  it("marks ready items as served", async () => {
    const user = userEvent.setup();
    const onMarkServed = vi.fn();

    render(
      <WaiterOrderDetailSheetContent
        order={createOrder({
          status: "ReadyToServe",
          items: [createOrderItem({ status: "Ready" })],
        })}
        onConfirm={vi.fn()}
        confirmPending={false}
        onMarkServed={onMarkServed}
        markServedPending={false}
        onAddItems={vi.fn()}
      />
    );

    expect(screen.getAllByText("Sẵn sàng phục vụ")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Đánh dấu đã phục vụ 1 món" }));
    expect(onMarkServed).toHaveBeenCalledOnce();
  });
});
