"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Eye,
  Search,
  SlidersHorizontal,
  Table2,
  XCircle,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
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

type MyBranchTablesPageProps = {
  branchId: string;
};

type StatusFilter = "all" | MyTableStatus;
type ActiveFilter = "all" | "active" | "inactive";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Disabled", value: "DISABLED" },
];

const SORT_OPTIONS = [
  { label: "Table number", value: "tableNumber:asc" },
  { label: "Capacity low to high", value: "capacity:asc" },
  { label: "Capacity high to low", value: "capacity:desc" },
  { label: "Newest updated", value: "updatedAt:desc" },
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
  const canSeeTables = canManageTableSessions(currentUser?.role);
  const canSeeOrders = canHandleWaiterOrders(currentUser?.role);
  const canSeeKitchen = canHandleKitchenOrders(currentUser?.role);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 250);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sortValue, setSortValue] = useState<(typeof SORT_OPTIONS)[number]["value"]>("tableNumber:asc");
  const [pageNumber, setPageNumber] = useState(1);
  const [openedSession, setOpenedSession] = useState<OpenTableSessionResponse | null>(null);

  const branchQuery = useMyBranchDetailQuery(branchId, canSeeTables);
  const [sortBy, sortDirection] = sortValue.split(":") as [string, "asc" | "desc"];
  const tableQueryParams = useMemo<MyTablesQuery>(
    () => ({
      pageNumber,
      pageSize: 12,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      isActive: getActiveQueryValue(activeFilter),
      sortBy,
      sortDirection,
    }),
    [activeFilter, pageNumber, search, sortBy, sortDirection, statusFilter]
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
  }, [activeFilter, search, sortValue, statusFilter]);

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
      showNotify({ type: "success", message: "Session code copied." });
    } catch {
      showNotify({ type: "error", message: "Unable to copy session code." });
    }
  };

  const isMutating = openMutation.isPending || closeMutation.isPending;

  return (
    <PortalShell
      title="Table Sessions"
      description="Open table sessions, give session codes to customers, and manually close sessions when needed."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      navItems={getMyPortalNavItems({
        active: "tables",
        branchId,
        canSeeMenu: false,
        canSeeTables,
        canSeeOrders,
        canSeeKitchen,
      })}
      topbarTitle={branchQuery.data?.name ?? currentUser?.fullName ?? "Table Sessions"}
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
          <PortalStatCard label="Visible Tables" value={String(tables.length)} helper="Tables in current result" />
          <PortalStatCard label="Available" value={String(availableCount)} helper="Ready to open" />
          <PortalStatCard label="Occupied" value={String(occupiedCount)} helper="Active dining sessions" />
          <PortalStatCard label="Active" value={String(activeCount)} helper="Operational tables" />
        </>
      }
    >
      {openedSession ? (
        <section className="border-success/50 bg-success text-success-foreground rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Table opened successfully</h2>
              <p className="mt-1 text-sm">
                Session Code: <span className="font-black tracking-[0.2em]">{openedSession.sessionCode}</span>
              </p>
              <p className="mt-1 text-sm">Give this code to the customer.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleCopyCode(openedSession.sessionCode)}>
                Copy Code
              </Button>
              <Button variant="success" onClick={() => setOpenedSession(null)}>
                Close
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">You do not have permission to access this branch/table</h2>
          <p className="mt-2 text-sm">Please select a branch assigned to your staff account.</p>
        </div>
      ) : null}

      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_220px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search table number"
              className="h-11 pl-10"
            />
          </label>

          <label className="relative">
            <SlidersHorizontal className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
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
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 w-full rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            <option value="all">All active states</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
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
      </section>

      {tablesQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading branch tables...</span>
        </div>
      ) : null}

      {tablesQuery.isError && !hasForbiddenError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">Unable to load tables</h2>
          <p className="mt-2 text-sm">
            {getApiErrorMessage(tablesQuery.error, "Please try refreshing this table list.")}
          </p>
          <Button className="mt-5" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isRefetching}>
            Retry
          </Button>
        </div>
      ) : null}

      {!tablesQuery.isLoading && !tablesQuery.isError && tables.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <Table2 className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">No tables found</h2>
          <p className="text-muted-foreground mt-2 text-sm">Try another search, status, or active filter.</p>
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

            <h2 className="mt-5 text-2xl font-bold">Table {table.tableNumber}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Capacity</dt>
                <dd className="font-medium">{table.capacity} seats</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Is Active</dt>
                <dd className="font-medium">{getActiveLabel(table.isActive)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground font-semibold">Branch</dt>
                <dd className="max-w-40 truncate font-medium">{table.branchName}</dd>
              </div>
              <div className="border-border/60 border-t pt-3">
                <dt className="text-muted-foreground font-semibold">Current Session</dt>
                <dd className="mt-1 font-medium">
                  {table.currentSession ? (
                    <div className="space-y-1">
                      <p className="text-primary font-black tracking-[0.18em]">{table.currentSession.sessionCode}</p>
                      <p className="text-muted-foreground flex gap-2 text-xs">
                        <Clock className="size-3.5" />
                        Expires {formatDateTime(table.currentSession.expiresAt)}
                      </p>
                    </div>
                  ) : (
                    "None"
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={PATH.me.table(table.tableId)}>
                  <Eye className="size-4" />
                  View Detail
                </Link>
              </Button>
              {canOpenTable(table) ? (
                <Button disabled={isMutating} onClick={() => handleOpenTable(table)}>
                  <DoorOpen className="size-4" />
                  {openMutation.isPending ? "Opening..." : "Open Table"}
                </Button>
              ) : null}
              {canCloseTableSession(table) ? (
                <Button variant="destructive" disabled={isMutating} onClick={() => handleCloseSession(table)}>
                  <XCircle className="size-4" />
                  {closeMutation.isPending ? "Closing..." : "Close Session"}
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {!tablesQuery.isLoading && !tablesQuery.isError && tables.length > 0 ? (
        <div className="bg-card border-border/60 flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Page {Math.min(pageNumber, totalPages)} of {totalPages} - {tablesQuery.data?.totalItems ?? 0} tables
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pageNumber <= 1 || tablesQuery.isFetching}
              onClick={() => setPageNumber((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={pageNumber >= totalPages || tablesQuery.isFetching}
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
