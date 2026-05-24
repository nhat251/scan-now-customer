"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChefHat, Clock3, Flame, RefreshCw, Soup } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMarkKitchenItemsReadyMutation, useStartCookingItemsMutation } from "@/hooks/mutations/useOrderMutations";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { useGroupedKitchenItemsQuery } from "@/hooks/queries/useOrderQueries";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { GroupedKitchenItem } from "@/types/order";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatDateTime,
  getApiErrorMessage,
  getMyPortalNavItems,
} from "./helpers";

type Props = {
  branchId: string;
};

type KitchenFilter = "all" | "Confirmed" | "Cooking";

const PRIORITY_TONE = {
  Low: "bg-success text-success-foreground",
  Medium: "bg-warning text-warning-foreground",
  High: "bg-destructive/10 text-destructive",
} as const;

export const MyBranchKitchenPage = ({ branchId }: Props) => {
  const currentUser = useUserStore((state) => state.user);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const branchQuery = useMyBranchDetailQuery(branchId, canSeeKitchen);
  const kitchenQuery = useGroupedKitchenItemsQuery(
    branchId,
    filter === "all" ? undefined : filter,
    canSeeKitchen
  );
  const startCookingMutation = useStartCookingItemsMutation();
  const markReadyMutation = useMarkKitchenItemsReadyMutation();
  const groups = useMemo(() => kitchenQuery.data ?? [], [kitchenQuery.data]);
  const visibleItemIds = useMemo(() => groups.flatMap((group) => group.items.map((item) => item.orderItemId)), [groups]);
  const selectedConfirmedIds = useMemo(
    () =>
      groups
        .filter((group) => group.status === "Confirmed")
        .flatMap((group) => group.items.map((item) => item.orderItemId))
        .filter((id) => selectedIds.includes(id)),
    [groups, selectedIds]
  );
  const selectedCookingIds = useMemo(
    () =>
      groups
        .filter((group) => group.status === "Cooking")
        .flatMap((group) => group.items.map((item) => item.orderItemId))
        .filter((id) => selectedIds.includes(id)),
    [groups, selectedIds]
  );
  const totalPortions = groups.reduce((total, group) => total + group.totalQuantity, 0);
  const highPriorityCount = groups.filter((group) => group.suggestedPriorityLevel === "High").length;

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleItemIds.includes(id)));
  }, [visibleItemIds]);

  const toggleItem = (orderItemId: string) => {
    setSelectedIds((current) =>
      current.includes(orderItemId) ? current.filter((id) => id !== orderItemId) : [...current, orderItemId]
    );
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

  const startItems = async (orderItemIds: string[]) => {
    if (orderItemIds.length === 0) {
      return;
    }

    await startCookingMutation.mutateAsync({ branchId, request: { orderItemIds } });
    setSelectedIds((current) => current.filter((id) => !orderItemIds.includes(id)));
  };

  const markReady = async (orderItemIds: string[]) => {
    if (orderItemIds.length === 0) {
      return;
    }

    await markReadyMutation.mutateAsync({ branchId, request: { orderItemIds } });
    setSelectedIds((current) => current.filter((id) => !orderItemIds.includes(id)));
  };

  const isMutating = startCookingMutation.isPending || markReadyMutation.isPending;
  const queryError = branchQuery.error ?? kitchenQuery.error;

  return (
    <PortalShell
      title="Kitchen Queue"
      description="Prepare backend-grouped dishes by priority. Notes create separate groups to protect preparation requirements."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
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
          <Button variant="outline" onClick={() => kitchenQuery.refetch()} disabled={kitchenQuery.isFetching}>
            <RefreshCw className={cn("size-4", kitchenQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      }
      stats={
        <>
          <PortalStatCard label="Groups" value={String(groups.length)} helper="Grouped by item, note and status" />
          <PortalStatCard label="Portions" value={String(totalPortions)} helper="Visible preparation quantity" />
          <PortalStatCard label="High Priority" value={String(highPriorityCount)} helper="Urgent groups first" />
          <PortalStatCard label="Selected Items" value={String(selectedIds.length)} helper="Individual order items" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "Confirmed", "Cooking"] as const).map((option) => (
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
              variant="warning"
              disabled={selectedConfirmedIds.length === 0 || isMutating}
              onClick={() => void startItems(selectedConfirmedIds)}
            >
              <Flame className="size-4" />
              Start Cooking ({selectedConfirmedIds.length})
            </Button>
            <Button
              variant="success"
              disabled={selectedCookingIds.length === 0 || isMutating}
              onClick={() => void markReady(selectedCookingIds)}
            >
              <Soup className="size-4" />
              Mark Ready ({selectedCookingIds.length})
            </Button>
          </div>
        </div>
      </section>

      {kitchenQuery.isLoading || branchQuery.isLoading ? (
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
          <p className="text-muted-foreground mt-2 text-sm">Confirmed dishes appear here after waiter approval.</p>
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
                      {group.status}
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
                <p>Cook ~{group.averageCookingMinutes}m</p>
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
                {group.status === "Confirmed" ? (
                  <Button
                    variant="warning"
                    className="w-full"
                    onClick={() => void startItems(groupIds)}
                    disabled={isMutating}
                  >
                    <Flame className="size-4" />
                    Start Entire Group
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => void markReady(groupIds)}
                    disabled={isMutating}
                  >
                    <Soup className="size-4" />
                    Mark Entire Group Ready
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </PortalShell>
  );
};
