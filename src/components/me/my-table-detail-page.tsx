"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DoorOpen,
  Hash,
  ReceiptText,
  Table2,
  XCircle,
} from "lucide-react";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import {
  getOrderItemStatusLabel,
  getOrderStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/helpers/presentation";
import {
  useCloseMyTableSessionMutation,
  useOpenMyTableSessionMutation,
} from "@/hooks/mutations/useMyTableMutations";
import { useMyTableActiveOrdersQuery, useMyTableQuery } from "@/hooks/queries/useMeQueries";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { MyTableResponse, OpenTableSessionResponse } from "@/types/me";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatCurrency,
  formatDateTime,
  getActiveLabel,
  getApiErrorMessage,
  getMyPortalNavItems,
  getTableStatusLabel,
  getTableStatusTone,
  isForbiddenError,
  normalizeTableStatus,
} from "./helpers";
import { MeInfoRow } from "./me-info-row";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type MyTableDetailPageProps = {
  tableId: string;
};

const canOpenTable = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "AVAILABLE" && !table.currentSession && table.isActive;

const canCloseTableSession = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "OCCUPIED" && Boolean(table.currentSession?.isActive);

export const MyTableDetailPage = ({ tableId }: MyTableDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const tableQuery = useMyTableQuery(tableId, canSeeTables);
  const activeOrdersQuery = useMyTableActiveOrdersQuery(tableId, canSeeTables);
  const openMutation = useOpenMyTableSessionMutation();
  const closeMutation = useCloseMyTableSessionMutation();
  const [openedSession, setOpenedSession] = useState<OpenTableSessionResponse | null>(null);
  const table = tableQuery.data;
  const branchId = table?.branchId;
  const hasForbiddenError = isForbiddenError(tableQuery.error);

  const handleOpenTable = async () => {
    if (!table) {
      return;
    }

    const response = await openMutation.mutateAsync({
      branchId: table.branchId,
      tableId: table.tableId,
    });

    setOpenedSession(response.result);
    await tableQuery.refetch();
  };

  const handleCloseSession = async () => {
    if (!table?.currentSession?.sessionId) {
      return;
    }

    await closeMutation.mutateAsync(table.currentSession.sessionId);
    setOpenedSession(null);
    await tableQuery.refetch();
  };

  const handleCopyCode = async (sessionCode: string) => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      showNotify({ type: "success", message: "Đã sao chép mã phiên." });
    } catch {
      showNotify({ type: "error", message: "Không thể sao chép mã phiên." });
    }
  };

  return (
    <PortalShell
      title={table ? `Bàn ${table.tableNumber}` : "Chi tiết bàn"}
      description="Xem thông tin bàn, mở phiên khách hoặc đóng phiên đang hoạt động."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      branchId={branchId}
      navItems={getMyPortalNavItems({
        active: "tables",
        branchId,
        canSeeMenu,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={table?.branchName ?? currentUser?.fullName ?? "Chi tiết bàn"}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={branchId ? PATH.me.branchTables(branchId) : PATH.me.branches}>
            <ArrowLeft className="size-4" />
            {branchId ? "Sơ đồ bàn" : "Chi nhánh của tôi"}
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Trạng thái"
            value={getTableStatusLabel(table?.status)}
            helper="Trạng thái bàn hiện tại"
          />
          <PortalStatCard
            label="Sức chứa"
            value={table ? String(table.capacity) : "-"}
            helper="Số chỗ đã cấu hình"
          />
          <PortalStatCard
            label="Hoạt động"
            value={table ? getActiveLabel(table.isActive) : "-"}
            helper="Cờ vận hành"
          />
          <PortalStatCard
            label="Phiên"
            value={table?.currentSession?.sessionCode ?? "Không có"}
            helper={table?.currentSession ? "Mã phiên hiện tại" : "Chưa có phiên hiện tại"}
          />
        </>
      }
    >
      {openedSession ? (
        <section className="border-success/50 bg-success text-success-foreground rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                <h2 className="text-lg font-bold">
                  {table ? `Bàn ${table.tableNumber} đã mở thành công` : "Mở bàn thành công"}
                </h2>
              </div>
              <p className="mt-2 text-sm">
                Mã phiên:{" "}
                <span className="font-black tracking-[0.2em]">{openedSession.sessionCode}</span>
              </p>
              <p className="mt-1 text-sm">Đưa mã này cho khách để gọi món.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleCopyCode(openedSession.sessionCode)}>
                Sao chép mã
              </Button>
              <Button variant="success" onClick={() => setOpenedSession(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {tableQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải chi tiết bàn...</span>
        </div>
      ) : null}

      {tableQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">
            {hasForbiddenError
              ? "Bạn không có quyền truy cập chi nhánh hoặc bàn này"
              : "Không tải được bàn"}
          </h2>
          <p className="mt-2 text-sm">
            {hasForbiddenError
              ? "Vui lòng chọn chi nhánh được gán cho tài khoản nhân viên."
              : getApiErrorMessage(tableQuery.error, "Không tìm thấy bàn hoặc phiên.")}
          </p>
          <Button
            className="mt-5"
            onClick={() => tableQuery.refetch()}
            disabled={tableQuery.isRefetching}
          >
            Thử lại
          </Button>
        </div>
      ) : null}

      {table ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
                  <Table2 className="size-6" />
                </div>
                <h2 className="mt-5 text-2xl font-bold">Bàn {table.tableNumber}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{table.branchName}</p>
              </div>
              <span
                className={cn(
                  "w-fit rounded-full px-3 py-1 text-xs font-semibold",
                  getTableStatusTone(table.status)
                )}
              >
                {getTableStatusLabel(table.status)}
              </span>
            </div>

            <dl className="mt-6">
              <MeInfoRow label="Số bàn" value={table.tableNumber} />
              <MeInfoRow label="Sức chứa" value={`${table.capacity} chỗ`} />
              <MeInfoRow label="Trạng thái" value={getTableStatusLabel(table.status)} />
              <MeInfoRow label="Hoạt động" value={getActiveLabel(table.isActive)} />
              <MeInfoRow label="Chi nhánh" value={table.branchName} />
              <MeInfoRow label="Ngày tạo" value={formatDateTime(table.createdAt)} />
              <MeInfoRow label="Cập nhật lúc" value={formatDateTime(table.updatedAt)} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {canOpenTable(table) ? (
                <Button disabled={openMutation.isPending} onClick={handleOpenTable}>
                  <DoorOpen className="size-4" />
                  {openMutation.isPending ? "Đang mở bàn..." : "Mở bàn"}
                </Button>
              ) : null}
              {canCloseTableSession(table) ? (
                <Button
                  variant="destructive"
                  disabled={closeMutation.isPending}
                  onClick={handleCloseSession}
                >
                  <XCircle className="size-4" />
                  {closeMutation.isPending ? "Đang đóng phiên..." : "Đóng phiên thủ công"}
                </Button>
              ) : null}
            </div>
          </div>

          <aside className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Phiên hiện tại</h2>
            {table.currentSession ? (
              <dl className="mt-4">
                <MeInfoRow label="Mã phiên hệ thống" value={table.currentSession.sessionId} />
                <MeInfoRow
                  label="Mã phiên"
                  value={
                    <span className="text-primary inline-flex items-center gap-2 font-black tracking-[0.18em]">
                      <Hash className="size-4" />
                      {table.currentSession.sessionCode}
                    </span>
                  }
                />
                <MeInfoRow
                  label="Mở lúc"
                  value={formatDateTime(
                    table.currentSession.openedAt ?? table.currentSession.createdAt
                  )}
                />
                <MeInfoRow
                  label="Hết hạn lúc"
                  value={formatDateTime(table.currentSession.expiresAt)}
                />
                <MeInfoRow
                  label="Hoạt động"
                  value={getActiveLabel(table.currentSession.isActive)}
                />
              </dl>
            ) : (
              <div className="bg-surface-container-low mt-5 rounded-xl p-5">
                <Clock className="text-muted-foreground size-8" />
                <h3 className="mt-3 font-bold">Chưa có phiên hiện tại</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Mở bàn khi khách đã ngồi và sẵn sàng nhận mã phiên.
                </p>
              </div>
            )}
          </aside>
        </section>
      ) : null}

      {table ? (
        <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ReceiptText className="text-primary size-5" />
                Đơn hiện tại & hóa đơn
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Nhân viên chỉ xem các đơn thuộc phiên đang hoạt động của bàn.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => activeOrdersQuery.refetch()}
              disabled={activeOrdersQuery.isFetching}
            >
              Tải lại
            </Button>
          </div>

          {activeOrdersQuery.isLoading ? (
            <div className="mt-5 flex items-center gap-3">
              <Spinner className="text-primary size-5" />
              <span className="text-sm font-medium">Đang tải đơn hiện tại...</span>
            </div>
          ) : null}

          {activeOrdersQuery.isError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive mt-5 rounded-xl border p-4 text-sm">
              {getApiErrorMessage(activeOrdersQuery.error, "Không tải được đơn hiện tại của bàn.")}
            </div>
          ) : null}

          {!activeOrdersQuery.isLoading &&
          !activeOrdersQuery.isError &&
          (activeOrdersQuery.data?.length ?? 0) === 0 ? (
            <div className="bg-surface-container-low mt-5 rounded-xl p-5 text-sm">
              <h3 className="font-bold">Bàn này chưa có đơn đang hoạt động</h3>
              <p className="text-muted-foreground mt-1">
                Đơn sẽ xuất hiện ở đây khi phiên bàn còn mở.
              </p>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {(activeOrdersQuery.data ?? []).map((order) => (
              <article key={order.orderId} className="border-border/60 rounded-xl border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <h3 className="mt-1 text-base font-bold">{order.orderNumber}</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Phiên {order.sessionCode ?? "-"} - {getOrderStatusLabel(order.status)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-primary text-lg font-black">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {order.paymentStatus
                        ? `${getPaymentMethodLabel(order.paymentMethod)} - ${getPaymentStatusLabel(order.paymentStatus)}`
                        : "Chưa thanh toán"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="flex justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {item.menuItemName} x{item.quantity}
                        </p>
                        {item.note ? (
                          <p className="text-muted-foreground mt-1 text-xs">Ghi chú: {item.note}</p>
                        ) : null}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {getOrderItemStatusLabel(item.status)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">{formatCurrency(item.subTotal)}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PortalShell>
  );
};
