"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import {
  type BranchStatusFilter,
  branchStatusFilterToQuery,
  getOwnerBranchErrorState,
} from "@/components/owner/branches/helpers";
import { OwnerBranchesTable } from "@/components/owner/branches/owner-branches-table";
import { OwnerBranchesToolbar } from "@/components/owner/branches/owner-branches-toolbar";
import { getOwnerPortalNavItems } from "@/components/owner/users/owner-portal-nav";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useActivateOwnerBranchMutation, useInactivateOwnerBranchMutation } from "@/hooks/mutations/useOwnerBranchMutations";
import { useOwnerBranchListQuery } from "@/hooks/queries/useOwnerBranchListQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { useUserStore } from "@/stores/user";
import type { BranchResponse, OwnerBranchListQuery } from "@/types/user-management";

export const OwnerBranchesPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim());
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<BranchStatusFilter>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setPageNumber(1);
  }, [search]);

  const filters = useMemo<OwnerBranchListQuery>(() => {
    return {
      pageNumber,
      pageSize,
      search: search || undefined,
      sortBy,
      sortDirection,
      ...branchStatusFilterToQuery(statusFilter),
    };
  }, [pageNumber, pageSize, search, sortBy, sortDirection, statusFilter]);

  const branchesQuery = useOwnerBranchListQuery(filters);
  const activateMutation = useActivateOwnerBranchMutation();
  const inactivateMutation = useInactivateOwnerBranchMutation();

  const branches = branchesQuery.data?.items;
  const totalItems = branchesQuery.data?.totalItems ?? 0;
  const totalPages = branchesQuery.data?.totalPages ?? 1;
  const activeBranches = (branches ?? []).filter((branch) => branch.isActive).length;
  const inactiveBranches = (branches ?? []).filter((branch) => !branch.isActive).length;
  const managedBranches = (branches ?? []).filter((branch) => Boolean(branch.managerId)).length;

  const clampPageAfterMutation = (nextTotalPages?: number) => {
    if (!nextTotalPages) {
      return;
    }

    setPageNumber((currentPage) => Math.min(currentPage, Math.max(nextTotalPages, 1)));
  };

  const refreshBranches = async () => {
    const result = await branchesQuery.refetch();
    clampPageAfterMutation(result.data?.totalPages);
  };

  const handleToggleActive = async (branch: BranchResponse) => {
    if (branch.isActive) {
      await inactivateMutation.mutateAsync({ id: branch.branchId });
      await refreshBranches();
      return;
    }

    await activateMutation.mutateAsync({ id: branch.branchId });
    await refreshBranches();
  };

  if (branchesQuery.isError) {
    const errorState = getOwnerBranchErrorState(branchesQuery.error);

    return (
      <PortalShell
        title="Branches"
        description="Manage every branch in your restaurant portfolio."
        portalLabel="Management Suite"
        portalName="Owner Portal"
        navItems={getOwnerPortalNavItems("branches")}
        topbarTitle={currentUser?.fullName ?? "Owner Portal"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">Owner portal</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{errorState.heading}</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">{errorState.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => branchesQuery.refetch()} disabled={branchesQuery.isRefetching}>
              {errorState.retryLabel}
            </Button>
            {errorState.shouldRouteToLogin ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Go to login
              </Button>
            ) : null}
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="Branches"
      description="Monitor branch operations, contact details, hours, and activation status."
      portalLabel="Management Suite"
      portalName="Owner Portal"
      navItems={getOwnerPortalNavItems("branches")}
      topbarTitle={currentUser?.fullName ?? "Owner Portal"}
      currentUser={currentUser}
      headerAction={
        <Button size="lg" className="h-12 px-8" onClick={() => router.push(PATH.owner.branchCreate)}>
          <Plus />
          Create Branch
        </Button>
      }
      stats={
        <>
          <PortalStatCard label="Total Branches" value={String(totalItems)} helper="Branches returned from backend" />
          <PortalStatCard label="Active Branches" value={String(activeBranches)} helper="Currently active branches on this page" />
          <PortalStatCard label="Inactive Branches" value={String(inactiveBranches)} helper="Branches that are currently inactive" />
          <PortalStatCard label="Assigned Managers" value={String(managedBranches)} helper="Branches with a manager assigned" />
        </>
      }
    >
      <OwnerBranchesToolbar
        searchInput={searchInput}
        statusFilter={statusFilter}
        onSearchInputChange={setSearchInput}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPageNumber(1);
        }}
      />

      <OwnerBranchesTable
        branches={branches}
        isLoading={branchesQuery.isLoading}
        pageNumber={pageNumber}
        pageSize={pageSize}
        sortBy={sortBy}
        sortDirection={sortDirection}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={setPageNumber}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPageNumber(1);
        }}
        onSortChange={(nextSortBy, nextSortDirection) => {
          setSortBy(nextSortBy);
          setSortDirection(nextSortDirection);
          setPageNumber(1);
        }}
        onOpenBranch={(href) => router.push(href)}
        onToggleActive={handleToggleActive}
      />
    </PortalShell>
  );
};
