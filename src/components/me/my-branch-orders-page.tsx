"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardList, RefreshCw, Soup, Table2 } from "lucide-react";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useConfirmWaiterOrderMutation, useMarkWaiterItemsServedMutation } from "@/hooks/mutations/useOrderMutations";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { usePendingWaiterOrdersQuery, useReadyToServeItemsQuery } from "@/hooks/queries/useOrderQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { useUserStore } from "@/stores/user";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatCurrency,
  formatDateTime,
  getApiErrorMessage,
  getMyPortalNavItems,
} from "./helpers";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type Props = {
  branchId: string;
};

export const MyBranchOrdersPage = ({ branchId }: Props) => {
  const currentUser = useUserStore((state) => state.user);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const branchQuery = useMyBranchDetailQuery(branchId, canSeeOrders);
  const pendingQuery = usePendingWaiterOrdersQuery(branchId, canSeeOrders);
  const readyQuery = useReadyToServeItemsQuery(branchId, canSeeOrders);
  const confirmMutation = useConfirmWaiterOrderMutation();
  const serveMutation = useMarkWaiterItemsServedMutation();
  const [selectedReadyIds, setSelectedReadyIds] = useState<string[]>([]);
  const handleBranchOrderUpdated = useCallback(() => {
    void pendingQuery.refetch();
    void readyQuery.refetch();
  }, [pendingQuery, readyQuery]);

  useBranchOrderUpdates(branchId, {
    enabled: canSeeOrders,
    onOrderUpdated: handleBranchOrderUpdated,
  });

  const pendingOrders = useMemo(() => pendingQuery.data ?? [], [pendingQuery.data]);
  const readyGroups = useMemo(() => readyQuery.data ?? [], [readyQuery.data]);
  const readyItemIds = useMemo(
    () => readyGroups.flatMap((table) => table.orders.flatMap((order) => order.items.map((item) => item.orderItemId))),
    [readyGroups]
  );
  const readyPortions = readyGroups.reduce(
    (total, table) =>
      total +
      table.orders.reduce(
        (orderTotal, order) => orderTotal + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
        0
      ),
    0
  );

  useEffect(() => {
    setSelectedReadyIds((current) => current.filter((id) => readyItemIds.includes(id)));
  }, [readyItemIds]);

  const toggleReadyItem = (orderItemId: string) => {
    setSelectedReadyIds((current) =>
      current.includes(orderItemId) ? current.filter((id) => id !== orderItemId) : [...current, orderItemId]
    );
  };

  const toggleAllReady = () => {
    setSelectedReadyIds((current) =>
      current.length === readyItemIds.length && readyItemIds.length > 0 ? [] : readyItemIds
    );
  };

  const handleConfirm = async (orderId: string) => {
    await confirmMutation.mutateAsync({ branchId, orderId });
  };

  const handleMarkServed = async () => {
    if (selectedReadyIds.length === 0) {
      return;
    }

    await serveMutation.mutateAsync({ branchId, request: { orderItemIds: selectedReadyIds } });
    setSelectedReadyIds([]);
  };

  const isLoading = branchQuery.isLoading || pendingQuery.isLoading || readyQuery.isLoading;
  const queryError = branchQuery.error ?? pendingQuery.error ?? readyQuery.error;

  return (
    <PortalShell
      title="Đơn hàng"
      description="Xác nhận đơn mới và phục vụ món sau khi bếp báo đã sẵn sàng."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "orders",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Đơn hàng"}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={PATH.me.branchDetail(branchId)}>
              <ArrowLeft className="size-4" />
              Chi tiết chi nhánh
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void pendingQuery.refetch();
              void readyQuery.refetch();
            }}
            disabled={pendingQuery.isFetching || readyQuery.isFetching}
          >
            <RefreshCw className="size-4" />
            Tải lại
          </Button>
        </div>
      }
      stats={
        <>
          <PortalStatCard label="Chờ xác nhận" value={String(pendingOrders.length)} helper="Đơn khách vừa gửi" />
          <PortalStatCard label="Bàn chờ phục vụ" value={String(readyGroups.length)} helper="Có món đã sẵn sàng" />
          <PortalStatCard label="Phần món sẵn sàng" value={String(readyPortions)} helper="Món cần mang ra bàn" />
          <PortalStatCard label="Đã chọn" value={String(selectedReadyIds.length)} helper="Món sẽ đánh dấu đã phục vụ" />
        </>
      }
    >
      {isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải hàng đợi phục vụ...</span>
        </div>
      ) : null}

      {queryError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Không tải được hàng đợi phục vụ</h2>
          <p className="mt-2 text-sm">{getApiErrorMessage(queryError, "Vui lòng thử lại hàng đợi của chi nhánh này.")}</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Chờ xác nhận</h2>
            <p className="text-muted-foreground mt-1 text-sm">Kiểm tra món và ghi chú trước khi gửi xuống bếp.</p>
          </div>
          <span className="bg-warning text-warning-foreground rounded-full px-3 py-1 text-sm font-semibold">
            {pendingOrders.length} đơn chờ
          </span>
        </div>

        {!pendingQuery.isLoading && pendingOrders.length === 0 ? (
          <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
            <ClipboardList className="text-muted-foreground mx-auto size-10" />
            <p className="text-muted-foreground mt-3 text-sm">Chưa có đơn khách nào chờ xác nhận.</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {pendingOrders.map((order) => (
            <article key={order.orderId} className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                    {order.tableNumber ?? "Mang đi"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{order.orderNumber}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="text-primary font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>

              {order.customerNote ? (
                <p className="bg-warning/50 text-warning-foreground mt-4 rounded-lg px-3 py-2 text-sm">
                  Ghi chú đơn: {order.customerNote}
                </p>
              ) : null}

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{item.menuItemName}</p>
                      {item.note ? <p className="text-muted-foreground mt-1 text-xs">Ghi chú: {item.note}</p> : null}
                    </div>
                    <span className="shrink-0 text-sm font-semibold">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <Button
                className="mt-5 w-full"
                onClick={() => void handleConfirm(order.orderId)}
                disabled={confirmMutation.isPending}
              >
                <Check className="size-4" />
                Xác nhận đơn
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sẵn sàng phục vụ</h2>
            <p className="text-muted-foreground mt-1 text-sm">Chọn đúng món đã mang ra bàn rồi đánh dấu đã phục vụ.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={toggleAllReady} disabled={readyItemIds.length === 0}>
              {selectedReadyIds.length === readyItemIds.length && readyItemIds.length > 0 ? "Bỏ chọn" : "Chọn tất cả"}
            </Button>
            <Button variant="success" onClick={() => void handleMarkServed()} disabled={!selectedReadyIds.length || serveMutation.isPending}>
              <Soup className="size-4" />
              Đã phục vụ ({selectedReadyIds.length})
            </Button>
          </div>
        </div>

        {!readyQuery.isLoading && readyGroups.length === 0 ? (
          <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
            <Table2 className="text-muted-foreground mx-auto size-10" />
            <p className="text-muted-foreground mt-3 text-sm">Hiện chưa có món nào sẵn sàng phục vụ.</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {readyGroups.map((table) => (
            <article key={table.tableId ?? table.tableNumber ?? "unassigned"} className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <h3 className="text-xl font-bold">{table.tableNumber ?? "Chưa gán bàn"}</h3>
              <div className="mt-4 space-y-4">
                {table.orders.map((order) => (
                  <div key={order.orderId} className="border-border/60 rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">{order.orderNumber}</p>
                    <div className="mt-3 space-y-3">
                      {order.items.map((item) => (
                        <label key={item.orderItemId} className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedReadyIds.includes(item.orderItemId)}
                            onChange={() => toggleReadyItem(item.orderItemId)}
                            className="border-border text-primary focus:ring-primary mt-0.5 size-4 rounded"
                          />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="font-semibold">{item.menuItemName} x{item.quantity}</span>
                            {item.note ? <span className="text-muted-foreground block">Ghi chú: {item.note}</span> : null}
                            <span className="text-muted-foreground block text-xs">Sẵn sàng lúc {formatDateTime(item.readyAt)}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PortalShell>
  );
};
