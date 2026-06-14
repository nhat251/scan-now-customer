"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useForm, useWatch } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  formatCurrency,
  getManageMenuNavItems,
  getPortalCopy,
  type ManagePortal,
} from "@/components/manage-menu/helpers";
import {
  formatDateTime,
  getOwnerTableErrorMessage,
  isForbiddenError,
  type TableManagementPortal,
} from "@/components/owner/tables/helpers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tag } from "@/components/ui/tag";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/helpers/presentation";
import { useOwnerBranchDetailQuery } from "@/hooks/queries/useOwnerBranchDetailQuery";
import { useOwnerBranchOrdersQuery } from "@/hooks/queries/useOwnerTableQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { OrderStatus } from "@/types/order";
import type { OwnerOrderInvoiceQuery, OwnerTableOrderHistoryResponse } from "@/types/owner-table";

import { OrderFilterSelect } from "./order-filter-select";

type OwnerBranchOrdersPageProps = {
  branchId: string;
  portal?: TableManagementPortal;
};

const ORDER_STATUS_OPTIONS: Array<{ label: string; value: "" | OrderStatus }> = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ xác nhận", value: "PendingConfirmation" },
  { label: "Đã xác nhận", value: "Confirmed" },
  { label: "Sẵn sàng phục vụ", value: "ReadyToServe" },
  { label: "Đã phục vụ", value: "Served" },
  { label: "Hoàn thành", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "Tất cả thanh toán", value: "" },
  { label: "Đang chờ", value: "PENDING" },
  { label: "Thành công", value: "SUCCESS" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { label: "Tất cả phương thức", value: "" },
  { label: "PayOS", value: "PAYOS" },
  { label: "Tiền mặt", value: "CASH" },
] as const;

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "createdAt:desc" },
  { label: "Cũ nhất", value: "createdAt:asc" },
  { label: "Tổng tiền cao nhất", value: "totalAmount:desc" },
  { label: "Tổng tiền thấp nhất", value: "totalAmount:asc" },
  { label: "Số bàn", value: "tableNumber:asc" },
] as const;

const getStatusVariant = (status: string): "success" | "warning" | "destructive" | "default" => {
  if (["Completed", "Served", "ReadyToServe"].includes(status)) return "success";
  if (["Cancelled"].includes(status)) return "destructive";
  if (["PendingConfirmation", "PartiallyReady", "PartiallyServed"].includes(status))
    return "warning";
  return "default";
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

export const OwnerBranchOrdersPage = ({
  branchId,
  portal = "owner",
}: OwnerBranchOrdersPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal as ManagePortal);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OwnerTableOrderHistoryResponse | null>(null);

  const { register, control, reset } = useForm({
    defaultValues: {
      search: "",
      tableNumber: "",
      status: "" as "" | OrderStatus,
      paymentStatus: "",
      paymentMethod: "",
      fromDate: "",
      toDate: "",
      sortValue: "createdAt:desc" as (typeof SORT_OPTIONS)[number]["value"],
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const tableNumberVal = useWatch({ control, name: "tableNumber" });
  const statusVal = useWatch({ control, name: "status" });
  const paymentStatusVal = useWatch({ control, name: "paymentStatus" });
  const paymentMethodVal = useWatch({ control, name: "paymentMethod" });
  const fromDateVal = useWatch({ control, name: "fromDate" });
  const toDateVal = useWatch({ control, name: "toDate" });
  const sortValueVal = useWatch({ control, name: "sortValue" });

  const search = useDebounce(searchVal.trim(), 250);

  useEffect(() => {
    setPageNumber(1);
  }, [
    search,
    tableNumberVal,
    statusVal,
    paymentStatusVal,
    paymentMethodVal,
    fromDateVal,
    toDateVal,
    sortValueVal,
  ]);

  const [sortBy, sortDirection] = sortValueVal.split(":") as [string, "asc" | "desc"];
  const pageSize = 10;
  const query = useMemo<OwnerOrderInvoiceQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      tableNumber: tableNumberVal.trim() || undefined,
      status: statusVal || undefined,
      paymentStatus: paymentStatusVal || undefined,
      paymentMethod: paymentMethodVal || undefined,
      fromDate: fromDateVal || undefined,
      toDate: toDateVal || undefined,
      sortBy,
      sortDirection,
    }),
    [
      fromDateVal,
      pageNumber,
      pageSize,
      paymentMethodVal,
      paymentStatusVal,
      search,
      sortBy,
      sortDirection,
      statusVal,
      tableNumberVal,
      toDateVal,
    ]
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

  return (
    <PortalShell
      title="Đơn hàng và hóa đơn"
      description="Tìm kiếm, lọc và xem các hóa đơn của chi nhánh."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal as ManagePortal, "orders", branchId)}
      topbarTitle={branchName ?? currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      branchName={branchName}
      branchId={branchId}
      stats={
        <>
          <PortalStatCard
            label="Hóa đơn"
            value={String(result?.totalOrders ?? 0)}
            helper="Khớp bộ lọc"
          />
          <PortalStatCard
            label="Tổng doanh thu"
            value={formatCurrency(result?.totalAmount ?? 0)}
            helper="Tất cả hóa đơn khớp bộ lọc"
          />
          <PortalStatCard
            label="Đã thanh toán"
            value={formatCurrency(result?.paidAmount ?? 0)}
            helper="Thanh toán thành công"
          />
          <PortalStatCard
            label="Đang chờ"
            value={formatCurrency(result?.pendingAmount ?? 0)}
            helper="Thanh toán đang chờ"
          />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <span className="text-sm font-semibold">Bộ lọc</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              {...register("search")}
              placeholder="Tìm đơn, phiên hoặc khách hàng..."
              className="h-10 pl-10"
            />
          </div>
          <div className="relative">
            <Hash className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input {...register("tableNumber")} placeholder="Bàn" className="h-10 pl-10" />
          </div>
          <OrderFilterSelect options={ORDER_STATUS_OPTIONS} {...register("status")} />
          <OrderFilterSelect options={PAYMENT_STATUS_OPTIONS} {...register("paymentStatus")} />
          <OrderFilterSelect options={[...SORT_OPTIONS]} {...register("sortValue")} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <div className="relative">
            <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="date"
              {...register("fromDate")}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-10 w-full rounded-lg border pr-3 pl-10 text-sm font-medium outline-none focus:ring-[3px]"
            />
          </div>
          <div className="relative">
            <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              type="date"
              {...register("toDate")}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-10 w-full rounded-lg border pr-3 pl-10 text-sm font-medium outline-none focus:ring-[3px]"
            />
          </div>
          <OrderFilterSelect options={PAYMENT_METHOD_OPTIONS} {...register("paymentMethod")} />
          <div className="flex items-center gap-2 lg:col-span-2">
            <Button
              variant="soft"
              onClick={() => ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
              className="w-full"
            >
              <RefreshCw className={cn("size-4", ordersQuery.isFetching && "animate-spin")} />
              Tải lại
            </Button>
            {search ||
            tableNumberVal ||
            statusVal ||
            paymentStatusVal ||
            paymentMethodVal ||
            fromDateVal ||
            toDateVal ? (
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setPageNumber(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {ordersQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải hóa đơn...</span>
        </div>
      ) : null}

      {ordersQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(ordersQuery.error)
            ? "Bạn không có quyền xem hóa đơn của chi nhánh này."
            : getOwnerTableErrorMessage(ordersQuery.error, "Không thể tải danh sách hóa đơn.")}
        </div>
      ) : null}

      {!ordersQuery.isLoading && !ordersQuery.isError ? (
        <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <Wallet className="text-muted-foreground size-10" />
              <h3 className="mt-4 text-lg font-bold">Không tìm thấy hóa đơn</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                {search ||
                tableNumberVal ||
                statusVal ||
                paymentStatusVal ||
                paymentMethodVal ||
                fromDateVal ||
                toDateVal
                  ? "Hãy điều chỉnh bộ lọc để tìm dữ liệu phù hợp."
                  : "Đơn của khách tại các bàn trong chi nhánh sẽ xuất hiện ở đây."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-surface-container-low text-muted-foreground text-xs font-bold tracking-wider uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Đơn hàng</th>
                      <th className="px-5 py-3.5">Bàn</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Thanh toán</th>
                      <th className="px-5 py-3.5 text-right">Tổng cộng</th>
                      <th className="px-5 py-3.5">Thời gian</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.orderId}
                        className="border-border/60 hover:bg-muted/30 border-t transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-bold">{order.orderNumber}</p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            Phiên {order.sessionCode ?? "-"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          {order.tableNumber ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                              <Hash className="text-muted-foreground size-3.5" />
                              {order.tableNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <Tag
                            tagString={getOrderStatusLabel(order.status)}
                            variant={getStatusVariant(order.status)}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                            {order.paymentStatus ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-xs font-semibold",
                                  order.paymentStatus === "SUCCESS" && "text-success-foreground",
                                  order.paymentStatus === "FAILED" && "text-destructive",
                                  order.paymentStatus === "REFUNDED" && "text-destructive",
                                  order.paymentStatus === "PENDING" && "text-warning-foreground",
                                  !order.paymentStatus && "text-muted-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    order.paymentStatus === "SUCCESS"
                                      ? "bg-success-foreground"
                                      : order.paymentStatus === "FAILED" ||
                                          order.paymentStatus === "REFUNDED"
                                        ? "bg-destructive"
                                        : order.paymentStatus === "PENDING"
                                          ? "bg-warning-foreground"
                                          : "bg-muted-foreground"
                                  )}
                                />
                                {getPaymentStatusLabel(order.paymentStatus)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Chưa thanh toán</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-base font-black">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-5 py-3.5 text-sm whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedOrder(order)}
                            title="Xem chi tiết"
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
                  Đang ở trang {Math.min(pageNumber, totalPages)} trên {totalPages}
                  <span className="mx-1.5">·</span>
                  {result?.orders.totalItems ?? 0} hóa đơn
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={pageNumber <= 1 || ordersQuery.isFetching}
                    onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                  >
                    <ChevronLeft className="size-3.5" />
                    Trang trước
                  </Button>
                  <div className="hidden items-center gap-1 sm:flex">
                    {visiblePages.map((visiblePage, index) => {
                      const previousPage = visiblePages[index - 1];
                      const shouldShowGap =
                        previousPage !== undefined && visiblePage - previousPage > 1;

                      return (
                        <span key={visiblePage} className="flex items-center gap-1">
                          {shouldShowGap ? (
                            <span className="text-muted-foreground px-1 text-sm">...</span>
                          ) : null}
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
                    Tiếp theo
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedOrder?.orderNumber ?? "Chi tiết hóa đơn"}</span>
              {selectedOrder ? (
                <Tag
                  tagString={getOrderStatusLabel(selectedOrder.status)}
                  variant={getStatusVariant(selectedOrder.status)}
                />
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-5">
              <div className="bg-muted/30 grid gap-3 rounded-xl p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Bàn
                  </p>
                  <p className="mt-0.5 font-bold">{selectedOrder.tableNumber ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Phiên
                  </p>
                  <p className="mt-0.5 font-bold">{selectedOrder.sessionCode ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Thời gian
                  </p>
                  <p className="mt-0.5 font-bold">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Món</p>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.orderItemId}
                    className="bg-muted/20 flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-muted-foreground shrink-0 text-xs font-bold">
                        {item.quantity}x
                      </span>
                      <p className="truncate text-sm font-semibold">{item.menuItemName}</p>
                      {item.note ? (
                        <span className="text-muted-foreground truncate text-xs">
                          ({item.note})
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-bold">
                      {formatCurrency(item.subTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-border/60 space-y-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.subTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.vatAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí phục vụ</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.serviceChargeAmount)}
                  </span>
                </div>
                <div className="border-border/60 flex justify-between border-t pt-2 text-base font-black">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {selectedOrder.customerNote ? (
                <div className="bg-warning/15 text-warning-foreground rounded-lg px-3.5 py-2.5 text-sm font-medium">
                  Ghi chú: {selectedOrder.customerNote}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
