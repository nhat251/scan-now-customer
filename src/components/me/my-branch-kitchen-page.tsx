"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BellRing, Check, ChefHat, Clock3, RefreshCw, Soup } from "lucide-react";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import {
  useConfirmKitchenItemsMutation,
  useConfirmKitchenOrderMutation,
  useMarkKitchenItemsReadyMutation,
} from "@/hooks/mutations/useOrderMutations";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { useGroupedKitchenItemsQuery, usePendingKitchenOrdersQuery } from "@/hooks/queries/useOrderQueries";
import { useBranchOrderUpdates } from "@/hooks/useBranchOrderUpdates";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { GroupedKitchenItem, PendingOrderResponse } from "@/types/order";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatDateTime,
  getApiErrorMessage,
  getMyPortalNavItems,
} from "./helpers";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type Props = {
  branchId: string;
};

type KitchenFilter = "all" | "Confirmed";

const PRIORITY_TONE = {
  Low: "bg-success text-success-foreground",
  Medium: "bg-warning text-warning-foreground",
  High: "bg-destructive/10 text-destructive",
} as const;

const PENDING_ALERT_AFTER_MS = 10 * 60 * 1000;
const PENDING_ALERT_REPEAT_MS = 5 * 60 * 1000;

const getPendingMinutes = (createdAt: string) => {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
};

const playPendingOrderBell = () => {
  const AudioContextClass =
    window.AudioContext ??
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.24, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.6);
  oscillator.onended = () => void context.close();
};

export const MyBranchKitchenPage = ({ branchId }: Props) => {
  const currentUser = useUserStore((state) => state.user);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const pendingAlertRef = useRef<Record<string, number>>({});
  const branchQuery = useMyBranchDetailQuery(branchId, canSeeKitchen);
  const pendingQuery = usePendingKitchenOrdersQuery(branchId, canSeeKitchen);
  const kitchenQuery = useGroupedKitchenItemsQuery(
    branchId,
    filter === "all" ? undefined : filter,
    canSeeKitchen
  );
  const confirmOrderMutation = useConfirmKitchenOrderMutation();
  const confirmItemsMutation = useConfirmKitchenItemsMutation();
  const markReadyMutation = useMarkKitchenItemsReadyMutation();
  const handleBranchOrderUpdated = useCallback(() => {
    void pendingQuery.refetch();
    void kitchenQuery.refetch();
  }, [kitchenQuery, pendingQuery]);

  useBranchOrderUpdates(branchId, {
    enabled: canSeeKitchen,
    onOrderUpdated: handleBranchOrderUpdated,
  });
  const pendingOrders = useMemo(() => pendingQuery.data ?? [], [pendingQuery.data]);
  const groups = useMemo(() => kitchenQuery.data ?? [], [kitchenQuery.data]);
  const pendingItemIds = useMemo(
    () => pendingOrders.flatMap((order) => order.items.map((item) => item.orderItemId)),
    [pendingOrders]
  );
  const overduePendingItems = useMemo(
    () =>
      pendingOrders.flatMap((order) =>
        order.items
          .filter((item) => Date.now() - new Date(item.createdAt).getTime() >= PENDING_ALERT_AFTER_MS)
          .map((item) => ({ order, item, pendingMinutes: getPendingMinutes(item.createdAt) }))
      ),
    [pendingOrders]
  );
  const visibleItemIds = useMemo(() => groups.flatMap((group) => group.items.map((item) => item.orderItemId)), [groups]);
  const selectedConfirmedIds = useMemo(
    () =>
      groups
        .filter((group) => group.status === "Confirmed")
        .flatMap((group) => group.items.map((item) => item.orderItemId))
        .filter((id) => selectedIds.includes(id)),
    [groups, selectedIds]
  );
  const totalPortions = groups.reduce((total, group) => total + group.totalQuantity, 0);
  const highPriorityCount = groups.filter((group) => group.suggestedPriorityLevel === "High").length;
  const pendingPortions = pendingOrders.reduce(
    (total, order) => total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0
  );

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleItemIds.includes(id)));
  }, [visibleItemIds]);

  useEffect(() => {
    setSelectedPendingIds((current) => current.filter((id) => pendingItemIds.includes(id)));
  }, [pendingItemIds]);

  useEffect(() => {
    const now = Date.now();

    for (const { order, item, pendingMinutes } of overduePendingItems) {
      const lastAlertAt = pendingAlertRef.current[item.orderItemId] ?? 0;

      if (now - lastAlertAt < PENDING_ALERT_REPEAT_MS) {
        continue;
      }

      pendingAlertRef.current[item.orderItemId] = now;
      playPendingOrderBell();
      showNotify({
        type: "warning",
        message: `Table ${order.tableNumber ?? "unassigned"} has ${item.menuItemName} waiting ${pendingMinutes} minutes for confirmation.`,
      });
    }
  }, [overduePendingItems]);

  const toggleItem = (orderItemId: string) => {
    setSelectedIds((current) =>
      current.includes(orderItemId) ? current.filter((id) => id !== orderItemId) : [...current, orderItemId]
    );
  };

  const togglePendingItem = (orderItemId: string) => {
    setSelectedPendingIds((current) =>
      current.includes(orderItemId) ? current.filter((id) => id !== orderItemId) : [...current, orderItemId]
    );
  };

  const togglePendingOrder = (order: PendingOrderResponse) => {
    const orderItemIds = order.items.map((item) => item.orderItemId);
    const allSelected = orderItemIds.every((id) => selectedPendingIds.includes(id));

    setSelectedPendingIds((current) =>
      allSelected
        ? current.filter((id) => !orderItemIds.includes(id))
        : Array.from(new Set([...current, ...orderItemIds]))
    );
  };

  const confirmOrder = async (order: PendingOrderResponse) => {
    const orderItemIds = order.items.map((item) => item.orderItemId);

    await confirmOrderMutation.mutateAsync({ branchId, orderId: order.orderId });
    setSelectedPendingIds((current) => current.filter((id) => !orderItemIds.includes(id)));
  };

  const confirmPendingItems = async (orderItemIds: string[]) => {
    if (orderItemIds.length === 0) {
      return;
    }

    await confirmItemsMutation.mutateAsync({ branchId, request: { orderItemIds } });
    setSelectedPendingIds((current) => current.filter((id) => !orderItemIds.includes(id)));
  };

  const toggleGroup = (group: GroupedKitchenItem) => {
    const groupIds = group.items.map((item) => item.orderItemId);
    const allSelected = groupIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds]))
    );
  };

  const markReady = async (orderItemIds: string[]) => {
    if (orderItemIds.length === 0) {
      return;
    }

    await markReadyMutation.mutateAsync({ branchId, request: { orderItemIds } });
    setSelectedIds((current) => current.filter((id) => !orderItemIds.includes(id)));
  };

  const isMutating =
    confirmOrderMutation.isPending ||
    confirmItemsMutation.isPending ||
    markReadyMutation.isPending;
  const queryError = branchQuery.error ?? pendingQuery.error ?? kitchenQuery.error;

  return (
    <PortalShell
      title="Kitchen Queue"
      description="Prepare backend-grouped dishes by priority. Notes create separate groups to protect preparation requirements."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "kitchen",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Kitchen Queue"}
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
              void kitchenQuery.refetch();
            }}
            disabled={pendingQuery.isFetching || kitchenQuery.isFetching}
          >
            <RefreshCw className={cn("size-4", (pendingQuery.isFetching || kitchenQuery.isFetching) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
      stats={
        <>
          <PortalStatCard label="Pending Orders" value={String(pendingOrders.length)} helper={`${pendingPortions} dishes need confirmation`} />
          <PortalStatCard label="Kitchen Groups" value={String(groups.length)} helper={`${totalPortions} confirmed portions`} />
          <PortalStatCard label="High Priority" value={String(highPriorityCount)} helper="Urgent groups first" />
          <PortalStatCard label="Selected Items" value={String(selectedIds.length)} helper="Individual order items" />
        </>
      }
    >
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pending Confirmation</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              New orders and added dishes go straight to kitchen. Confirm a whole order or only selected dishes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={playPendingOrderBell}>
              <BellRing className="size-4" />
              Test Bell
            </Button>
            <Button
              variant="warning"
              disabled={selectedPendingIds.length === 0 || isMutating}
              onClick={() => void confirmPendingItems(selectedPendingIds)}
            >
              <Check className="size-4" />
              Confirm Selected ({selectedPendingIds.length})
            </Button>
          </div>
        </div>

        {overduePendingItems.length > 0 ? (
          <div className="border-warning/60 bg-warning/20 text-warning-foreground flex items-start gap-3 rounded-xl border p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <p className="font-bold">{overduePendingItems.length} dish(es) have waited over 10 minutes.</p>
              <p className="mt-1">
                The bell repeats every 5 minutes while those dishes remain unconfirmed.
              </p>
            </div>
          </div>
        ) : null}

        {!pendingQuery.isLoading && pendingOrders.length === 0 ? (
          <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
            <ChefHat className="text-muted-foreground mx-auto size-10" />
            <h2 className="mt-3 text-xl font-bold">No orders waiting for confirmation</h2>
            <p className="text-muted-foreground mt-2 text-sm">New customer dishes will appear here first.</p>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-2">
          {pendingOrders.map((order) => {
            const orderItemIds = order.items.map((item) => item.orderItemId);
            const allOrderItemsSelected = orderItemIds.every((id) => selectedPendingIds.includes(id));
            const longestWaitMinutes = Math.max(...order.items.map((item) => getPendingMinutes(item.createdAt)), 0);
            const isOverdue = longestWaitMinutes >= 10;

            return (
              <article
                key={order.orderId}
                className={cn(
                  "bg-card border-border/60 rounded-xl border p-5 shadow-sm",
                  isOverdue && "border-warning/70 bg-warning/10"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                      {order.tableNumber ?? "Unassigned table"}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{order.orderNumber}</h3>
                    <p className="text-muted-foreground mt-1 text-xs">Longest wait {longestWaitMinutes}m</p>
                  </div>
                  {isOverdue ? (
                    <span className="bg-warning text-warning-foreground rounded-full px-3 py-1 text-xs font-bold">
                      Alert
                    </span>
                  ) : null}
                </div>

                {order.customerNote ? (
                  <p className="bg-warning/40 text-warning-foreground mt-4 rounded-lg px-3 py-2 text-sm">
                    Order note: {order.customerNote}
                  </p>
                ) : null}

                <label className="text-muted-foreground mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allOrderItemsSelected}
                    onChange={() => togglePendingOrder(order)}
                    className="border-border text-primary focus:ring-primary size-4 rounded"
                  />
                  Select all pending dishes in this order
                </label>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => {
                    const pendingMinutes = getPendingMinutes(item.createdAt);

                    return (
                      <label key={item.orderItemId} className="border-border/60 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                        <input
                          type="checkbox"
                          checked={selectedPendingIds.includes(item.orderItemId)}
                          onChange={() => togglePendingItem(item.orderItemId)}
                          className="border-border text-primary focus:ring-primary mt-1 size-4 rounded"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="block font-semibold">
                            {item.menuItemName} x{item.quantity}
                          </span>
                          {item.note ? <span className="text-primary mt-1 block text-xs font-semibold">Note: {item.note}</span> : null}
                          <span className={cn("mt-1 block text-xs", pendingMinutes >= 10 ? "text-warning-foreground font-bold" : "text-muted-foreground")}>
                            Waiting {pendingMinutes}m
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="warning"
                    className="flex-1"
                    disabled={isMutating}
                    onClick={() => void confirmOrder(order)}
                  >
                    <Check className="size-4" />
                    Confirm Order
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!orderItemIds.some((id) => selectedPendingIds.includes(id)) || isMutating}
                    onClick={() => void confirmPendingItems(orderItemIds.filter((id) => selectedPendingIds.includes(id)))}
                  >
                    Confirm Checked
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </section>

      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "Confirmed"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={filter === option ? "default" : "outline"}
                onClick={() => setFilter(option)}
              >
                {option === "all" ? "All Active" : option}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={selectedConfirmedIds.length === 0 || isMutating}
              onClick={() => void markReady(selectedConfirmedIds)}
            >
              <Soup className="size-4" />
              Mark Ready ({selectedConfirmedIds.length})
            </Button>
          </div>
        </div>
      </section>

      {kitchenQuery.isLoading || pendingQuery.isLoading || branchQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading kitchen groups...</span>
        </div>
      ) : null}

      {queryError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Unable to load kitchen queue</h2>
          <p className="mt-2 text-sm">{getApiErrorMessage(queryError, "Please retry this kitchen queue.")}</p>
        </div>
      ) : null}

      {!kitchenQuery.isLoading && !kitchenQuery.isError && groups.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <ChefHat className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">No dishes in this queue</h2>
          <p className="text-muted-foreground mt-2 text-sm">Confirmed dishes appear here after kitchen approval.</p>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => {
          const groupIds = group.items.map((item) => item.orderItemId);
          const allSelected = groupIds.length > 0 && groupIds.every((id) => selectedIds.includes(id));

          return (
            <article
              key={`${group.menuItemId}-${group.status}-${group.note ?? "standard"}`}
              className="bg-card border-border/60 rounded-xl border p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", PRIORITY_TONE[group.suggestedPriorityLevel])}>
                      {group.suggestedPriorityLevel}
                    </span>
                    <span className="bg-surface-container text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                      Confirmed / In Progress
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold">{group.menuItemName}</h2>
                  {group.note ? <p className="text-primary mt-1 text-sm font-semibold">Note: {group.note}</p> : null}
                </div>
                <p className="text-primary shrink-0 text-2xl font-black">x{group.totalQuantity}</p>
              </div>

              <div className="text-muted-foreground mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
                <p className="flex items-center gap-2">
                  <Clock3 className="size-4" />
                  Wait {Math.round(group.waitingMinutes)}m
                </p>
                <p>Prep ~{group.averageCookingMinutes}m</p>
                <p>Score {Math.round(group.priorityScore)}</p>
              </div>

              <label className="text-muted-foreground mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => toggleGroup(group)}
                  className="border-border text-primary focus:ring-primary size-4 rounded"
                />
                Select entire group
              </label>

              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <label key={item.orderItemId} className="border-border/60 flex cursor-pointer items-start gap-3 rounded-lg border p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.orderItemId)}
                      onChange={() => toggleItem(item.orderItemId)}
                      className="border-border text-primary focus:ring-primary mt-1 size-4 rounded"
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold">
                        {item.tableName ?? "No table"} / {item.orderCode} - x{item.quantity}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        Confirmed {formatDateTime(item.confirmedAt)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-5">
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => void markReady(groupIds)}
                  disabled={isMutating}
                >
                  <Soup className="size-4" />
                  Mark Entire Group Ready
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </PortalShell>
  );
};
