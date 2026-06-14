"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getWaiterOrderFilterGroup } from "@/components/waiter/waiter-dashboard.helpers";
import type {
  OrderFilter,
  WaiterView,
} from "@/components/waiter/waiter-dashboard.types";
import {
  useConfirmWaiterOrderMutation,
  useMarkWaiterItemsServedMutation,
} from "@/hooks/mutations/useOrderMutations";
import { useCashierOrdersQuery } from "@/hooks/queries/useCashierQueries";
import {
  useMyBranchesListQuery,
  useMyBranchMenuQuery,
  useMyBranchTablesQuery,
} from "@/hooks/queries/useMeQueries";
import { useReadyToServeItemsQuery } from "@/hooks/queries/useOrderQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { useWaiterManualOrder } from "@/hooks/waiter/use-waiter-manual-order";
import { useUserStore } from "@/stores/user";
import type {
  MyMenuCategoryResponse,
  MyTableResponse,
} from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

const EMPTY_ORDERS: OwnerTableOrderHistoryResponse[] = [];
const EMPTY_TABLES: MyTableResponse[] = [];
const EMPTY_MENU_CATEGORIES: MyMenuCategoryResponse[] = [];

export const useWaiterDashboard = () => {
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = branchesQuery.data ?? [];
  const [branchId, setBranchId] = useState("");
  const [currentView, setCurrentView] = useState<WaiterView>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableModal, setSelectedTableModal] = useState<MyTableResponse | null>(null);
  const activeBranchId = branchId || branches[0]?.branchId;
  const debouncedOrderSearch = useDebounce(orderSearchInput.trim(), 250);

  const activeOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    {
      pageNumber: 1,
      pageSize: 100,
      status: "active",
      sortBy: "createdAt",
      sortDirection: "desc",
      search: debouncedOrderSearch || undefined,
    },
    Boolean(activeBranchId)
  );
  const tablesQuery = useMyBranchTablesQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "tableNumber", sortDirection: "asc" },
    Boolean(activeBranchId)
  );
  const menuQuery = useMyBranchMenuQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "displayOrder", sortDirection: "asc" },
    Boolean(activeBranchId)
  );
  const readyItemsQuery = useReadyToServeItemsQuery(activeBranchId, Boolean(activeBranchId));
  const confirmOrderMutation = useConfirmWaiterOrderMutation();
  const markServedMutation = useMarkWaiterItemsServedMutation();

  const refreshWaiterData = useCallback(async () => {
    await Promise.all([
      activeOrdersQuery.refetch(),
      tablesQuery.refetch(),
      readyItemsQuery.refetch(),
    ]);
  }, [activeOrdersQuery, readyItemsQuery, tablesQuery]);

  useBranchOrderUpdates(activeBranchId, {
    enabled: Boolean(activeBranchId),
    onOrderUpdated: refreshWaiterData,
  });

  const activeOrders = useMemo(
    () => activeOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [activeOrdersQuery.data?.items]
  );
  const tables = useMemo(
    () => tablesQuery.data?.items ?? EMPTY_TABLES,
    [tablesQuery.data?.items]
  );
  const menuCategories = useMemo(
    () => menuQuery.data?.items ?? EMPTY_MENU_CATEGORIES,
    [menuQuery.data?.items]
  );
  const readyGroups = readyItemsQuery.data ?? [];
  const filteredOrders = useMemo(
    () =>
      activeOrders.filter(
        (order) =>
          orderFilter === "all" || getWaiterOrderFilterGroup(order) === orderFilter
      ),
    [activeOrders, orderFilter]
  );

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (
      !selectedOrderId ||
      !filteredOrders.some((order) => order.orderId === selectedOrderId)
    ) {
      setSelectedOrderId(filteredOrders[0].orderId);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder =
    filteredOrders.find((order) => order.orderId === selectedOrderId) ??
    activeOrders.find((order) => order.orderId === selectedOrderId) ??
    filteredOrders[0] ??
    null;
  const selectedOrderReadyItems =
    selectedOrder?.items
      .filter((item) => item.status === "Ready")
      .map((item) => item.orderItemId) ?? [];

  const manualOrder = useWaiterManualOrder({
    activeBranchId,
    activeOrders,
    menuCategories,
    onOrderCreated: setSelectedOrderId,
    onViewChange: setCurrentView,
    refreshData: refreshWaiterData,
    refetchTables: tablesQuery.refetch,
    tables,
  });

  const confirmOrder = async (orderId: string) => {
    if (!activeBranchId) {
      return;
    }

    await confirmOrderMutation.mutateAsync({ branchId: activeBranchId, orderId });
    await refreshWaiterData();
  };

  const markReadyItemsServed = async () => {
    if (!activeBranchId || selectedOrderReadyItems.length === 0) {
      return;
    }

    await markServedMutation.mutateAsync({
      branchId: activeBranchId,
      request: { orderItemIds: selectedOrderReadyItems },
    });
    await refreshWaiterData();
  };

  const changeBranch = (nextBranchId: string) => {
    setBranchId(nextBranchId);
    setSelectedOrderId(null);
    manualOrder.resetOrder();
  };

  return {
    activeBranchId,
    activeOrders,
    activeOrdersQuery,
    branches,
    changeBranch,
    confirmOrder,
    confirmOrderMutation,
    currentUser,
    currentView,
    filteredOrders,
    manualOrder,
    markReadyItemsServed,
    markServedMutation,
    orderFilter,
    orderSearchInput,
    readyGroups,
    selectedOrder,
    selectedOrderId,
    selectedTableModal,
    setCurrentView,
    setOrderFilter,
    setOrderSearchInput,
    setSelectedOrderId,
    setSelectedTableModal,
    tables,
    tablesQuery,
  };
};
