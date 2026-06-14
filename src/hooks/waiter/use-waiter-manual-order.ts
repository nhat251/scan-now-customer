"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type {
  WaiterCartItem,
  WaiterView,
} from "@/components/waiter/waiter-dashboard.types";
import {
  addManualOrderCartItem,
  getManualOrderCartTotal,
  getManualOrderCategoryOptions,
  getManualOrderMenuItems,
  updateManualOrderCartItemQuantity,
} from "@/helpers/orders/manual-order";
import {
  useCloseMyTableSessionMutation,
  useOpenMyTableSessionMutation,
} from "@/hooks/mutations/useMyTableMutations";
import { useCreateWaiterOrderMutation } from "@/hooks/mutations/useOrderMutations";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  MyMenuCategoryResponse,
  MyMenuItemResponse,
  MyTableResponse,
} from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

type UseWaiterManualOrderOptions = {
  activeBranchId?: string;
  activeOrders: OwnerTableOrderHistoryResponse[];
  menuCategories: MyMenuCategoryResponse[];
  onOrderCreated: (orderId: string) => void;
  onViewChange: (view: WaiterView) => void;
  refreshData: () => Promise<void>;
  refetchTables: () => Promise<unknown>;
  tables: MyTableResponse[];
};

export const useWaiterManualOrder = ({
  activeBranchId,
  activeOrders,
  menuCategories,
  onOrderCreated,
  onViewChange,
  refreshData,
  refetchTables,
  tables,
}: UseWaiterManualOrderOptions) => {
  const {
    watch,
    setValue,
    reset: resetOrderForm,
  } = useForm({
    defaultValues: {
      selectedTableId: null as string | null,
      categorySearch: "",
      customerName: "",
      customerNote: "",
    },
  });
  const selectedTableId = watch("selectedTableId");
  const categorySearch = watch("categorySearch");
  const customerName = watch("customerName");
  const customerNote = watch("customerNote");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartItems, setCartItems] = useState<WaiterCartItem[]>([]);
  const debouncedCategorySearch = useDebounce(categorySearch.trim(), 200);
  const createOrderMutation = useCreateWaiterOrderMutation();
  const openTableMutation = useOpenMyTableSessionMutation();
  const closeTableMutation = useCloseMyTableSessionMutation();

  const menuItems = useMemo(
    () =>
      getManualOrderMenuItems(
        menuCategories,
        activeCategory,
        debouncedCategorySearch
      ),
    [activeCategory, debouncedCategorySearch, menuCategories]
  );

  const categoryOptions = useMemo(
    () => getManualOrderCategoryOptions(menuCategories),
    [menuCategories]
  );
  const selectedTable = tables.find((table) => table.tableId === selectedTableId) ?? null;
  const selectedTableOrders = selectedTable
    ? activeOrders.filter((order) => order.tableId === selectedTable.tableId)
    : [];
  const cartTotal = useMemo(
    () => getManualOrderCartTotal(cartItems),
    [cartItems]
  );

  const resetOrder = (tableId: string | null = null) => {
    resetOrderForm({
      selectedTableId: tableId,
      customerName: "",
      customerNote: "",
      categorySearch: "",
    });
    setCartItems([]);
    setActiveCategory("all");
  };

  const setCreateMode = (tableId: string | null) => {
    resetOrder(tableId);
    onViewChange("create-order");
  };

  const addToCart = (menuItem: MyMenuItemResponse) => {
    setCartItems((currentItems) =>
      addManualOrderCartItem(currentItems, menuItem)
    );
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCartItems((currentItems) =>
      updateManualOrderCartItemQuantity(currentItems, menuItemId, delta)
    );
  };

  const submitOrder = async () => {
    if (!activeBranchId || !selectedTableId || cartItems.length === 0) {
      return;
    }

    const table = tables.find((item) => item.tableId === selectedTableId);
    if (!table) {
      return;
    }

    if (!table.currentSession) {
      await openTableMutation.mutateAsync({
        branchId: activeBranchId,
        tableId: table.tableId,
      });
    }

    const response = await createOrderMutation.mutateAsync({
      branchId: activeBranchId,
      request: {
        tableId: selectedTableId,
        customerName: customerName.trim() || null,
        customerNote: customerNote.trim() || null,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItem.menuItemId,
          quantity: item.qty,
          note: null,
        })),
      },
    });

    resetOrder();
    onOrderCreated(response.result.orderId);
    onViewChange("orders");
    await refreshData();
  };

  const openTable = async (table: MyTableResponse) => {
    if (!activeBranchId) {
      return;
    }

    await openTableMutation.mutateAsync({
      branchId: activeBranchId,
      tableId: table.tableId,
    });
    await refetchTables();
  };

  const closeTable = async (table: MyTableResponse) => {
    if (!table.currentSession) {
      return;
    }

    await closeTableMutation.mutateAsync(table.currentSession.sessionId);
    await refetchTables();
  };

  return {
    activeCategory,
    addToCart,
    cartItems,
    cartTotal,
    categoryOptions,
    categorySearch,
    closeTable,
    closeTableMutation,
    createOrderMutation,
    customerName,
    customerNote,
    menuItems,
    openTable,
    openTableMutation,
    resetOrder,
    selectedTable,
    selectedTableOrders,
    setActiveCategory,
    setCreateMode,
    setValue,
    submitOrder,
    updateCartQty,
  };
};
