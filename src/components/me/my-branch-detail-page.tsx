"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Mail, MapPin, Phone, Soup, Tags } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyBranchDetailQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

import {
  canManageMenuAvailability,
  formatFixedAmount,
  formatPercent,
  formatTime,
  getApiErrorMessage,
  getBranchStatusLabel,
  getMyPortalNavItems,
  isForbiddenError,
} from "./helpers";

type MyBranchDetailPageProps = {
  branchId: string;
};

const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="border-border/60 flex flex-col gap-1 border-b py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-muted-foreground text-sm font-semibold">{label}</dt>
    <dd className="text-on-surface text-sm font-medium sm:text-right">{value || "-"}</dd>
  </div>
);

export const MyBranchDetailPage = ({ branchId }: MyBranchDetailPageProps) => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canManageBranchMenu = currentUser?.role?.toUpperCase() === "BRANCH_MANAGER";
  const branchQuery = useMyBranchDetailQuery(branchId);
  const branch = branchQuery.data;

  const errorTitle = isForbiddenError(branchQuery.error)
    ? "You do not have permission to access this branch"
    : "Unable to load branch";

  return (
    <PortalShell
      title={branch?.name ?? "Branch Detail"}
      description="Read-only branch and restaurant information assigned to your account."
      portalLabel="Branch Workspace"
      portalName="My Branch Portal"
      navItems={getMyPortalNavItems({ active: "branch-detail", branchId, canSeeMenu })}
      topbarTitle={branch?.name ?? currentUser?.fullName ?? "My Branch Portal"}
      currentUser={currentUser}
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={PATH.me.branches}>
              <ArrowLeft className="size-4" />
              My Branches
            </Link>
          </Button>
          {canSeeMenu ? (
            <Button asChild>
              <Link href={PATH.me.branchMenu(branchId)}>
                <Soup className="size-4" />
                Menu Availability
              </Link>
            </Button>
          ) : null}
          {canManageBranchMenu ? (
            <>
              <Button asChild variant="outline">
                <Link href={PATH.manager.branchCategories(branchId)}>
                  <Tags className="size-4" />
                  Manage Categories
                </Link>
              </Button>
              <Button asChild>
                <Link href={PATH.manager.branchMenuItems(branchId)}>
                  <Soup className="size-4" />
                  Manage Menu
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      }
      stats={
        <>
          <PortalStatCard label="Status" value={getBranchStatusLabel(branch)} helper="Read-only branch status" />
          <PortalStatCard label="Restaurant ID" value={branch?.restaurantId ?? "-"} helper="Linked restaurant" />
          <PortalStatCard label="Manager" value={branch?.managerName ?? "-"} helper="Assigned branch manager" />
          <PortalStatCard
            label="Hours"
            value={formatTime(branch?.openTime)}
            helper={`Close time ${formatTime(branch?.closeTime)}`}
          />
        </>
      }
    >
      {branchQuery.isLoading ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading branch information...</span>
        </div>
      ) : null}

      {branchQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">{errorTitle}</h2>
          <p className="mt-2 text-sm">
            {isForbiddenError(branchQuery.error)
              ? "You do not have permission to access this branch"
              : getApiErrorMessage(branchQuery.error, "Please try refreshing this branch.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => branchQuery.refetch()} disabled={branchQuery.isRefetching}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => router.push(PATH.me.branches)}>
              Back to branches
            </Button>
          </div>
        </div>
      ) : null}

      {branch ? (
        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Branch Information</h2>
            <dl className="mt-4">
              <InfoRow label="Branch Name" value={branch.name} />
              <InfoRow label="Restaurant ID" value={branch.restaurantId} />
              <InfoRow label="Manager Name" value={branch.managerName || "-"} />
              <InfoRow label="Address" value={branch.address || "-"} />
              <InfoRow label="Phone" value={branch.phone || "-"} />
              <InfoRow label="Email" value={branch.email || "-"} />
              <InfoRow label="Open Time" value={formatTime(branch.openTime)} />
              <InfoRow label="Close Time" value={formatTime(branch.closeTime)} />
              <InfoRow label="VAT Percent" value={formatPercent(branch.vatPercent)} />
              <InfoRow label="Service Charge Percent" value={formatPercent(branch.serviceChargePercent)} />
              <InfoRow label="Service Charge Fixed" value={formatFixedAmount(branch.serviceChargeFixed)} />
              <InfoRow label="Status" value={getBranchStatusLabel(branch)} />
              <InfoRow label="Permission" value="Read Only" />
            </dl>
          </div>

          <aside className="bg-card border-border/60 rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-bold">Contact Snapshot</h2>
            <div className="mt-5 space-y-4 text-sm">
              <p className="text-muted-foreground flex gap-3">
                <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.address || "No address provided"}</span>
              </p>
              <p className="text-muted-foreground flex gap-3">
                <Phone className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.phone || "No phone provided"}</span>
              </p>
              <p className="text-muted-foreground flex gap-3">
                <Mail className="text-primary mt-0.5 size-4 shrink-0" />
                <span>{branch.email || "No email provided"}</span>
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
