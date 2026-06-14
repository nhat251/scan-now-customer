"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChefHat,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  Phone,
  Soup,
  Table2,
  Tags,
} from "lucide-react";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatFixedAmount,
  formatPercent,
  formatTime,
  getApiErrorMessage,
  getBranchStatusLabel,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";
import { MeInfoRow } from "./me-info-row";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type MyBranchDetailPageProps = {
  branchId: string;
};

export const MyBranchDetailPage = ({ branchId }: MyBranchDetailPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const canManageBranchMenu = currentUser?.role?.toUpperCase() === "BRANCH_MANAGER";
  const branchQuery = useMyBranchDetailQuery(branchId);
  const branch = branchQuery.data;

  const errorTitle = isForbiddenError(branchQuery.error)
    ? "Bạn không có quyền truy cập chi nhánh này"
    : "Không tải được chi nhánh";

  return (
    <PortalShell
      title={branch?.name ?? "Chi tiết chi nhánh"}
      description="Thông tin chi nhánh và nhà hàng được gán cho tài khoản của bạn."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "branch-detail",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branch?.name ?? currentUser?.fullName ?? "Cổng chi nhánh"}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={PATH.me.branches}>
              <ArrowLeft className="size-4" />
              Chi nhánh của tôi
            </Link>
          </Button>
          {canSeeMenu ? (
            <Button asChild>
              <Link href={PATH.me.branchMenu(branchId)}>
                <Soup className="size-4" />
                Thực đơn
              </Link>
            </Button>
          ) : null}
          {canSeeTables ? (
            <Button asChild>
              <Link href={PATH.me.branchTables(branchId)}>
                <Table2 className="size-4" />
                Sơ đồ bàn
              </Link>
            </Button>
          ) : null}
          {canSeeOrders ? (
            <Button asChild>
              <Link href={PATH.me.branchOrders(branchId)}>
                <ClipboardList className="size-4" />
                Đơn hàng
              </Link>
            </Button>
          ) : null}
          {canSeeKitchen ? (
            <Button asChild>
              <Link href={PATH.me.branchKitchen(branchId)}>
                <ChefHat className="size-4" />
                Bếp
              </Link>
            </Button>
          ) : null}
          {canManageBranchMenu ? (
            <>
              <Button asChild variant="outline">
                <Link href={PATH.manager.branchCategories(branchId)}>
                  <Tags className="size-4" />
                  Quản lý danh mục
                </Link>
              </Button>
              <Button asChild>
                <Link href={PATH.manager.branchMenuItems(branchId)}>
                  <Soup className="size-4" />
                  Quản lý menu
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={PATH.manager.branchTables(branchId)}>
                  <Table2 className="size-4" />
                  Bàn & QR
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      }
      stats={
        <>
          <PortalStatCard
            label="Trạng thái"
            value={getBranchStatusLabel(branch)}
            helper="Trạng thái chi nhánh"
          />
          <PortalStatCard
            label="Mã nhà hàng"
            value={branch?.restaurantId ?? "-"}
            helper="Nhà hàng liên kết"
          />
          <PortalStatCard
            label="Quản lý"
            value={branch?.managerName ?? "-"}
            helper="Quản lý chi nhánh"
          />
          <PortalStatCard
            label="Giờ mở cửa"
            value={formatTime(branch?.openTime)}
            helper={`Đóng cửa ${formatTime(branch?.closeTime)}`}
          />
        </>
      }
    >
      {branchQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải thông tin chi nhánh...</span>
        </div>
      ) : null}

      {branchQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">{errorTitle}</h2>
          <p className="mt-2 text-sm">
            {isForbiddenError(branchQuery.error)
              ? "Bạn không có quyền truy cập chi nhánh này"
              : getApiErrorMessage(branchQuery.error, "Vui lòng thử tải lại chi nhánh.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => branchQuery.refetch()} disabled={branchQuery.isRefetching}>
              Thử lại
            </Button>
            <Button variant="outline" onClick={() => router.push(PATH.me.branches)}>
              Quay lại chi nhánh
            </Button>
          </div>
        </div>
      ) : null}

      {branch ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Thông tin chi nhánh</h2>
            <dl className="mt-4">
              <MeInfoRow label="Tên chi nhánh" value={branch.name} />
              <MeInfoRow label="Mã nhà hàng" value={branch.restaurantId} />
              <MeInfoRow label="Quản lý" value={branch.managerName || "-"} />
              <MeInfoRow label="Địa chỉ" value={branch.address || "-"} />
              <MeInfoRow label="Số điện thoại" value={branch.phone || "-"} />
              <MeInfoRow label="Email" value={branch.email || "-"} />
              <MeInfoRow label="Giờ mở cửa" value={formatTime(branch.openTime)} />
              <MeInfoRow label="Giờ đóng cửa" value={formatTime(branch.closeTime)} />
              <MeInfoRow label="VAT" value={formatPercent(branch.vatPercent)} />
              <MeInfoRow
                label="Phí dịch vụ (%)"
                value={formatPercent(branch.serviceChargePercent)}
              />
              <MeInfoRow
                label="Phí dịch vụ cố định"
                value={formatFixedAmount(branch.serviceChargeFixed)}
              />
              <MeInfoRow label="Trạng thái" value={getBranchStatusLabel(branch)} />
              <MeInfoRow label="Quyền" value="Chỉ xem" />
            </dl>
          </div>

          <aside className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Thông tin liên hệ</h2>
            <div className="mt-5 space-y-4 text-sm">
              <p className="text-muted-foreground flex gap-3">
                <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.address || "Chưa có địa chỉ"}</span>
              </p>
              <p className="text-muted-foreground flex gap-3">
                <Phone className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.phone || "Chưa có số điện thoại"}</span>
              </p>
              <p className="text-muted-foreground flex gap-3">
                <Mail className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.email || "Chưa có email"}</span>
              </p>
              <p className="text-muted-foreground flex gap-3">
                <Clock className="text-primary mt-0.5 size-4 shrink-0" />
                <span>
                  {formatTime(branch.openTime)} - {formatTime(branch.closeTime)}
                </span>
              </p>
            </div>
          </aside>
        </section>
      ) : null}
    </PortalShell>
  );
};
