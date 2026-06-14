"use client";

import { Bell, BookOpen, ChefHat, Grid2x2, PlusCircle, UserCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { WaiterCreateOrderView } from "@/components/waiter/waiter-create-order-view";
import type { WaiterView } from "@/components/waiter/waiter-dashboard.types";
import { WaiterEmptyState } from "@/components/waiter/waiter-empty-state";
import { WaiterMenuView } from "@/components/waiter/waiter-menu-view";
import { WaiterOrdersView } from "@/components/waiter/waiter-orders-view";
import { WaiterProfileView } from "@/components/waiter/waiter-profile-view";
import { WaiterTableMapView } from "@/components/waiter/waiter-table-map-view";
import { useWaiterDashboard } from "@/hooks/waiter/use-waiter-dashboard";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{
  key: WaiterView;
  label: string;
  icon: ReactNode;
}> = [
  { key: "orders", label: "Đơn hàng", icon: <BookOpen className="size-5" /> },
  { key: "table-map", label: "Sơ đồ bàn", icon: <Grid2x2 className="size-5" /> },
  { key: "create-order", label: "Tạo đơn", icon: <PlusCircle className="size-5" /> },
  { key: "menu", label: "Thực đơn", icon: <ChefHat className="size-5" /> },
  { key: "profile", label: "Tôi", icon: <UserCircle2 className="size-5" /> },
];

export const WaiterDashboardPage = () => {
  const {
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
  } = useWaiterDashboard();
  const {
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
    selectedTable,
    selectedTableOrders,
    setActiveCategory,
    setCreateMode,
    setValue,
    submitOrder,
    updateCartQty,
  } = manualOrder;

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] justify-center">
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#f8f7f4] shadow-2xl sm:border-x sm:border-[#e8e4dc]">
          <header className="sticky top-0 z-40 h-[60px] shrink-0 border-b border-[#e8e4dc] bg-white">
            <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-primary-container text-lg font-black tracking-tight">
                  ScanNow
                </span>
              </div>
              <h1 className="text-center text-base font-black">
                {currentView === "orders" && "Đơn hàng"}
                {currentView === "table-map" && "Sơ đồ bàn"}
                {currentView === "create-order" && "Tạo đơn mới"}
                {currentView === "menu" && "Thực đơn"}
                {currentView === "profile" && "Tài khoản"}
              </h1>
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-medium tracking-wider text-stone-500 uppercase">
                    Trực tiếp
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Xem thông báo"
                  className="rounded-full p-1 text-stone-500"
                >
                  <Bell className="size-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden pb-[86px]">
            <div className="border-b border-[#e8e4dc] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <select
                  aria-label="Chọn chi nhánh"
                  value={activeBranchId ?? ""}
                  onChange={(event) => changeBranch(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-2xl border border-[#e8e4dc] bg-[#f8f7f4] px-3 text-[13px] font-bold outline-none"
                >
                  {branches.map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <div className="bg-primary-container/10 text-primary-container max-w-[40%] truncate rounded-2xl px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase">
                  {currentUser?.fullName ?? "Nhân viên phục vụ"}
                </div>
              </div>
            </div>

            {!activeBranchId ? (
              <WaiterEmptyState
                title="Chọn chi nhánh để bắt đầu"
                detail="Tài khoản này chưa có chi nhánh khả dụng."
              />
            ) : currentView === "orders" ? (
              <WaiterOrdersView
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
              <WaiterTableMapView
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
              <WaiterCreateOrderView
                tables={tables}
                selectedTable={selectedTable}
                selectedTableOrders={selectedTableOrders}
                onSelectTable={(tableId) => setValue("selectedTableId", tableId)}
                menuItems={menuItems}
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                search={categorySearch}
                onSearchChange={(value) => setValue("categorySearch", value)}
                cartItems={cartItems}
                onAddToCart={addToCart}
                onUpdateQty={updateCartQty}
                cartTotal={cartTotal}
                customerName={customerName}
                onCustomerNameChange={(value) => setValue("customerName", value)}
                customerNote={customerNote}
                onCustomerNoteChange={(value) => setValue("customerNote", value)}
                onSubmit={submitOrder}
                isSubmitting={createOrderMutation.isPending || openTableMutation.isPending}
              />
            ) : null}

            {currentView === "menu" ? (
              <WaiterMenuView
                menuItems={menuItems}
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                search={categorySearch}
                onSearchChange={(value) => setValue("categorySearch", value)}
              />
            ) : null}

            {currentView === "profile" ? (
              <WaiterProfileView
                currentUser={currentUser}
                activeBranchId={activeBranchId}
                branchName={branches.find((item) => item.branchId === activeBranchId)?.name ?? "-"}
              />
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
                    active ? "text-primary-container" : "text-stone-400"
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
                aria-label="Tạo đơn mới"
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
                    active ? "text-primary-container" : "text-stone-400"
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
