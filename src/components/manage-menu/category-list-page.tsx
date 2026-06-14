"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Edit, Plus, Power, PowerOff, RefreshCw, Search } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import {
  useReorderManageCategoriesMutation,
  useSetManageCategoryActiveMutation,
} from "@/hooks/mutations/useManageMenuMutations";
import { useManageCategoriesQuery } from "@/hooks/queries/useManageMenuQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserStore } from "@/stores/user";
import type { ManageCategoryQuery } from "@/types/manage-menu";

import {
  FALLBACK_MENU_IMAGE,
  formatDateTime,
  getCategoryCreatePath,
  getCategoryDetailPath,
  getManageApiErrorMessage,
  getManageMenuNavItems,
  getPortalCopy,
  getStatusLabel,
  isForbiddenError,
  MANAGE_MENU_PAGE_SIZE_OPTIONS,
  type ManagePortal,
  type StatusFilter,
  statusFilterToQuery,
} from "./helpers";

const CATEGORY_SORT_OPTIONS = [
  { label: "Thứ tự hiển thị", sortBy: "displayOrder", sortDirection: "asc" },
  { label: "Thứ tự hiển thị giảm dần", sortBy: "displayOrder", sortDirection: "desc" },
  { label: "Tên A-Z", sortBy: "name", sortDirection: "asc" },
  { label: "Tên Z-A", sortBy: "name", sortDirection: "desc" },
  { label: "Mới nhất", sortBy: "createdAt", sortDirection: "desc" },
  { label: "Cũ nhất", sortBy: "createdAt", sortDirection: "asc" },
  { label: "Mới cập nhật", sortBy: "updatedAt", sortDirection: "desc" },
] as const;

type CategoryListPageProps = {
  branchId: string;
  portal: ManagePortal;
};

export const CategoryListPage = ({ branchId, portal }: CategoryListPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { register, control } = useForm({
    defaultValues: {
      search: "",
      status: "all" as StatusFilter,
      sortValue: "displayOrder:asc",
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const statusVal = useWatch({ control, name: "status" });
  const sortValueVal = useWatch({ control, name: "sortValue" });

  const search = useDebounce(searchVal.trim(), 250);

  useEffect(() => {
    setPageNumber(1);
  }, [search, statusVal, sortValueVal]);

  const [sortBy, sortDirection] = sortValueVal.split(":") as [string, "asc" | "desc"];
  const query = useMemo<ManageCategoryQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      isActive: statusFilterToQuery(statusVal),
      sortBy,
      sortDirection,
    }),
    [pageNumber, pageSize, search, sortBy, sortDirection, statusVal]
  );
  const categoriesQuery = useManageCategoriesQuery(branchId, query);
  const activeMutation = useSetManageCategoryActiveMutation();
  const reorderMutation = useReorderManageCategoriesMutation();
  const categories = categoriesQuery.data?.items ?? [];
  const totalPages = categoriesQuery.data?.totalPages ?? 1;
  const totalItems = categoriesQuery.data?.totalItems ?? 0;
  const activeCount = categories.filter((category) => category.isActive).length;

  const reorder = async (categoryId: string, direction: "up" | "down") => {
    const index = categories.findIndex((category) => category.categoryId === categoryId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= categories.length) {
      return;
    }

    const next = [...categories];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    await reorderMutation.mutateAsync({
      branchId,
      data: {
        items: next.map((category, itemIndex) => ({
          id: category.categoryId,
          displayOrder: itemIndex + 1,
        })),
      },
    });
  };

  return (
    <PortalShell
      title="Danh mục"
      description="Tạo, cập nhật, bật, tắt và sắp xếp danh mục của chi nhánh."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "categories", branchId)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button onClick={() => router.push(getCategoryCreatePath(portal, branchId))}>
          <Plus className="size-4" />
          Tạo danh mục
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Tổng cộng"
            value={String(totalItems)}
            helper="Số danh mục từ hệ thống"
          />
          <PortalStatCard
            label="Đang hoạt động"
            value={String(activeCount)}
            helper="Danh mục đang hoạt động trên trang"
          />
          <PortalStatCard
            label="Chi nhánh"
            value="Theo phạm vi"
            helper="Hệ thống kiểm tra quyền sở hữu chi nhánh"
          />
          <PortalStatCard
            label="Sắp xếp"
            value="Đã bật"
            helper="Dùng nút mũi tên để sắp xếp trang hiện tại"
          />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_240px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input {...register("search")} placeholder="Tìm danh mục" className="h-11 pl-10" />
          </label>
          <select
            {...register("status")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
          <select
            {...register("sortValue")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            {CATEGORY_SORT_OPTIONS.map((option) => (
              <option
                key={`${option.sortBy}:${option.sortDirection}`}
                value={`${option.sortBy}:${option.sortDirection}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {categoriesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(categoriesQuery.error)
            ? "Bạn không có quyền truy cập chi nhánh này"
            : getManageApiErrorMessage(categoriesQuery.error, "Không thể tải danh sách danh mục.")}
          <Button
            className="mt-4"
            onClick={() => categoriesQuery.refetch()}
            disabled={categoriesQuery.isRefetching}
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border/60 min-w-[1120px] divide-y text-left">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Hình ảnh</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Tên danh mục</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Mô tả</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">
                  Thứ tự hiển thị
                </th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Trạng thái</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Ngày tạo</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Ngày cập nhật</th>
                <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {categoriesQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    Đang tải danh mục...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    Không tìm thấy danh mục.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.categoryId} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="bg-surface-container relative size-16 overflow-hidden rounded-lg">
                        <Image
                          src={category.imageUrl || FALLBACK_MENU_IMAGE}
                          alt={category.name}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{category.name}</p>
                    </td>
                    <td className="text-muted-foreground max-w-xs px-6 py-4 text-sm">
                      <p className="line-clamp-2">{category.description || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{category.displayOrder}</td>
                    <td className="px-6 py-4">
                      <Tag
                        tagString={getStatusLabel(category.isActive)}
                        variant={category.isActive ? "success" : "warning"}
                      />
                    </td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {formatDateTime(category.createdAt)}
                    </td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {formatDateTime(category.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() => reorder(category.categoryId, "up")}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={index === categories.length - 1}
                          onClick={() => reorder(category.categoryId, "down")}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              getCategoryDetailPath(portal, branchId, category.categoryId)
                            )
                          }
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant={category.isActive ? "destructive" : "success"}
                          onClick={() =>
                            activeMutation.mutateAsync({
                              branchId,
                              categoryId: category.categoryId,
                              isActive: !category.isActive,
                            })
                          }
                        >
                          {category.isActive ? (
                            <PowerOff className="size-4" />
                          ) : (
                            <Power className="size-4" />
                          )}
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
          disabled={categoriesQuery.isLoading}
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
