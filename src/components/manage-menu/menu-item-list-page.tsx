"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Edit, History, PackageX, Plus, Power, PowerOff, Search, Star } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import {
  useBulkManageAvailabilityMutation,
  useReorderManageMenuItemsMutation,
  useSetManageMenuItemActiveMutation,
  useToggleManageMenuItemAvailableMutation,
  useToggleManageMenuItemFeaturedMutation,
} from "@/hooks/mutations/useManageMenuMutations";
import { useManageCategoriesQuery, useManageMenuItemsQuery } from "@/hooks/queries/useManageMenuQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { ManageMenuQuery } from "@/types/manage-menu";

import {
  type AvailabilityFilter,
  availabilityFilterToQuery,
  FALLBACK_MENU_IMAGE,
  type FeaturedFilter,
  featuredFilterToQuery,
  formatCurrency,
  getAvailabilityLabel,
  getFeaturedLabel,
  getManageApiErrorMessage,
  getManageMenuNavItems,
  getMenuItemCreatePath,
  getMenuItemDetailPath,
  getPortalCopy,
  getPriceHistoryPath,
  getStatusLabel,
  isForbiddenError,
  MANAGE_MENU_PAGE_SIZE_OPTIONS,
  type ManagePortal,
  type StatusFilter,
  statusFilterToQuery,
} from "./helpers";

type MenuItemListPageProps = {
  branchId: string;
  portal: ManagePortal;
};

export const MenuItemListPage = ({ branchId, portal }: MenuItemListPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, control } = useForm({
    defaultValues: {
      search: "",
      categoryId: "all",
      status: "all" as StatusFilter,
      availability: "all" as AvailabilityFilter,
      featured: "all" as FeaturedFilter,
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const categoryIdVal = useWatch({ control, name: "categoryId" });
  const statusVal = useWatch({ control, name: "status" });
  const availabilityVal = useWatch({ control, name: "availability" });
  const featuredVal = useWatch({ control, name: "featured" });

  const search = useDebounce(searchVal.trim(), 250);

  useEffect(() => {
    setPageNumber(1);
  }, [search, categoryIdVal, statusVal, availabilityVal, featuredVal]);

  const query = useMemo<ManageMenuQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      categoryId: categoryIdVal === "all" ? undefined : categoryIdVal,
      isActive: statusFilterToQuery(statusVal),
      isAvailable: availabilityFilterToQuery(availabilityVal),
      isFeatured: featuredFilterToQuery(featuredVal),
      sortBy: "displayOrder",
      sortDirection: "asc",
    }),
    [availabilityVal, categoryIdVal, featuredVal, pageNumber, pageSize, search, statusVal]
  );

  const menuQuery = useManageMenuItemsQuery(branchId, query);
  const categoriesQuery = useManageCategoriesQuery(
    branchId,
    { pageNumber: 1, pageSize: 100, sortBy: "displayOrder", sortDirection: "asc" },
    true
  );
  const activeMutation = useSetManageMenuItemActiveMutation();
  const reorderMutation = useReorderManageMenuItemsMutation();
  const toggleAvailabilityMutation = useToggleManageMenuItemAvailableMutation();
  const toggleFeaturedMutation = useToggleManageMenuItemFeaturedMutation();
  const bulkAvailabilityMutation = useBulkManageAvailabilityMutation();
  const items = menuQuery.data?.items ?? [];
  const categories = categoriesQuery.data?.items ?? [];
  const totalPages = menuQuery.data?.totalPages ?? 1;
  const totalItems = menuQuery.data?.totalItems ?? 0;
  const availableCount = items.filter((item) => item.isAvailable).length;
  const featuredCount = items.filter((item) => item.isFeatured).length;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  };

  const reorder = async (menuItemId: string, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.menuItemId === menuItemId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    await reorderMutation.mutateAsync({
      branchId,
      data: {
        items: next.map((item, itemIndex) => ({
          id: item.menuItemId,
          displayOrder: itemIndex + 1,
        })),
      },
    });
  };

  const bulkAvailability = async (isAvailable: boolean) => {
    if (selectedIds.length === 0) return;

    await bulkAvailabilityMutation.mutateAsync({
      branchId,
      data: {
        isAvailable,
        menuItemIds: selectedIds,
      },
    });
    setSelectedIds([]);
  };

  const isMutating =
    activeMutation.isPending ||
    reorderMutation.isPending ||
    toggleAvailabilityMutation.isPending ||
    toggleFeaturedMutation.isPending ||
    bulkAvailabilityMutation.isPending;

  return (
    <PortalShell
      title="Menu Items"
      description="Manage item list, filters, availability, featured flags, activation, ordering, and pricing."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "menu-items", branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button onClick={() => router.push(getMenuItemCreatePath(portal, branchId))}>
          <Plus className="size-4" />
          Create Menu Item
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Total" value={String(totalItems)} helper="Menu items returned from backend" />
          <PortalStatCard label="Available" value={String(availableCount)} helper="Available items on this page" />
          <PortalStatCard label="Featured" value={String(featuredCount)} helper="Featured items on this page" />
          <PortalStatCard label="Selected" value={String(selectedIds.length)} helper="Bulk availability target" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px_180px_180px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input {...register("search")} placeholder="Search menu items" className="h-11 pl-10" />
          </label>
          <select {...register("categoryId")} className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold">
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
            ))}
          </select>
          <select {...register("status")} className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select {...register("availability")} className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold">
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select {...register("featured")} className="border-input bg-card h-11 rounded-md border px-3 text-sm font-semibold">
            <option value="all">All featured</option>
            <option value="featured">Featured</option>
            <option value="not-featured">Not featured</option>
          </select>
        </div>
        <div className="border-border/60 mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <label className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={items.length > 0 && items.every((item) => selectedIds.includes(item.menuItemId))}
              onChange={() => {
                const ids = items.map((item) => item.menuItemId);
                setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
              }}
            />
            Select visible items
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="success" disabled={selectedIds.length === 0 || isMutating} onClick={() => bulkAvailability(true)}>
              <Check className="size-4" />
              Set Available
            </Button>
            <Button variant="warning" disabled={selectedIds.length === 0 || isMutating} onClick={() => bulkAvailability(false)}>
              <PackageX className="size-4" />
              Set Unavailable
            </Button>
          </div>
        </div>
      </section>

      {menuQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(menuQuery.error)
            ? "You do not have permission to access this branch"
            : getManageApiErrorMessage(menuQuery.error, "Unable to load menu items.")}
        </div>
      ) : null}

      <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border/60 min-w-[1200px] divide-y text-left">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-6 py-4"></th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Image</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Name</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Category</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Price</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Cost</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Prep</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Flags</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Order</th>
                <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {menuQuery.isLoading ? (
                <tr>
                  <td colSpan={10} className="text-muted-foreground px-6 py-10 text-center text-sm">Loading menu items...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-muted-foreground px-6 py-10 text-center text-sm">No menu items found.</td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.menuItemId} className={cn("hover:bg-muted/30", selectedIds.includes(item.menuItemId) && "bg-primary/5")}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.includes(item.menuItemId)} onChange={() => toggleSelected(item.menuItemId)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-surface-container relative size-16 overflow-hidden rounded-lg">
                        <Image src={item.imageUrl || FALLBACK_MENU_IMAGE} alt={item.name} fill unoptimized sizes="64px" className="object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-muted-foreground line-clamp-1 text-xs">{item.description || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.categoryName || "-"}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-4 text-sm">{formatCurrency(item.costPrice)}</td>
                    <td className="px-6 py-4 text-sm">{item.preparationTime} min</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Tag tagString={getAvailabilityLabel(item.isAvailable)} variant={item.isAvailable ? "success" : "warning"} />
                        <Tag tagString={getFeaturedLabel(item.isFeatured)} variant={item.isFeatured ? "success" : "default"} />
                        <Tag tagString={getStatusLabel(item.isActive)} variant={item.isActive ? "success" : "warning"} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.displayOrder}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="icon-sm" variant="outline" disabled={index === 0} onClick={() => reorder(item.menuItemId, "up")}>
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" disabled={index === items.length - 1} onClick={() => reorder(item.menuItemId, "down")}>
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => router.push(getMenuItemDetailPath(portal, item.menuItemId))}>
                          <Edit className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => router.push(getPriceHistoryPath(portal, item.menuItemId))}>
                          <History className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant={item.isActive ? "destructive" : "success"} onClick={() => activeMutation.mutateAsync({ menuItemId: item.menuItemId, isActive: !item.isActive })}>
                          {item.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>
                        <Button size="icon-sm" variant={item.isAvailable ? "warning" : "success"} onClick={() => toggleAvailabilityMutation.mutateAsync(item.menuItemId)}>
                          {item.isAvailable ? <PackageX className="size-4" /> : <Check className="size-4" />}
                        </Button>
                        <Button size="icon-sm" variant={item.isFeatured ? "warning" : "outline"} onClick={() => toggleFeaturedMutation.mutateAsync(item.menuItemId)}>
                          <Star className="size-4" />
                        </Button>
                      </div>
                    </td>
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
          pageSizeOptions={MANAGE_MENU_PAGE_SIZE_OPTIONS}
          totalItems={totalItems}
          disabled={menuQuery.isLoading}
          onPageChange={setPageNumber}
          onPageSizeChange={(value) => {
            setPageNumber(1);
            setPageSize(value);
          }}
        />
      </section>
    </PortalShell>
  );
};
