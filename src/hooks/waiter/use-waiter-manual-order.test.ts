import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWaiterManualOrder } from "@/hooks/waiter/use-waiter-manual-order";
import {
  createMenuCategory,
  createMenuItem,
  createOrder,
  createTable,
} from "@/test/fixtures";
import { act, renderHook } from "@testing-library/react";

const mutationMocks = vi.hoisted(() => ({
  closeTable: vi.fn(),
  createOrder: vi.fn(),
  openTable: vi.fn(),
}));

vi.mock("@/hooks/mutations/useMyTableMutations", () => ({
  useCloseMyTableSessionMutation: () => ({
    isPending: false,
    mutateAsync: mutationMocks.closeTable,
  }),
  useOpenMyTableSessionMutation: () => ({
    isPending: false,
    mutateAsync: mutationMocks.openTable,
  }),
}));

vi.mock("@/hooks/mutations/useOrderMutations", () => ({
  useCreateWaiterOrderMutation: () => ({
    isPending: false,
    mutateAsync: mutationMocks.createOrder,
  }),
}));

describe("useWaiterManualOrder", () => {
  beforeEach(() => {
    mutationMocks.closeTable.mockReset();
    mutationMocks.createOrder.mockReset();
    mutationMocks.openTable.mockReset();
    mutationMocks.openTable.mockResolvedValue({});
    mutationMocks.createOrder.mockResolvedValue({
      result: { orderId: "order-created" },
    });
  });

  it("opens an inactive table before creating an order with the unchanged payload", async () => {
    const onOrderCreated = vi.fn();
    const onViewChange = vi.fn();
    const refreshData = vi.fn().mockResolvedValue(undefined);
    const menuItem = createMenuItem();
    const { result } = renderHook(() =>
      useWaiterManualOrder({
        activeBranchId: "branch-1",
        activeOrders: [createOrder()],
        menuCategories: [createMenuCategory({ items: [menuItem] })],
        onOrderCreated,
        onViewChange,
        refreshData,
        refetchTables: vi.fn().mockResolvedValue(undefined),
        tables: [createTable()],
      })
    );

    act(() => {
      result.current.setValue("selectedTableId", "table-1");
      result.current.setValue("customerName", " Nguyễn Văn A ");
      result.current.setValue("customerNote", " Ít hành ");
      result.current.addToCart(menuItem);
      result.current.addToCart(menuItem);
    });

    await act(async () => {
      await result.current.submitOrder();
    });

    expect(mutationMocks.openTable).toHaveBeenCalledWith({
      branchId: "branch-1",
      tableId: "table-1",
    });
    expect(mutationMocks.createOrder).toHaveBeenCalledWith({
      branchId: "branch-1",
      request: {
        tableId: "table-1",
        customerName: "Nguyễn Văn A",
        customerNote: "Ít hành",
        items: [
          {
            menuItemId: "menu-1",
            quantity: 2,
            note: null,
          },
        ],
      },
    });
    expect(
      mutationMocks.openTable.mock.invocationCallOrder[0]
    ).toBeLessThan(mutationMocks.createOrder.mock.invocationCallOrder[0]);
    expect(onOrderCreated).toHaveBeenCalledWith("order-created");
    expect(onViewChange).toHaveBeenCalledWith("orders");
    expect(refreshData).toHaveBeenCalledOnce();
  });
});
