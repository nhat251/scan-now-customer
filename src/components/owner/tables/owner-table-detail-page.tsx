"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clipboard,
  Download,
  ExternalLink,
  Eye,
  Power,
  PowerOff,
  QrCode,
  ReceiptText,
  RefreshCw,
  Save,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag } from "@/components/ui/tag";
import {
  useDownloadOwnerTableQrMutation,
  useRegenerateOwnerTableQrMutation,
  useSetOwnerTableActiveMutation,
  useUpdateOwnerTableMutation,
  useUpdateOwnerTableStatusMutation,
} from "@/hooks/mutations/useOwnerTableMutations";
import { useOwnerTableOrderHistoryQuery, useOwnerTableQuery } from "@/hooks/queries/useOwnerTableQueries";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { OwnerTableFormValues, OwnerTableOrderHistoryResponse, OwnerTableStatus } from "@/types/owner-table";

import {
  downloadQrBlob,
  formatDateTime,
  getActiveLabel,
  getOwnerTableErrorMessage,
  getOwnerTableListPath,
  getOwnerTablePayload,
  getOwnerTableStatusLabel,
  getOwnerTableStatusTone,
  getQrFileName,
  getTablePortalCopy,
  getTablePortalNavItems,
  isForbiddenError,
  normalizeOwnerTableStatus,
  OWNER_TABLE_STATUS_UPDATE_OPTIONS,
  type TableManagementPortal,
  toOwnerTableFormValues,
} from "./helpers";
import { OwnerTableForm } from "./owner-table-form";

type OwnerTableDetailPageProps = {
  branchId: string;
  tableId: string;
  portal?: TableManagementPortal;
};

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface min-w-0 text-sm font-medium break-words sm:text-right">{value || "-"}</dd>
  </div>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const ORDER_STATUS_LABEL: Record<string, string> = {
  PendingConfirmation: "Chờ bếp xác nhận",
  Confirmed: "Bếp đã nhận",
  Preparing: "Bếp đã nhận",
  PartiallyReady: "Một số món sẵn sàng",
  ReadyToServe: "Sẵn sàng phục vụ",
  PartiallyServed: "Đã phục vụ một phần",
  Served: "Đã phục vụ",
  Completed: "Đã thanh toán",
  Cancelled: "Đã hủy",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Bếp đã nhận",
  Cooking: "Bếp đã nhận",
  Ready: "Sẵn sàng",
  Served: "Đã phục vụ",
  Cancelled: "Đã hủy",
};

const getPaymentLabel = (order: OwnerTableOrderHistoryResponse) => {
  if (order.paymentStatus) {
    return `${order.paymentMethod ?? "Payment"} - ${order.paymentStatus}`;
  }

  return order.status === "Completed" ? "Completed" : "No payment";
};

const getVisiblePages = (page: number, totalPages: number) => {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);

  if (page <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
};

const STATUS_STYLE: Record<string, { active: string; inactive: string }> = {
  AVAILABLE: { active: "border-success/50 bg-success/25 text-success-foreground shadow-success/20", inactive: "border-border text-muted-foreground hover:border-success/50 hover:text-success-foreground" },
  RESERVED: { active: "border-warning/50 bg-warning/25 text-warning-foreground shadow-warning/20", inactive: "border-border text-muted-foreground hover:border-warning/50 hover:text-warning-foreground" },
  DISABLED: { active: "border-border bg-muted text-muted-foreground", inactive: "border-border text-muted-foreground" },
};

export const OwnerTableDetailPage = ({ branchId, tableId, portal = "owner" }: OwnerTableDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getTablePortalCopy(portal);
  const tableQuery = useOwnerTableQuery(branchId, tableId);
  const orderHistoryQuery = useOwnerTableOrderHistoryQuery(branchId, tableId);
  const table = tableQuery.data;
  const orderHistory = useMemo(() => orderHistoryQuery.data ?? [], [orderHistoryQuery.data]);
  const tableStatus = normalizeOwnerTableStatus(table?.status);
  const [form, setForm] = useState<OwnerTableFormValues>(toOwnerTableFormValues());
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const updateMutation = useUpdateOwnerTableMutation();
  const statusMutation = useUpdateOwnerTableStatusMutation();
  const activeMutation = useSetOwnerTableActiveMutation();
  const regenerateMutation = useRegenerateOwnerTableQrMutation();
  const downloadMutation = useDownloadOwnerTableQrMutation();
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<OwnerTableOrderHistoryResponse | null>(null);
  const historyPageSize = 5;
  const historyTotalPages = Math.max(Math.ceil(orderHistory.length / historyPageSize), 1);
  const historyVisiblePages = getVisiblePages(historyPage, historyTotalPages);
  const pagedOrderHistory = orderHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);
  const historyRevenue = useMemo(() => {
    return orderHistory.reduce(
      (summary, order) => {
        summary.total += order.totalAmount;

        if (order.paymentStatus === "SUCCESS" || order.status === "Completed") {
          summary.paid += order.totalAmount;
        } else {
          summary.pending += order.totalAmount;
        }

        return summary;
      },
      { total: 0, paid: 0, pending: 0 },
    );
  }, [orderHistory]);

  useEffect(() => {
    if (table) {
      setForm(toOwnerTableFormValues(table));
    }
  }, [table]);

  useEffect(() => {
    setHistoryPage((current) => Math.min(current, historyTotalPages));
  }, [historyTotalPages]);

  const onChange = <Key extends keyof OwnerTableFormValues>(key: Key, value: OwnerTableFormValues[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!form.tableNumber.trim()) {
      showNotify({ type: "warning", message: "Table number is required." });
      return false;
    }

    if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
      showNotify({ type: "warning", message: "Capacity must be greater than or equal to 1." });
      return false;
    }

    return true;
  };

  const saveInfo = async () => {
    if (!validate()) {
      return;
    }

    await updateMutation.mutateAsync({ tableId, data: getOwnerTablePayload(form) });
    await tableQuery.refetch();
  };

  const updateStatus = async (status: Exclude<OwnerTableStatus, "OCCUPIED">) => {
    await statusMutation.mutateAsync({ tableId, data: { status } });
    await tableQuery.refetch();
  };

  const toggleActive = async () => {
    if (!table) {
      return;
    }

    await activeMutation.mutateAsync({ tableId, isActive: !table.isActive });
    await tableQuery.refetch();
  };

  const downloadQr = async () => {
    const blob = await downloadMutation.mutateAsync(tableId);
    downloadQrBlob(blob, getQrFileName(table));
  };

  const copyQrUrl = async () => {
    if (!table?.qrCodeUrl) {
      return;
    }

    await navigator.clipboard.writeText(table.qrCodeUrl);
    showNotify({ type: "success", message: "QR URL copied." });
  };

  const regenerateQr = async () => {
    const response = await regenerateMutation.mutateAsync(tableId);

    setRegenerateOpen(false);
    await navigator.clipboard.writeText(response.result.qrCodeUrl).catch(() => undefined);
    await tableQuery.refetch();
  };

  return (
    <PortalShell
      title={table ? `Table ${table.tableNumber}` : "Table Detail"}
      description="Configure table identity, status, active state, and QR code. Session operations are handled by Staff."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getTablePortalNavItems(portal, branchId)}
      topbarTitle={table?.branchName ?? currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="soft">
          <Link href={getOwnerTableListPath(branchId, portal)}>
            <ArrowLeft className="size-4" />
            Tables
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Status" value={getOwnerTableStatusLabel(table?.status)} helper="Owner cannot set Occupied" />
          <PortalStatCard label="Capacity" value={table ? `${table.capacity} seats` : "-"} helper="Configured seats" />
          <PortalStatCard label="Active" value={getActiveLabel(table?.isActive)} helper="Visibility in operation" />
          <PortalStatCard label="Session" value={table?.currentSession?.sessionCode ?? "None"} helper="Display only" />
          <PortalStatCard label="Orders" value={String(orderHistory.length)} helper="History for this table" />
        </>
      }
    >
      {tableQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(tableQuery.error)
            ? "You do not have permission to access this branch/table"
            : getOwnerTableErrorMessage(tableQuery.error, "Table not found.")}
          <Button className="mt-4" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {tableQuery.isLoading ? (
        <div className="bg-card border-border/60 rounded-xl border p-6 text-sm shadow-sm">Loading table...</div>
      ) : null}

      {table ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <OwnerTableForm
              value={form}
              submitting={updateMutation.isPending}
              submitLabel="Save Table"
              onChange={onChange}
              onSubmit={saveInfo}
            />

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Order & Invoice History</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Orders created at this table in the current branch.</p>
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => orderHistoryQuery.refetch()}
                  disabled={orderHistoryQuery.isFetching}
                >
                  <RefreshCw className={cn("size-4", orderHistoryQuery.isFetching && "animate-spin")} />
                  Refresh
                </Button>
              </div>

              {orderHistoryQuery.isLoading ? (
                <div className="mt-5 space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="border-border/60 bg-muted/20 animate-pulse rounded-xl border p-4">
                      <div className="bg-muted-foreground/10 mb-3 h-4 w-32 rounded" />
                      <div className="bg-muted-foreground/10 mb-2 h-5 w-48 rounded" />
                      <div className="bg-muted-foreground/10 h-4 w-36 rounded" />
                    </div>
                  ))}
                </div>
              ) : null}

              {orderHistoryQuery.isError ? (
                <div className="border-destructive/40 bg-destructive/10 text-destructive mt-4 rounded-xl border p-4 text-sm">
                  {getOwnerTableErrorMessage(orderHistoryQuery.error, "Unable to load order history.")}
                </div>
              ) : null}

              {!orderHistoryQuery.isLoading && !orderHistoryQuery.isError && orderHistory.length === 0 ? (
                <div className="bg-surface-container-low mt-5 flex flex-col items-center rounded-xl p-8 text-center text-sm">
                  <ReceiptText className="text-muted-foreground size-10" />
                  <h3 className="mt-3 font-bold">No orders yet</h3>
                  <p className="text-muted-foreground mt-1 max-w-xs">Orders from customers seated at this table will appear here.</p>
                </div>
              ) : null}

              {!orderHistoryQuery.isLoading && !orderHistoryQuery.isError && orderHistory.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Total revenue</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(historyRevenue.total)}</p>
                  </div>
                  <div className="bg-success/15 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Paid</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(historyRevenue.paid)}</p>
                  </div>
                  <div className="bg-warning/15 rounded-xl p-4">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Unpaid / pending</p>
                    <p className="mt-1 text-lg font-black">{formatCurrency(historyRevenue.pending)}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 space-y-4">
                {pagedOrderHistory.map((order) => (
                  <article key={order.orderId} className="border-border/60 hover:border-border/80 bg-card rounded-xl border p-4 transition-colors">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                            {formatDateTime(order.createdAt)}
                          </p>
                          <Tag tagString={ORDER_STATUS_LABEL[order.status] ?? order.status} variant={order.status === "Cancelled" ? "destructive" : order.status === "Completed" ? "success" : "warning"} />
                        </div>
                        <h3 className="mt-1 text-base font-bold">{order.orderNumber}</h3>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Session {order.sessionCode ?? "-"}
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-primary text-lg font-black">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{getPaymentLabel(order)}</p>
                      </div>
                    </div>

                    {order.customerNote ? (
                      <p className="bg-warning/15 text-warning-foreground mt-3 rounded-lg px-3 py-2 text-sm font-medium">
                        Note: {order.customerNote}
                      </p>
                    ) : null}

                    <div className="border-border/60 mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-muted-foreground text-sm">
                        {order.items.length} dishes - {formatCurrency(order.subTotal)} subtotal
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setSelectedHistoryOrder(order)}>
                        <Eye className="size-4" />
                        View order detail
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {!orderHistoryQuery.isLoading && !orderHistoryQuery.isError && orderHistory.length > historyPageSize ? (
                <div className="border-border/60 mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {historyPage} of {historyTotalPages} - {orderHistory.length} invoices
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage((page) => Math.max(page - 1, 1))}
                    >
                      Previous
                    </Button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {historyVisiblePages.map((visiblePage, index) => {
                        const previousPage = historyVisiblePages[index - 1];
                        const shouldShowGap = previousPage !== undefined && visiblePage - previousPage > 1;

                        return (
                          <span key={visiblePage} className="flex items-center gap-1">
                            {shouldShowGap ? <span className="text-muted-foreground px-1 text-sm">...</span> : null}
                            <Button
                              variant={visiblePage === historyPage ? "default" : "outline"}
                              size="icon-sm"
                              disabled={visiblePage === historyPage}
                              onClick={() => setHistoryPage(visiblePage)}
                            >
                              {visiblePage}
                            </Button>
                          </span>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage >= historyTotalPages}
                      onClick={() => setHistoryPage((page) => Math.min(page + 1, historyTotalPages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Table Info</h2>
                <Tag tagString={getOwnerTableStatusLabel(table.status)} variant={getOwnerTableStatusTone(table.status)} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{table.branchName}</p>
              <dl className="mt-4">
                <InfoRow label="Table Number" value={table.tableNumber} />
                <InfoRow label="Capacity" value={`${table.capacity} seats`} />
                <InfoRow label="Created" value={formatDateTime(table.createdAt)} />
                <InfoRow label="Updated" value={formatDateTime(table.updatedAt)} />
              </dl>

              <div className="border-border/60 mt-4 border-t pt-4">
                <h3 className="mb-3 text-sm font-semibold">Current Session</h3>
                {table.currentSession ? (
                  <dl>
                    <InfoRow label="Session Code" value={table.currentSession.sessionCode} />
                    <InfoRow label="Opened At" value={formatDateTime(table.currentSession.openedAt ?? table.currentSession.createdAt)} />
                    <InfoRow label="Expires At" value={formatDateTime(table.currentSession.expiresAt)} />
                  </dl>
                ) : (
                  <p className="text-muted-foreground text-sm">No current session.</p>
                )}
              </div>
            </section>

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Status</h2>
                <div className="flex items-center gap-2">
                  <span className={cn("relative inline-flex size-2.5 rounded-full", table?.isActive ? "bg-success" : "bg-muted-foreground")} />
                  <span className="text-xs font-semibold tracking-wider uppercase">{table?.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Set table availability status</p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">Status</label>
                <div className="flex gap-2">
                  {OWNER_TABLE_STATUS_UPDATE_OPTIONS.map((option) => {
                    const isCurrent = tableStatus === option.value;
                    const style = STATUS_STYLE[option.value];
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={statusMutation.isPending || tableStatus === "OCCUPIED"}
                        onClick={() => updateStatus(option.value)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2.5 text-center text-sm font-bold transition-all",
                          isCurrent
                            ? `${style?.active} shadow-sm`
                            : `${style?.inactive}`,
                          statusMutation.isPending && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {tableStatus === "OCCUPIED" ? (
                  <p className="text-muted-foreground mt-3 text-xs">
                    Occupied is controlled by Staff opening a session.
                  </p>
                ) : null}
              </div>

              <div className="border-border/60 mt-5 border-t pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold">Activation</label>
                    <p className="text-muted-foreground mt-0.5 text-xs">Toggle table visibility in operation</p>
                  </div>
                  <Button
                    variant={table.isActive ? "destructive" : "success"}
                    size="sm"
                    onClick={toggleActive}
                    disabled={activeMutation.isPending}
                  >
                    {table.isActive ? (
                      <><PowerOff className="size-3.5" /> Deactivate</>
                    ) : (
                      <><Power className="size-3.5" /> Activate</>
                    )}
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">QR Management</h2>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-sm break-all">{table.qrCodeUrl || "QR URL is pending."}</p>
                </div>
                <div className="bg-primary/5 flex size-14 shrink-0 items-center justify-center rounded-xl">
                  <QrCode className="text-primary size-7" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="soft" size="sm" onClick={downloadQr} disabled={downloadMutation.isPending}>
                  <Download className="size-3.5" />
                  Download
                </Button>
                <Button variant="soft" size="sm" onClick={copyQrUrl} disabled={!table.qrCodeUrl}>
                  <Clipboard className="size-3.5" />
                  Copy URL
                </Button>
                {table.qrCodeUrl ? (
                  <Button asChild variant="soft" size="sm">
                    <a href={table.qrCodeUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" />
                      Open
                    </a>
                  </Button>
                ) : null}
                <Button variant="warning" size="sm" onClick={() => setRegenerateOpen(true)}>
                  <QrCode className="size-3.5" />
                  Regenerate
                </Button>
              </div>
            </section>
          </div>
        </section>
      ) : null}

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate QR?</DialogTitle>
            <DialogDescription>
              Regenerating QR will make the old QR invalid. Customers must scan the new QR image afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="soft" onClick={() => setRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={regenerateQr} disabled={regenerateMutation.isPending}>
              <Save className="size-4" />
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedHistoryOrder)} onOpenChange={(open) => !open && setSelectedHistoryOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedHistoryOrder?.orderNumber ?? "Order detail"}</span>
              {selectedHistoryOrder ? (
                <Tag
                  tagString={ORDER_STATUS_LABEL[selectedHistoryOrder.status] ?? selectedHistoryOrder.status}
                  variant={selectedHistoryOrder.status === "Cancelled" ? "destructive" : selectedHistoryOrder.status === "Completed" ? "success" : "warning"}
                />
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {selectedHistoryOrder ? (
            <div className="space-y-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="text-muted-foreground">Table:</span> <strong>{selectedHistoryOrder.tableNumber ?? table?.tableNumber ?? "-"}</strong></p>
                <p><span className="text-muted-foreground">Session:</span> <strong>{selectedHistoryOrder.sessionCode ?? "-"}</strong></p>
                <p><span className="text-muted-foreground">Payment:</span> <strong>{getPaymentLabel(selectedHistoryOrder)}</strong></p>
                <p><span className="text-muted-foreground">Created:</span> <strong>{formatDateTime(selectedHistoryOrder.createdAt)}</strong></p>
              </div>
              <div className="space-y-3">
                {selectedHistoryOrder.items.map((item) => (
                  <div key={item.orderItemId} className="border-border/60 flex justify-between gap-3 border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.menuItemName} x{item.quantity}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {ITEM_STATUS_LABEL[item.status] ?? item.status}{item.note ? ` - ${item.note}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold">{formatCurrency(item.subTotal)}</p>
                  </div>
                ))}
              </div>
              <dl className="border-border/60 border-t pt-4 text-sm">
                <div className="flex justify-between py-1"><dt>Subtotal</dt><dd>{formatCurrency(selectedHistoryOrder.subTotal)}</dd></div>
                <div className="flex justify-between py-1"><dt>VAT</dt><dd>{formatCurrency(selectedHistoryOrder.vatAmount)}</dd></div>
                <div className="flex justify-between py-1"><dt>Service charge</dt><dd>{formatCurrency(selectedHistoryOrder.serviceChargeAmount)}</dd></div>
                <div className="flex justify-between py-2 text-base font-black"><dt>Total</dt><dd>{formatCurrency(selectedHistoryOrder.totalAmount)}</dd></div>
              </dl>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
