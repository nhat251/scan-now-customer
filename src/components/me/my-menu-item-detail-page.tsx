"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, DollarSign, Layers, PackageCheck } from "lucide-react";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyMenuItemQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageTableSessions,
  FALLBACK_MENU_IMAGE,
  formatCurrency,
  getActiveLabel,
  getApiErrorMessage,
  getAvailabilityLabel,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type MyMenuItemDetailPageProps = {
  menuItemId: string;
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface text-sm font-medium sm:text-right">{value || "-"}</dd>
  </div>
);

const MenuItemDetailImage = ({ src, alt }: { src?: string | null; alt: string }) => {
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
      sizes="(max-width: 1280px) 100vw, 480px"
      className="object-cover"
      onError={() => setImageSrc(FALLBACK_MENU_IMAGE)}
    />
  );
};

export const MyMenuItemDetailPage = ({ menuItemId }: MyMenuItemDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const itemQuery = useMyMenuItemQuery(menuItemId);
  const item = itemQuery.data;
  const branchId = item?.branchId;
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);

  return (
    <PortalShell
      title={item?.name ?? "Chi tiết món"}
      description="Xem chi tiết món mà không chỉnh sửa nội dung, giá hoặc danh mục."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "menu",
        branchId,
        canSeeMenu: true,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={item?.branchName ?? currentUser?.fullName ?? "Chi tiết món"}
      currentUser={currentUser}
      headerAction={
        branchId ? (
          <Button asChild variant="outline">
            <Link href={PATH.me.branchMenu(branchId)}>
              <ArrowLeft className="size-4" />
              Menu
            </Link>
          </Button>
        ) : null
      }
      stats={
        <>
          <PortalStatCard
            label="Trạng thái bán"
            value={item ? getAvailabilityLabel(item) : "-"}
            helper="Cập nhật từ danh sách menu"
          />
          <PortalStatCard label="Hoạt động" value={item ? getActiveLabel(item.isActive) : "-"} helper="Chỉ xem" />
          <PortalStatCard label="Giá" value={item ? formatCurrency(item.price) : "-"} helper="Không chỉnh giá tại đây" />
          <PortalStatCard
            label="Chuẩn bị"
            value={item ? `${item.preparationTime} phút` : "-"}
            helper={item?.categoryName ?? "Chưa có danh mục"}
          />
        </>
      }
    >
      {itemQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải chi tiết món...</span>
        </div>
      ) : null}

      {itemQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">
            {isForbiddenError(itemQuery.error)
              ? "Bạn không có quyền truy cập chi nhánh này"
              : "Không tải được chi tiết món"}
          </h2>
          <p className="mt-2 text-sm">
            {isForbiddenError(itemQuery.error)
              ? "Bạn không có quyền truy cập chi nhánh này"
              : getApiErrorMessage(itemQuery.error, "Vui lòng thử tải lại món này.")}
          </p>
          <Button className="mt-5" onClick={() => itemQuery.refetch()} disabled={itemQuery.isRefetching}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {item ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
            <div className="bg-surface-container relative aspect-[4/3] overflow-hidden rounded-lg">
              <MenuItemDetailImage src={item.imageUrl} alt={item.name} />
            </div>
          </div>

          <div className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Thông tin món</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {item.description || "Chưa có mô tả."}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="bg-surface-container-low rounded-xl p-4">
                <DollarSign className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{formatCurrency(item.price)}</p>
                <p className="text-muted-foreground text-sm">Giá hiện tại</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <Clock className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{item.preparationTime} phút</p>
                <p className="text-muted-foreground text-sm">Thời gian chuẩn bị</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <PackageCheck className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{getAvailabilityLabel(item)}</p>
                <p className="text-muted-foreground text-sm">Trạng thái bán</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4">
                <Layers className="text-primary size-5" />
                <p className="mt-3 text-2xl font-bold">{item.categoryName ?? "-"}</p>
                <p className="text-muted-foreground text-sm">Danh mục</p>
              </div>
            </div>

            <dl className="mt-6">
              <DetailRow label="Tên món" value={item.name} />
              <DetailRow label="Mô tả" value={item.description || "-"} />
              <DetailRow label="Danh mục" value={item.categoryName || "-"} />
              <DetailRow label="Giá" value={formatCurrency(item.price)} />
              <DetailRow label="Thời gian chuẩn bị" value={`${item.preparationTime} phút`} />
              <DetailRow label="Trạng thái bán" value={getAvailabilityLabel(item)} />
              <DetailRow label="Trạng thái hoạt động" value={getActiveLabel(item.isActive)} />
            </dl>
          </div>
        </section>
      ) : null}
    </PortalShell>
  );
};
