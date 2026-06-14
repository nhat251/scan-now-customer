"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCashierListMetrics,
  getCashierReportMetrics,
  getCashierViewTitle,
} from "@/components/cashier/cashier-dashboard.helpers";
import type { CashierView } from "@/components/cashier/cashier-dashboard.types";
import { useCashierManualOrder } from "@/hooks/cashier/use-cashier-manual-order";
import { useCashierPayment } from "@/hooks/cashier/use-cashier-payment";
import { useCashierOrdersQuery } from "@/hooks/queries/useCashierQueries";
import {
  useMyBranchesListQuery,
  useMyBranchMenuQuery,
  useMyBranchTablesQuery,
} from "@/hooks/queries/useMeQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserStore } from "@/stores/user";
import type { CashierOrderQuery } from "@/types/cashier";
import type {
  MyMenuCategoryResponse,
  MyTableResponse,
} from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

const EMPTY_ORDERS: OwnerTableOrderHistoryResponse[] = [];
const EMPTY_TABLES: MyTableResponse[] = [];
const EMPTY_MENU_CATEGORIES: MyMenuCategoryResponse[] = [];

export const useCashierDashboard = () => {
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = branchesQuery.data ?? [];
  const [currentView, setCurrentView] = useState<CashierView>("orders");
  const [branchId, setBranchId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const activeBranchId = branchId || branches[0]?.branchId;
  const search = useDebounce(searchInput.trim(), 250);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPageNumber(1);
  }, [currentView, search]);

  const listStatus: NonNullable<CashierOrderQuery["status"]> =
    currentView === "history"
      ? "paid"
      : currentView === "report"
        ? "all"
        : "active";
  const listQuery = useMemo<CashierOrderQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      status: listStatus,
      sortBy: currentView === "history" ? "paidAt" : "createdAt",
      sortDirection: "desc",
    }),
    [currentView, listStatus, pageNumber, pageSize, search]
  );

  const activeOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    {
      pageNumber: 1,
      pageSize: 100,
      status: "active",
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    Boolean(activeBranchId)
  );
  const listOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    listQuery,
    Boolean(activeBranchId)
  );
  const reportOrdersQuery = useCashierOrdersQuery(
    activeBranchId,
    {
      pageNumber: 1,
      pageSize: 100,
      status: "all",
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    Boolean(activeBranchId) && currentView === "report"
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

  const refreshCashierData = useCallback(async () => {
    await Promise.all([
      activeOrdersQuery.refetch(),
      listOrdersQuery.refetch(),
      tablesQuery.refetch(),
    ]);
  }, [activeOrdersQuery, listOrdersQuery, tablesQuery]);

  useBranchOrderUpdates(activeBranchId, {
    enabled: Boolean(activeBranchId),
    onOrderUpdated: refreshCashierData,
  });

  const activeOrders = useMemo(
    () => activeOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [activeOrdersQuery.data?.items]
  );
  const listOrders = useMemo(
    () => listOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [listOrdersQuery.data?.items]
  );
  const reportOrders = useMemo(
    () => reportOrdersQuery.data?.items ?? EMPTY_ORDERS,
    [reportOrdersQuery.data?.items]
  );
  const tables = useMemo(
    () => tablesQuery.data?.items ?? EMPTY_TABLES,
    [tablesQuery.data?.items]
  );
  const menuCategories = useMemo(
    () => menuQuery.data?.items ?? EMPTY_MENU_CATEGORIES,
    [menuQuery.data?.items]
  );
  const orderLookup = useMemo(() => {
    const lookup = new Map<string, OwnerTableOrderHistoryResponse>();
    [...activeOrders, ...listOrders, ...reportOrders].forEach((order) =>
      lookup.set(order.orderId, order)
    );
    return lookup;
  }, [activeOrders, listOrders, reportOrders]);
  const visibleOrders =
    currentView === "history"
      ? listOrders
      : currentView === "orders"
        ? listOrders
        : activeOrders;

  useEffect(() => {
    if (!visibleOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (
      !selectedOrderId ||
      !visibleOrders.some((order) => order.orderId === selectedOrderId)
    ) {
      setSelectedOrderId(visibleOrders[0].orderId);
    }
  }, [selectedOrderId, visibleOrders]);

  const selectedOrder =
    (selectedOrderId ? (orderLookup.get(selectedOrderId) ?? null) : null) ??
    visibleOrders[0] ??
    activeOrders[0] ??
    null;
  const payment = useCashierPayment({
    activeBranchId,
    onOrderSelected: setSelectedOrderId,
    refreshData: refreshCashierData,
    selectedOrder,
  });
  const manualOrder = useCashierManualOrder({
    activeBranchId,
    activeOrders,
    menuCategories,
    onOrderCreated: (orderId) => {
      setSelectedOrderId(orderId);
      payment.resetPayOsPayment();
    },
    onViewChange: setCurrentView,
    refreshData: refreshCashierData,
    refetchTables: tablesQuery.refetch,
    tables,
  });
  const listMetrics = getCashierListMetrics(visibleOrders, activeOrders);
  const reportMetrics = getCashierReportMetrics(reportOrders);
  const totalPages = Math.max(listOrdersQuery.data?.totalPages ?? 1, 1);

  const setView = (view: CashierView) => {
    setCurrentView(view);
    if (view !== "create") {
      manualOrder.clearMenuFilter();
    }
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
    clock,
    currentUser,
    currentView,
    headerTitle: getCashierViewTitle(currentView),
    listMetrics,
    listOrders,
    listOrdersQuery,
    manualOrder,
    pageNumber,
    pageSize,
    payment,
    refreshCashierData,
    reportMetrics,
    reportOrders,
    reportOrdersQuery,
    searchInput,
    selectedOrder,
    selectedOrderId,
    setPageNumber,
    setPageSize,
    setSearchInput,
    setSelectedOrderId,
    setView,
    showCompactToolbar:
      currentView === "tables" || currentView === "create",
    showDetailedToolbar:
      currentView === "orders" || currentView === "history",
    tables,
    tablesQuery,
    totalPages,
    visibleOrders,
  };
};
