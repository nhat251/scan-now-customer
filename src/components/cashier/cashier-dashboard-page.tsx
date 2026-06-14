"use client";

import {
  Grid2x2,
  History,
  Loader2,
  MonitorDot,
  PlusCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { CashierCreateOrderPanel } from "@/components/cashier/cashier-create-order-panel";
import {
  getCashierBranchName,
  printCashierReceipt,
} from "@/components/cashier/cashier-dashboard.helpers";
import type { CashierView } from "@/components/cashier/cashier-dashboard.types";
import { CashierHistoryPanel } from "@/components/cashier/cashier-history-panel";
import { CashierMetricCard } from "@/components/cashier/cashier-metric-card";
import { CashierOrderDetailPanel } from "@/components/cashier/cashier-order-detail-panel";
import { CashierOrdersListPanel } from "@/components/cashier/cashier-orders-list-panel";
import { CashierPaymentPanel } from "@/components/cashier/cashier-payment-panel";
import { CashierReportPanel } from "@/components/cashier/cashier-report-panel";
import { CashierSectionCard } from "@/components/cashier/cashier-section-card";
import { CashierTablesPanel } from "@/components/cashier/cashier-tables-panel";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashierDashboard } from "@/hooks/cashier/use-cashier-dashboard";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{
  key: CashierView;
  label: string;
  mobileLabel: string;
  icon: ReactNode;
}> = [
  {
    key: "orders",
    label: "Quản lý đơn",
    mobileLabel: "Đơn",
    icon: <ReceiptText className="size-5" />,
  },
  { key: "tables", label: "Sơ đồ bàn", mobileLabel: "Bàn", icon: <Grid2x2 className="size-5" /> },
  {
    key: "create",
    label: "Tạo đơn mới",
    mobileLabel: "Tạo",
    icon: <PlusCircle className="size-5" />,
  },
  {
    key: "history",
    label: "Lịch sử GD",
    mobileLabel: "Lịch sử",
    icon: <History className="size-5" />,
  },
  {
    key: "report",
    label: "Báo cáo",
    mobileLabel: "Báo cáo",
    icon: <MonitorDot className="size-5" />,
  },
];

export const CashierDashboardPage = () => {
  const {
    activeBranchId,
    activeOrders,
    activeOrdersQuery,
    branches,
    changeBranch,
    clock,
    currentUser,
    currentView,
    headerTitle,
    listMetrics: { needPaymentCount, visibleTotal },
    listOrders,
    listOrdersQuery,
    manualOrder,
    pageNumber,
    pageSize,
    payment,
    refreshCashierData,
    reportMetrics: {
      averageTicket,
      paidCount,
      paidRevenue,
      pendingRevenue,
    },
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
    showCompactToolbar,
    showDetailedToolbar,
    tables,
    tablesQuery,
    totalPages,
    visibleOrders,
  } = useCashierDashboard();
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
    setCreateModeForTable,
    setValue,
    submitManualOrder,
    updateCartQty,
  } = manualOrder;
  const {
    activePayOsPayment,
    amountReceivedInput,
    canConfirmCash,
    cancelCashierPayment,
    cancelPaymentMutation,
    cashChange,
    cashDialogOpen,
    checkout,
    checkoutMutation,
    confirmCashPayment,
    hasPendingPayOs,
    openCashDialog,
    register: registerCash,
    setCashDialogOpen,
    setVoucherCode,
    voucherCode,
  } = payment;

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-sans text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[88px] shrink-0 border-r border-[#e8e4dc] bg-white md:flex lg:w-[240px]">
          <div className="flex h-full w-full flex-col justify-between px-4 py-6">
            <div>
              <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
                <div className="bg-primary shadow-primary/20 flex size-10 items-center justify-center rounded-2xl text-white shadow-lg">
                  <ReceiptText className="size-5" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-lg font-black tracking-tight">ScanNow</p>
                  <p className="text-primary text-[11px] font-bold tracking-[0.24em] uppercase">
                    Thu ngân
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active = currentView === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-label={item.label}
                      onClick={() => setView(item.key)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-stone-500 hover:bg-stone-50"
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="hidden lg:inline">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-2xl border border-[#e8e4dc] bg-stone-50 px-3 py-3">
              <p className="truncate text-sm font-bold">{currentUser?.fullName ?? "Thu ngân"}</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
                {getCashierBranchName(activeBranchId, branches)}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0">
          <header className="sticky top-0 z-30 border-b border-[#e8e4dc] bg-white/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] text-stone-500 uppercase">
                  Khu vực thu ngân
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight">{headerTitle}</h1>
                <p className="mt-1 text-sm text-stone-500">
                  {getCashierBranchName(activeBranchId, branches)} ·{" "}
                  {clock.toLocaleDateString("vi-VN")}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex items-center gap-2 rounded-full border border-[#e8e4dc] bg-stone-50 px-3 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.22em] text-stone-700 uppercase">
                    Trực tuyến
                  </span>
                </div>

                <div className="rounded-2xl border border-[#e8e4dc] bg-white px-4 py-2 text-right shadow-sm">
                  <p className="font-mono text-sm font-bold">{clock.toLocaleTimeString("vi-VN")}</p>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
                    {currentUser?.fullName ?? "Thu ngân"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4">
              {showDetailedToolbar ? (
                <CashierSectionCard className="p-4">
                  <div className="grid gap-3 lg:grid-cols-[240px_minmax(260px,1fr)_auto]">
                    <select
                      aria-label="Chọn chi nhánh"
                      value={activeBranchId ?? ""}
                      onChange={(event) => changeBranch(event.target.value)}
                      className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {branches.map((branch) => (
                        <option key={branch.branchId} value={branch.branchId}>
                          {branch.name}
                        </option>
                      ))}
                    </select>

                    <label className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={
                          currentView === "history"
                            ? "Tìm đơn đã thanh toán, bàn hoặc phiên"
                            : "Tìm đơn, bàn, phiên hoặc khách hàng"
                        }
                        className="h-11 rounded-xl border-[#e8e4dc] pl-10"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => refreshCashierData()}
                      disabled={activeOrdersQuery.isFetching || listOrdersQuery.isFetching}
                    >
                      {activeOrdersQuery.isFetching || listOrdersQuery.isFetching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Tải lại
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <CashierMetricCard
                      label="Đơn đang hiển thị"
                      value={String(visibleOrders.length)}
                      helper="Theo bộ lọc hiện tại"
                    />
                    <CashierMetricCard
                      label="Cần thu"
                      value={String(needPaymentCount)}
                      helper="Đơn chưa thanh toán"
                    />
                    <CashierMetricCard
                      label="Tổng tiền"
                      value={formatCurrency(visibleTotal)}
                      helper="Tổng trên danh sách"
                    />
                  </div>
                </CashierSectionCard>
              ) : null}

              {showCompactToolbar ? (
                <CashierSectionCard className="p-4">
                  <div className="grid gap-3 md:grid-cols-[240px_minmax(0,1fr)_auto]">
                    <select
                      aria-label="Chọn chi nhánh"
                      value={activeBranchId ?? ""}
                      onChange={(event) => changeBranch(event.target.value)}
                      className="h-11 rounded-xl border border-[#e8e4dc] bg-white px-3 text-sm font-semibold outline-none"
                    >
                      {branches.map((branch) => (
                        <option key={branch.branchId} value={branch.branchId}>
                          {branch.name}
                        </option>
                      ))}
                    </select>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <CashierMetricCard
                        label="Cần thu"
                        value={String(needPaymentCount)}
                        helper="Đơn chưa thu tiền"
                      />
                      <CashierMetricCard
                        label="Đang mở"
                        value={String(activeOrders.length)}
                        helper="Đơn đang phục vụ"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={() => refreshCashierData()}
                      disabled={activeOrdersQuery.isFetching || tablesQuery.isFetching}
                    >
                      {activeOrdersQuery.isFetching || tablesQuery.isFetching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Tải lại
                    </Button>
                  </div>
                </CashierSectionCard>
              ) : null}

              {currentView === "orders" ? (
                <section className="grid gap-4 xl:grid-cols-[360px_minmax(320px,1fr)_400px]">
                  <CashierOrdersListPanel
                    orders={listOrders}
                    isLoading={listOrdersQuery.isLoading}
                    isError={listOrdersQuery.isError}
                    error={listOrdersQuery.error}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                  />

                  <CashierOrderDetailPanel
                    order={selectedOrder}
                    onAddItems={() => setCreateModeForTable(selectedOrder?.tableId ?? null)}
                    onOpenTableOrder={() => setView("tables")}
                  />

                  <CashierPaymentPanel
                    order={selectedOrder}
                    voucherCode={voucherCode}
                    onVoucherChange={setVoucherCode}
                    activePayOsPayment={activePayOsPayment}
                    hasPendingPayOs={hasPendingPayOs}
                    isCheckingOut={checkoutMutation.isPending}
                    isCanceling={cancelPaymentMutation.isPending}
                    onCash={openCashDialog}
                    onPayOs={() => checkout("PAYOS")}
                    onCancelPayOs={cancelCashierPayment}
                    onPrint={() =>
                      selectedOrder && printCashierReceipt(selectedOrder, activePayOsPayment)
                    }
                  />
                </section>
              ) : null}

              {currentView === "tables" ? (
                <CashierTablesPanel
                  tables={tables}
                  activeOrders={activeOrders}
                  isLoading={tablesQuery.isLoading || activeOrdersQuery.isLoading}
                  onCollect={(orderId) => {
                    setSelectedOrderId(orderId);
                    setView("orders");
                  }}
                  onCreate={setCreateModeForTable}
                  onOpenTable={openTable}
                  onCloseTable={closeTable}
                  openTablePending={openTableMutation.isPending}
                  closeTablePending={closeTableMutation.isPending}
                />
              ) : null}

              {currentView === "create" ? (
                <CashierCreateOrderPanel
                  tables={tables}
                  selectedTable={selectedTable}
                  selectedTableOrders={selectedTableOrders}
                  onSelectTable={(val) => setValue("selectedTableId", val)}
                  menuItems={menuItems}
                  categories={categoryOptions}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  search={categorySearch}
                  onSearchChange={(val) => setValue("categorySearch", val)}
                  cartItems={cartItems}
                  onAddToCart={addToCart}
                  onUpdateQty={updateCartQty}
                  cartTotal={cartTotal}
                  customerName={customerName}
                  onCustomerNameChange={(val) => setValue("customerName", val)}
                  customerNote={customerNote}
                  onCustomerNoteChange={(val) => setValue("customerNote", val)}
                  onSubmit={submitManualOrder}
                  isSubmitting={createOrderMutation.isPending || openTableMutation.isPending}
                />
              ) : null}

              {currentView === "history" ? (
                <CashierHistoryPanel
                  orders={listOrders}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                  selectedOrder={selectedOrder}
                  isLoading={listOrdersQuery.isLoading}
                  isError={listOrdersQuery.isError}
                  error={listOrdersQuery.error}
                  onPrint={() => selectedOrder && printCashierReceipt(selectedOrder, null)}
                />
              ) : null}

              {currentView === "report" ? (
                <CashierReportPanel
                  orders={reportOrders}
                  isLoading={reportOrdersQuery.isLoading}
                  revenue={paidRevenue}
                  pendingRevenue={pendingRevenue}
                  paidCount={paidCount}
                  averageTicket={averageTicket}
                />
              ) : null}

              {currentView === "orders" || currentView === "history" ? (
                  <FooterPagination
                  page={pageNumber}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  pageSizeOptions={[10]}
                  totalItems={listOrdersQuery.data?.totalItems ?? 0}
                  itemLabel="đơn"
                  mode="numbers"
                  disabled={listOrdersQuery.isFetching}
                  onPageChange={setPageNumber}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPageNumber(1);
                  }}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e4dc] bg-white/90 backdrop-blur-md md:hidden">
        <div className="flex h-[72px] items-center justify-around px-2">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.key;
            const isCreate = item.key === "create";
            return isCreate ? (
              <div key={item.key} className="relative -top-3">
                <button
                  type="button"
                  aria-label="Tạo đơn mới"
                  onClick={() => setView(item.key)}
                  className="bg-primary shadow-primary/30 flex size-14 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-95"
                >
                  {item.icon}
                </button>
                <span className="font-display text-text-muted absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium"></span>
              </div>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={cn(
                  "group flex flex-col items-center gap-1 transition-colors",
                  active ? "text-primary" : "hover:text-primary text-stone-500"
                )}
              >
                {item.icon}
                <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Thanh toán tiền mặt</DialogTitle>
            <DialogDescription>
              Nhập số tiền khách đưa trước khi hoàn tất thanh toán.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-stone-50 p-4 text-sm">
                <div className="flex justify-between py-1">
                  <span>Tổng đơn</span>
                  <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tiền thừa</span>
                  <strong className={cashChange < 0 ? "text-red-600" : "text-emerald-700"}>
                    {formatCurrency(Math.max(cashChange, 0))}
                  </strong>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount-received" required>
                  Tiền khách đưa
                </Label>
                <Input
                  id="amount-received"
                  type="number"
                  min={0}
                  step={1000}
                  {...registerCash("amountReceivedInput")}
                  className="h-12 text-lg font-bold"
                  autoFocus
                />
              </div>
              {amountReceivedInput && !canConfirmCash ? (
                <p className="text-sm text-red-600">
                  Tiền khách đưa phải lớn hơn hoặc bằng tổng đơn.
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCashDialogOpen(false)}
              disabled={checkoutMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmCashPayment}
              disabled={!canConfirmCash || checkoutMutation.isPending}
            >
              <Wallet className="size-4" />
              Xác nhận tiền mặt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
