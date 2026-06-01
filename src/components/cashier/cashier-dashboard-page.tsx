"use client";

import { useCallback, useMemo, useState } from "react";
import { CreditCard, Hash, Printer, RefreshCw, Search, Wallet } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { formatCurrency } from "@/components/customer/customer-session-utils";
import { formatDateTime, getOwnerTableErrorMessage } from "@/components/owner/tables/helpers";
import { getQrImageSrc, PayOsQrPanel } from "@/components/payment/payos-qr-panel";
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
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/ui/tag";
import { useCashierCancelPaymentMutation, useCashierCheckoutMutation } from "@/hooks/mutations/useCashierMutations";
import { useCashierOrdersQuery } from "@/hooks/queries/useCashierQueries";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserStore } from "@/stores/user";
import type { CashierOrderQuery, CashierPaymentResponse } from "@/types/cashier";
import type { OwnerTableOrderHistoryResponse } from "@/types/owner-table";

const STATUS_OPTIONS: Array<{ label: string; value: NonNullable<CashierOrderQuery["status"]> }> = [
  { label: "Active orders", value: "active" },
  { label: "Paid history", value: "paid" },
  { label: "All orders", value: "all" },
];

const getPaymentLabel = (order?: OwnerTableOrderHistoryResponse | null) => {
  if (!order) {
    return "-";
  }

  return order.paymentStatus ? `${order.paymentMethod ?? "Payment"} - ${order.paymentStatus}` : "No payment";
};

const printReceipt = (order: OwnerTableOrderHistoryResponse, payOsPayment?: CashierPaymentResponse | null) => {
  const receipt = window.open("", "_blank", "width=420,height=720");
  if (!receipt) {
    return;
  }

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.menuItemName} x${item.quantity}</td>
          <td style="text-align:right">${formatCurrency(item.subTotal)}</td>
        </tr>
      `,
    )
    .join("");
  const qrImageSrc =
    payOsPayment?.paymentMethod === "PAYOS"
      ? getQrImageSrc(payOsPayment.qrCode, payOsPayment.checkoutUrl)
      : null;

  receipt.document.write(`
    <html>
      <head>
        <title>Receipt ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 8px; }
          p { margin: 4px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td { border-bottom: 1px solid #ddd; padding: 8px 0; font-size: 13px; }
          .total { font-size: 18px; font-weight: 800; display: flex; justify-content: space-between; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>ScanNow Receipt</h1>
        <p>Order: ${order.orderNumber}</p>
        <p>Table: ${order.tableNumber ?? "-"}</p>
        <p>Session: ${order.sessionCode ?? "-"}</p>
        <p>Date: ${formatDateTime(order.createdAt)}</p>
        <table>${rows}</table>
        <p>Subtotal: ${formatCurrency(order.subTotal)}</p>
        <p>VAT: ${formatCurrency(order.vatAmount)}</p>
        <p>Service charge: ${formatCurrency(order.serviceChargeAmount)}</p>
        ${order.discountAmount > 0 ? `<p>Discount: -${formatCurrency(order.discountAmount)}</p>` : ""}
        <div class="total"><span>Total</span><span>${formatCurrency(order.totalAmount)}</span></div>
        <p>Payment: ${getPaymentLabel(order)}</p>
        ${
          order.paymentMethod === "CASH" && order.paymentStatus === "SUCCESS"
            ? `<p>Cash received: ${formatCurrency(order.amountReceived ?? order.totalAmount)}</p><p>Change: ${formatCurrency(order.changeAmount ?? 0)}</p>`
            : ""
        }
        ${
          qrImageSrc
            ? `<div style="margin-top:16px;text-align:center"><p style="font-weight:700">PayOS QR</p><img src="${qrImageSrc}" alt="PayOS QR" style="width:220px;height:220px;padding:8px;background:white" /><p>${payOsPayment?.description ?? ""}</p></div>`
            : ""
        }
      </body>
    </html>
  `);
  receipt.document.close();
  receipt.focus();
  receipt.print();
};

export const CashierDashboardPage = () => {
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = branchesQuery.data ?? [];
  const [branchId, setBranchId] = useState("");
  const activeBranchId = branchId || branches[0]?.branchId;
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 250);
  const [status, setStatus] = useState<NonNullable<CashierOrderQuery["status"]>>("active");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [amountReceivedInput, setAmountReceivedInput] = useState("");
  const [payOsPayment, setPayOsPayment] = useState<CashierPaymentResponse | null>(null);
  const query = useMemo<CashierOrderQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      status,
      sortBy: "createdAt",
      sortDirection: "desc",
    }),
    [pageNumber, pageSize, search, status],
  );
  const ordersQuery = useCashierOrdersQuery(activeBranchId, query, Boolean(activeBranchId));
  const checkoutMutation = useCashierCheckoutMutation();
  const cancelPaymentMutation = useCashierCancelPaymentMutation();
  const handleBranchOrderUpdated = useCallback(() => {
    void ordersQuery.refetch();
  }, [ordersQuery]);

  useBranchOrderUpdates(activeBranchId, {
    enabled: Boolean(activeBranchId),
    onOrderUpdated: handleBranchOrderUpdated,
  });
  const orders = ordersQuery.data?.items ?? [];
  const selectedOrder = orders.find((order) => order.orderId === selectedOrderId) ?? orders[0] ?? null;
  const totalPages = Math.max(ordersQuery.data?.totalPages ?? 1, 1);
  const unpaidCount = orders.filter((order) => order.paymentStatus !== "SUCCESS").length;
  const totalVisible = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const amountReceived = Number(amountReceivedInput);
  const cashChange = selectedOrder && Number.isFinite(amountReceived) ? amountReceived - selectedOrder.totalAmount : 0;
  const canConfirmCash = Boolean(selectedOrder && Number.isFinite(amountReceived) && amountReceived >= selectedOrder.totalAmount);
  const hasPendingPayOs = selectedOrder?.paymentMethod === "PAYOS" && selectedOrder.paymentStatus === "PENDING";
  const activePayOsPayment = hasPendingPayOs && payOsPayment?.orderId === selectedOrder?.orderId ? payOsPayment : null;

  const setFilter = (callback: () => void) => {
    setPageNumber(1);
    callback();
  };

  const checkout = async (paymentMethod: "CASH" | "PAYOS", amountReceivedValue?: number) => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await checkoutMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
      request: {
        paymentMethod,
        voucherCode: voucherCode.trim() || null,
        amountReceived: paymentMethod === "CASH" ? amountReceivedValue : null,
      },
    });

    setVoucherCode("");
    setAmountReceivedInput("");
    setCashDialogOpen(false);
    setSelectedOrderId(response.result.order.orderId);
    setPayOsPayment(response.result.paymentMethod === "PAYOS" ? response.result : null);
    await ordersQuery.refetch();
  };

  const openCashDialog = () => {
    if (!selectedOrder) {
      return;
    }

    if (hasPendingPayOs) {
      return;
    }

    setAmountReceivedInput(String(selectedOrder.totalAmount));
    setCashDialogOpen(true);
  };

  const confirmCashPayment = async () => {
    if (!canConfirmCash) {
      return;
    }

    await checkout("CASH", amountReceived);
  };

  const cancelCashierPayment = async () => {
    if (!selectedOrder || !activeBranchId) {
      return;
    }

    const response = await cancelPaymentMutation.mutateAsync({
      branchId: activeBranchId,
      orderId: selectedOrder.orderId,
    });

    setPayOsPayment(null);
    setSelectedOrderId(response.result.orderId);
    await ordersQuery.refetch();
  };

  return (
    <PortalShell
      title="Cashier"
      description="Search table sessions, collect payment, and print receipts."
      portalLabel="Cashier Workspace"
      portalName="Cashier Portal"
      navItems={[]}
      topbarTitle={currentUser?.fullName ?? "Cashier"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Visible orders" value={String(orders.length)} helper="Current filter result" />
          <PortalStatCard label="Need payment" value={String(unpaidCount)} helper="Visible unpaid orders" />
          <PortalStatCard label="Visible total" value={formatCurrency(totalVisible)} helper="Current page total" />
          <PortalStatCard label="Branch" value={branches.find((branch) => branch.branchId === activeBranchId)?.name ?? "-"} helper="Assigned cashier scope" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(220px,1fr)_180px_120px]">
          <select
            value={activeBranchId ?? ""}
            onChange={(event) => setFilter(() => setBranchId(event.target.value))}
            className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold"
          >
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.name}
              </option>
            ))}
          </select>
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setFilter(() => setSearchInput(event.target.value))}
              placeholder="Search table number, session code, order, customer"
              className="h-11 pl-10"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setFilter(() => setStatus(event.target.value as NonNullable<CashierOrderQuery["status"]>))}
            className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
          {ordersQuery.isLoading || branchesQuery.isLoading ? (
            <div className="flex items-center gap-3 p-6">
              <Spinner className="text-primary size-5" />
              <span className="text-sm font-medium">Loading cashier orders...</span>
            </div>
          ) : null}

          {ordersQuery.isError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive m-5 rounded-xl border p-4 text-sm">
              {getOwnerTableErrorMessage(ordersQuery.error, "Unable to load cashier orders.")}
            </div>
          ) : null}

          {!ordersQuery.isLoading && !ordersQuery.isError ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left">
                  <thead className="bg-surface-container-low text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    <tr>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Table</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-muted-foreground px-5 py-10 text-center text-sm">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="border-border/60 hover:bg-muted/30 cursor-pointer border-t"
                          onClick={() => setSelectedOrderId(order.orderId)}
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold">{order.orderNumber}</p>
                            <p className="text-muted-foreground mt-1 text-xs">Session {order.sessionCode ?? "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold">
                            <Hash className="text-muted-foreground mr-1 inline size-3.5" />
                            {order.tableNumber ?? "-"}
                          </td>
                          <td className="px-5 py-4">
                            <Tag tagString={order.status} variant={order.status === "Completed" ? "success" : "warning"} />
                          </td>
                          <td className="px-5 py-4 text-sm">{getPaymentLabel(order)}</td>
                          <td className="px-5 py-4 text-right font-black">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <FooterPagination
                page={pageNumber}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizeOptions={[10, 25, 50]}
                totalItems={ordersQuery.data?.totalItems ?? 0}
                itemLabel="orders"
                disabled={ordersQuery.isFetching}
                onPageChange={setPageNumber}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPageNumber(1);
                }}
              />
            </>
          ) : null}
        </div>

        <aside className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
          <h2 className="text-xl font-bold">Receipt</h2>
          {selectedOrder ? (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{formatDateTime(selectedOrder.createdAt)}</p>
                <h3 className="mt-1 text-lg font-black">{selectedOrder.orderNumber}</h3>
                <p className="text-muted-foreground mt-1 text-sm">Table {selectedOrder.tableNumber ?? "-"} - {getPaymentLabel(selectedOrder)}</p>
              </div>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between gap-3 border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.menuItemName} x{item.quantity}</p>
                      {item.note ? <p className="text-muted-foreground text-xs">{item.note}</p> : null}
                    </div>
                    <p className="font-bold">{formatCurrency(item.subTotal)}</p>
                  </div>
                ))}
              </div>
              <dl className="text-sm">
                <div className="flex justify-between py-1"><dt>Subtotal</dt><dd>{formatCurrency(selectedOrder.subTotal)}</dd></div>
                <div className="flex justify-between py-1"><dt>VAT</dt><dd>{formatCurrency(selectedOrder.vatAmount)}</dd></div>
                <div className="flex justify-between py-1"><dt>Service</dt><dd>{formatCurrency(selectedOrder.serviceChargeAmount)}</dd></div>
                {selectedOrder.discountAmount > 0 ? (
                  <div className="text-success-foreground flex justify-between py-1">
                    <dt>Voucher discount</dt>
                    <dd>-{formatCurrency(selectedOrder.discountAmount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between py-2 text-lg font-black"><dt>Total</dt><dd>{formatCurrency(selectedOrder.totalAmount)}</dd></div>
              </dl>
              {selectedOrder.paymentStatus !== "SUCCESS" ? (
                <div className="space-y-3">
                  <Input
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                    placeholder="Paper voucher code (optional)"
                    className="h-11"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={openCashDialog} disabled={checkoutMutation.isPending || hasPendingPayOs}>
                      <Wallet className="size-4" />
                      Cash
                    </Button>
                    <Button variant="outline" onClick={() => checkout("PAYOS")} disabled={checkoutMutation.isPending}>
                      <CreditCard className="size-4" />
                      {hasPendingPayOs ? "Show PayOS QR" : "PayOS"}
                    </Button>
                  </div>
                  {hasPendingPayOs ? (
                    <p className="text-warning-foreground text-sm font-semibold">
                      This order has a pending PayOS QR. Cash is disabled until QR payment is completed or canceled.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {activePayOsPayment ? (
                <PayOsQrPanel
                  qrCode={activePayOsPayment.qrCode}
                  checkoutUrl={activePayOsPayment.checkoutUrl}
                  amount={activePayOsPayment.amount ?? selectedOrder.totalAmount}
                  description={activePayOsPayment.description}
                  accountName={activePayOsPayment.accountName}
                  accountNumber={activePayOsPayment.accountNumber}
                  bin={activePayOsPayment.bin}
                  expiresAt={activePayOsPayment.paymentExpiresAt}
                  onCancel={cancelCashierPayment}
                  cancelDisabled={cancelPaymentMutation.isPending}
                />
              ) : null}
              {selectedOrder.paymentMethod === "CASH" && selectedOrder.paymentStatus === "SUCCESS" ? (
                <div className="bg-surface-container-low rounded-lg p-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Cash received</span>
                    <strong>{formatCurrency(selectedOrder.amountReceived ?? selectedOrder.totalAmount)}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Change</span>
                    <strong>{formatCurrency(selectedOrder.changeAmount ?? 0)}</strong>
                  </div>
                </div>
              ) : null}
              <Button variant="soft" className="w-full" onClick={() => printReceipt(selectedOrder, activePayOsPayment)}>
                <Printer className="size-4" />
                Print receipt
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mt-4 text-sm">Select an order to view and print the receipt.</p>
          )}
        </aside>
      </section>
      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Cash payment</DialogTitle>
            <DialogDescription>Enter the amount received from the customer before completing payment.</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-lg p-4 text-sm">
                <div className="flex justify-between py-1">
                  <span>Order total</span>
                  <strong>{formatCurrency(selectedOrder.totalAmount)}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Change</span>
                  <strong className={cashChange < 0 ? "text-destructive" : "text-success-foreground"}>
                    {formatCurrency(Math.max(cashChange, 0))}
                  </strong>
                </div>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Amount received</span>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={amountReceivedInput}
                  onChange={(event) => setAmountReceivedInput(event.target.value)}
                  className="h-12 text-lg font-bold"
                  autoFocus
                />
              </label>
              {amountReceivedInput && !canConfirmCash ? (
                <p className="text-destructive text-sm">Amount received must be at least the order total.</p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashDialogOpen(false)} disabled={checkoutMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={confirmCashPayment} disabled={!canConfirmCash || checkoutMutation.isPending}>
              <Wallet className="size-4" />
              Confirm cash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
