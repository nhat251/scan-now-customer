import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCashierPayment } from "@/hooks/cashier/use-cashier-payment";
import { createOrder } from "@/test/fixtures";
import { act, renderHook } from "@testing-library/react";

const mutationMocks = vi.hoisted(() => ({
  cancelPayment: vi.fn(),
  checkout: vi.fn(),
}));

vi.mock("@/hooks/mutations/useCashierMutations", () => ({
  useCashierCancelPaymentMutation: () => ({
    isPending: false,
    mutateAsync: mutationMocks.cancelPayment,
  }),
  useCashierCheckoutMutation: () => ({
    isPending: false,
    mutateAsync: mutationMocks.checkout,
  }),
}));

describe("useCashierPayment", () => {
  beforeEach(() => {
    mutationMocks.cancelPayment.mockReset();
    mutationMocks.checkout.mockReset();
    mutationMocks.checkout.mockResolvedValue({
      result: {
        order: createOrder(),
        orderId: "order-1",
        paymentMethod: "PAYOS",
      },
    });
    mutationMocks.cancelPayment.mockResolvedValue({
      result: createOrder(),
    });
  });

  it("keeps PayOS, voucher and refresh payload behavior", async () => {
    const onOrderSelected = vi.fn();
    const refreshData = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCashierPayment({
        activeBranchId: "branch-1",
        onOrderSelected,
        refreshData,
        selectedOrder: createOrder(),
      })
    );

    act(() => result.current.setVoucherCode(" SALE10 "));
    await act(async () => {
      await result.current.checkout("PAYOS");
    });

    expect(mutationMocks.checkout).toHaveBeenCalledWith({
      branchId: "branch-1",
      orderId: "order-1",
      request: {
        paymentMethod: "PAYOS",
        voucherCode: "SALE10",
        amountReceived: null,
      },
    });
    expect(onOrderSelected).toHaveBeenCalledWith("order-1");
    expect(refreshData).toHaveBeenCalledOnce();
  });

  it("keeps CASH and pending-payment cancellation payloads", async () => {
    const onOrderSelected = vi.fn();
    const refreshData = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCashierPayment({
        activeBranchId: "branch-1",
        onOrderSelected,
        refreshData,
        selectedOrder: createOrder(),
      })
    );

    await act(async () => {
      await result.current.checkout("CASH", 120_000);
      await result.current.cancelCashierPayment();
    });

    expect(mutationMocks.checkout).toHaveBeenCalledWith({
      branchId: "branch-1",
      orderId: "order-1",
      request: {
        paymentMethod: "CASH",
        voucherCode: null,
        amountReceived: 120_000,
      },
    });
    expect(mutationMocks.cancelPayment).toHaveBeenCalledWith({
      branchId: "branch-1",
      orderId: "order-1",
    });
    expect(refreshData).toHaveBeenCalledTimes(2);
  });
});
