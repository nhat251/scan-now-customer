"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Edit, Eye, Plus, Power, PowerOff, QrCode, RefreshCw, Search } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FooterPagination } from "@/components/ui/footer-pagination";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/tag";
import {
  useDownloadOwnerTableQrMutation,
  useRegenerateOwnerTableQrMutation,
  useSetOwnerTableActiveMutation,
} from "@/hooks/mutations/useOwnerTableMutations";
import { useOwnerBranchDetailQuery } from "@/hooks/queries/useOwnerBranchDetailQuery";
import { useOwnerBranchTablesQuery } from "@/hooks/queries/useOwnerTableQueries";
import { useDebounce } from "@/hooks/useDebounce";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { OwnerTablesQuery } from "@/types/owner-table";

import {
  activeFilterToQuery,
  downloadQrBlob,
  formatDateTime,
  getActiveLabel,
  getOwnerTableCreatePath,
  getOwnerTableDetailPath,
  getOwnerTableErrorMessage,
  getOwnerTableStatusLabel,
  getOwnerTableStatusTone,
  getQrFileName,
  getTablePortalCopy,
  getTablePortalNavItems,
  isForbiddenError,
  normalizeOwnerTableStatus,
  OWNER_TABLE_PAGE_SIZE_OPTIONS,
  OWNER_TABLE_STATUS_FILTER_OPTIONS,
  type OwnerTableActiveFilter,
  type OwnerTableStatusFilter,
  type TableManagementPortal,
} from "./helpers";

type OwnerTableListPageProps = {
  branchId: string;
  portal?: TableManagementPortal;
};

const SORT_OPTIONS = [
  { label: "Table number", value: "tableNumber:asc" },
  { label: "Capacity low to high", value: "capacity:asc" },
  { label: "Capacity high to low", value: "capacity:desc" },
  { label: "Newest first", value: "createdAt:desc" },
  { label: "Recently updated", value: "updatedAt:desc" },
] as const;

export const OwnerTableListPage = ({ branchId, portal = "owner" }: OwnerTableListPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getTablePortalCopy(portal);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [regenerateTableId, setRegenerateTableId] = useState<string | null>(null);

  const { register, control } = useForm({
    defaultValues: {
      search: "",
      status: "all" as OwnerTableStatusFilter,
      capacity: "",
      activeFilter: "all" as OwnerTableActiveFilter,
      sortValue: "tableNumber:asc" as (typeof SORT_OPTIONS)[number]["value"],
    },
  });

  const searchVal = useWatch({ control, name: "search" });
  const statusVal = useWatch({ control, name: "status" });
  const capacityVal = useWatch({ control, name: "capacity" });
  const activeFilterVal = useWatch({ control, name: "activeFilter" });
  const sortValueVal = useWatch({ control, name: "sortValue" });

  const search = useDebounce(searchVal.trim(), 250);

  useEffect(() => {
    setPageNumber(1);
  }, [search, statusVal, capacityVal, activeFilterVal, sortValueVal]);

  const [sortBy, sortDirection] = sortValueVal.split(":") as [string, "asc" | "desc"];
  const query = useMemo<OwnerTablesQuery>(
    () => ({
      pageNumber,
      pageSize,
      search: search || undefined,
      status: statusVal === "all" ? undefined : statusVal,
      capacity: capacityVal ? Number(capacityVal) : undefined,
      isActive: activeFilterToQuery(activeFilterVal),
      sortBy,
      sortDirection,
    }),
    [activeFilterVal, capacityVal, pageNumber, pageSize, search, sortBy, sortDirection, statusVal]
  );
  const tablesQuery = useOwnerBranchTablesQuery(branchId, query);
  const branchDetailQuery = useOwnerBranchDetailQuery(branchId);
  const activeMutation = useSetOwnerTableActiveMutation();
  const regenerateMutation = useRegenerateOwnerTableQrMutation();
  const downloadMutation = useDownloadOwnerTableQrMutation();

  const tables = tablesQuery.data?.items ?? [];
  const branchName = branchDetailQuery.data?.name ?? (tables.length > 0 ? tables[0].branchName : undefined);
  const totalItems = tablesQuery.data?.totalItems ?? 0;
  const totalPages = Math.max(tablesQuery.data?.totalPages ?? 1, 1);
  const activeCount = tables.filter((table) => table.isActive).length;
  const occupiedCount = tables.filter((table) => normalizeOwnerTableStatus(table.status) === "OCCUPIED").length;

  const downloadQr = async (tableId: string) => {
    const table = tables.find((item) => item.tableId === tableId);
    const blob = await downloadMutation.mutateAsync(tableId);

    downloadQrBlob(blob, getQrFileName(table));
  };

  const regenerateQr = async () => {
    if (!regenerateTableId) {
      return;
    }

    const response = await regenerateMutation.mutateAsync(regenerateTableId);
    setRegenerateTableId(null);
    await navigator.clipboard.writeText(response.result.qrCodeUrl).catch(() => undefined);
    showNotify({ type: "success", message: "New QR URL is ready." });
    await tablesQuery.refetch();
  };

  return (
    <PortalShell
      title="Tables & QR"
      description="Configure branch tables, activation state, table status, and QR codes."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getTablePortalNavItems(portal, branchId)}
      topbarTitle={branchName ?? currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      branchName={branchName}
      branchId={branchId}
      headerAction={
        <Button asChild>
          <Link href={getOwnerTableCreatePath(branchId, portal)}>
            <Plus className="size-4" />
            Create Table
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Total" value={String(totalItems)} helper="Tables returned from backend" />
          <PortalStatCard label="Visible" value={String(tables.length)} helper="Tables on current page" />
          <PortalStatCard label="Active" value={String(activeCount)} helper="Operational tables on this page" />
          <PortalStatCard label="Occupied" value={String(occupiedCount)} helper="Session display only" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_160px_160px_220px]">
          <label className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              {...register("search")}
              placeholder="Search table"
              className="h-11 pl-10"
            />
          </label>
          <select
            {...register("status")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            {OWNER_TABLE_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            {...register("capacity")}
            placeholder="Capacity"
            className="h-11"
          />
          <select
            {...register("activeFilter")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            <option value="all">All active</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            {...register("sortValue")}
            className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {tablesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(tablesQuery.error)
            ? "You do not have permission to access this branch/table"
            : getOwnerTableErrorMessage(tablesQuery.error, "Unable to load tables.")}
          <Button className="mt-4" onClick={() => tablesQuery.refetch()} disabled={tablesQuery.isRefetching}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : null}

      <section className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="divide-border/60 min-w-[1180px] divide-y text-left">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Table Number</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Capacity</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Status</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Active</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Current Session</th>
                <th className="text-muted-foreground px-6 py-4 text-sm font-bold">Created At</th>
                <th className="text-muted-foreground px-6 py-4 text-right text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border/40 divide-y">
              {tablesQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    Loading tables...
                  </td>
                </tr>
              ) : tables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-muted-foreground px-6 py-10 text-center text-sm">
                    No tables found.
                  </td>
                </tr>
              ) : (
                tables.map((table) => (
                  <tr key={table.tableId} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <p className="font-bold">Table {table.tableNumber}</p>
                      <p className="text-muted-foreground max-w-48 truncate text-xs">{table.branchName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{table.capacity}</td>
                    <td className="px-6 py-4">
                      <Tag tagString={getOwnerTableStatusLabel(table.status)} variant={getOwnerTableStatusTone(table.status)} />
                    </td>
                    <td className="px-6 py-4">
                      <Tag tagString={getActiveLabel(table.isActive)} variant={table.isActive ? "success" : "warning"} />
                    </td>
                    <td className="px-6 py-4 text-sm">{table.currentSession?.sessionCode ?? "-"}</td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">{formatDateTime(table.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="icon-sm" variant="outline">
                          <Link href={getOwnerTableDetailPath(branchId, table.tableId, portal)}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild size="icon-sm" variant="outline">
                          <Link href={getOwnerTableDetailPath(branchId, table.tableId, portal)}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => downloadQr(table.tableId)}>
                          <Download className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => setRegenerateTableId(table.tableId)}>
                          <QrCode className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant={table.isActive ? "destructive" : "success"}
                          onClick={() => activeMutation.mutateAsync({ tableId: table.tableId, isActive: !table.isActive })}
                        >
                          {table.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
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
          pageSizeOptions={OWNER_TABLE_PAGE_SIZE_OPTIONS}
          totalItems={totalItems}
          itemLabel="tables"
          disabled={tablesQuery.isFetching}
          onPageChange={setPageNumber}
          onPageSizeChange={(nextPageSize) => {
            setPageNumber(1);
            setPageSize(nextPageSize);
          }}
        />
      </section>

      <Dialog open={Boolean(regenerateTableId)} onOpenChange={(open) => !open && setRegenerateTableId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate QR?</DialogTitle>
            <DialogDescription>
              Regenerating QR will make the old QR invalid. Download and share the new QR afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateTableId(null)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={regenerateQr} disabled={regenerateMutation.isPending}>
              <QrCode className="size-4" />
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
