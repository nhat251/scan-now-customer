"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageX,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useBulkMyMenuAvailabilityMutation, useToggleMyMenuItemAvailabilityMutation } from "@/hooks/mutations/useMeMenuMutations";
import { useMyBranchDetailQuery, useMyBranchMenuQuery } from "@/hooks/queries/useMeQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { MyMenuItemResponse, MyMenuQuery } from "@/types/me";

import {
  canManageMenuAvailability,
  FALLBACK_MENU_IMAGE,
  formatCurrency,
  getActiveLabel,
  getApiErrorMessage,
  getAvailabilityLabel,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";

type MyBranchMenuPageProps = {
  branchId: string;
};

type AvailabilityFilter = "all" | "available" | "out-of-stock";

const SORT_OPTIONS = [
  { label: "Display order", value: "displayOrder:asc" },
  { label: "Name A-Z", value: "name:asc" },
  { label: "Price low to high", value: "price:asc" },
  { label: "Price high to low", value: "price:desc" },
] as const;

const getAvailabilityQueryValue = (filter: AvailabilityFilter) => {
  if (filter === "available") {
    return true;
  }

  if (filter === "out-of-stock") {
    return false;
  }

  return undefined;
};

export const MyBranchMenuPage = ({ branchId }: MyBranchMenuPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 250);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [categoryId, setCategoryId] = useState("all");
  const [sortValue, setSortValue] = useState<(typeof SORT_OPTIONS)[number]["value"]>("displayOrder:asc");
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const branchQuery = useMyBranchDetailQuery(branchId, canSeeMenu);
  const [sortBy, sortDirection] = sortValue.split(":") as [string, "asc" | "desc"];
  const menuQueryParams = useMemo<MyMenuQuery>(
    () => ({
      pageNumber,
      pageSize: 8,
      search: search || undefined,
      isAvailable: getAvailabilityQueryValue(availabilityFilter),
      categoryId: categoryId === "all" ? undefined : categoryId,
      sortBy,
      sortDirection,
    }),
    [availabilityFilter, categoryId, pageNumber, search, sortBy, sortDirection]
  );
  const categoryQueryParams = useMemo<MyMenuQuery>(
    () => ({
      pageNumber: 1,
      pageSize: 100,
      sortBy: "displayOrder",
      sortDirection: "asc",
    }),
    []
  );

  const menuQuery = useMyBranchMenuQuery(branchId, menuQueryParams, canSeeMenu);
  const categoryQuery = useMyBranchMenuQuery(branchId, categoryQueryParams, canSeeMenu);
  const toggleMutation = useToggleMyMenuItemAvailabilityMutation();
  const bulkMutation = useBulkMyMenuAvailabilityMutation();

  const groups = useMemo(() => menuQuery.data?.items ?? [], [menuQuery.data?.items]);
  const allVisibleItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const categories = useMemo(
    () =>
      (categoryQuery.data?.items ?? []).map((category) => ({
        id: category.categoryId,
        name: category.categoryName,
      })),
    [categoryQuery.data?.items]
  );
  const selectedCount = selectedIds.length;
  const availableCount = allVisibleItems.filter((item) => item.isAvailable).length;
  const outOfStockCount = allVisibleItems.filter((item) => !item.isAvailable).length;
  const totalPages = Math.max(menuQuery.data?.totalPages ?? 1, 1);

  useEffect(() => {
    setPageNumber(1);
  }, [availabilityFilter, categoryId, search, sortValue]);

  useEffect(() => {
    setSelectedIds((current) =>
      current.filter((id) => allVisibleItems.some((item) => item.menuItemId === id))
    );
  }, [allVisibleItems]);

  const toggleSelected = (menuItemId: string) => {
    setSelectedIds((current) =>
      current.includes(menuItemId)
        ? current.filter((id) => id !== menuItemId)
        : [...current, menuItemId]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = allVisibleItems.map((item) => item.menuItemId);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) => {
      if (allSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleToggleItem = async (item: MyMenuItemResponse) => {
    await toggleMutation.mutateAsync(item.menuItemId);
    await menuQuery.refetch();
  };

  const handleBulkAvailability = async (isAvailable: boolean) => {
    if (selectedIds.length === 0) {
      return;
    }

    await bulkMutation.mutateAsync({
      branchId,
      request: {
        isAvailable,
        menuItemIds: selectedIds,
      },
    });
    setSelectedIds([]);
    await menuQuery.refetch();
  };

  const isMutating = toggleMutation.isPending || bulkMutation.isPending;
  const hasForbiddenError = isForbiddenError(menuQuery.error) || isForbiddenError(branchQuery.error);

  return (
    <PortalShell
      title="Menu Availability"
      description="View branch menu items and update availability without changing menu content or prices."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      navItems={getMyPortalNavItems({ active: "menu", branchId, canSeeMenu })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Menu Availability"}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={PATH.me.branchDetail(branchId)}>
            <ArrowLeft className="size-4" />
            Branch Detail
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Visible Items" value={String(allVisibleItems.length)} helper="Items in current result" />
          <PortalStatCard label="Available" value={String(availableCount)} helper="Ready to sell" />
          <PortalStatCard label="Out of Stock" value={String(outOfStockCount)} helper="Temporarily unavailable" />
          <PortalStatCard label="Selected" value={String(selectedCount)} helper="Items selected for bulk update" />
        </>
      }
    >
      {hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">You do not have permission to access this branch</h2>
          <p className="mt-2 text-sm">Please select a branch assigned to your account.</p>
        </div>
      ) : null}

      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_220px_220px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search menu items"
              className="h-11 pl-10"
            />
          </label>

          <label className="relative">
            <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as AvailabilityFilter)}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full appearance-none rounded-md border pr-3 pl-10 text-sm font-semibold outline-none focus:ring-3"
            >
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </label>

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value as (typeof SORT_OPTIONS)[number]["value"])}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-border/60 mt-4 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="text-muted-foreground flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={
                allVisibleItems.length > 0 &&
                allVisibleItems.every((item) => selectedIds.includes(item.menuItemId))
              }
              onChange={toggleAllVisible}
              className="border-border text-primary focus:ring-primary size-4 rounded"
            />
            Select visible items
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(true)}
            >
              <Check className="size-4" />
              Set as Available
            </Button>
            <Button
              variant="warning"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(false)}
            >
              <PackageX className="size-4" />
              Set as Unavailable
            </Button>
          </div>
        </div>
      </section>

      {menuQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading branch menu...</span>
        </div>
      ) : null}

      {menuQuery.isError && !hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">Unable to load menu</h2>
          <p className="mt-2 text-sm">
            {getApiErrorMessage(menuQuery.error, "Please try refreshing this menu.")}
          </p>
          <Button className="mt-5" onClick={() => menuQuery.refetch()} disabled={menuQuery.isRefetching}>
            Retry
          </Button>
        </div>
      ) : null}

      {!menuQuery.isLoading && !menuQuery.isError && groups.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <PackageX className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">No menu items found</h2>
          <p className="text-muted-foreground mt-2 text-sm">Try another search, category, or availability filter.</p>
        </div>
      ) : null}

      <section className="space-y-6">
        {groups.map((group) => (
          <div key={group.categoryId} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{group.categoryName}</h2>
              <span className="text-muted-foreground text-sm font-semibold">{group.items.length} items</span>
            </div>

            <div className="grid gap-3">
              {group.items.map((item) => {
                const selected = selectedIds.includes(item.menuItemId);

                return (
                  <article
                    key={item.menuItemId}
                    className={cn(
                      "bg-card border-border/60 grid gap-4 rounded-xl border p-4 shadow-sm lg:grid-cols-[auto_96px_minmax(0,1fr)_auto]",
                      selected && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(item.menuItemId)}
                        className="border-border text-primary focus:ring-primary size-4 rounded"
                        aria-label={`Select ${item.name}`}
                      />
                    </div>

                    <div className="bg-surface-container relative h-24 w-full overflow-hidden rounded-lg lg:w-24">
                      <Image
                        src={item.imageUrl || FALLBACK_MENU_IMAGE}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="96px"
                        className={cn("object-cover", !item.isAvailable && "opacity-60 grayscale")}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            item.isAvailable
                              ? "bg-success text-success-foreground"
                              : "bg-warning text-warning-foreground"
                          )}
                        >
                          {getAvailabilityLabel(item)}
                        </span>
                        <span className="bg-surface-container text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                          {getActiveLabel(item.isActive)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {item.description || "No description provided."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <span className="text-primary font-black">{formatCurrency(item.price)}</span>
                        <span className="text-muted-foreground">{item.categoryName ?? group.categoryName}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch lg:justify-center">
                      <Button
                        variant={item.isAvailable ? "warning" : "success"}
                        disabled={isMutating}
                        onClick={() => handleToggleItem(item)}
                      >
                        {item.isAvailable ? <PackageX className="size-4" /> : <Check className="size-4" />}
                        {item.isAvailable ? "Out of Stock" : "Available"}
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={PATH.me.menuItem(item.menuItemId)}>
                          <Eye className="size-4" />
                          Detail
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {!menuQuery.isLoading && !menuQuery.isError && groups.length > 0 ? (
        <div className="bg-card border-border/60 flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Page {Math.min(pageNumber, totalPages)} of {totalPages} · {menuQuery.data?.totalItems ?? 0} categories
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pageNumber <= 1 || menuQuery.isFetching}
              onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pageNumber >= totalPages || menuQuery.isFetching}
              onClick={() => setPageNumber((current) => Math.min(current + 1, totalPages))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
};
