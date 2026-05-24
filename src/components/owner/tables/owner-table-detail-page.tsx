"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clipboard,
  Download,
  ExternalLink,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  Save,
} from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tag } from "@/components/ui/tag";
import {
  useDownloadOwnerTableQrMutation,
  useRegenerateOwnerTableQrMutation,
  useSetOwnerTableActiveMutation,
  useUpdateOwnerTableMutation,
  useUpdateOwnerTableStatusMutation,
} from "@/hooks/mutations/useOwnerTableMutations";
import { useOwnerTableQuery } from "@/hooks/queries/useOwnerTableQueries";
import { showNotify } from "@/stores/global";
import { useUserStore } from "@/stores/user";
import type { OwnerTableFormValues, OwnerTableStatus } from "@/types/owner-table";

import {
  downloadQrBlob,
  formatDateTime,
  getActiveLabel,
  getOwnerTableErrorMessage,
  getOwnerTableListPath,
  getOwnerTablePayload,
  getOwnerTableStatusLabel,
  getOwnerTableStatusTone,
  getQrFileName,
  getTablePortalCopy,
  getTablePortalNavItems,
  isForbiddenError,
  normalizeOwnerTableStatus,
  OWNER_TABLE_STATUS_UPDATE_OPTIONS,
  type TableManagementPortal,
  toOwnerTableFormValues,
} from "./helpers";
import { OwnerTableForm } from "./owner-table-form";

type OwnerTableDetailPageProps = {
  branchId: string;
  tableId: string;
  portal?: TableManagementPortal;
};

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface min-w-0 text-sm font-medium break-words sm:text-right">{value || "-"}</dd>
  </div>
);

export const OwnerTableDetailPage = ({ branchId, tableId, portal = "owner" }: OwnerTableDetailPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getTablePortalCopy(portal);
  const tableQuery = useOwnerTableQuery(branchId, tableId);
  const table = tableQuery.data;
  const tableStatus = normalizeOwnerTableStatus(table?.status);
  const [form, setForm] = useState<OwnerTableFormValues>(toOwnerTableFormValues());
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const updateMutation = useUpdateOwnerTableMutation();
  const statusMutation = useUpdateOwnerTableStatusMutation();
  const activeMutation = useSetOwnerTableActiveMutation();
  const regenerateMutation = useRegenerateOwnerTableQrMutation();
  const downloadMutation = useDownloadOwnerTableQrMutation();

  useEffect(() => {
    if (table) {
      setForm(toOwnerTableFormValues(table));
    }
  }, [table]);

  const onChange = <Key extends keyof OwnerTableFormValues>(key: Key, value: OwnerTableFormValues[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!form.tableNumber.trim()) {
      showNotify({ type: "warning", message: "Table number is required." });
      return false;
    }

    if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
      showNotify({ type: "warning", message: "Capacity must be greater than or equal to 1." });
      return false;
    }

    return true;
  };

  const saveInfo = async () => {
    if (!validate()) {
      return;
    }

    await updateMutation.mutateAsync({ tableId, data: getOwnerTablePayload(form) });
    await tableQuery.refetch();
  };

  const updateStatus = async (status: Exclude<OwnerTableStatus, "OCCUPIED">) => {
    await statusMutation.mutateAsync({ tableId, data: { status } });
    await tableQuery.refetch();
  };

  const toggleActive = async () => {
    if (!table) {
      return;
    }

    await activeMutation.mutateAsync({ tableId, isActive: !table.isActive });
    await tableQuery.refetch();
  };

  const downloadQr = async () => {
    const blob = await downloadMutation.mutateAsync(tableId);
    downloadQrBlob(blob, getQrFileName(table));
  };

  const copyQrUrl = async () => {
    if (!table?.qrCodeUrl) {
      return;
    }

    await navigator.clipboard.writeText(table.qrCodeUrl);
    showNotify({ type: "success", message: "QR URL copied." });
  };

  const regenerateQr = async () => {
    const response = await regenerateMutation.mutateAsync(tableId);

    setRegenerateOpen(false);
    await navigator.clipboard.writeText(response.result.qrCodeUrl).catch(() => undefined);
    await tableQuery.refetch();
  };

  return (
    <PortalShell
      title={table ? `Table ${table.tableNumber}` : "Table Detail"}
      description="Configure table identity, status, active state, and QR code. Session operations are handled by Staff."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getTablePortalNavItems(portal, branchId)}
      topbarTitle={table?.branchName ?? currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      headerAction={
        <Button asChild variant="outline">
          <Link href={getOwnerTableListPath(branchId, portal)}>
            <ArrowLeft className="size-4" />
            Tables
          </Link>
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Status" value={getOwnerTableStatusLabel(table?.status)} helper="Owner cannot set Occupied" />
          <PortalStatCard label="Capacity" value={table ? String(table.capacity) : "-"} helper="Configured seats" />
          <PortalStatCard label="Active" value={getActiveLabel(table?.isActive)} helper="Visibility in operation" />
          <PortalStatCard label="Session" value={table?.currentSession?.sessionCode ?? "None"} helper="Display only" />
        </>
      }
    >
      {tableQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          {isForbiddenError(tableQuery.error)
            ? "You do not have permission to access this branch/table"
            : getOwnerTableErrorMessage(tableQuery.error, "Table not found.")}
          <Button className="mt-4" onClick={() => tableQuery.refetch()} disabled={tableQuery.isRefetching}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {tableQuery.isLoading ? (
        <div className="bg-card border-border/60 rounded-xl border p-6 text-sm shadow-sm">Loading table...</div>
      ) : null}

      {table ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <OwnerTableForm
              value={form}
              submitting={updateMutation.isPending}
              submitLabel="Save Table"
              onChange={onChange}
              onSubmit={saveInfo}
            />

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold">Status & Activation</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                <select
                  value={tableStatus ?? ""}
                  disabled={tableStatus === "OCCUPIED" || statusMutation.isPending}
                  onChange={(event) => updateStatus(event.target.value as Exclude<OwnerTableStatus, "OCCUPIED">)}
                  className="border-input bg-card focus:border-ring focus:ring-ring/50 h-11 rounded-md border px-3 text-sm font-semibold outline-none focus:ring-3"
                >
                  {tableStatus === "OCCUPIED" ? (
                    <option value="OCCUPIED" disabled>
                      Occupied
                    </option>
                  ) : null}
                  {OWNER_TABLE_STATUS_UPDATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={table.isActive ? "destructive" : "success"}
                  onClick={toggleActive}
                  disabled={activeMutation.isPending}
                >
                  {table.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                  {table.isActive ? "Deactivate Table" : "Activate Table"}
                </Button>
              </div>
              {tableStatus === "OCCUPIED" ? (
                <p className="text-muted-foreground mt-3 text-sm">
                  Occupied is controlled by Staff opening a table session, so Owner cannot set this status manually.
                </p>
              ) : null}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Table Information</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{table.branchName}</p>
                </div>
                <Tag tagString={getOwnerTableStatusLabel(table.status)} variant={getOwnerTableStatusTone(table.status)} />
              </div>
              <dl className="mt-4">
                <InfoRow label="Table Number" value={table.tableNumber} />
                <InfoRow label="Capacity" value={`${table.capacity} seats`} />
                <InfoRow label="Is Active" value={getActiveLabel(table.isActive)} />
                <InfoRow label="QR URL" value={table.qrCodeUrl || "-"} />
                <InfoRow label="Created At" value={formatDateTime(table.createdAt)} />
                <InfoRow label="Updated At" value={formatDateTime(table.updatedAt)} />
              </dl>
            </section>

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold">QR Management</h2>
              <p className="text-muted-foreground mt-2 text-sm break-all">{table.qrCodeUrl || "QR URL is pending."}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadQr} disabled={downloadMutation.isPending}>
                  <Download className="size-4" />
                  Download QR
                </Button>
                <Button variant="outline" onClick={copyQrUrl} disabled={!table.qrCodeUrl}>
                  <Clipboard className="size-4" />
                  Copy QR URL
                </Button>
                {table.qrCodeUrl ? (
                  <Button asChild variant="outline">
                    <a href={table.qrCodeUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                      Open
                    </a>
                  </Button>
                ) : null}
                <Button variant="warning" onClick={() => setRegenerateOpen(true)}>
                  <QrCode className="size-4" />
                  Regenerate QR
                </Button>
              </div>
            </section>

            <section className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
              <h2 className="text-xl font-bold">Current Session</h2>
              {table.currentSession ? (
                <dl className="mt-4">
                  <InfoRow label="Session Code" value={table.currentSession.sessionCode} />
                <InfoRow label="Opened At" value={formatDateTime(table.currentSession.openedAt ?? table.currentSession.createdAt)} />
                  <InfoRow label="Expires At" value={formatDateTime(table.currentSession.expiresAt)} />
                </dl>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">No current session.</p>
              )}
            </section>
          </div>
        </section>
      ) : null}

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate QR?</DialogTitle>
            <DialogDescription>
              Regenerating QR will make the old QR invalid. Customers must scan the new QR image afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={regenerateQr} disabled={regenerateMutation.isPending}>
              <Save className="size-4" />
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
};
