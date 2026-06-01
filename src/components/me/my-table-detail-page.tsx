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

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useCloseMyTableSessionMutation, useOpenMyTableSessionMutation } from "@/hooks/mutations/useMyTableMutations";
import { useMyTableActiveOrdersQuery, useMyTableQuery } from "@/hooks/queries/useMeQueries";
import { cn } from "@/lib/utils";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { MyTableResponse, OpenTableSessionResponse } from "@/types/me";

import {
  canHandleKitchenOrders,
  canHandleWaiterOrders,
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

type MyTableDetailPageProps = {
  tableId: string;
};

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface text-sm font-medium sm:text-right">{value || "-"}</dd>
  </div>
);

const canOpenTable = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "AVAILABLE" && !table.currentSession && table.isActive;

const canCloseTableSession = (table: MyTableResponse) =>
  normalizeTableStatus(table.status) === "OCCUPIED" && Boolean(table.currentSession?.isActive);

export const MyTableDetailPage = ({ tableId }: MyTableDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
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
      showNotify({ type: "success", message: "Session code copied." });
    } catch {
      showNotify({ type: "error", message: "Unable to copy session code." });
    }
  };

  return (
    <PortalShell
      title={table ? `Table ${table.tableNumber}` : "Table Detail"}
      description="View table information, open a customer session, or manually close the active session."
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
      topbarTitle={table?.branchName ?? currentUser?.fullName ?? "Table Detail"}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={branchId ? PATH.me.branchTables(branchId) : PATH.me.branches}>
            <ArrowLeft className="size-4" />
            {branchId ? "Table Sessions" : "My Branches"}
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Status" value={getTableStatusLabel(table?.status)} helper="Current table state" />
          <PortalStatCard label="Capacity" value={table ? String(table.capacity) : "-"} helper="Configured seats" />
          <PortalStatCard label="Active" value={table ? getActiveLabel(table.isActive) : "-"} helper="Operational flag" />
          <PortalStatCard
            label="Session"
            value={table?.currentSession?.sessionCode ?? "None"}
            helper={table?.currentSession ? "Current active code" : "No current session"}
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
                  {table ? `Table ${table.tableNumber} opened successfully` : "Table opened successfully"}
                </h2>
              </div>
              <p className="mt-2 text-sm">
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

      {tableQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading table detail...</span>
        </div>
      ) : null}

      {tableQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <AlertTriangle className="size-5" />
          <h2 className="mt-3 text-lg font-semibold">
            {hasForbiddenError ? "You do not have permission to access this branch/table" : "Unable to load table"}
          </h2>
          <p className="mt-2 text-sm">
            {hasForbiddenError
              ? "Please select a branch assigned to your staff account."
              : getApiErrorMessage(tableQuery.error, "Table or session not found.")}
          </p>
          <Button className="mt-5" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
            Retry
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
                <h2 className="mt-5 text-2xl font-bold">Table {table.tableNumber}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{table.branchName}</p>
              </div>
              <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold", getTableStatusTone(table.status))}>
                {getTableStatusLabel(table.status)}
              </span>
            </div>

            <dl className="mt-6">
              <InfoRow label="Table Number" value={table.tableNumber} />
              <InfoRow label="Capacity" value={`${table.capacity} seats`} />
              <InfoRow label="Status" value={getTableStatusLabel(table.status)} />
              <InfoRow label="Is Active" value={getActiveLabel(table.isActive)} />
              <InfoRow label="Branch Name" value={table.branchName} />
              <InfoRow label="Created At" value={formatDateTime(table.createdAt)} />
              <InfoRow label="Updated At" value={formatDateTime(table.updatedAt)} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              {canOpenTable(table) ? (
                <Button disabled={openMutation.isPending} onClick={handleOpenTable}>
                  <DoorOpen className="size-4" />
                  {openMutation.isPending ? "Opening table..." : "Open Table"}
                </Button>
              ) : null}
              {canCloseTableSession(table) ? (
                <Button variant="destructive" disabled={closeMutation.isPending} onClick={handleCloseSession}>
                  <XCircle className="size-4" />
                  {closeMutation.isPending ? "Closing session..." : "Close Session Manually"}
                </Button>
              ) : null}
            </div>
          </div>

          <aside className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Current Session</h2>
            {table.currentSession ? (
              <dl className="mt-4">
                <InfoRow label="Session ID" value={table.currentSession.sessionId} />
                <InfoRow
                  label="Session Code"
                  value={
                    <span className="text-primary inline-flex items-center gap-2 font-black tracking-[0.18em]">
                      <Hash className="size-4" />
                      {table.currentSession.sessionCode}
                    </span>
                  }
                />
                <InfoRow label="Opened At" value={formatDateTime(table.currentSession.openedAt ?? table.currentSession.createdAt)} />
                <InfoRow label="Expires At" value={formatDateTime(table.currentSession.expiresAt)} />
                <InfoRow label="Is Active" value={getActiveLabel(table.currentSession.isActive)} />
              </dl>
            ) : (
              <div className="bg-surface-container-low mt-5 rounded-xl p-5">
                <Clock className="text-muted-foreground size-8" />
                <h3 className="mt-3 font-bold">Current session: None</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Open this table when customers are seated and ready to receive a session code.
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
                Current Table Orders & Invoice
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Staff and kitchen can view orders tied to the active dining session only.
              </p>
            </div>
            <Button variant="outline" onClick={() => activeOrdersQuery.refetch()} disabled={activeOrdersQuery.isFetching}>
              Refresh
            </Button>
          </div>

          {activeOrdersQuery.isLoading ? (
            <div className="mt-5 flex items-center gap-3">
              <Spinner className="text-primary size-5" />
              <span className="text-sm font-medium">Loading current orders...</span>
            </div>
          ) : null}

          {activeOrdersQuery.isError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive mt-5 rounded-xl border p-4 text-sm">
              {getApiErrorMessage(activeOrdersQuery.error, "Unable to load current table orders.")}
            </div>
          ) : null}

          {!activeOrdersQuery.isLoading && !activeOrdersQuery.isError && (activeOrdersQuery.data?.length ?? 0) === 0 ? (
            <div className="bg-surface-container-low mt-5 rounded-xl p-5 text-sm">
              <h3 className="font-bold">No active order for this table</h3>
              <p className="text-muted-foreground mt-1">Orders will appear here while the table session is still open.</p>
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
                      Session {order.sessionCode ?? "-"} - {order.status}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-primary text-lg font-black">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {order.paymentStatus ? `${order.paymentMethod ?? "Payment"} - ${order.paymentStatus}` : "No payment"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.orderItemId} className="flex justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold">{item.menuItemName} x{item.quantity}</p>
                        {item.note ? <p className="text-muted-foreground mt-1 text-xs">Note: {item.note}</p> : null}
                        <p className="text-muted-foreground mt-1 text-xs">{item.status}</p>
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
