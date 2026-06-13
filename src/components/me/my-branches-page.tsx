"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, MapPin, Phone, RefreshCw } from "lucide-react";

import { PortalShell, PortalStatCard } from "@/components/auth/portal-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PATH } from "@/constants/path";
import { useMyBranchesListQuery } from "@/hooks/queries/useMeQueries";
import { useUserStore } from "@/stores/user";

import {
  canManageMenuAvailability,
  canManageTableSessions,
  getApiErrorMessage,
  getBranchStatusLabel,
  getMyPortalNavItems,
} from "./helpers";

export const MyBranchesPage = () => {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.user);
  const branchesQuery = useMyBranchesListQuery();
  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const activeBranches = branches.filter((branch) => branch.isActive).length;
  const canSeeMenu = canManageMenuAvailability(currentUser?.role);
  const canSeeTables = canManageTableSessions(currentUser?.role);

  useEffect(() => {
    if (branchesQuery.isSuccess && branches.length === 1) {
      router.replace(PATH.me.branchDetail(branches[0].branchId));
    }
  }, [branches, branchesQuery.isSuccess, router]);

  return (
    <PortalShell
      title="Chi nhánh của tôi"
      description="Xem các chi nhánh nhà hàng được gán cho tài khoản của bạn."
      portalLabel="Khu vực chi nhánh"
      portalName="Cổng chi nhánh"
      navItems={getMyPortalNavItems({ active: "branches", canSeeMenu, canSeeTables })}
      topbarTitle={currentUser?.fullName ?? "Cổng chi nhánh"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard label="Được gán" value={String(branches.length)} helper="Chi nhánh liên kết với tài khoản" />
          <PortalStatCard label="Hoạt động" value={String(activeBranches)} helper="Chi nhánh đang hoạt động" />
          <PortalStatCard
            label="Quyền"
            value="Chỉ xem"
            helper="Không chỉnh sửa thông tin chi nhánh tại đây"
          />
          <PortalStatCard
            label="Menu"
            value={canSeeMenu ? "Có quyền" : "Thông tin"}
            helper={canSeeMenu ? "Có thể cập nhật trạng thái món" : "Chỉ xem thông tin chi nhánh"}
          />
        </>
      }
    >
      {branchesQuery.isLoading || branchesQuery.isFetching ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải chi nhánh được gán...</span>
        </div>
      ) : null}

      {branchesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Không tải được danh sách chi nhánh</h2>
          <p className="mt-2 text-sm">
            {getApiErrorMessage(branchesQuery.error, "Vui lòng thử tải lại danh sách chi nhánh.")}
          </p>
          <Button className="mt-5" onClick={() => branchesQuery.refetch()} disabled={branchesQuery.isRefetching}>
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <Building2 className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">Không tìm thấy chi nhánh được gán.</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Tài khoản đang hoạt động nhưng chưa được liên kết với chi nhánh nào.
          </p>
        </div>
      ) : null}

      {branches.length > 1 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <article
              key={branch.branchId}
              className="bg-card border-border/60 flex min-h-64 flex-col justify-between rounded-xl border p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Building2 className="size-5" />
                  </div>
                  <span className="bg-surface-container text-on-surface rounded-full px-3 py-1 text-xs font-semibold">
                    {getBranchStatusLabel(branch)}
                  </span>
                </div>

                <h2 className="mt-5 line-clamp-2 text-xl font-bold">{branch.name}</h2>
                <div className="text-muted-foreground mt-4 space-y-3 text-sm">
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span className="line-clamp-2">{branch.address || "Chưa có địa chỉ"}</span>
                  </p>
                  <p className="flex gap-2">
                    <Phone className="mt-0.5 size-4 shrink-0" />
                    <span>{branch.phone || "Chưa có số điện thoại"}</span>
                  </p>
                </div>
              </div>

              <Button asChild className="mt-6 w-full">
                <Link href={PATH.me.branchDetail(branch.branchId)}>
                  Xem chi tiết
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
