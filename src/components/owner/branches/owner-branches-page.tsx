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
import {
  useActivateOwnerBranchMutation,
  useInactivateOwnerBranchMutation,
} from "@/hooks/mutations/useOwnerBranchMutations";
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
        title="Chi nhánh"
        description="Quản lý toàn bộ chi nhánh trong hệ thống nhà hàng."
        portalLabel="Bộ quản lý"
        portalName="Cổng chủ quán"
        navItems={getOwnerPortalNavItems("branches")}
        topbarTitle={currentUser?.fullName ?? "Cổng chủ quán"}
        currentUser={currentUser}
      >
        <div className="border-border/60 bg-card rounded-[1.5rem] border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Cổng chủ quán
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{errorState.heading}</h2>
          <p className="text-muted-foreground mt-3 text-sm md:text-base">
            {errorState.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => branchesQuery.refetch()} disabled={branchesQuery.isRefetching}>
              {errorState.retryLabel}
            </Button>
            {errorState.shouldRouteToLogin ? (
              <Button variant="outline" onClick={() => router.push(PATH.auth.login)}>
                Về trang đăng nhập
              </Button>
            ) : null}
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="Chi nhánh"
      description="Theo dõi thông tin vận hành, liên hệ, giờ mở cửa và trạng thái kích hoạt."
      portalLabel="Bộ quản lý"
      portalName="Cổng chủ quán"
      navItems={getOwnerPortalNavItems("branches")}
      topbarTitle={currentUser?.fullName ?? "Cổng chủ quán"}
      currentUser={currentUser}
      headerAction={
        <Button
          size="lg"
          className="h-12 px-8"
          onClick={() => router.push(PATH.owner.branchCreate)}
        >
          <Plus />
          Tạo chi nhánh
        </Button>
      }
      stats={
        <>
          <PortalStatCard
            label="Tổng chi nhánh"
            value={String(totalItems)}
            helper="Số chi nhánh trong hệ thống"
          />
          <PortalStatCard
            label="Hoạt động"
            value={String(activeBranches)}
            helper="Chi nhánh đang bật trên trang này"
          />
          <PortalStatCard
            label="Tạm tắt"
            value={String(inactiveBranches)}
            helper="Chi nhánh hiện đang tắt"
          />
          <PortalStatCard
            label="Có quản lý"
            value={String(managedBranches)}
            helper="Chi nhánh đã gán quản lý"
          />
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
