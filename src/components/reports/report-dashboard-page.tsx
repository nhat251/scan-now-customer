"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, RefreshCw } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { formatCurrency, getManageMenuNavItems, getPortalCopy, type ManagePortal } from "@/components/manage-menu/helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { useReportOverviewQuery } from "@/hooks/queries/useReportQueries";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/user";
import type { BranchResponse } from "@/types/user-management";

type ReportDashboardPageProps = {
  portal: ManagePortal;
};

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const maxOf = (values: number[]) => Math.max(...values, 1);

export const ReportDashboardPage = ({ portal }: ReportDashboardPageProps) => {
  const currentUser = useUserStore((state) => state.user);
  const copy = getPortalCopy(portal);
  const [fromDate, setFromDate] = useState(() => toDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [toDate, setToDate] = useState(() => toDateInput(new Date()));
  const [branchId, setBranchId] = useState("");

  const ownerBranchesQuery = useOwnerBranchListQuery(
    { pageNumber: 1, pageSize: 100, sortBy: "name", sortDirection: "asc" },
    portal === "owner"
  );
  const managerBranchesQuery = useMyBranchesListQuery(portal === "manager");

  const branches: BranchResponse[] = useMemo(() => {
    return portal === "owner" ? ownerBranchesQuery.data?.items ?? [] : managerBranchesQuery.data ?? [];
  }, [managerBranchesQuery.data, ownerBranchesQuery.data?.items, portal]);

  const reportQuery = useReportOverviewQuery(portal, {
    branchId: branchId || undefined,
    fromDate,
    toDate,
  });
  const report = reportQuery.data;

  return (
    <PortalShell
      title={portal === "owner" ? "Owner Reports" : "Manager Reports"}
      description="Revenue, order volume, top dishes, peak hours, and branch comparison."
      portalLabel={copy.label}
      portalName={copy.name}
      navItems={getManageMenuNavItems(portal, "dashboard", branchId || undefined)}
      topbarTitle={currentUser?.fullName ?? copy.topbar}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Revenue" value={formatCurrency(report?.paidRevenue ?? 0)} helper="Successful payments" />
          <PortalStatCard label="Orders" value={String(report?.totalOrders ?? 0)} helper={`${report?.completedOrders ?? 0} completed`} />
          <PortalStatCard label="Average order" value={formatCurrency(report?.averageOrderValue ?? 0)} helper="All non-cancelled orders" />
          <PortalStatCard label="Pending" value={formatCurrency(report?.pendingRevenue ?? 0)} helper="Unpaid active invoices" />
        </>
      }
    >
      <section className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold">
              Branch
              <select
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
              >
                <option value="">All branches</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
              />
            </label>
            <label className="text-sm font-semibold">
              To
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="border-input bg-card mt-2 h-10 w-full rounded-lg border px-3 text-sm outline-none"
              />
            </label>
          </div>
          <Button variant="soft" onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching}>
            <RefreshCw className={cn("size-4", reportQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </section>

      {reportQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading reports...</span>
        </div>
      ) : null}

      {reportQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6 text-sm">
          Unable to load reports for this account.
        </div>
      ) : null}

      {report ? (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <ChartPanel title="Revenue by day" icon={<BarChart3 className="size-4" />}>
              <BarSeries
                data={report.revenueByDay.map((point) => ({ label: point.label, value: point.revenue }))}
                formatValue={formatCurrency}
              />
            </ChartPanel>
            <ChartPanel title="Peak hours" icon={<CalendarDays className="size-4" />}>
              <BarSeries
                data={report.peakHours.map((point) => ({ label: point.label, value: point.orders }))}
                formatValue={(value) => `${value} orders`}
              />
            </ChartPanel>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <h2 className="text-lg font-bold">Top selling dishes</h2>
              <div className="mt-4 space-y-3">
                {report.topItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No dishes sold in this range.</p>
                ) : (
                  report.topItems.map((item, index) => (
                    <div key={item.menuItemId} className="bg-muted/30 flex items-center justify-between gap-3 rounded-lg px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{index + 1}. {item.name}</p>
                        <p className="text-muted-foreground text-xs">{item.quantity} sold</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
              <h2 className="text-lg font-bold">Branch comparison</h2>
              <div className="mt-4 space-y-3">
                {report.branches.map((branch) => (
                  <div key={branch.branchId} className="bg-muted/30 rounded-lg px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold">{branch.branchName}</p>
                      <span className="text-sm font-bold">{formatCurrency(branch.revenue)}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{branch.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </PortalShell>
  );
};

const ChartPanel = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card border-border/60 rounded-xl border p-5 shadow-sm">
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
    <div className="mt-5">{children}</div>
  </div>
);

const BarSeries = ({
  data,
  formatValue,
}: {
  data: Array<{ label: string; value: number }>;
  formatValue: (value: number) => string;
}) => {
  const max = maxOf(data.map((item) => item.value));
  const visibleData = data.slice(-14);

  return (
    <div className="flex h-72 items-end gap-2 overflow-x-auto pb-2">
      {visibleData.map((item) => (
        <div key={item.label} className="flex min-w-12 flex-1 flex-col items-center gap-2">
          <div className="bg-muted/40 flex h-52 w-full items-end rounded-lg px-1.5">
            <div
              className="bg-primary/80 w-full rounded-md"
              style={{ height: `${Math.max(4, (item.value / max) * 100)}%` }}
              title={`${item.label}: ${formatValue(item.value)}`}
            />
          </div>
          <span className="text-muted-foreground max-w-16 truncate text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
