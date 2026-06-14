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
      title="Đơn hàng và hóa đơn"
      description="Chọn chi nhánh để xem lịch sử đơn hàng và hóa đơn."
      portalLabel="Khu vực chi nhánh"
      portalName="Khu vực quản lý chi nhánh"
      navItems={getManageMenuNavItems("manager", "orders")}
      topbarTitle={currentUser?.fullName ?? "Khu vực quản lý chi nhánh"}
      currentUser={currentUser}
      stats={
        <>
          <PortalStatCard
            label="Chi nhánh được phân công"
            value={String(branches.length)}
            helper="Được liên kết với tài khoản"
          />
          <PortalStatCard
            label="Chi nhánh đang hoạt động"
            value={String(activeBranches)}
            helper="Sẵn sàng vận hành"
          />
          <PortalStatCard
            label="Tra cứu đơn hàng"
            value="Theo chi nhánh"
            helper="Bộ lọc nằm trong trang hóa đơn của từng chi nhánh"
          />
          <PortalStatCard
            label="Phạm vi truy cập"
            value="Quản lý"
            helper="Giới hạn trong chi nhánh được phân công"
          />
        </>
      }
    >
      {branchesQuery.isLoading || branchesQuery.isFetching ? (
        <div className="bg-card border-border/60 flex items-center gap-3 rounded-xl border p-6 shadow-sm">
          <Spinner className="text-primary size-5" />
          <span className="text-sm font-medium">Đang tải chi nhánh được phân công...</span>
        </div>
      ) : null}

      {branchesQuery.isError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border p-6">
          <h2 className="text-lg font-semibold">Không thể tải danh sách chi nhánh</h2>
          <p className="mt-2 text-sm">Vui lòng tải lại và thử lại.</p>
          <Button
            className="mt-5"
            onClick={() => branchesQuery.refetch()}
            disabled={branchesQuery.isRefetching}
          >
            <RefreshCw className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      {!branchesQuery.isLoading && !branchesQuery.isError && branches.length === 0 ? (
        <div className="bg-card border-border/60 rounded-xl border p-8 text-center shadow-sm">
          <FileText className="text-muted-foreground mx-auto size-10" />
          <h2 className="mt-3 text-xl font-bold">Chưa có chi nhánh</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Tài khoản quản lý chưa được gán chi nhánh.
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
                  {branch.address || "Chưa có địa chỉ"}
                </p>
              </div>

              <Button asChild className="mt-6 w-full">
                <Link href={PATH.manager.branchOrders(branch.branchId)}>
                  Xem đơn hàng
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
