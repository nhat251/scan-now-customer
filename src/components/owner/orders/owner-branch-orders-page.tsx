"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Hash,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { formatCurrency, getManageMenuNavItems, getPortalCopy, type ManagePortal } from "@/components/manage-menu/helpers";
import { formatDateTime, getOwnerTableErrorMessage, isForbiddenError, type TableManagementPortal } from "@/components/owner/tables/helpers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/ui/tag";
import { useOwnerBranchDetailQuery } from "@/hooks/queries/useOwnerBranchDetailQuery";
import { useOwnerBranchOrdersQuery } from "@/hooks/queries/useOwnerTableQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { OrderStatus } from "@/types/order";
import type { OwnerOrderInvoiceQuery, OwnerTableOrderHistoryResponse } from "@/types/owner-table";

type OwnerBranchOrdersPageProps = {
  branchId: string;
  portal?: TableManagementPortal;
};

const ORDER_STATUS_OPTIONS: Array<{ label: string; value: "" | OrderStatus }> = [
  { label: "All statuses", value: "" },
  { label: "Pending confirmation", value: "PendingConfirmation" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Ready to serve", value: "ReadyToServe" },
  { label: "Served", value: "Served" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "All payments", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { label: "All methods", value: "" },
  { label: "PayOS", value: "PAYOS" },
  { label: "Cash", value: "CASH" },
] as const;

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt:desc" },
  { label: "Oldest", value: "createdAt:asc" },
  { label: "Highest total", value: "totalAmount:desc" },
  { label: "Lowest total", value: "totalAmount:asc" },
  { label: "Table number", value: "tableNumber:asc" },
] as const;

const ORDER_STATUS_LABEL: Record<string, string> = {
  PendingConfirmation: "Chờ xác nhận",
  Confirmed: "Bếp đã nhận",
  Preparing: "Bếp đã nhận",
  PartiallyReady: "Một số món sẵn sàng",
  ReadyToServe: "Sẵn sàng phục vụ",
  PartiallyServed: "Đã phục vụ một phần",
  Served: "Đã phục vụ",
  Completed: "Đã thanh toán",
  Cancelled: "Đã hủy",
};

const getStatusVariant = (status: string): "success" | "warning" | "destructive" | "default" => {
  if (["Completed", "Served", "ReadyToServe"].includes(status)) return "success";
  if (["Cancelled"].includes(status)) return "destructive";
  if (["PendingConfirmation", "PartiallyReady", "PartiallyServed"].includes(status)) return "warning";
  return "default";
};

const FilterSelect = ({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={cn(
      "border-input bg-card h-10 w-full rounded-lg border px-3 pr-8 text-sm font-medium outline-none",
      "focus:border-ring focus:ring-ring/50 focus:ring-[3px]",
      "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23666%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.17l3.71-3.94a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200L5.21%208.27a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat",
      !value && "text-muted-foreground",
      className,
    )}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

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

export const OwnerBranchOrdersPage = ({ branchId, portal = "owner" }: OwnerBranchOrdersPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal as ManagePortal);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 250);
  const [tableNumber, setTableNumber] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortValue, setSortValue] = useState<(typeof SORT_OPTIONS)[number]["value"]>("createdAt:desc");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OwnerTableOrderHistoryResponse | null>(null);
  const [sortBy, sortDirection] = sortValue.split(":") as [string, "asc" | "desc"];
  const pageSize = 10;
  const query = useMemo<OwnerOrderInvoiceQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      tableNumber: tableNumber.trim() || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      paymentMethod: paymentMethod || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      sortBy,
      sortDirection,
    }),
    [fromDate, pageNumber, pageSize, paymentMethod, paymentStatus, search, sortBy, sortDirection, status, tableNumber, toDate]
  );
  const ordersQuery = useOwnerBranchOrdersQuery(branchId, query);
  const branchDetailQuery = useOwnerBranchDetailQuery(branchId);
  const handleBranchOrderUpdated = useCallback(() => {
    void ordersQuery.refetch();
  }, [ordersQuery]);

  useBranchOrderUpdates(branchId, {
    onOrderUpdated: handleBranchOrderUpdated,
  });
  const branchName = branchDetailQuery.data?.name;
  const result = ordersQuery.data;
  const orders = result?.orders.items ?? [];
  const totalPages = Math.max(result?.orders.totalPages ?? 1, 1);
  const visiblePages = getVisiblePages(pageNumber, totalPages);

  const setFilter = (callback: () => void) => {
    setPageNumber(1);
    callback();
  };

  return (
    <PortalShell
      title="Orders & Invoices"
      description="Search, filter, and review all invoices created in this branch."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal as ManagePortal, "orders", branchId)}
      topbarTitle={branchName ?? currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      branchName={branchName}
      branchId={branchId}
      stats={
        <>
          <PortalStatCard label="Invoices" value={String(result?.totalOrders ?? 0)} helper="Matching filters" />
          <PortalStatCard label="Total revenue" value={formatCurrency(result?.totalAmount ?? 0)} helper="All matching invoices" />
          <PortalStatCard label="Paid" value={formatCurrency(result?.paidAmount ?? 0)} helper="Successful payments" />
          <PortalStatCard label="Pending" value={formatCurrency(result?.pendingAmount ?? 0)} helper="Pending payments" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setFilter(() => setSearchInput(event.target.value))}
              placeholder="Search order, session, customer..."
              className="h-10 pl-10"
            />
          </div>
          <div className="relative">
            <Hash className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={tableNumber}
              onChange={(event) => setFilter(() => setTableNumber(event.target.value))}
              placeholder="Table"
              className="h-10 pl-10"
            />
          </div>
          <FilterSelect
            value={status}
            onChange={(v) => setFilter(() => setStatus(v as "" | OrderStatus))}
            options={ORDER_STATUS_OPTIONS}
          />
          <FilterSelect
            value={paymentStatus}
            onChange={(v) => setFilter(() => setPaymentStatus(v))}
            options={PAYMENT_STATUS_OPTIONS}
          />
          <FilterSelect
            value={sortValue}
            onChange={(v) => setFilter(() => setSortValue(v as (typeof SORT_OPTIONS)[number]["value"]))}
            options={[...SORT_OPTIONS]}
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div className="relative">
            <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFilter(() => setFromDate(event.target.value))}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-10 w-full rounded-lg border pr-3 pl-10 text-sm font-medium outline-none focus:ring-[3px]"
            />
          </div>
          <div className="relative">
            <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setFilter(() => setToDate(event.target.value))}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-10 w-full rounded-lg border pr-3 pl-10 text-sm font-medium outline-none focus:ring-[3px]"
            />
          </div>
          <FilterSelect
            value={paymentMethod}
            onChange={(v) => setFilter(() => setPaymentMethod(v))}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <div className="flex items-center gap-2 lg:col-span-2">
            <Button
              variant="soft"
              onClick={() => ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
              className="w-full"
            >
              <RefreshCw className={cn("size-4", ordersQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
            {(search || tableNumber || status || paymentStatus || paymentMethod || fromDate || toDate) ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchInput("");
                  setTableNumber("");
                  setStatus("");
                  setPaymentStatus("");
                  setPaymentMethod("");
                  setFromDate("");
                  setToDate("");
                  setSortValue("createdAt:desc");
                  setPageNumber(1);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {ordersQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading invoices...</span>
        </div>
      ) : null}

      {ordersQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(ordersQuery.error)
            ? "You do not have permission to view invoices for this branch."
            : getOwnerTableErrorMessage(ordersQuery.error, "Unable to load invoices.")}
        </div>
      ) : null}

      {!ordersQuery.isLoading && !ordersQuery.isError ? (
        <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <Wallet className="text-muted-foreground size-10" />
              <h3 className="mt-4 text-lg font-bold">No invoices found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                {search || tableNumber || status || paymentStatus || paymentMethod || fromDate || toDate
                  ? "Try adjusting your filters to find what you're looking for."
                  : "Orders from customers seated at tables in this branch will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-surface-container-low text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Order</th>
                      <th className="px-5 py-3.5">Table</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Payment</th>
                      <th className="px-5 py-3.5 text-right">Total</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId} className="border-border/60 hover:bg-muted/30 border-t transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold">{order.orderNumber}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">Session {order.sessionCode ?? "-"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {order.tableNumber ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                              <Hash className="text-muted-foreground size-3.5" />
                              {order.tableNumber}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">-</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Tag
                            tagString={ORDER_STATUS_LABEL[order.status] ?? order.status}
                            variant={getStatusVariant(order.status)}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{order.paymentMethod ?? "-"}</span>
                            {order.paymentStatus ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-semibold",
                                  order.paymentStatus === "SUCCESS" && "text-success-foreground",
                                  order.paymentStatus === "FAILED" && "text-destructive",
                                  order.paymentStatus === "REFUNDED" && "text-destructive",
                                  order.paymentStatus === "PENDING" && "text-warning-foreground",
                                  !order.paymentStatus && "text-muted-foreground",
                                )}
                              >
                                <span className={cn("size-1.5 rounded-full", order.paymentStatus === "SUCCESS" ? "bg-success-foreground" : order.paymentStatus === "FAILED" || order.paymentStatus === "REFUNDED" ? "bg-destructive" : order.paymentStatus === "PENDING" ? "bg-warning-foreground" : "bg-muted-foreground")} />
                                {order.paymentStatus === "SUCCESS"
                                  ? "Paid"
                                  : order.paymentStatus === "PENDING"
                                    ? "Pending"
                                    : order.paymentStatus === "FAILED"
                                      ? "Failed"
                                      : order.paymentStatus === "REFUNDED"
                                        ? "Refunded"
                                        : "-"}
                              </span>
                            ) : <span className="text-muted-foreground text-xs">No payment</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-base font-black">{formatCurrency(order.totalAmount)}</span>
                        </td>
                        <td className="text-muted-foreground px-5 py-3.5 text-sm whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedOrder(order)}
                            title="View details"
                          >
                            <Eye className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-border/60 flex flex-col gap-3 border-t px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {Math.min(pageNumber, totalPages)} of {totalPages}
                  <span className="mx-1.5">·</span>
                  {result?.orders.totalItems ?? 0} invoices
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={pageNumber <= 1 || ordersQuery.isFetching}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <div className="hidden items-center gap-1 sm:flex">
                    {visiblePages.map((visiblePage, index) => {
                      const previousPage = visiblePages[index - 1];
                      const shouldShowGap = previousPage !== undefined && visiblePage - previousPage > 1;

                      return (
                        <span key={visiblePage} className="flex items-center gap-1">
                          {shouldShowGap ? <span className="text-muted-foreground px-1 text-sm">...</span> : null}
                          <Button
                            variant={visiblePage === pageNumber ? "default" : "soft"}
                            size="icon-sm"
                            disabled={ordersQuery.isFetching || visiblePage === pageNumber}
                            onClick={() => setPageNumber(visiblePage)}
                          >
                            {visiblePage}
                          </Button>
                        </span>
                      );
                    })}
                  </div>
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={pageNumber >= totalPages || ordersQuery.isFetching}
                    onClick={() => setPageNumber((value) => value + 1)}
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedOrder?.orderNumber ?? "Invoice detail"}</span>
              {selectedOrder ? (
                <Tag
                  tagString={ORDER_STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}
                  variant={getStatusVariant(selectedOrder.status)}
                />
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="bg-muted/30 grid gap-3 rounded-xl p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Table</p>
                  <p className="mt-0.5 font-bold">{selectedOrder.tableNumber ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Session</p>
                  <p className="mt-0.5 font-bold">{selectedOrder.sessionCode ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">Date</p>
                  <p className="mt-0.5 font-bold">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Items</p>
                {selectedOrder.items.map((item) => (
                  <div key={item.orderItemId} className="bg-muted/20 flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-muted-foreground shrink-0 text-xs font-bold">{item.quantity}x</span>
                      <p className="truncate text-sm font-semibold">{item.menuItemName}</p>
                      {item.note ? <span className="text-muted-foreground truncate text-xs">({item.note})</span> : null}
                    </div>
                    <span className="shrink-0 text-sm font-bold">{formatCurrency(item.subTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-border/60 space-y-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.vatAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service charge</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.serviceChargeAmount)}</span>
                </div>
                <div className="border-border/60 flex justify-between border-t pt-2 text-base font-black">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {selectedOrder.customerNote ? (
                <div className="bg-warning/15 text-warning-foreground rounded-lg px-3.5 py-2.5 text-sm font-medium">
                  Note: {selectedOrder.customerNote}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
