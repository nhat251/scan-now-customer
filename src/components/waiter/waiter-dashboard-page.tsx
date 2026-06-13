/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCheck,
  ChefHat,
  Clock3,
  Grid2x2,
  Loader2,
  PlusCircle,
  Search,
  Table2,
  UserCircle2,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime } from "@/components/owner/tables/helpers";
import { Label } from "@/components/ui/label";
import { useCloseMyTableSessionMutation, useOpenMyTableSessionMutation } from "@/hooks/mutations/useMyTableMutations";
import {
  useConfirmWaiterOrderMutation,
  useCreateWaiterOrderMutation,
  useMarkWaiterItemsServedMutation,
} from "@/hooks/mutations/useOrderMutations";
import { useCashierOrdersQuery } from "@/hooks/queries/useCashierQueries";
import { useMyBranchesListQuery, useMyBranchMenuQuery, useMyBranchTablesQuery } from "@/hooks/queries/useMeQueries";
import { useReadyToServeItemsQuery } from "@/hooks/queries/useOrderQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { MyMenuCategoryResponse, MyMenuItemResponse, MyTableResponse } from "@/types/me";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

type WaiterView = "orders" | "table-map" | "create-order" | "menu" | "profile";

type WaiterCartItem = {
  menuItem: MyMenuItemResponse;
  qty: number;
};

type OrderFilter = "all" | "pending" | "preparing" | "ready";

const NAV_ITEMS: Array<{
  key: WaiterView;
  label: string;
  icon: ReactNode;
}> = [
  { key: "orders", label: "Don hang", icon: <BookOpen className="size-5" /> },
  { key: "table-map", label: "So do ban", icon: <Grid2x2 className="size-5" /> },
  { key: "create-order", label: "Tao don", icon: <PlusCircle className="size-5" /> },
  { key: "menu", label: "Menu", icon: <ChefHat className="size-5" /> },
  { key: "profile", label: "Toi", icon: <UserCircle2 className="size-5" /> },
];

const EMPTY_ORDERS: OwnerTableOrderHistoryResponse[] = [];
const EMPTY_TABLES: MyTableResponse[] = [];
const EMPTY_MENU_CATEGORIES: MyMenuCategoryResponse[] = [];

const getOrderStatusMeta = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    PendingConfirmation: { label: "Cho xac nhan", className: "bg-amber-100 text-amber-700" },
    Confirmed: { label: "Da xac nhan", className: "bg-primary-container/20 text-primary-container" },
    Preparing: { label: "Dang lam", className: "bg-orange-100 text-orange-700" },
    PartiallyReady: { label: "Len 1 phan", className: "bg-lime-100 text-lime-700" },
    ReadyToServe: { label: "San sang", className: "bg-emerald-100 text-emerald-700" },
    PartiallyServed: { label: "Da phuc vu 1 phan", className: "bg-slate-100 text-slate-700" },
    Served: { label: "Da phuc vu", className: "bg-slate-100 text-slate-700" },
    Completed: { label: "Hoan thanh", className: "bg-emerald-100 text-emerald-700" },
    Cancelled: { label: "Da huy", className: "bg-rose-100 text-rose-700" },
  };

  return map[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
};

const getOrderFilterGroup = (order: OwnerTableOrderHistoryResponse): OrderFilter => {
  if (order.status === "PendingConfirmation") {
    return "pending";
  }

  if (order.status === "PartiallyReady" || order.status === "ReadyToServe") {
    return "ready";
  }

  return "preparing";
};

const getTableState = (table: MyTableResponse) => {
  if (table.status === "DISABLED") {
    return "disabled";
  }

  return table.currentSession ? "occupied" : "available";
};

const PILL_BASE = "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold";

const Pill = ({ label, className }: { label: string; className: string }) => (
  <span className={cn(PILL_BASE, className)}>{label}</span>
);

const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <section className={cn("rounded-2xl border border-[#e8e4dc] bg-white shadow-sm", className)}>{children}</section>
);

const EmptyState = ({ title, detail }: { title: string; detail: string }) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
    <ChefHat className="mb-3 size-12 text-stone-300" />
    <p className="text-sm font-semibold text-stone-700">{title}</p>
    <p className="mt-1 text-xs text-stone-500">{detail}</p>
  </div>
);

export const WaiterDashboardPage = () => {
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = branchesQuery.data ?? [];

  const [branchId, setBranchId] = useState("");
  const [currentView, setCurrentView] = useState<WaiterView>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { watch: watchOrder, setValue: setValueOrder, reset: resetOrderForm } = useForm({
    defaultValues: {
      selectedTableId: null as string | null,
      categorySearch: "",
      customerName: "",
      customerNote: "",
    },
  });

  const selectedTableId = watchOrder("selectedTableId");
  const categorySearch = watchOrder("categorySearch");
  const customerName = watchOrder("customerName");
  const customerNote = watchOrder("customerNote");

  const [activeCategory, setActiveCategory] = useState("all");
  const [cartItems, setCartItems] = useState<WaiterCartItem[]>([]);
  const [selectedTableModal, setSelectedTableModal] = useState<MyTableResponse | null>(null);

  const activeBranchId = branchId || branches[0]?.branchId;
  const debouncedOrderSearch = useDebounce(orderSearchInput.trim(), 250);
  const debouncedCategorySearch = useDebounce(categorySearch.trim(), 200);

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
    Boolean(activeBranchId),
  );
  const tablesQuery = useMyBranchTablesQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "tableNumber", sortDirection: "asc" },
    Boolean(activeBranchId),
  );
  const menuQuery = useMyBranchMenuQuery(
    activeBranchId,
    { pageNumber: 1, pageSize: 100, sortBy: "displayOrder", sortDirection: "asc" },
    Boolean(activeBranchId),
  );
  const readyItemsQuery = useReadyToServeItemsQuery(activeBranchId, Boolean(activeBranchId));

  const confirmOrderMutation = useConfirmWaiterOrderMutation();
  const markServedMutation = useMarkWaiterItemsServedMutation();
  const createOrderMutation = useCreateWaiterOrderMutation();
  const openTableMutation = useOpenMyTableSessionMutation();
  const closeTableMutation = useCloseMyTableSessionMutation();

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
    [activeOrdersQuery.data?.items],
  );
  const tables = useMemo(() => tablesQuery.data?.items ?? EMPTY_TABLES, [tablesQuery.data?.items]);
  const menuCategories = useMemo(
    () => menuQuery.data?.items ?? EMPTY_MENU_CATEGORIES,
    [menuQuery.data?.items],
  );
  const readyGroups = readyItemsQuery.data ?? [];

  const filteredOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      if (orderFilter === "all") {
        return true;
      }

      return getOrderFilterGroup(order) === orderFilter;
    });
  }, [activeOrders, orderFilter]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId(null);
      return;
    }

    if (!selectedOrderId || !filteredOrders.some((order) => order.orderId === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].orderId);
    }
  }, [filteredOrders, selectedOrderId]);

  const selectedOrder =
    filteredOrders.find((order) => order.orderId === selectedOrderId) ??
    activeOrders.find((order) => order.orderId === selectedOrderId) ??
    filteredOrders[0] ??
    null;

  const selectedOrderReadyItems =
    selectedOrder?.items.filter((item) => item.status === "Ready").map((item) => item.orderItemId) ?? [];

  const menuItems = useMemo(() => {
    const flattened = menuCategories.flatMap((category: MyMenuCategoryResponse) =>
      category.items.map((item) => ({
        ...item,
        categoryName: category.categoryName,
      })),
    );

    return flattened.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory || item.categoryName === activeCategory;
      const matchesSearch =
        !debouncedCategorySearch ||
        item.name.toLowerCase().includes(debouncedCategorySearch.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(debouncedCategorySearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedCategorySearch, menuCategories]);

  const categoryOptions = useMemo(
    () =>
      menuCategories.map((category) => ({
        id: category.categoryId,
        name: category.categoryName,
      })),
    [menuCategories],
  );

  const selectedTable = tables.find((table) => table.tableId === selectedTableId) ?? null;
  const selectedTableOrders = selectedTable
    ? activeOrders.filter((order) => order.tableId === selectedTable.tableId)
    : [];

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0),
    [cartItems],
  );

  const setCreateMode = (tableId: string | null) => {
    resetOrderForm({
      selectedTableId: tableId,
      customerName: "",
      customerNote: "",
      categorySearch: "",
    });
    setCartItems([]);
    setActiveCategory("all");
    setCurrentView("create-order");
  };

  const addToCart = (menuItem: MyMenuItemResponse) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.menuItem.menuItemId === menuItem.menuItemId);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.menuItemId === menuItem.menuItemId ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [...prev, { menuItem, qty: 1 }];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.menuItem.menuItemId === menuItemId ? { ...item, qty: item.qty + delta } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

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
      request: {
        orderItemIds: selectedOrderReadyItems,
      },
    });
    await refreshWaiterData();
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
      await openTableMutation.mutateAsync({ branchId: activeBranchId, tableId: table.tableId });
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

    setCartItems([]);
    resetOrderForm({
      selectedTableId: null,
      customerName: "",
      customerNote: "",
      categorySearch: "",
    });
    setSelectedOrderId(response.result.orderId);
    setCurrentView("orders");
    await refreshWaiterData();
  };

  const openTable = async (table: MyTableResponse) => {
    if (!activeBranchId) {
      return;
    }

    await openTableMutation.mutateAsync({ branchId: activeBranchId, tableId: table.tableId });
    await tablesQuery.refetch();
  };

  const closeTable = async (table: MyTableResponse) => {
    if (!table.currentSession) {
      return;
    }

    await closeTableMutation.mutateAsync(table.currentSession.sessionId);
    await tablesQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] justify-center">
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f8f7f4] shadow-2xl sm:border-x sm:border-[#e8e4dc]">
          <header className="sticky top-0 z-40 h-[60px] shrink-0 border-b border-[#e8e4dc] bg-white">
            <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-primary-container text-lg font-black tracking-tight">ScanNow</span>
              </div>
              <h1 className="text-center text-base font-black">
                {currentView === "orders" && "Don hang"}
                {currentView === "table-map" && "So do ban"}
                {currentView === "create-order" && "Tao don moi"}
                {currentView === "menu" && "Menu"}
                {currentView === "profile" && "Tai khoan"}
              </h1>
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-medium tracking-wider text-stone-500 uppercase">Live</span>
                </div>
                <button type="button" className="rounded-full p-1 text-stone-500">
                  <Bell className="size-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden pb-[86px]">
            <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  value={activeBranchId ?? ""}
                  onChange={(event) => {
                    setBranchId(event.target.value);
                    setSelectedOrderId(null);
                    resetOrderForm({
                      selectedTableId: null,
                      customerName: "",
                      customerNote: "",
                      categorySearch: "",
                    });
                  }}
                  className="h-10 min-w-0 flex-1 rounded-2xl border border-[#e8e4dc] bg-[#f8f7f4] px-3 text-[13px] font-bold outline-none"
                >
                  {branches.map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <div className="bg-primary-container/10 text-primary-container max-w-[40%] truncate rounded-2xl px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase">
                  {currentUser?.fullName ?? "Staff"}
                </div>
              </div>
            </div>

            {!activeBranchId ? (
              <EmptyState title="Chon branch de bat dau" detail="Tai khoan nay chua co branch kha dung." />
            ) : currentView === "orders" ? (
              <OrdersView
                orders={filteredOrders}
                isLoading={activeOrdersQuery.isLoading}
                orderFilter={orderFilter}
                onFilterChange={setOrderFilter}
                searchInput={orderSearchInput}
                onSearchChange={setOrderSearchInput}
                selectedOrder={selectedOrder}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
                onConfirm={confirmOrder}
                confirmPending={confirmOrderMutation.isPending}
                onMarkServed={markReadyItemsServed}
                markServedPending={markServedMutation.isPending}
                onAddItems={() => setCreateMode(selectedOrder?.tableId ?? null)}
              />
            ) : null}

            {currentView === "table-map" ? (
              <TableMapView
                tables={tables}
                activeOrders={activeOrders}
                readyGroups={readyGroups}
                isLoading={tablesQuery.isLoading}
                selectedTable={selectedTableModal}
                onSelectTable={setSelectedTableModal}
                onOpenTable={openTable}
                onCloseTable={closeTable}
                onCreateOrder={setCreateMode}
                onViewOrders={(orderId) => {
                  setSelectedOrderId(orderId);
                  setCurrentView("orders");
                }}
                openPending={openTableMutation.isPending}
                closePending={closeTableMutation.isPending}
              />
            ) : null}

            {currentView === "create-order" ? (
              <CreateOrderView
                tables={tables}
                selectedTable={selectedTable}
                selectedTableOrders={selectedTableOrders}
                onSelectTable={(tableId) => setValueOrder("selectedTableId", tableId)}
                menuItems={menuItems}
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                search={categorySearch}
                onSearchChange={(value) => setValueOrder("categorySearch", value)}
                cartItems={cartItems}
                onAddToCart={addToCart}
                onUpdateQty={updateCartQty}
                cartTotal={cartTotal}
                customerName={customerName}
                onCustomerNameChange={(value) => setValueOrder("customerName", value)}
                customerNote={customerNote}
                onCustomerNoteChange={(value) => setValueOrder("customerNote", value)}
                onSubmit={submitOrder}
                isSubmitting={createOrderMutation.isPending || openTableMutation.isPending}
              />
            ) : null}

            {currentView === "menu" ? (
              <MenuView
                menuItems={menuItems}
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                search={categorySearch}
                onSearchChange={(value) => setValueOrder("categorySearch", value)}
              />
            ) : null}

            {currentView === "profile" ? (
              <ProfileView currentUser={currentUser} activeBranchId={activeBranchId} branchName={branches.find((item) => item.branchId === activeBranchId)?.name ?? "-"} />
            ) : null}
          </main>

          <nav className="fixed bottom-0 left-1/2 z-50 flex h-[72px] w-full max-w-[500px] -translate-x-1/2 items-center justify-around border-t border-[#e8e4dc] bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const active = currentView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCurrentView(item.key)}
                  className={cn(
                    "flex min-w-[68px] flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                    active ? "text-primary-container" : "text-stone-400",
                  )}
                >
                  {item.icon}
                  <span className={cn("font-medium", active && "font-bold")}>{item.label}</span>
                </button>
              );
            })}

            <div className="relative -top-3">
              <button
                type="button"
                onClick={() => setCurrentView("create-order")}
                className="bg-primary-container shadow-primary-container/30 flex size-14 items-center justify-center rounded-full text-white shadow-lg active:scale-[0.98]"
              >
                <PlusCircle className="size-7" />
              </button>
            </div>

            {NAV_ITEMS.slice(3).map((item) => {
              const active = currentView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCurrentView(item.key)}
                  className={cn(
                    "flex min-w-[68px] flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                    active ? "text-primary-container" : "text-stone-400",
                  )}
                >
                  {item.icon}
                  <span className={cn("font-medium", active && "font-bold")}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

function OrdersView({
  orders,
  isLoading,
  orderFilter,
  onFilterChange,
  searchInput,
  onSearchChange,
  selectedOrder,
  selectedOrderId,
  onSelectOrder,
  onConfirm,
  confirmPending,
  onMarkServed,
  markServedPending,
  onAddItems,
}: {
  orders: OwnerTableOrderHistoryResponse[];
  isLoading: boolean;
  orderFilter: OrderFilter;
  onFilterChange: (filter: OrderFilter) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedOrder: OwnerTableOrderHistoryResponse | null;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onConfirm: (orderId: string) => void;
  confirmPending: boolean;
  onMarkServed: () => void;
  markServedPending: boolean;
  onAddItems: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setSheetOpen(true);
    }
  }, [selectedOrderId, selectedOrder]);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: "all" as OrderFilter, label: "Tat ca" },
                { key: "pending" as OrderFilter, label: "Cho XN" },
                { key: "preparing" as OrderFilter, label: "Dang lam" },
                { key: "ready" as OrderFilter, label: "San sang" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onFilterChange(item.key)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                    orderFilter === item.key ? "bg-primary-container text-white" : "bg-stone-100 text-stone-600",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tim ban, order..."
              className="h-10 w-full rounded-xl border border-[#e8e4dc] bg-[#f8f7f4] pr-3 pl-10 text-sm outline-none"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto pt-3 pb-28">
          <div className="space-y-[10px] px-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm">
                <Loader2 className="text-primary-container size-4 animate-spin" />
                <span>Loading orders...</span>
              </div>
            ) : null}

            {!isLoading && orders.length === 0 ? (
              <EmptyState title="Chua co order phu hop" detail="Thu doi filter hoac branch." />
            ) : null}

            {orders.map((order) => {
              const statusMeta = getOrderStatusMeta(order.status);
              const active = selectedOrderId === order.orderId;
              const readyCount = order.items.filter((item) => item.status === "Ready").length;

              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => onSelectOrder(order.orderId)}
                  className={cn(
                    "w-full rounded-[22px] border bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99]",
                    active ? "border-primary-container/20 bg-primary-container/10/70" : "border-[#e8e4dc]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-container/10 text-primary-container flex size-11 items-center justify-center rounded-[14px] text-lg font-black">
                        {order.tableNumber ?? "TA"}
                      </div>
                      <div>
                        <p className="text-sm font-black">Ban {order.tableNumber ?? "Takeaway"}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {order.orderNumber} · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Pill label={statusMeta.label} className={statusMeta.className} />
                  </div>

                  <div className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                    {order.items.slice(0, 2).map((item) => `${item.menuItemName} x${item.quantity}`).join(", ")}
                    {order.items.length > 2 ? "..." : ""}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-black text-orange-600">{formatCurrency(order.totalAmount)}</span>
                    {readyCount > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                        {readyCount} mon san sang
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sheetOpen && selectedOrder ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 z-50 flex h-[88%] w-full max-w-[500px] -translate-x-1/2 flex-col rounded-t-[24px] bg-white shadow-2xl">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <OrderDetailSheetContent
              order={selectedOrder}
              onConfirm={async (orderId) => {
                await onConfirm(orderId);
                setSheetOpen(false);
              }}
              confirmPending={confirmPending}
              onMarkServed={async () => {
                await onMarkServed();
                setSheetOpen(false);
              }}
              markServedPending={markServedPending}
              onAddItems={() => {
                onAddItems();
                setSheetOpen(false);
              }}
            />
          </div>
        </>
      ) : null}
    </>
  );
}

function OrderDetailSheetContent({
  order,
  onConfirm,
  confirmPending,
  onMarkServed,
  markServedPending,
  onAddItems,
}: {
  order: OwnerTableOrderHistoryResponse | null;
  onConfirm: (orderId: string) => Promise<void> | void;
  confirmPending: boolean;
  onMarkServed: () => Promise<void> | void;
  markServedPending: boolean;
  onAddItems: () => void;
}) {
  if (!order) {
    return <EmptyState title="Chon mot order" detail="Nhan vao order trong danh sach de xem chi tiet." />;
  }

  const statusMeta = getOrderStatusMeta(order.status);
  const readyItems = order.items.filter((item) => item.status === "Ready");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-[#e8e4dc] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black">Ban {order.tableNumber ?? "-"}</h2>
              <Pill label={statusMeta.label} className={statusMeta.className} />
            </div>
            <p className="mt-1 text-sm text-stone-500">{order.orderNumber} · {formatDateTime(order.createdAt)}</p>
          </div>
          {order.tableId ? (
            <button
              type="button"
              onClick={onAddItems}
              className="border-primary-container/20 bg-primary-container/10 text-primary-container rounded-xl border px-3 py-2 text-xs font-bold"
            >
              Them mon
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50/60 p-4">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="rounded-2xl border border-[#ebe7df] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{item.menuItemName}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Qty {item.quantity} · {formatCurrency(item.unitPrice)}
                </p>
                {item.note ? <p className="mt-2 text-xs text-orange-600 italic">{item.note}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{formatCurrency(item.subTotal)}</p>
                <p className="mt-1 text-[11px] font-semibold text-stone-500">{item.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#e8e4dc] px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">Tong cong</span>
          <span className="text-2xl font-black text-orange-600">{formatCurrency(order.totalAmount)}</span>
        </div>

        {order.status === "PendingConfirmation" ? (
          <button
            type="button"
            onClick={() => onConfirm(order.orderId)}
            disabled={confirmPending}
            className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          >
            {confirmPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            Xac nhan don hang
          </button>
        ) : readyItems.length > 0 ? (
          <button
            type="button"
            onClick={() => onMarkServed()}
            disabled={markServedPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white disabled:opacity-50"
          >
            {markServedPending ? <Loader2 className="size-4 animate-spin" /> : <ChefHat className="size-4" />}
            Danh dau da phuc vu {readyItems.length} mon
          </button>
        ) : (
          <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-600">
            <Clock3 className="size-4" />
            Theo doi bep va ban
          </div>
        )}
      </div>
    </div>
  );
}

function TableMapView({
  tables,
  activeOrders,
  readyGroups,
  isLoading,
  selectedTable,
  onSelectTable,
  onOpenTable,
  onCloseTable,
  onCreateOrder,
  onViewOrders,
  openPending,
  closePending,
}: {
  tables: MyTableResponse[];
  activeOrders: OwnerTableOrderHistoryResponse[];
  readyGroups: Array<{ tableId: string | null; tableNumber: string | null; orders: unknown[] }>;
  isLoading: boolean;
  selectedTable: MyTableResponse | null;
  onSelectTable: (table: MyTableResponse | null) => void;
  onOpenTable: (table: MyTableResponse) => Promise<void> | void;
  onCloseTable: (table: MyTableResponse) => Promise<void> | void;
  onCreateOrder: (tableId: string | null) => void;
  onViewOrders: (orderId: string) => void;
  openPending: boolean;
  closePending: boolean;
}) {
  const tableOrder = selectedTable
    ? activeOrders.find((order) => order.tableId === selectedTable.tableId) ?? null
    : null;

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
          <div className="flex flex-wrap gap-4 text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            <LegendDot color="bg-emerald-500" label="Trong" />
            <LegendDot color="bg-orange-500" label="Co khach" />
            <LegendDot color="bg-slate-400" label="Ngung" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="text-primary-container size-4 animate-spin" />
              <span>Loading tables...</span>
            </div>
          ) : null}

          <div className="grid grid-cols-3 gap-4 pb-28">
            {tables.map((table) => {
              const state = getTableState(table);
              const order = activeOrders.find((item) => item.tableId === table.tableId) ?? null;
              const hasReady = readyGroups.some((group) => group.tableId === table.tableId);
              const className =
                state === "occupied"
                  ? "border-transparent bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : state === "disabled"
                    ? "border-transparent bg-slate-100 text-slate-400"
                    : "border-[#e8e4dc] bg-white text-stone-900";

              return (
                <button
                  key={table.tableId}
                  type="button"
                  onClick={() => onSelectTable(table)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-3xl border-2 px-3 py-4 transition-all",
                    className,
                  )}
                >
                  {hasReady ? <span className="absolute top-2 right-2 size-3 rounded-full bg-emerald-300" /> : null}
                  <span className="text-2xl font-black">{table.tableNumber}</span>
                  {order ? (
                    <span className="mt-2 rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  ) : (
                    <span className="mt-2 text-[10px] font-bold tracking-[0.18em] uppercase opacity-70">
                      {state === "available" ? `${table.capacity} cho` : "Ngung"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTable ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => onSelectTable(null)} />
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black">Ban {selectedTable.tableNumber}</h3>
                <p className="mt-1 text-sm text-stone-500">{selectedTable.capacity} cho</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[#e8e4dc] p-2 text-stone-500"
                onClick={() => onSelectTable(null)}
              >
                <XCircle className="size-4" />
              </button>
            </div>

            {tableOrder ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-xs font-bold tracking-[0.2em] text-orange-700 uppercase">Dang phuc vu</p>
                  <p className="mt-2 text-lg font-black text-orange-700">{tableOrder.orderNumber}</p>
                  <p className="mt-1 text-sm text-orange-700">{formatCurrency(tableOrder.totalAmount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onCreateOrder(selectedTable.tableId);
                      onSelectTable(null);
                    }}
                    className="bg-primary-container flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
                  >
                    <PlusCircle className="size-4" />
                    Them mon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewOrders(tableOrder.orderId);
                      onSelectTable(null);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-bold text-stone-700"
                  >
                    <Table2 className="size-4" />
                    Xem don
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onCloseTable(selectedTable);
                    onSelectTable(null);
                  }}
                  disabled={closePending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-stone-100 text-sm font-bold text-stone-700 disabled:opacity-50"
                >
                  {closePending ? <Loader2 className="size-4 animate-spin" /> : <Table2 className="size-4" />}
                  Dong ban
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onCreateOrder(selectedTable.tableId);
                    onSelectTable(null);
                  }}
                  className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
                >
                  <PlusCircle className="size-4" />
                  Mo ban / Tao don
                </button>
                {!selectedTable.currentSession ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await onOpenTable(selectedTable);
                      onSelectTable(null);
                    }}
                    disabled={openPending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-bold text-stone-700 disabled:opacity-50"
                  >
                    {openPending ? <Loader2 className="size-4 animate-spin" /> : <Table2 className="size-4" />}
                    Mo phien ban
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

function CreateOrderView({
  tables,
  selectedTable,
  selectedTableOrders,
  onSelectTable,
  menuItems,
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  cartItems,
  onAddToCart,
  onUpdateQty,
  cartTotal,
  customerName,
  onCustomerNameChange,
  customerNote,
  onCustomerNoteChange,
  onSubmit,
  isSubmitting,
}: {
  tables: MyTableResponse[];
  selectedTable: MyTableResponse | null;
  selectedTableOrders: OwnerTableOrderHistoryResponse[];
  onSelectTable: (tableId: string | null) => void;
  menuItems: Array<MyMenuItemResponse & { categoryName?: string | null }>;
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  cartItems: WaiterCartItem[];
  onAddToCart: (item: MyMenuItemResponse) => void;
  onUpdateQty: (menuItemId: string, delta: number) => void;
  cartTotal: number;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerNote: string;
  onCustomerNoteChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [tableSheetOpen, setTableSheetOpen] = useState(false);
  const selectedTableLabel = selectedTable ? `Ban ${selectedTable.tableNumber}` : "Chon ban phuc vu";

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="mx-4 mt-4 space-y-2">
            <Label required className="text-xs font-bold text-stone-600">
              Chon ban phuc vu
            </Label>
            <button
              type="button"
              onClick={() => setTableSheetOpen(true)}
              className="flex w-full items-center justify-between rounded-[22px] border border-[#e8e4dc] bg-white px-4 py-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-container/10 text-primary-container flex size-10 items-center justify-center rounded-2xl">
                  <Table2 className="size-5" />
                </div>
                <div>
                  <p className="flex items-center gap-1 text-sm font-black">
                    {selectedTableLabel}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {selectedTableOrders.length > 0 ? "Ban dang co order, co the them mon" : "Nhan de chon ban phuc vu"}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-stone-400" />
            </button>
          </div>

          <div className="px-4 pt-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Tim mon an..."
                className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white pr-3 pl-10 text-sm outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button
              type="button"
              onClick={() => onCategoryChange("all")}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                activeCategory === "all" ? "bg-primary-container text-white" : "bg-white text-stone-600",
              )}
            >
              Tat ca
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
                  activeCategory === category.id ? "bg-primary-container text-white" : "bg-white text-stone-600",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-3 px-4 pt-4">
            {selectedTable ? (
              <div className="border-primary-container/15 bg-primary-container/10 rounded-[22px] border px-4 py-3">
                <p className="text-primary-container text-[11px] font-bold tracking-[0.18em] uppercase">Ban dang chon</p>
                <p className="text-primary-container mt-1 text-sm font-bold">
                  {selectedTableLabel}
                  {selectedTableOrders.length > 0 ? " · Dang phuc vu" : " · San sang tao don"}
                </p>
              </div>
            ) : null}

            {menuItems.map((item) => {
              const cartItem = cartItems.find((cart) => cart.menuItem.menuItemId === item.menuItemId);

              return (
                <article key={item.menuItemId} className="rounded-[24px] border border-[#ebe7df] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="size-[84px] shrink-0 overflow-hidden rounded-[18px] bg-stone-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-200">
                          <ChefHat className="size-7 text-stone-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black">{item.name}</p>
                          <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                            {item.categoryName ?? "Menu"}
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-black text-orange-600">{formatCurrency(item.price)}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className={cn("text-[12px] font-bold", item.isAvailable ? "text-emerald-600" : "text-rose-600")}>
                          {item.isAvailable ? "Con hang" : "Het hang"}
                        </span>

                        {cartItem ? (
                          <div className="bg-primary-container/10 flex items-center rounded-2xl px-2 py-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuItemId, -1)}
                              className="text-primary-container flex size-9 items-center justify-center rounded-xl bg-white"
                            >
                              -
                            </button>
                            <span className="text-primary-container w-10 text-center text-sm font-black">{cartItem.qty}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQty(item.menuItemId, 1)}
                              className="bg-primary-container flex size-9 items-center justify-center rounded-xl text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddToCart(item)}
                            disabled={!item.isAvailable}
                            className="border-primary-container/20 bg-primary-container/10 text-primary-container flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-bold disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
                          >
                            <PlusCircle className="size-4" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {cartItems.length > 0 ? (
        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="bg-primary-container shadow-primary-container/25 fixed bottom-[88px] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[468px] -translate-x-1/2 items-center justify-between rounded-[22px] px-5 py-4 text-white shadow-2xl active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 text-sm font-black">
              {cartItems.reduce((sum, item) => sum + item.qty, 0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-black">Xem gio hang</p>
              <p className="text-xs text-white/75">
                {selectedTableOrders.length > 0 ? "Them mon vao order dang phuc vu" : "Tao order moi cho ban"}
              </p>
            </div>
          </div>
          <p className="text-lg font-black">{formatCurrency(cartTotal)}</p>
        </button>
      ) : null}

      {tableSheetOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setTableSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
            <div className="mb-3 flex justify-center">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-black">Chon ban phuc vu</p>
              <button type="button" onClick={() => setTableSheetOpen(false)} className="rounded-full p-1 text-stone-500">
                <XCircle className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid max-h-[52vh] grid-cols-4 gap-3 overflow-y-auto">
              {tables
                .filter((table) => table.status !== "DISABLED")
                .map((table) => {
                  const selectable = !table.currentSession || table.tableId === selectedTable?.tableId;

                  return (
                    <button
                      key={table.tableId}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        onSelectTable(table.tableId);
                        setTableSheetOpen(false);
                      }}
                      className={cn(
                        "flex h-14 flex-col items-center justify-center rounded-2xl border-2 text-center transition-all",
                        table.tableId === selectedTable?.tableId
                          ? "border-primary-container bg-primary-container text-white"
                          : selectable
                            ? "border-[#e8e4dc] bg-white text-stone-900"
                            : "border-stone-100 bg-stone-50 text-stone-300",
                      )}
                    >
                      <span className="text-sm font-black">{table.tableNumber}</span>
                      <span className="text-[9px] font-bold uppercase">{table.currentSession ? "Dang dung" : "Trong"}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      ) : null}

      {cartSheetOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setCartSheetOpen(false)} />
          <div className="fixed bottom-0 left-1/2 z-50 flex h-[84%] w-full max-w-[500px] -translate-x-1/2 flex-col rounded-t-[28px] bg-white shadow-2xl">
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="border-b border-[#e8e4dc] px-5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black">Gio hang</p>
                  <p className="mt-1 text-sm text-stone-500">{selectedTableLabel}</p>
                </div>
                <button type="button" onClick={() => setCartSheetOpen(false)} className="rounded-full p-1 text-stone-500">
                  <XCircle className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <EmptyState title="Gio hang dang trong" detail="Them mon tu danh sach ben tren." />
              ) : (
                cartItems.map((item) => (
                  <div key={item.menuItem.menuItemId} className="rounded-[22px] border border-[#ebe7df] bg-stone-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{item.menuItem.name}</p>
                        <p className="mt-1 text-xs text-stone-500">{formatCurrency(item.menuItem.price)}</p>
                      </div>
                      <p className="text-sm font-black">{formatCurrency(item.menuItem.price * item.qty)}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItem.menuItemId, -1)}
                        className="text-primary-container flex size-8 items-center justify-center rounded-xl bg-white"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.menuItem.menuItemId, 1)}
                        className="bg-primary-container flex size-8 items-center justify-center rounded-xl text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#e8e4dc] px-5 py-4">
              <div className="space-y-3">
                <input
                  value={customerName}
                  onChange={(event) => onCustomerNameChange(event.target.value)}
                  placeholder="Ten khach (optional)"
                  className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white px-3 text-sm outline-none"
                />
                <input
                  value={customerNote}
                  onChange={(event) => onCustomerNoteChange(event.target.value)}
                  placeholder="Ghi chu (optional)"
                  className="h-11 w-full rounded-2xl border border-[#e8e4dc] bg-white px-3 text-sm outline-none"
                />
                <div className="flex items-center justify-between border-t border-dashed border-[#e8e4dc] pt-3">
                  <span className="text-sm font-bold tracking-[0.18em] text-stone-500 uppercase">Tong cong</span>
                  <span className="text-2xl font-black text-orange-600">{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onSubmit();
                    setCartSheetOpen(false);
                  }}
                  disabled={!selectedTable || cartItems.length === 0 || isSubmitting}
                  className="bg-primary-container flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                  {selectedTableOrders.length > 0 ? "Them mon vao ban" : "Gui don hang"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

function MenuView({
  menuItems,
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
}: {
  menuItems: Array<MyMenuItemResponse & { categoryName?: string | null }>;
  categories: Array<{ id: string; name: string }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mt-3 shrink-0 px-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tim mon an, do uong..."
            className="h-10 w-full rounded-[10px] border border-[#e8e4dc] bg-[#f8f7f4] pr-3 pl-10 text-sm outline-none"
          />
        </label>
      </div>

      <div className="my-4 flex shrink-0 gap-2 overflow-x-auto px-4">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
            activeCategory === "all" ? "bg-primary-container text-white" : "bg-[#f1efe9] text-stone-600",
          )}
        >
          Tat ca
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all",
              activeCategory === category.id ? "bg-primary-container text-white" : "bg-[#f1efe9] text-stone-600",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto px-4 pb-28">
        <div className="space-y-5">
          {menuItems.map((item) => (
            <article
              key={item.menuItemId}
              className="rounded-[28px] border border-[#e8e4dc] bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-center gap-4">
                <div className="size-[100px] shrink-0 overflow-hidden rounded-[18px] bg-stone-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-200">
                      <ChefHat className="size-8 text-stone-400" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[18px] font-bold text-stone-900">{item.name}</h3>
                      <p className="mt-2 text-[13px] font-medium tracking-[0.16em] text-stone-400 uppercase">
                        {item.categoryName ?? "Menu"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[18px] font-black text-orange-600">{formatCurrency(item.price)}</p>
                      <p className={cn("mt-2 text-[13px] font-bold", item.isAvailable ? "text-emerald-600" : "text-rose-600")}>
                        {item.isAvailable ? "Con hang" : "Het hang"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function ProfileView({
  currentUser,
  activeBranchId,
  branchName,
}: {
  currentUser: { fullName?: string; role?: string; email?: string | null } | null;
  activeBranchId: string;
  branchName: string;
}) {
  return (
    <div className="h-full overflow-y-auto p-6 pb-28">
      <Card className="rounded-[28px] p-6">
        <div className="flex items-center gap-4">
          <div className="border-primary-container/10 bg-primary-container/20 text-primary-container flex size-20 items-center justify-center rounded-full border-4">
            <UserCircle2 className="size-12" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black">{currentUser?.fullName ?? "Nhan vien"}</h2>
            <p className="bg-primary-container/10 text-primary-container mt-1 inline-block rounded-full px-2 py-1 text-[11px] font-bold">
              {currentUser?.role ?? "STAFF"}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-500">{currentUser?.email ?? "Khong co email"}</p>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card className="rounded-[28px] p-4 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-500 uppercase">Branch</p>
          <p className="text-primary-container mt-2 text-lg font-black">{branchName}</p>
        </Card>
        <Card className="rounded-[28px] p-4 text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-stone-500 uppercase">Vai tro</p>
          <p className="mt-2 text-lg font-black text-orange-600">{currentUser?.role ?? "STAFF"}</p>
        </Card>
      </div>

      <div className="mt-6 space-y-3">
        <InfoRow label="Chi nhanh" value={branchName} />
        <InfoRow label="Branch ID" value={activeBranchId} />
        <InfoRow label="Email" value={currentUser?.email ?? "-"} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#ebe7df] bg-stone-50 px-4 py-3 text-sm">
      <span className="font-semibold text-stone-500">{label}</span>
      <span className="max-w-[60%] truncate font-bold">{value}</span>
    </div>
  );
}
