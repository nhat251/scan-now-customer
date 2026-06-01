"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, FileText, RefreshCw } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { getManageMenuNavItems } from "@/components/manage-menu/helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

export const ManagerOrdersIndexPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const activeBranches = branches.filter((branch) => branch.isActive).length;

  useEffect(() => {
    if (branchesQuery.isSuccess && branches.length === 1) {
      router.replace(PATH.manager.branchOrders(branches[0].branchId));
    }
  }, [branches, branchesQuery.isSuccess, router]);

  return (
    <PortalShell
      title="Orders & Invoices"
      description="Choose a branch to review its order and invoice history."
      portalLabel="Branch Portal"
      portalName="Branch Manager Console"
      navItems={getManageMenuNavItems("manager", "orders")}
      topbarTitle={currentUser?.fullName ?? "Branch Manager Console"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Assigned branches" value={String(branches.length)} helper="Linked to your account" />
          <PortalStatCard label="Active branches" value={String(activeBranches)} helper="Available for operations" />
          <PortalStatCard label="Order view" value="By branch" helper="Filters open in each branch invoice page" />
          <PortalStatCard label="Access" value="Manager" helper="Limited to your branch scope" />
        </>
      }
    >
      {branchesQuery.isLoading || branchesQuery.isFetching ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Loading assigned branches...</span>
        </div>
      ) : null}

      {branchesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Unable to load branches</h2>
          <p className="mt-2 text-sm">Please refresh and try again.</p>
          <Button className="mt-5" onClick={() => branchesQuery.refetch()} disabled={branchesQuery.isRefetching}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <FileText className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">No branch available</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your manager account is not linked to a branch yet.
          </p>
        </div>
      ) : null}

      {branches.length > 1 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <article
              key={branch.branchId}
              className="bg-card border-border/60 flex min-h-56 flex-col justify-between rounded-xl border p-5 shadow-sm"
            >
              <div>
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <Building2 className="size-5" />
                </div>
                <h2 className="mt-5 line-clamp-2 text-xl font-bold">{branch.name}</h2>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {branch.address || "No address provided"}
                </p>
              </div>

              <Button asChild className="mt-6 w-full">
                <Link href={PATH.manager.branchOrders(branch.branchId)}>
                  View orders
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </article>
          ))}
        </section>
      ) : null}
    </PortalShell>
  );
};
