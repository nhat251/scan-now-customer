"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  Eye,
  PackageX,
  Search,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useBulkMyMenuAvailabilityMutation, useToggleMyMenuItemAvailabilityMutation } from "@/hooks/mutations/useMeMenuMutations";
import { useMyBranchDetailQuery, useMyBranchMenuQuery } from "@/hooks/queries/useMeQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { MyMenuItemResponse, MyMenuQuery } from "@/types/me";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  FALLBACK_MENU_IMAGE,
  formatCurrency,
  getApiErrorMessage,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type MyBranchMenuPageProps = {
  branchId: string;
};

type AvailabilityFilter = "all" | "available" | "out-of-stock";

const SORT_OPTIONS = [
  { label: "Thứ tự hiển thị", value: "displayOrder:asc" },
  { label: "Tên A-Z", value: "name:asc" },
  { label: "Giá thấp đến cao", value: "price:asc" },
  { label: "Giá cao đến thấp", value: "price:desc" },
] as const;

const AVAILABILITY_FILTER_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Còn hàng", value: "available" },
  { label: "Hết hàng", value: "out-of-stock" },
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

const MenuItemImage = ({
  src,
  alt,
  isAvailable,
}: {
  src?: string | null;
  alt: string;
  isAvailable: boolean;
}) => {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_MENU_IMAGE);

  useEffect(() => {
    setImageSrc(src || FALLBACK_MENU_IMAGE);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      unoptimized
      sizes="96px"
      className={cn("object-cover", !isAvailable && "opacity-60 grayscale")}
      onError={() => setImageSrc(FALLBACK_MENU_IMAGE)}
    />
  );
};

export const MyBranchMenuPage = ({ branchId }: MyBranchMenuPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, control, setValue } = useForm({
    defaultValues: {
      search: "",
      availabilityFilter: "all" as AvailabilityFilter,
      categoryId: "all",
      sortValue: "displayOrder:asc" as (typeof SORT_OPTIONS)[number]["value"],
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const availabilityFilterVal = useWatch({ control, name: "availabilityFilter" });
  const categoryIdVal = useWatch({ control, name: "categoryId" });
  const sortValueVal = useWatch({ control, name: "sortValue" });

  const search = useDebounce(searchVal.trim(), 250);

  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const branchQuery = useMyBranchDetailQuery(branchId, canSeeMenu);
  const [sortBy, sortDirection] = sortValueVal.split(":") as [string, "asc" | "desc"];
  const menuQueryParams = useMemo<MyMenuQuery>(
    () => ({
      pageNumber,
      pageSize: 10,
      search: search || undefined,
      isAvailable: getAvailabilityQueryValue(availabilityFilterVal),
      categoryId: categoryIdVal === "all" ? undefined : categoryIdVal,
      sortBy,
      sortDirection,
    }),
    [availabilityFilterVal, categoryIdVal, pageNumber, search, sortBy, sortDirection]
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
  }, [availabilityFilterVal, categoryIdVal, search, sortValueVal]);

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
      title="Tình trạng menu"
      description="Cập nhật trạng thái món ăn mà không thay đổi nội dung hoặc giá."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "menu",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Tình trạng menu"}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={PATH.me.branchDetail(branchId)}>
            <ArrowLeft className="size-4" />
            Chi tiết chi nhánh
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Đang hiển thị" value={String(allVisibleItems.length)} helper="Món trong kết quả hiện tại" />
          <PortalStatCard label="Còn hàng" value={String(availableCount)} helper="Sẵn sàng bán" />
          <PortalStatCard label="Hết hàng" value={String(outOfStockCount)} helper="Tạm thời ngưng bán" />
          <PortalStatCard label="Đã chọn" value={String(selectedCount)} helper="Món chọn để cập nhật" />
        </>
      }
    >
      {hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Bạn không có quyền truy cập chi nhánh này</h2>
          <p className="mt-2 text-sm">Vui lòng chọn chi nhánh được gán cho tài khoản của bạn.</p>
        </div>
      ) : null}

      <section className="rounded-[24px] border border-[#e8e4dc] bg-white p-3 shadow-sm lg:p-4">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div>
            <p className="text-[12px] font-black tracking-[0.16em] text-stone-400 uppercase">Menu</p>
            <h2 className="text-lg font-black tracking-tight text-stone-950">Tình trạng món</h2>
          </div>
          <span className="rounded-full bg-[#f1efe9] px-3 py-1.5 text-xs font-bold text-stone-600">
            {allVisibleItems.length} món
          </span>
        </div>

        <div className="mt-3 grid gap-2 lg:mt-0 lg:grid-cols-[minmax(220px,1fr)_220px_220px_220px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              {...register("search")}
              placeholder="Tìm món ăn, đồ uống..."
              className="h-11 rounded-2xl border-[#e8e4dc] bg-[#f8f7f4] pl-10 text-sm shadow-none lg:bg-white"
            />
          </label>

          <label className="relative hidden lg:block">
            <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <select
              {...register("availabilityFilter")}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full appearance-none rounded-2xl border pr-3 pl-10 text-sm font-semibold outline-none focus:ring-3"
            >
              {AVAILABILITY_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Danh mục"
                className="border-input bg-card focus:border-ring focus:ring-ring/50 relative flex h-11 w-full items-center gap-2 rounded-2xl border px-3 pl-10 text-sm font-semibold outline-none focus:ring-3"
              >
                <Store className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <span className="flex-1 truncate text-left">
                  {categoryIdVal === "all" ? "Tất cả danh mục" : (categories.find((c) => c.id === categoryIdVal)?.name ?? "Danh mục")}
                </span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-64 w-full min-w-(--radix-popover-trigger-width) overflow-y-auto p-1"
            >
              <button
                type="button"
                onClick={() => setValue("categoryId", "all")}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                  categoryIdVal === "all" ? "bg-primary-container/10 text-primary-container" : "text-muted-foreground hover:bg-muted"
                )}
              >
                Tất cả danh mục
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setValue("categoryId", category.id)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                    categoryIdVal === category.id ? "bg-primary-container/10 text-primary-container" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Sắp xếp"
                className="border-input bg-card focus:border-ring focus:ring-ring/50 relative flex h-11 w-full items-center gap-2 rounded-2xl border px-3 pl-10 text-sm font-semibold outline-none focus:ring-3"
              >
                <ArrowUpDown className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <span className="flex-1 truncate text-left">
                  {SORT_OPTIONS.find((o) => o.value === sortValueVal)?.label ?? "Sắp xếp"}
                </span>
                <ChevronDown className="text-muted-foreground size-4 shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-64 w-full min-w-(--radix-popover-trigger-width) overflow-y-auto p-1"
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue("sortValue", option.value)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-semibold transition",
                    sortValueVal === option.value ? "bg-primary-container/10 text-primary-container" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {AVAILABILITY_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("availabilityFilter", option.value)}
              className={cn(
                "flex-none rounded-full px-4 py-2 text-xs font-bold transition",
                availabilityFilterVal === option.value
                  ? "bg-primary-container shadow-primary-container/20 text-white shadow-sm"
                  : "bg-[#f1efe9] text-stone-500"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#f8f7f4] px-3 py-2 lg:hidden">
          <label className="flex min-w-0 items-center gap-2 text-xs font-bold text-stone-600">
            <input
              type="checkbox"
              checked={
                allVisibleItems.length > 0 &&
                allVisibleItems.every((item) => selectedIds.includes(item.menuItemId))
              }
              onChange={toggleAllVisible}
              className="border-border text-primary focus:ring-primary size-4 rounded"
            />
            <span className="truncate">{selectedCount > 0 ? `${selectedCount} đã chọn` : "Chọn trang này"}</span>
          </label>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              className="h-8 px-3 text-xs"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(true)}
            >
              Còn
            </Button>
            <Button
              size="sm"
              variant="warning"
              className="h-8 px-3 text-xs"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(false)}
            >
              Hết
            </Button>
          </div>
        </div>

        <div className="border-border/60 mt-4 hidden flex-col gap-3 border-t pt-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
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
            Chọn món đang hiển thị
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(true)}
            >
              <Check className="size-4" />
              Đặt còn hàng
            </Button>
            <Button
              variant="warning"
              disabled={selectedCount === 0 || isMutating}
              onClick={() => handleBulkAvailability(false)}
            >
              <PackageX className="size-4" />
              Đặt hết hàng
            </Button>
          </div>
        </div>
      </section>

      {menuQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải menu...</span>
        </div>
      ) : null}

      {menuQuery.isError && !hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">Không tải được menu</h2>
          <p className="mt-2 text-sm">
            {getApiErrorMessage(menuQuery.error, "Vui lòng thử tải lại menu.")}
          </p>
          <Button className="mt-5" onClick={() => menuQuery.refetch()} disabled={menuQuery.isRefetching}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {!menuQuery.isLoading && !menuQuery.isError && groups.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <PackageX className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">Không tìm thấy món</h2>
          <p className="text-muted-foreground mt-2 text-sm">Thử đổi từ khóa, danh mục hoặc trạng thái món.</p>
        </div>
      ) : null}

      <section className="space-y-5">
        {groups.map((group) => (
          <div key={group.categoryId} className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <h2 className="text-sm font-black tracking-[0.16em] text-stone-500 uppercase lg:text-2xl lg:tracking-tight lg:text-stone-950 lg:normal-case">
                {group.categoryName}
              </h2>
              <span className="text-xs font-bold text-stone-400 lg:text-sm">{group.items.length} món</span>
            </div>

            <div className="grid gap-3">
              {group.items.map((item) => {
                const selected = selectedIds.includes(item.menuItemId);

                return (
                  <article
                    key={item.menuItemId}
                    className={cn(
                      "relative grid grid-cols-[82px_minmax(0,1fr)] items-start gap-3 rounded-[22px] border border-[#e8e4dc] bg-white p-3 shadow-[0_2px_14px_rgba(28,25,23,0.05)] transition active:scale-[0.99] lg:grid-cols-[auto_96px_minmax(0,1fr)_auto] lg:items-center lg:gap-4 lg:p-4",
                      selected && "border-primary-container/50 bg-primary-container/10"
                    )}
                  >
                    <div className="absolute top-4 left-4 z-10 lg:static lg:flex lg:items-center lg:justify-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(item.menuItemId)}
                        className="border-border text-primary focus:ring-primary size-4 rounded bg-white/95 shadow-sm lg:shadow-none"
                        aria-label={`Select ${item.name}`}
                      />
                    </div>

                    <div className="relative size-[82px] overflow-hidden rounded-2xl bg-[#f1efe9] lg:size-24">
                      <MenuItemImage src={item.imageUrl} alt={item.name} isAvailable={item.isAvailable} />
                    </div>

                    <div className="min-w-0 py-0.5 lg:py-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-[15px] leading-snug font-black text-stone-950 lg:text-lg">
                            {item.name}
                          </h3>
                          <p className="mt-1 truncate text-[11px] font-bold tracking-[0.16em] text-stone-400 uppercase">
                            {item.categoryName ?? group.categoryName}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[14px] font-black whitespace-nowrap text-[#ff5a00] lg:text-base">
                            {formatCurrency(item.price)}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-[11px] font-black whitespace-nowrap",
                              item.isAvailable ? "text-emerald-600" : "text-red-500"
                            )}
                          >
                            {item.isAvailable ? "Còn hàng" : "Hết hàng"}
                          </p>
                        </div>
                      </div>

                      <p className="text-muted-foreground mt-2 line-clamp-2 hidden text-sm lg:block">
                        {item.description || "Chưa có mô tả."}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 lg:hidden">
                        <div className="flex items-center gap-2">
                          <label
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full p-0.5 transition",
                              item.isAvailable ? "bg-emerald-500" : "bg-stone-300",
                              isMutating && "opacity-60"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={item.isAvailable}
                              disabled={isMutating}
                              onChange={() => handleToggleItem(item)}
                              aria-label={`Toggle availability for ${item.name}`}
                            />
                            <span
                              className={cn(
                                "size-5 rounded-full bg-white shadow-sm transition",
                                item.isAvailable && "translate-x-5"
                              )}
                            />
                          </label>
                          <span className="text-xs font-bold text-stone-500">
                            {item.isAvailable ? "Đang bán" : "Tạm hết"}
                          </span>
                        </div>

                        <Button asChild variant="soft" size="sm" className="h-8 px-3 text-xs">
                          <Link href={PATH.me.menuItem(item.menuItemId)}>
                            <Eye className="size-3.5" />
                            Chi tiết
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="hidden flex-col items-stretch justify-center gap-2 lg:flex">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-center text-xs font-semibold",
                          item.isActive
                            ? "bg-surface-container text-muted-foreground"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {item.isActive ? "Đang bán" : "Tạm ẩn"}
                      </span>
                      <Button
                        variant={item.isAvailable ? "warning" : "success"}
                        size="sm"
                        className="min-w-[132px]"
                        disabled={isMutating}
                        onClick={() => handleToggleItem(item)}
                      >
                        {item.isAvailable ? <PackageX className="size-4" /> : <Check className="size-4" />}
                        {item.isAvailable ? "Hết hàng" : "Còn hàng"}
                      </Button>
                      <Button asChild variant="outline" size="sm" className="min-w-[132px]">
                        <Link href={PATH.me.menuItem(item.menuItemId)}>
                          <Eye className="size-4" />
                          Chi tiết
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

      {!menuQuery.isLoading && !menuQuery.isError && groups.length > 0 && totalPages > 1 ? (
        <div className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
          <FooterPagination
            page={pageNumber}
            totalPages={totalPages}
            pageSize={10}
            pageSizeOptions={[10]}
            mode="numbers"
            compact
            hideWhenSinglePage
            totalItems={menuQuery.data?.totalItems ?? 0}
            itemLabel="danh mục"
            disabled={menuQuery.isFetching}
            onPageChange={setPageNumber}
            onPageSizeChange={() => setPageNumber(1)}
          />
        </div>
      ) : null}
    </PortalShell>
  );
};
