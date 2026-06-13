"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  DoorOpen,
  Eye,
  Search,
  SlidersHorizontal,
  Table2,
  XCircle,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useCloseMyTableSessionMutation, useOpenMyTableSessionMutation } from "@/hooks/mutations/useMyTableMutations";
import { useMyBranchDetailQuery, useMyBranchTablesQuery } from "@/hooks/queries/useMeQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { MyTableResponse, MyTablesQuery, MyTableStatus, OpenTableSessionResponse } from "@/types/me";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
  canManageMenuAvailability,
  canManageTableSessions,
  formatDateTime,
  getActiveLabel,
  getApiErrorMessage,
  getMyPortalNavItems,
  getTableStatusLabel,
  getTableStatusTone,
  isForbiddenError,
  normalizeTableStatus,
} from "./helpers";
import { MeRoleShell as PortalShell } from "./me-role-shell";

type MyBranchTablesPageProps = {
  branchId: string;
};

type StatusFilter = "all" | MyTableStatus;
type ActiveFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Trống", value: "AVAILABLE" },
  { label: "Có khách", value: "OCCUPIED" },
  { label: "Đã đặt", value: "RESERVED" },
  { label: "Ngưng dùng", value: "DISABLED" },
];

const SORT_OPTIONS = [
  { label: "Số bàn", value: "tableNumber:asc" },
  { label: "Sức chứa tăng dần", value: "capacity:asc" },
  { label: "Sức chứa giảm dần", value: "capacity:desc" },
  { label: "Mới cập nhật", value: "updatedAt:desc" },
] as const;

const getActiveQueryValue = (filter: ActiveFilter) => {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return undefined;
};

const canOpenTable = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "AVAILABLE" && !table.currentSession && table.isActive;

const canCloseTableSession = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "OCCUPIED" && Boolean(table.currentSession?.isActive);

export const MyBranchTablesPage = ({ branchId }: MyBranchTablesPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const [pageNumber, setPageNumber] = useState(1);
  const [openedSession, setOpenedSession] = useState<OpenTableSessionResponse | null>(null);

  const { register, control } = useForm({
    defaultValues: {
      search: "",
      statusFilter: "all" as StatusFilter,
      activeFilter: "all" as ActiveFilter,
      sortValue: "tableNumber:asc" as (typeof SORT_OPTIONS)[number]["value"],
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const statusFilterVal = useWatch({ control, name: "statusFilter" });
  const activeFilterVal = useWatch({ control, name: "activeFilter" });
  const sortValueVal = useWatch({ control, name: "sortValue" });

  const search = useDebounce(searchVal.trim(), 250);

  const branchQuery = useMyBranchDetailQuery(branchId, canSeeTables);
  const [sortBy, sortDirection] = sortValueVal.split(":") as [string, "asc" | "desc"];
  const tableQueryParams = useMemo<MyTablesQuery>(
    () => ({
      pageNumber,
      pageSize: 10,
      search: search || undefined,
      status: statusFilterVal === "all" ? undefined : statusFilterVal,
      isActive: getActiveQueryValue(activeFilterVal),
      sortBy,
      sortDirection,
    }),
    [activeFilterVal, pageNumber, search, sortBy, sortDirection, statusFilterVal]
  );
  const tablesQuery = useMyBranchTablesQuery(branchId, tableQueryParams, canSeeTables);
  const openMutation = useOpenMyTableSessionMutation();
  const closeMutation = useCloseMyTableSessionMutation();

  const tables = useMemo(() => tablesQuery.data?.items ?? [], [tablesQuery.data?.items]);
  const totalPages = Math.max(tablesQuery.data?.totalPages ?? 1, 1);
  const availableCount = tables.filter((table) => normalizeTableStatus(table.status) === "AVAILABLE").length;
  const occupiedCount = tables.filter((table) => normalizeTableStatus(table.status) === "OCCUPIED").length;
  const activeCount = tables.filter((table) => table.isActive).length;
  const hasForbiddenError = isForbiddenError(tablesQuery.error) || isForbiddenError(branchQuery.error);

  useEffect(() => {
    setPageNumber(1);
  }, [activeFilterVal, search, sortValueVal, statusFilterVal]);

  const handleOpenTable = async (table: MyTableResponse) => {
    const response = await openMutation.mutateAsync({
      branchId: table.branchId,
      tableId: table.tableId,
    });

    setOpenedSession(response.result);
    await tablesQuery.refetch();
  };

  const handleCloseSession = async (table: MyTableResponse) => {
    if (!table.currentSession?.sessionId) {
      return;
    }

    await closeMutation.mutateAsync(table.currentSession.sessionId);
    await tablesQuery.refetch();
  };

  const handleCopyCode = async (sessionCode: string) => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      showNotify({ type: "success", message: "Đã sao chép mã phiên." });
    } catch {
      showNotify({ type: "error", message: "Không thể sao chép mã phiên." });
    }
  };

  const isMutating = openMutation.isPending || closeMutation.isPending;

  return (
    <PortalShell
      title="Sơ đồ bàn"
      description="Mở phiên bàn, đưa mã phiên cho khách và đóng phiên khi cần."
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
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Sơ đồ bàn"}
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
          <PortalStatCard label="Đang hiển thị" value={String(tables.length)} helper="Bàn trong kết quả hiện tại" />
          <PortalStatCard label="Bàn trống" value={String(availableCount)} helper="Sẵn sàng mở bàn" />
          <PortalStatCard label="Có khách" value={String(occupiedCount)} helper="Đang có phiên phục vụ" />
          <PortalStatCard label="Hoạt động" value={String(activeCount)} helper="Bàn đang dùng" />
        </>
      }
    >
      {openedSession ? (
        <section className="border-success/50 bg-success text-success-foreground rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Mở bàn thành công</h2>
              <p className="mt-1 text-sm">
                Mã phiên: <span className="font-black tracking-[0.2em]">{openedSession.sessionCode}</span>
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

      {hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Bạn không có quyền truy cập chi nhánh hoặc bàn này</h2>
          <p className="mt-2 text-sm">Vui lòng chọn chi nhánh được gán cho tài khoản nhân viên.</p>
        </div>
      ) : null}

      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_220px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              {...register("search")}
              placeholder="Tìm số bàn"
              className="h-11 pl-10"
            />
          </label>

          <label className="relative">
            <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <select
              {...register("statusFilter")}
              className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full appearance-none rounded-md border pr-3 pl-10 text-sm font-semibold outline-none focus:ring-3"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <select
            {...register("activeFilter")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            <option value="all">Tất cả trạng thái hoạt động</option>
            <option value="active">Chỉ đang hoạt động</option>
            <option value="inactive">Chỉ tạm ẩn</option>
          </select>

          <select
            {...register("sortValue")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {tablesQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải danh sách bàn...</span>
        </div>
      ) : null}

      {tablesQuery.isError && !hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">Không tải được danh sách bàn</h2>
          <p className="mt-2 text-sm">
            {getApiErrorMessage(tablesQuery.error, "Vui lòng thử tải lại danh sách bàn.")}
          </p>
          <Button className="mt-5" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isRefetching}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {!tablesQuery.isLoading && !tablesQuery.isError && tables.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <Table2 className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">Không tìm thấy bàn</h2>
          <p className="text-muted-foreground mt-2 text-sm">Thử đổi từ khóa, trạng thái hoặc bộ lọc hoạt động.</p>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <article key={table.tableId} className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Table2 className="size-5" />
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getTableStatusTone(table.status))}>
                {getTableStatusLabel(table.status)}
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-bold">Bàn {table.tableNumber}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Sức chứa</dt>
                <dd className="font-medium">{table.capacity} chỗ</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Hoạt động</dt>
                <dd className="font-medium">{getActiveLabel(table.isActive)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Chi nhánh</dt>
                <dd className="max-w-40 truncate font-medium">{table.branchName}</dd>
              </div>
              <div className="border-border/60 border-t pt-3">
                <dt className="text-muted-foreground font-semibold">Phiên hiện tại</dt>
                <dd className="mt-1 font-medium">
                  {table.currentSession ? (
                    <div className="space-y-1">
                      <p className="text-primary font-black tracking-[0.18em]">{table.currentSession.sessionCode}</p>
                      <p className="text-muted-foreground flex gap-2 text-xs">
                        <Clock className="size-3.5" />
                        Hết hạn {formatDateTime(table.currentSession.expiresAt)}
                      </p>
                    </div>
                  ) : (
                    "Không có"
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={PATH.me.table(table.tableId)}>
                  <Eye className="size-4" />
                  Chi tiết
                </Link>
              </Button>
              {canOpenTable(table) ? (
                <Button disabled={isMutating} onClick={() => handleOpenTable(table)}>
                  <DoorOpen className="size-4" />
                  {openMutation.isPending ? "Đang mở..." : "Mở bàn"}
                </Button>
              ) : null}
              {canCloseTableSession(table) ? (
                <Button variant="destructive" disabled={isMutating} onClick={() => handleCloseSession(table)}>
                  <XCircle className="size-4" />
                  {closeMutation.isPending ? "Đang đóng..." : "Đóng phiên"}
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {!tablesQuery.isLoading && !tablesQuery.isError && tables.length > 0 && totalPages > 1 ? (
        <div className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
          <FooterPagination
            page={pageNumber}
            totalPages={totalPages}
            pageSize={10}
            pageSizeOptions={[10]}
            mode="numbers"
            compact
            hideWhenSinglePage
            totalItems={tablesQuery.data?.totalItems ?? 0}
            itemLabel="bàn"
            disabled={tablesQuery.isFetching}
            onPageChange={setPageNumber}
            onPageSizeChange={() => setPageNumber(1)}
          />
        </div>
      ) : null}
    </PortalShell>
  );
};
