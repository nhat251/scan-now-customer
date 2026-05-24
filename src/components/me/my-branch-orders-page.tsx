"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardList, RefreshCw, Soup, Table2 } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useConfirmWaiterOrderMutation, useMarkWaiterItemsServedMutation } from "@/hooks/mutations/useOrderMutations";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { usePendingWaiterOrdersQuery, useReadyToServeItemsQuery } from "@/hooks/queries/useOrderQueries";
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
      title="Order Service"
      description="Confirm newly submitted orders and serve dishes after the kitchen marks them ready."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      navItems={getMyPortalNavItems({
        active: "orders",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Order Service"}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={PATH.me.branchDetail(branchId)}>
              <ArrowLeft className="size-4" />
              Branch Detail
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
            Refresh
          </Button>
        </div>
      }
      stats={
        <>
          <PortalStatCard label="Pending Orders" value={String(pendingOrders.length)} helper="Awaiting confirmation" />
          <PortalStatCard label="Ready Tables" value={String(readyGroups.length)} helper="Tables waiting for service" />
          <PortalStatCard label="Ready Portions" value={String(readyPortions)} helper="Ready dishes to deliver" />
          <PortalStatCard label="Selected" value={String(selectedReadyIds.length)} helper="Items to mark served" />
        </>
      }
    >
      {isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading service queue...</span>
        </div>
      ) : null}

      {queryError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Unable to load order service queue</h2>
          <p className="mt-2 text-sm">{getApiErrorMessage(queryError, "Please retry this branch queue.")}</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Pending Confirmation</h2>
            <p className="text-muted-foreground mt-1 text-sm">Verify dishes and notes before sending them to kitchen.</p>
          </div>
          <span className="bg-warning text-warning-foreground rounded-full px-3 py-1 text-sm font-semibold">
            {pendingOrders.length} pending
          </span>
        </div>

        {!pendingQuery.isLoading && pendingOrders.length === 0 ? (
          <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
            <ClipboardList className="text-muted-foreground mx-auto size-10" />
            <p className="text-muted-foreground mt-3 text-sm">No customer orders are waiting for confirmation.</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {pendingOrders.map((order) => (
            <article key={order.orderId} className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                    {order.tableNumber ?? "Takeaway"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold">{order.orderNumber}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="text-primary font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>

              {order.customerNote ? (
                <p className="bg-warning/50 text-warning-foreground mt-4 rounded-lg px-3 py-2 text-sm">
                  Order note: {order.customerNote}
                </p>
              ) : null}

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{item.menuItemName}</p>
                      {item.note ? <p className="text-muted-foreground mt-1 text-xs">Note: {item.note}</p> : null}
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
                Confirm Order
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ready To Serve</h2>
            <p className="text-muted-foreground mt-1 text-sm">Select only dishes delivered to the table, then mark served.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={toggleAllReady} disabled={readyItemIds.length === 0}>
              {selectedReadyIds.length === readyItemIds.length && readyItemIds.length > 0 ? "Clear selection" : "Select all"}
            </Button>
            <Button variant="success" onClick={() => void handleMarkServed()} disabled={!selectedReadyIds.length || serveMutation.isPending}>
              <Soup className="size-4" />
              Mark Served ({selectedReadyIds.length})
            </Button>
          </div>
        </div>

        {!readyQuery.isLoading && readyGroups.length === 0 ? (
          <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
            <Table2 className="text-muted-foreground mx-auto size-10" />
            <p className="text-muted-foreground mt-3 text-sm">No dishes are currently ready for service.</p>
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {readyGroups.map((table) => (
            <article key={table.tableId ?? table.tableNumber ?? "unassigned"} className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <h3 className="text-xl font-bold">{table.tableNumber ?? "Unassigned table"}</h3>
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
                            {item.note ? <span className="text-muted-foreground block">Note: {item.note}</span> : null}
                            <span className="text-muted-foreground block text-xs">Ready {formatDateTime(item.readyAt)}</span>
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
